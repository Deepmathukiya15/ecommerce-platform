const mongoose = require('mongoose');
const Order = require('../models/Order');

const ORDER_POPULATE = [
  { path: 'user', select: 'name email' },
  { path: 'items.product', select: 'name' },
  { path: 'items.seller', select: 'name email' },
];

/**
 * @route   GET /api/orders/mine
 * @desc    A user's own order history
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(ORDER_POPULATE).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/orders
 * @desc    Admin: ALL orders (with optional status filter + pagination).
 *          Sales Person: only orders that contain THEIR products.
 *          Regular users get 403 — role enforcement happens here on the backend.
 * @access  Private (Admin, Sales)
 */
const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    let filter = {};
    if (req.user.role === 'sales') {
      filter['items.seller'] = req.user._id; // only orders containing their products
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden — insufficient role to list orders' });
    }
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate(ORDER_POPULATE).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Order detail — visible to the owner, an Admin, or the Sales Person
 *          whose products are in the order.
 * @access  Private
 */
const getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found' });
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSellerInOrder = order.items.some((i) => i.seller?.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin && !isSellerInOrder) {
      return res.status(403).json({ message: 'Forbidden — you cannot view this order' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Admin-only fulfilment status update (paid → processing → shipped → delivered / cancelled)
 * @access  Private (Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled' && order.isPaid) {
      // Restore stock for cancelled paid orders
      await Promise.all(
        order.items.map((item) => Product_inc(item.product, item.quantity))
      );
      order.isPaid = false;
    }
    await order.save();

    const populated = await order.populate(ORDER_POPULATE);
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// Small helper to restore stock on cancellation
const Product = require('../models/Product');
const Product_inc = (productId, quantity) =>
  Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });

module.exports = { getMyOrders, getOrders, getOrderById, updateOrderStatus };
