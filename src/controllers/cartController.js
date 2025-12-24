const asyncHandler = require('express-async-handler');
const Cart = require('../models/cartModel');

// @desc    Sync (Save) User Cart
// @route   PUT /api/cart
// @access  Private
const syncCart = asyncHandler(async (req, res) => {
    const { cartItems } = req.body;
    const userId = req.user._id;

    console.log("--------------- SYNC CART (SAVE) ---------------");
    console.log("User:", userId);
    console.log("Items to Save:", cartItems.length);

    // 1. Calculate Total Price (Handle both 'qty' and 'quantity')
    const totalPrice = cartItems.reduce((acc, item) => {
        const qty = item.qty || item.quantity || 1;
        return acc + (qty * item.price);
    }, 0);

    try {
        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            cart.cartItems = cartItems;
            cart.totalPrice = totalPrice;
            await cart.save();
            console.log("✅ Cart Updated Successfully in DB!");
            res.json(cart);
        } else {
            const newCart = await Cart.create({
                user: userId,
                cartItems: cartItems,
                totalPrice: totalPrice
            });
            console.log("✅ New Cart Created in DB!");
            res.status(201).json(newCart);
        }
    } catch (error) {
        console.error("❌ SAVE FAILED:", error.message);
        res.status(500);
        throw new Error("Database Save Failed: " + error.message);
    }
});

// @desc    Get User Cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("--------------- GET CART (LOAD) ---------------");
    console.log("Fetching for User:", userId);

    try {
        const cart = await Cart.findOne({ user: userId });

        if (cart && cart.cartItems.length > 0) {
            console.log(`✅ Found ${cart.cartItems.length} items in DB.`);
            res.json(cart.cartItems);
        } else {
            console.log("⚠️ Cart is Empty or Not Found in DB.");
            res.json([]);
        }
    } catch (error) {
        console.error("❌ GET FAILED:", error.message);
        res.status(500);
        throw new Error("Failed to fetch cart");
    }
});

module.exports = { syncCart, getCart };