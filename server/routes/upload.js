const express = require('express');
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getMetadata
} = require('../controller/upload');
const { protect } = require('../middleware/auth');

// All upload routes require authentication
router.use(protect);

/**
 * @route   POST /api/upload/single
 * @desc    Upload single file (image or video)
 * @access  Private
 */
router.post('/single', upload.single('file'), uploadSingle);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (max 10)
 * @access  Private
 */
router.post('/multiple', upload.array('files', 10), uploadMultiple);

/**
 * @route   DELETE /api/upload
 * @desc    Delete a file from Firebase Storage
 * @access  Private
 */
router.delete('/', deleteFile);

/**
 * @route   GET /api/upload/metadata
 * @desc    Get file metadata
 * @access  Private
 */
router.get('/metadata', getMetadata);

module.exports = router;
