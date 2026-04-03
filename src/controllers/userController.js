const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 1. Generate & Send OTP
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    // Send Email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset OTP - Luxe',
        text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error('Email could not be sent');
    }
});
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Clean comparison without debug logs
    if (String(user.otp) === String(otp) && user.otpExpires > Date.now()) {
        
        user.password = newPassword; 
        user.otp = undefined;       
        user.otpExpires = undefined;
        
        await user.save();
        res.json({ message: 'Password updated successfully' });
        
    } else {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }
});
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,

            isAdmin: user.role === 'admin', 
            role: user.role, 
            
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, adminKey } = req.body; 

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    let role = 'customer';
    if (adminKey === process.env.ADMIN_SECRET_KEY) {
        role = 'admin';
    }

    const user = await User.create({
        name,
        email,
        password,
        role 
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// GET /api/users/profile

const getUserProfile = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            isAdmin: user.role === 'admin',
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;

        if (req.body.password && req.body.password.trim() !== '') {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address,
            isAdmin: updatedUser.role === 'admin',
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
module.exports = { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile ,
  forgotPassword,
  resetPassword

};