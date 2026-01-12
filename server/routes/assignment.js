const express = require('express');
const router = express.Router();
const {
  assignReport,
  unassignReport,
  getAssignmentHistory,
  getDepartmentReports
} = require('../controller/assignment');
const { protect } = require('../middleware/auth');
const { authorizeStatusUpdate } = require('../middleware/statusAuth');

// Public routes
router.get('/:id/assignment-history', getAssignmentHistory);

// Protected routes (POLICE, MUNICIPAL, ADMIN only)
router.put('/:id/assign', protect, authorizeStatusUpdate, assignReport);

// Admin only routes
router.put('/:id/unassign', protect, authorizeStatusUpdate, unassignReport);

// Department routes
router.get('/department/:id/reports', protect, getDepartmentReports);

module.exports = router;
