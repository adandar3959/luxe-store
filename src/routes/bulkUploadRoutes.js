
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadBulkProducts } = require('../controllers/bulkUploadController');
const { protect, staff } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/temp/' });

router.post('/upload', protect, staff, upload.single('file'), uploadBulkProducts);

module.exports = router;

module.exports = router;