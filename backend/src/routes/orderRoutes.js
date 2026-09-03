const express = require('express');
const {
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all order routes require login

router.get('/mine', getMyOrders);
router.get('/', authorize('admin', 'sales'), getOrders); // backend role check, not just UI
router.get('/:id', getOrderById); // owner / admin / involved seller (checked in controller)
router.patch('/:id/status', authorize('admin'), updateOrderStatus); // Admin only

module.exports = router;
