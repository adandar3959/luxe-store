const express = require('express');
const router = express.Router();
const { syncCart, getCart } = require('../controllers/cartController');

const { protect } = require('../middleware/authMiddleware');
// 2. Add 'protect' before the functions
router.route('/')
    .get(protect, getCart)
    .put(protect, syncCart);

module.exports = router;