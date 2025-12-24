const Wishlist = require('../models/wishlistModel');

//  GET /api/wishlist

const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
        }
        
        res.status(200).json(wishlist.products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  POST /api/wishlist
const addToWishlist = async (req, res) => {
    const { productId } = req.body; 

    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, products: [] });
        }

        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/wishlist/:id
const removeFromWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                (id) => id.toString() !== req.params.id
            );
            await wishlist.save();
        }

        res.status(200).json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };