const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @route   GET /api/admin/stats
 * @desc    Basic sales stats for the Admin dashboard:
 *          total revenue (paid orders), order counts by status, users,
 *          products, low-stock items, top products and recent orders.
 * @access  Private (Admin)
 */
const getStats = async (req, res, next) => {
  try {
    const paidStatuses = ['paid', 'processing', 'shipped', 'delivered'];

    const [revenueAgg, orderCount, paidCount, userCount, salesCount, productCount, lowStock, recentOrders, statusAgg] =
      await Promise.all([
        Order.aggregate([
          { $match: { isPaid: true, status: { $in: paidStatuses } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
        ]),
        Order.countDocuments(),
        Order.countDocuments({ isPaid: true }),
        User.countDocuments(),
        User.countDocuments({ role: 'sales' }),
        Product.countDocuments(),
        Product.find({ stock: { $lte: 5 } }).select('name stock price').sort('stock').limit(5).lean(),
        Order.find().populate('user', 'name email').sort('-createdAt').limit(8).lean(),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ]);

    // Top products by units sold (units and revenue per product, from paid orders)
    const topProducts = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));

    res.json({
      totalRevenue: Math.round((revenueAgg[0]?.revenue || 0) * 100) / 100,
      totalOrders: orderCount,
      paidOrders: paidCount,
      totalUsers: userCount,
      totalSalesPersons: salesCount,
      totalProducts: productCount,
      ordersByStatus: statusCounts,
      lowStock,
      topProducts,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
