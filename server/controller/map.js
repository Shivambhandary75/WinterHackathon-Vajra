const Report = require('../models/Report');

// @desc    Get all reports for map with filters
// @route   GET /api/map/reports
// @access  Public
exports.getMapReports = async (req, res) => {
  try {
    const { category, status, verified, limit = 1000, page = 1 } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
      if (validCategories.includes(category.toUpperCase())) {
        filter.category = category.toUpperCase();
      }
    }

    if (status) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
      }
    }

    // Handle verified filter
    if (verified !== undefined) {
      filter.verified = verified === 'true' || verified === true;
    }

    const skip = (page - 1) * limit;

    // Get map pins with minimal data
    const reports = await Report.find(filter)
      .select('title category priority status verified location latitude longitude createdAt views')
      .limit(parseInt(limit))
      .skip(skip)
      .lean()
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    // Transform data for map (include coordinates)
    const mapData = reports.map(report => ({
      _id: report._id,
      title: report.title,
      category: report.category,
      priority: report.priority,
      status: report.status,
      verified: report.verified,
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      createdAt: report.createdAt,
      views: report.views
    }));

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      reports: mapData
    });
  } catch (error) {
    console.error('Get Map Reports Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get nearby reports for map
// @route   GET /api/map/nearby/:longitude/:latitude
// @access  Public
exports.getNearbyMapReports = async (req, res) => {
  try {
    const { longitude, latitude } = req.params;
    const { radius = 5000, category, status, verified, limit = 500 } = req.query;

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseInt(radius);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of range'
      });
    }

    // Build aggregation pipeline with $geoNear
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          distanceField: 'distance',
          maxDistance: rad,
          spherical: true
        }
      }
    ];

    // Add filters if provided
    const filterStage = {};

    if (category) {
      const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
      if (validCategories.includes(category.toUpperCase())) {
        filterStage.category = category.toUpperCase();
      }
    }

    if (status) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filterStage.status = status.toUpperCase();
      }
    }

    if (verified !== undefined) {
      filterStage.verified = verified === 'true' || verified === true;
    }

    if (Object.keys(filterStage).length > 0) {
      pipeline.push({ $match: filterStage });
    }

    // Add limit and projection
    pipeline.push({
      $limit: parseInt(limit)
    });

    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        category: 1,
        priority: 1,
        status: 1,
        verified: 1,
        location: 1,
        createdAt: 1,
        views: 1,
        distance: 1
      }
    });

    // Execute aggregation
    const reports = await Report.aggregate(pipeline);

    // Transform data for map
    const mapData = reports.map(report => ({
      _id: report._id,
      title: report.title,
      category: report.category,
      priority: report.priority,
      status: report.status,
      verified: report.verified,
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      createdAt: report.createdAt,
      views: report.views,
      distance: Math.round(report.distance)
    }));

    res.status(200).json({
      success: true,
      count: mapData.length,
      centerPoint: {
        latitude: lat,
        longitude: lon
      },
      radius: rad,
      reports: mapData
    });
  } catch (error) {
    console.error('Get Nearby Map Reports Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get report bounds (min/max coordinates) for map auto-zoom
// @route   GET /api/map/bounds
// @access  Public
exports.getReportBounds = async (req, res) => {
  try {
    const { category, status, verified } = req.query;

    const filter = {};

    if (category) {
      const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
      if (validCategories.includes(category.toUpperCase())) {
        filter.category = category.toUpperCase();
      }
    }

    if (status) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
      }
    }

    if (verified !== undefined) {
      filter.verified = verified === 'true' || verified === true;
    }

    // Use aggregation to find bounds
    const bounds = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          minLat: { $min: { $arrayElemAt: ['$location.coordinates', 1] } },
          maxLat: { $max: { $arrayElemAt: ['$location.coordinates', 1] } },
          minLon: { $min: { $arrayElemAt: ['$location.coordinates', 0] } },
          maxLon: { $max: { $arrayElemAt: ['$location.coordinates', 0] } },
          totalReports: { $sum: 1 }
        }
      }
    ]);

    if (!bounds || bounds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reports found',
        bounds: null,
        totalReports: 0
      });
    }

    const boundData = bounds[0];

    res.status(200).json({
      success: true,
      bounds: {
        minLatitude: boundData.minLat,
        maxLatitude: boundData.maxLat,
        minLongitude: boundData.minLon,
        maxLongitude: boundData.maxLon
      },
      totalReports: boundData.totalReports,
      center: {
        latitude: (boundData.minLat + boundData.maxLat) / 2,
        longitude: (boundData.minLon + boundData.maxLon) / 2
      }
    });
  } catch (error) {
    console.error('Get Bounds Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get report count by category for map legend
// @route   GET /api/map/stats
// @access  Public
exports.getMapStats = async (req, res) => {
  try {
    const { status, verified } = req.query;

    const filter = {};

    if (status) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
      }
    }

    if (verified !== undefined) {
      filter.verified = verified === 'true' || verified === true;
    }

    // Get stats by category
    const stats = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          priorities: {
            $push: {
              priority: '$priority',
              status: '$status'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority breakdown
    const priorityStats = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get status breakdown
    const statusStats = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalReports,
      byCategory: stats,
      byPriority: priorityStats,
      byStatus: statusStats
    });
  } catch (error) {
    console.error('Get Map Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get cluster summary for map clustering
// @route   GET /api/map/clusters
// @access  Public
exports.getMapClusters = async (req, res) => {
  try {
    const { category, status, verified, gridSize = 0.5 } = req.query;

    const filter = {};

    if (category) {
      const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
      if (validCategories.includes(category.toUpperCase())) {
        filter.category = category.toUpperCase();
      }
    }

    if (status) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
      }
    }

    if (verified !== undefined) {
      filter.verified = verified === 'true' || verified === true;
    }

    // Group reports by grid
    const clusters = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            lat: {
              $multiply: [
                { $floor: { $divide: [{ $arrayElemAt: ['$location.coordinates', 1] }, parseFloat(gridSize)] } },
                parseFloat(gridSize)
              ]
            },
            lon: {
              $multiply: [
                { $floor: { $divide: [{ $arrayElemAt: ['$location.coordinates', 0] }, parseFloat(gridSize)] } },
                parseFloat(gridSize)
              ]
            }
          },
          count: { $sum: 1 },
          categories: { $push: '$category' },
          priorities: { $push: '$priority' },
          avgLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } },
          avgLon: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const clusterData = clusters.map(cluster => ({
      latitude: cluster.avgLat,
      longitude: cluster.avgLon,
      count: cluster.count,
      categories: [...new Set(cluster.categories)],
      dominantCategory: cluster.categories[0],
      highestPriority: cluster.priorities.includes('CRITICAL') ? 'CRITICAL' : 
                       cluster.priorities.includes('HIGH') ? 'HIGH' : 'MEDIUM'
    }));

    res.status(200).json({
      success: true,
      totalClusters: clusterData.length,
      clusters: clusterData
    });
  } catch (error) {
    console.error('Get Clusters Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
