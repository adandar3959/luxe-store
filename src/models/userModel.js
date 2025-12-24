const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: { type: String },
    address: { type: String }, 
    
    role: { 
        type: String, 
        enum: ['customer', 'admin', 'employee'], 
        default: 'customer' 
    },
    
    // Employee Fields
    salary: { type: Number, default: 0 },
    position: { type: String, default: 'Staff' },
    lastPaidDate: { type: Date },
    
    otp: { type: String },
    otpExpires: { type: Date },

    addresses: [addressSchema],
    
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return; 
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);