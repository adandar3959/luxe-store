const express = require('express');
const router = express.Router();
const { 
    createCategory, 
    getCategories, 
    updateCategory, 
    deleteCategory 
} = require('../controllers/categoryController');
const { protect, staff, admin } = require('../middleware/authMiddleware');

// Public/Everyone can read categories
router.route('/').get(getCategories);

// Only Employees can Create
router.route('/').post(protect, staff, createCategory);

// Only Employees can Update/Delete
router.route('/:id')
    .put(protect, staff, updateCategory)
    .delete(protect, staff, deleteCategory);

module.exports = router;