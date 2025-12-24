const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');

router.route('/').get(protect, getWishlist).post(protect, addToWishlist);
router.route('/:id').delete(protect, removeFromWishlist);

module.exports = router;