const express = require('express');
const {
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin-only user & role management — enforced server-side
router.use(protect, authorize('admin'));

router.route('/').get(getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
