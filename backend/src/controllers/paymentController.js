const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let razorpayInstance = null;
if (hasRazorpayConfig) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * DEMO PAYMENT MODE
 * -----------------
 * When Razorpay keys are NOT configured we fall back to a fully local "demo
 * gateway" so the checkout can still be exercised end-to-end (create order →
 * sign payment → SERVER-SIDE HMAC verification → persist order → decrement
 * stock → clear cart). It reuses the identical signature-verification code path
 * as real Razorpay; only the signing secret differs.
 *
 * Safety: demo mode is DISABLED in production — a production deploy MUST set
 * real RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET, otherwise create-order returns 503.
 */
const DEMO_SECRET = 'shopkart_demo_payment_secret_not_for_production';
const demoEnabled = !hasRazorpayConfig && process.env.NODE_ENV !== 'production';

const CART_POPULATE = { path: 'items.product', select: 'name price images stock seller isActive' };

/**
 * @route   GET /api/payments/mode
 * @desc    Tells the frontend whether real Razorpay or the demo gateway is active.
 * @access  Private
 */
const getPaymentMode = (req, res) => {
  res.json({ configured: hasRazorpayConfig, demo: demoEnabled });
};

/**
 * @route   POST /api/payments/create-order
 * @desc    Step 1 of checkout: build a Razorpay (or demo) order for the cart.
 *          The amount is computed SERVER-SIDE from the cart (never trusted from the client).
 * @access  Private
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    if (!razorpayInstance && !demoEnabled) {
      return res.status(503).json({
        message: 'Razorpay is not configured on this server. Add RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (test keys) to .env',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Your cart is empty' });

    // Validate availability & compute total from DB prices
    let total = 0;
    for (const item of cart.items) {
      const p = item.product;
      if (!p || !p.isActive) return res.status(400).json({ message: 'An item in your cart is no longer available' });
      if (p.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${p.name}" (available: ${p.stock})` });
      }
      total += p.price * item.quantity;
    }
    total = Math.round(total * 100) / 100;
    const amountInPaise = Math.round(total * 100); // Razorpay works in the smallest currency unit
    const user = { name: req.user.name, email: req.user.email };

    // ---- Real Razorpay ----
    if (razorpayInstance) {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { userId: req.user._id.toString() },
      });
      return res.status(201).json({
        demo: false,
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID, // public key_id is safe to expose to checkout.js
        user,
      });
    }

    // ---- Demo gateway (no keys configured) ----
    const demoOrderId = `order_DEMO_${crypto.randomBytes(10).toString('hex')}`;
    return res.status(201).json({
      demo: true,
      razorpayOrderId: demoOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: 'rzp_DEMO_KEY',
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/payments/demo-sign
 * @desc    DEMO ONLY. Plays the role of Razorpay's servers: given a demo order id,
 *          mints a payment id and the HMAC-SHA256 signature over
 *          `${order_id}|${payment_id}` with the demo secret. The frontend then sends
 *          these to /payments/verify — the SAME verification used for real Razorpay.
 *          Returns 404 unless demo mode is active (never in production).
 * @access  Private
 */
const demoSignOrder = (req, res) => {
  if (!demoEnabled) return res.status(404).json({ message: 'Demo signing is not available' });
  const { razorpayOrderId } = req.body || {};
  if (!razorpayOrderId || !String(razorpayOrderId).startsWith('order_DEMO_')) {
    return res.status(400).json({ message: 'Invalid demo order id' });
  }
  const paymentId = `pay_DEMO_${crypto.randomBytes(10).toString('hex')}`;
  const signature = crypto
    .createHmac('sha256', DEMO_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex');
  res.json({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  });
};

/**
 * @route   POST /api/payments/verify
 * @desc    Step 2: verify the payment signature (HMAC-SHA256 of
 *          `${order_id}|${payment_id}` with the active secret). This is what
 *          prevents fake "success" callbacks. Only after a valid signature do
 *          we persist the order, decrement stock and clear the cart.
 * @body    { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress }
 * @access  Private
 */
const verifyPaymentAndCreateOrder = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment details' });
    }
    if (!hasRazorpayConfig && !demoEnabled) {
      return res.status(503).json({ message: 'Razorpay is not configured on this server' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // ---- Signature verification (identical for real Razorpay & demo) ----
    const activeSecret = hasRazorpayConfig ? process.env.RAZORPAY_KEY_SECRET : DEMO_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const received = Buffer.from(String(razorpay_signature));
    const expected = Buffer.from(expectedSignature);
    const isValid =
      received.length === expected.length && crypto.timingSafeEqual(received, expected);

    if (!isValid) {
      return res.status(400).json({ message: 'Payment signature verification failed — order NOT created' });
    }

    // Re-read the cart and recompute the total server-side
    const cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Your cart is empty' });

    let total = 0;
    for (const item of cart.items) {
      const p = item.product;
      if (!p || !p.isActive || p.stock < item.quantity) {
        return res.status(400).json({ message: `Item unavailable or insufficient stock: ${p ? p.name : 'unknown product'}` });
      }
      total += p.price * item.quantity;
    }
    total = Math.round(total * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url || '',
        price: item.product.price,
        quantity: item.quantity,
        seller: item.product.seller,
      })),
      shippingAddress,
      totalAmount: total,
      payment: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      isPaid: true,
      paidAt: new Date(),
      status: 'paid',
    });

    // Decrement stock atomically
    await Promise.all(
      cart.items.map((item) =>
        Product.updateOne({ _id: item.product._id }, { $inc: { stock: -item.quantity } })
      )
    );

    // Clear the cart
    cart.items = [];
    await cart.save();

    const populated = await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name' },
    ]);
    res.status(201).json({ message: 'Payment verified — order placed successfully', order: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentAndCreateOrder,
  demoSignOrder,
  getPaymentMode,
  hasRazorpayConfig,
  demoEnabled,
};
