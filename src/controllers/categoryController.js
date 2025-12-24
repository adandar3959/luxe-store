const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');

const createCategory = asyncHandler(async (req, res) => {
    const { name, image, parentId } = req.body;
    
    const slug = name.toLowerCase().split(' ').join('-');

    // 👇 UPDATED CHECK: Only fail if name exists AND parent is the same
    const categoryExists = await Category.findOne({ 
        name, 
        parentId: parentId || null 
    });

    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists in this parent group');
    }

    const category = await Category.create({
        name,
        slug,
        image,
        parentId: parentId || null
    });

    res.status(201).json(category);
});
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public/Private
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Employee
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = req.body.name || category.name;
        category.image = req.body.image || category.image;
        category.parentId = req.body.parentId || category.parentId;
        
        if(req.body.name) {
            category.slug = req.body.name.toLowerCase().split(' ').join('-');
        }

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Employee
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};