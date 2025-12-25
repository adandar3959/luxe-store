const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect, admin, staff } = require('../middleware/authMiddleware');

// Public route
router.post('/subscribe', newsletterController.subscribe);

// Admin routes
router.get('/list', protect, admin, newsletterController.getSubscribers);
router.post('/send-bulk', protect, admin, newsletterController.sendMassEmail);
router.delete('/delete/:id', protect, admin, newsletterController.deleteSubscriber);

module.exports = router;