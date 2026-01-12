const Report = require('../models/Report');
const Alert = require('../models/Alert');

// Configuration
const ALERT_THRESHOLD = 3; // Minimum number of reports to trigger alert
const TIME_WINDOW_HOURS = 24; // Time window in hours
const CLUSTER_RADIUS_METERS = 1000; // 1km radius for clustering

/**
 * Detect report clusters and create alerts
 * @param {Object} newReport - The newly created report
 * @returns {Object|null} Created alert or null
 */
const detectAndCreateAlert = async (newReport) => {
  try {
    // Only check for verified reports or high priority ones
    if (!newReport.verified && newReport.priority !== 'HIGH') {
      return null;
    }

    const timeThreshold = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
    
    // Find nearby reports in the same category within time window
    const nearbyReports = await Report.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: newReport.location.coordinates
          },
          distanceField: 'distance',
          maxDistance: CLUSTER_RADIUS_METERS,
          spherical: true,
          query: {
            category: newReport.category,
            createdAt: { $gte: timeThreshold },
            _id: { $ne: newReport._id }
          }
        }
      },
      {
        $match: {
          $or: [
            { verified: true },
            { priority: 'HIGH' }
          ]
        }
      }
    ]);

    // Include the new report in the count
    const totalReports = nearbyReports.length + 1;

    // Check if threshold is exceeded
    if (totalReports < ALERT_THRESHOLD) {
      return null;
    }

    // Check if an active alert already exists for this area
    const existingAlert = await Alert.findOne({
      category: newReport.category,
      isActive: true,
      'area.center.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: newReport.location.coordinates
          },
          $maxDistance: CLUSTER_RADIUS_METERS
        }
      },
      createdAt: { $gte: timeThreshold }
    });

    if (existingAlert) {
      // Update existing alert with new report
      existingAlert.reports.push(newReport._id);
      existingAlert.reportCount = existingAlert.reports.length;
      
      // Upgrade severity if needed
      if (totalReports >= 10) {
        existingAlert.severity = 'CRITICAL';
      } else if (totalReports >= 7) {
        existingAlert.severity = 'HIGH';
      } else if (totalReports >= 5) {
        existingAlert.severity = 'MEDIUM';
      }
      
      await existingAlert.save();
      return existingAlert;
    }

    // Determine severity based on report count
    let severity = 'LOW';
    if (totalReports >= 10) {
      severity = 'CRITICAL';
    } else if (totalReports >= 7) {
      severity = 'HIGH';
    } else if (totalReports >= 5) {
      severity = 'MEDIUM';
    }

    // Get area name from report or use coordinates
    const areaName = newReport.location.address || 
                     `${newReport.location.city || 'Unknown'}, ${newReport.location.state || ''}`;

    // Create alert message
    const message = generateAlertMessage(newReport.category, totalReports, areaName, severity);

    // Collect all report IDs
    const reportIds = [newReport._id, ...nearbyReports.map(r => r._id)];

    // Create new alert
    const alert = await Alert.create({
      message,
      area: {
        name: areaName,
        center: {
          type: 'Point',
          coordinates: newReport.location.coordinates
        },
        radius: CLUSTER_RADIUS_METERS
      },
      severity,
      category: newReport.category,
      reportCount: totalReports,
      reports: reportIds,
      threshold: ALERT_THRESHOLD,
      timeWindow: TIME_WINDOW_HOURS,
      affectedArea: `${areaName} and surrounding ${CLUSTER_RADIUS_METERS}m radius`
    });

    console.log(`🚨 Alert created: ${alert.severity} - ${alert.message}`);
    return alert;

  } catch (error) {
    console.error('Error in alert detection:', error);
    throw error;
  }
};

/**
 * Generate alert message based on category and severity
 * @param {String} category - Report category
 * @param {Number} count - Number of reports
 * @param {String} area - Area name
 * @param {String} severity - Alert severity
 * @returns {String} Alert message
 */
const generateAlertMessage = (category, count, area, severity) => {
  const categoryMessages = {
    CRIME: `${count} crime incidents reported in ${area} within the last 24 hours. Exercise caution in this area.`,
    MISSING: `${count} missing person reports in ${area}. Community assistance requested.`,
    DOG: `${count} stray dog incidents reported in ${area}. Avoid the area if possible.`,
    HAZARD: `${count} hazards reported in ${area}. Area may be unsafe.`,
    NATURAL_DISASTER: `${count} natural disaster reports in ${area}. Seek shelter and follow safety protocols.`
  };

  let message = categoryMessages[category] || `${count} incidents reported in ${area}.`;

  if (severity === 'CRITICAL') {
    message = `⚠️ CRITICAL ALERT: ${message}`;
  } else if (severity === 'HIGH') {
    message = `⚠️ HIGH ALERT: ${message}`;
  }

  return message;
};

/**
 * Check for potential alerts in a specific area
 * @param {Number} longitude - Longitude
 * @param {Number} latitude - Latitude
 * @param {String} category - Report category (optional)
 * @returns {Array} List of potential clusters
 */
const checkAreaForClusters = async (longitude, latitude, category = null) => {
  try {
    const timeThreshold = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
    
    const matchQuery = {
      createdAt: { $gte: timeThreshold },
      $or: [
        { verified: true },
        { priority: 'HIGH' }
      ]
    };

    if (category) {
      matchQuery.category = category;
    }

    const clusters = await Report.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: CLUSTER_RADIUS_METERS * 3, // Check wider area
          spherical: true,
          query: matchQuery
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          reports: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gte: ALERT_THRESHOLD }
        }
      }
    ]);

    return clusters;
  } catch (error) {
    console.error('Error checking area for clusters:', error);
    throw error;
  }
};

module.exports = {
  detectAndCreateAlert,
  checkAreaForClusters,
  ALERT_THRESHOLD,
  TIME_WINDOW_HOURS,
  CLUSTER_RADIUS_METERS
};
