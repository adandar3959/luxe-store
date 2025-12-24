const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, updateUserProfile,forgotPassword,resetPassword} = require('../controllers/userController');

router.post('/login', authUser);
router.post('/', registerUser);

const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;