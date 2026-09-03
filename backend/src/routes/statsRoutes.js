const express = require('express');
const { getStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);

module.exports = router;
