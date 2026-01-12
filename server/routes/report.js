const express = require('express');
const router = express.Router();
const {
  createReport,
  getAllReports,
  getReport,
  updateReportStatus,
  getStatusHistory,
  getNearbyReports,
  deleteReport,
  updateReportAssignment,
  updateInstitutionNotes
} = require('../controller/report');
const { protect } = require('../middleware/auth');
const { authorizeStatusUpdate, validateStatusTransition } = require('../middleware/statusAuth');
const { upload, uploadMultipleToFirebase } = require('../utils/fileUpload');
const Report = require('../models/Report');
const { detectAndCreateAlert } = require('../utils/alertDetection');

// Public routes
router.get('/', getAllReports);
router.get('/:id', getReport);
router.get('/:id/status-history', getStatusHistory);
router.get('/nearby/:longitude/:latitude', getNearbyReports);

// Protected routes (authenticated users only)
router.post('/', protect, createReport);
router.delete('/:id', protect, deleteReport);

// Create report with file uploads (images/videos)
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

    const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

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

    // Upload files to Firebase
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

    if (fileUrls.length > 0) {
      reportData.images = fileUrls.map(url => ({ url, uploadedAt: new Date() }));
    }

    const report = await Report.create(reportData);
    await report.populate('reportedBy', 'name email phone city state');

    // Trigger alert detection
    detectAndCreateAlert(report).catch(err => console.error('Alert detection error:', err));

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

// Protected routes (POLICE, MUNICIPAL, ADMIN only) with status transition validation
router.put('/:id/status', protect, authorizeStatusUpdate, validateStatusTransition, updateReportStatus);

// Institution routes for assignment and notes
router.put('/:id/assignment', protect, updateReportAssignment);
router.put('/:id/notes', protect, updateInstitutionNotes);

module.exports = router;
