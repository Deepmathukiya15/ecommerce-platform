const express = require('express');
const {
  getProducts,
  getCategories,
  getProductById,
  uploadImages,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Public (optional auth lets admin/sales include inactive products in management views)
router.get('/', optionalProtect, getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected — Admin & Sales Person only
router.post('/upload', protect, authorize('admin', 'sales'), upload.array('images', 5), uploadImages);
router.post('/', protect, authorize('admin', 'sales'), createProduct);
router.put('/:id', protect, authorize('admin', 'sales'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'sales'), deleteProduct);

module.exports = router;
