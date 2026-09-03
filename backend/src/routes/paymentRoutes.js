const express = require('express');
const {
  createPaymentOrder,
  verifyPaymentAndCreateOrder,
  demoSignOrder,
  getPaymentMode,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/mode', getPaymentMode);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPaymentAndCreateOrder);
router.post('/demo-sign', demoSignOrder); // demo gateway only — 404 in production

module.exports = router;
