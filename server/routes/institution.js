const express = require('express');
const router = express.Router();
const {
  registerInstitution,
  loginInstitution,
  getInstitutionProfile,
  updateInstitutionProfile,
  getAllInstitutions,
  getInstitution,
  verifyInstitution,
  updateInstitutionStatus,
  getInstitutionStatistics
} = require('../controller/institution');
const { protect } = require('../middleware/auth');

// Middleware to check if user is institution
const institutionAuth = async (req, res, next) => {
  try {
    const Institution = require('../models/Institution');
    const institution = await Institution.findById(req.user.id);
    
    if (!institution) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Institution account required.'
      });
    }
    
    req.institution = institution;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Middleware for admin only
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Public routes
router.post('/register', registerInstitution);
router.post('/login', loginInstitution);
router.get('/', getAllInstitutions);
router.get('/:id', getInstitution);
router.get('/:id/statistics', getInstitutionStatistics);

// Protected routes (Institution only)
router.get('/me', protect, institutionAuth, getInstitutionProfile);
router.put('/profile', protect, institutionAuth, updateInstitutionProfile);

// Admin routes
router.put('/:id/verify', protect, adminOnly, verifyInstitution);
router.put('/:id/status', protect, adminOnly, updateInstitutionStatus);

module.exports = router;
