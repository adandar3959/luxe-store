const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cartItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String },
            image: { type: String },
            price: { type: Number, required: true },
            size: { type: String },
            color: { type: String },
            // Ensure this matches what you send (qty vs quantity)
            qty: { type: Number, default: 1 } 
        }
    ],
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);