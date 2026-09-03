const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all wishlist routes require login

router.route('/').get(getWishlist).post(addToWishlist);
router.route('/:productId').delete(removeFromWishlist);

module.exports = router;
