const Alert = require('../models/Alert');
const { checkAreaForClusters } = require('../utils/alertDetection');

/**
 * @desc    Get all alerts with filters
 * @route   GET /api/alerts
 * @access  Public
 */
const getAllAlerts = async (req, res) => {
  try {
    const {
      severity,
      category,
      isActive,
      longitude,
      latitude,
      radius,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (severity) {
      query.severity = severity;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    let alerts;

    // If location provided, search nearby
    if (longitude && latitude) {
      const maxDistance = radius ? parseInt(radius) : 5000; // Default 5km
      
      alerts = await Alert.findNearbyAlerts(
        parseFloat(longitude),
        parseFloat(latitude),
        maxDistance
      );

      // Apply additional filters
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      if (category) {
        alerts = alerts.filter(a => a.category === category);
      }
    } else {
      // Regular query with pagination
      const skip = (page - 1) * limit;
      
      alerts = await Alert.find(query)
        .populate('reports', 'title category status createdAt')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    }

    const total = await Alert.countDocuments(query);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

/**
 * @desc    Get single alert by ID
 * @route   GET /api/alerts/:id
 * @access  Public
 */
const getAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('reports', 'title category status location priority createdAt')
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert',
      error: error.message
    });
  }
};

/**
 * @desc    Get active alerts by severity
 * @route   GET /api/alerts/severity/:severity
 * @access  Public
 */
const getAlertsBySeverity = async (req, res) => {
  try {
    const { severity } = req.params;
    
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validSeverities.includes(severity.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid severity level',
        validSeverities
      });
    }

    const alerts = await Alert.getActiveBySeverity(severity.toUpperCase());

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts by severity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

/**
 * @desc    Resolve an alert
 * @route   PUT /api/alerts/:id/resolve
 * @access  Private (ADMIN, POLICE, MUNICIPAL)
 */
const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (!alert.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      });
    }

    const resolvedAlert = await alert.resolve(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: resolvedAlert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
};

/**
 * @desc    Check for clusters in an area
 * @route   POST /api/alerts/check-clusters
 * @access  Public
 */
const checkClusters = async (req, res) => {
  try {
    const { longitude, latitude, category } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    const clusters = await checkAreaForClusters(
      parseFloat(longitude),
      parseFloat(latitude),
      category
    );

    res.status(200).json({
      success: true,
      count: clusters.length,
      data: clusters,
      message: clusters.length > 0 
        ? 'Potential clusters detected in this area' 
        : 'No significant clusters detected'
    });
  } catch (error) {
    console.error('Error checking clusters:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking clusters',
      error: error.message
    });
  }
};

/**
 * @desc    Get alert statistics
 * @route   GET /api/alerts/stats
 * @access  Public
 */
const getAlertStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $facet: {
          bySeverity: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 },
                active: {
                  $sum: { $cond: ['$isActive', 1, 0] }
                }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                active: {
                  $sum: { $cond: ['$isActive', 1, 0] }
                }
              }
            }
          ],
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: ['$isActive', 1, 0] }
                },
                resolved: {
                  $sum: { $cond: ['$isActive', 0, 1] }
                },
                avgReportCount: { $avg: '$reportCount' }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllAlerts,
  getAlert,
  getAlertsBySeverity,
  resolveAlert,
  checkClusters,
  getAlertStats
};
