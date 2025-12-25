const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { auth, adminAuth } = require('../middleware/auth'); // Import your existing auth middleware

// Public route
router.post('/subscribe', newsletterController.subscribe);

// Admin routes
router.get('/list', auth, adminAuth, newsletterController.getSubscribers);
router.post('/send-bulk', auth, adminAuth, newsletterController.sendMassEmail);
router.delete('/delete/:id', auth, adminAuth, newsletterController.deleteSubscriber);

module.exports = router;