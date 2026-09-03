const User = require('../models/User');
const Product = require('../models/Product');

/**
 * @route   GET /api/users
 * @desc    List all users (with product counts for sales persons)
 * @access  Private (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort('-createdAt');

    // Count products owned by each seller in one aggregation
    const counts = await Product.aggregate([
      { $group: { _id: '$seller', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json(
      users.map((u) => ({
        ...u.toJSON(),
        productCount: countMap[String(u._id)] || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change a user's role. Admins cannot demote themselves
 *          (guarantees at least one admin remains and prevents lockout).
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'sales', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be one of: user, sales, admin' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    user.role = role;
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Activate / deactivate a user account
 * @access  Private (Admin)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    user.isActive = Boolean(req.body.isActive);
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user. Self-deletion is blocked. Products owned by the
 *          deleted sales person are reassigned to the acting admin so listings stay valid.
 * @access  Private (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Product.updateMany({ seller: user._id }, { $set: { seller: req.user._id } });
    await user.deleteOne();
    res.json({ message: `User ${user.email} deleted`, _id: user._id });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserRole, updateUserStatus, deleteUser };
