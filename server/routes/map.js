const express = require('express');
const router = express.Router();
const {
  getMapReports,
  getNearbyMapReports,
  getReportBounds,
  getMapStats,
  getMapClusters
} = require('../controller/map');

// Public routes
router.get('/reports', getMapReports);
router.get('/nearby/:longitude/:latitude', getNearbyMapReports);
router.get('/bounds', getReportBounds);
router.get('/stats', getMapStats);
router.get('/clusters', getMapClusters);

module.exports = router;
