const Cart = require('../models/Cart');
const Product = require('../models/Product');

const CART_POPULATE = {
  path: 'items.product',
  select: 'name price images stock category seller isActive',
};

/** Compute cart totals server-side (never trust client-supplied prices) */
const computeTotals = (cart) => {
  const validItems = cart.items.filter((i) => i.product);
  const itemsCount = validItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = validItems.reduce((sum, i) => {
    const price = i.product?.price ?? 0;
    return sum + price * i.quantity;
  }, 0);
  return { itemsCount, total: Math.round(total * 100) / 100 };
};

/**
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ ...cart.toObject(), ...computeTotals(cart) });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/cart
 * @body    { productId, quantity }
 * @desc    Add product to cart or update its quantity. Validates product
 *          existence, active state and available stock server-side.
 * @access  Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found or unavailable' });
    if (product.stock < qty) {
      return res.status(400).json({ message: `Only ${product.stock} unit(s) in stock for "${product.name}"` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === product._id.toString());
    if (existing) {
      const newQty = existing.quantity + qty > product.stock ? product.stock : existing.quantity + qty;
      existing.quantity = newQty;
    } else {
      cart.items.push({ product: product._id, quantity: qty });
    }

    await cart.save();
    await cart.populate(CART_POPULATE);
    res.status(201).json({ ...cart.toObject(), ...computeTotals(cart) });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/cart/:productId
 * @body    { quantity }
 * @desc    Set exact quantity for a cart item (0 removes it)
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart is empty' });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    const qty = parseInt(req.body.quantity);
    if (Number.isNaN(qty) || qty < 0) return res.status(400).json({ message: 'Invalid quantity' });

    if (qty === 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    } else {
      const product = await Product.findById(req.params.productId);
      if (!product || !product.isActive) return res.status(404).json({ message: 'Product no longer available' });
      if (product.stock < qty) {
        return res.status(400).json({ message: `Only ${product.stock} unit(s) in stock for "${product.name}"` });
      }
      item.quantity = qty;
    }

    await cart.save();
    await cart.populate(CART_POPULATE);
    res.json({ ...cart.toObject(), ...computeTotals(cart) });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart is empty' });
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate(CART_POPULATE);
    res.json({ ...cart.toObject(), ...computeTotals(cart) });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/cart
 * @desc    Clear the whole cart (used after successful payment)
 * @access  Private
 */
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true, new: true });
    res.json({ items: [], itemsCount: 0, total: 0, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, computeTotals };
