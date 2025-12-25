const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

//  Get /api/products?category=Men
const getProducts = asyncHandler(async (req, res) => {
    let query = {};

    if (req.query.keyword) {
        query.name = new RegExp(req.query.keyword, 'i');
    }

    if (req.query.category) {
        query.category = new RegExp(`^${req.query.category}$`, 'i');
    }

    const products = await Product.find(query);
    
    res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

//  POST /api/products
const createProduct = asyncHandler(async (req, res) => {
    const { name, price,sizes, image, brand, category, countInStock, description } = req.body;

    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized. Please login.');
    }

    const product = new Product({
        name,
        price,
        user: req.user._id,
        image,
        brand,
        category,
        countInStock,
        numReviews: 0,
        description,
        sizes: sizes || []
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne(); 
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

//  PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, sizes, description, image, brand, category, countInStock } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.price = price || product.price;
        product.sizes = sizes || product.sizes;
        product.description = description || product.description;
        product.image = image || product.image;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.countInStock = countInStock || product.countInStock;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// GET /api/products/lowstock
const getLowStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ countInStock: { $lte: 5 } });
    res.json(products);
});
module.exports = {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    updateProduct,
    getLowStockProducts,
};