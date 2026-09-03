const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all cart routes require login

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/:productId').put(updateCartItem).delete(removeFromCart);

module.exports = router;
