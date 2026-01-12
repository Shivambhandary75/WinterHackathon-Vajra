const express = require('express');
const router = express.Router();
const {
  getAllAlerts,
  getAlert,
  getAlertsBySeverity,
  resolveAlert,
  checkClusters,
  getAlertStats
} = require('../controller/alert');
const { protect } = require('../middleware/auth');

// Custom middleware for authority roles
const authorityOnly = (req, res, next) => {
  if (!['ADMIN', 'POLICE', 'MUNICIPAL'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Authority roles only.'
    });
  }
  next();
};

// Public routes
router.get('/', getAllAlerts);
router.get('/stats', getAlertStats);
router.get('/severity/:severity', getAlertsBySeverity);
router.get('/:id', getAlert);
router.post('/check-clusters', checkClusters);

// Protected routes (Authority only)
router.put('/:id/resolve', protect, authorityOnly, resolveAlert);

module.exports = router;
