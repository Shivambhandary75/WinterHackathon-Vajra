const express = require('express');
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const { uploadMultipleToFirebase } = require('../utils/fileUpload');
const Report = require('../models/Report');
const { detectAndCreateAlert } = require('../utils/alertDetection');
const { protect } = require('../middleware/auth');

/**
 * @desc    Create report with file uploads
 * @route   POST /api/reports/with-files
 * @access  Private
 */
router.post('/with-files', protect, upload.array('files', 10), async (req, res) => {
  try {
    const { title, category, description, latitude, longitude, address, priority } = req.body;

    // Validation
    if (!title || !category || !description || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, description, and address'
      });
    }

    // Validate category
    const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Upload files to Firebase if provided
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        fileUrls = await uploadMultipleToFirebase(req.files, 'reports');
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `File upload failed: ${uploadError.message}`
        });
      }
    }

    // Create report
    const reportData = {
      title,
      category,
      description,
      priority: priority || 'MEDIUM',
      reportedBy: req.user.id,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address
      }
    };

    // Add uploaded file URLs
    if (fileUrls.length > 0) {
      reportData.images = fileUrls.map(url => ({
        url,
        uploadedAt: new Date()
      }));
    }

    const report = await Report.create(reportData);
    await report.populate('reportedBy', 'name email phone city state');

    // Trigger alert detection
    detectAndCreateAlert(report).catch(err => {
      console.error('Alert detection error:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report,
      filesUploaded: fileUrls.length
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
