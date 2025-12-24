const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, deleteProduct, updateProduct,getLowStockProducts } = require('../controllers/productController');
const { protect, staff } = require('../middleware/authMiddleware'); // Import 'staff'

router.route('/')
    .get(getProducts)
    .post(protect, staff, createProduct); // admin to staff

router.get('/lowstock', protect, staff, getLowStockProducts);

router.route('/:id')
    .get(getProductById)
    .delete(protect, staff, deleteProduct) //  admin to staff
    .put(protect, staff, updateProduct); 

module.exports = router;