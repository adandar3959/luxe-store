
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadBulkProducts } = require('../controllers/bulkUploadController');


const upload = multer({ dest: 'uploads/temp/' });

router.post('/upload', upload.single('file'), uploadBulkProducts);

module.exports = router;