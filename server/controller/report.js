const Report = require('../models/Report');
const StatusLog = require('../models/StatusLog');
const { detectAndCreateAlert } = require('../utils/alertDetection');
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'AIzaSyD_baF0etMza8OwVOQlTfHL1bTpbLGTi_Y';

// Helper function for reverse geocoding
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

// @desc    Create a new incident report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { title, category, description, images, latitude, longitude, address, priority } = req.body;

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

    // Validate location coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    // Validate latitude and longitude values
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Priority must be one of: ${validPriorities.join(', ')}`
        });
      }
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long'
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 5000 characters'
      });
    }

    // Get address from coordinates if not provided
    let finalAddress = address;
    if (!address || address.includes('Lat:') || address.includes('lat:')) {
      const geocodedAddress = await reverseGeocode(latitude, longitude);
      if (geocodedAddress) {
        finalAddress = geocodedAddress;
      } else {
        finalAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }

    // Create report with GeoJSON format
    const reportData = {
      title,
      category,
      description,
      priority: priority || 'MEDIUM',
      reportedBy: req.user.id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
        address: finalAddress
      }
    };

    // Add images if provided
    if (images && Array.isArray(images)) {
      reportData.images = images.map(img => ({
        url: img
      }));
    }

    const report = await Report.create(reportData);

    // Populate user information
    await report.populate('reportedBy', 'name email phone city state');

    // Trigger alert detection in background (don't wait for completion)
    detectAndCreateAlert(report).catch(err => {
      console.error('Alert detection error:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
exports.getAllReports = async (req, res) => {
  try {
    const { category, status, priority, page = 1, limit = 10, userCity, userState } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      const validCategories = ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'];
      if (validCategories.includes(category.toUpperCase())) {
        filter.category = category.toUpperCase();
      }
    }

    if (status) {
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
      if (validStatuses.includes(status.toUpperCase())) {
        filter.status = status.toUpperCase();
      }
    }

    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (validPriorities.includes(priority.toUpperCase())) {
        filter.priority = priority.toUpperCase();
      }
    }

    const skip = (page - 1) * limit;

    // Build query with population
    let query = Report.find(filter)
      .populate('reportedBy', 'name email phone city state')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Execute query
    let reports = await query;

    // Filter by user location if provided (city and/or state)
    if (userCity || userState) {
      reports = reports.filter(report => {
        if (!report.reportedBy) return false;
        
        let matchesCity = true;
        let matchesState = true;
        
        if (userCity) {
          matchesCity = report.reportedBy.city?.toLowerCase() === userCity.toLowerCase();
        }
        
        if (userState) {
          matchesState = report.reportedBy.state?.toLowerCase() === userState.toLowerCase();
        }
        
        return matchesCity && matchesState;
      });
    }

    const total = userCity || userState ? reports.length : await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('reportedBy', 'name email phone city state');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update report status with workflow validation
// @route   PUT /api/reports/:id/status
// @access  Private (POLICE, MUNICIPAL, ADMIN only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { newStatus, reason, notes } = req.body;
    const reportId = req.params.id;

    // Validate new status is provided (enforced by middleware but double-check)
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the new status'
      });
    }

    // Fetch the current report
    const report = await Report.findById(reportId).populate('reportedBy', 'name email phone city state');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const currentStatus = report.status;
    const validTransitions = req.validTransitions;

    // Validate status transition
    if (!validTransitions[currentStatus]) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from status: ${currentStatus}`,
        currentStatus
      });
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Cannot go from ${currentStatus} to ${newStatus}`,
        currentStatus,
        requestedStatus: newStatus,
        allowedTransitions: validTransitions[currentStatus]
      });
    }

    // Prevent transitioning to the same status
    if (currentStatus === newStatus) {
      return res.status(400).json({
        success: false,
        message: `Report is already in ${currentStatus} status`
      });
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Add resolution details if transitioning to RESOLVED
    if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user.id;
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email phone city state')
     .populate('resolvedBy', 'name email role');

    // Log the status change
    const statusLog = await StatusLog.create({
      report: reportId,
      previousStatus: currentStatus,
      newStatus,
      changedBy: req.user.id,
      changedByRole: req.user.role,
      reason: reason || null,
      notes: notes || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    });

    // Populate status log user details
    await statusLog.populate('changedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Report status updated from ${currentStatus} to ${newStatus}`,
      data: {
        report: updatedReport,
        statusLog: {
          id: statusLog._id,
          previousStatus: statusLog.previousStatus,
          newStatus: statusLog.newStatus,
          changedBy: statusLog.changedBy,
          changedByRole: statusLog.changedByRole,
          reason: statusLog.reason,
          notes: statusLog.notes,
          timestamp: statusLog.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report status',
      error: error.message
    });
  }
};

// @desc    Get status change history for a report
// @route   GET /api/reports/:id/status-history
// @access  Public
exports.getStatusHistory = async (req, res) => {
  try {
    const reportId = req.params.id;

    // Verify report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get status change history
    const statusHistory = await StatusLog.getHistory(reportId);

    res.status(200).json({
      success: true,
      count: statusHistory.length,
      message: `Retrieved status history for report ${reportId}`,
      data: {
        reportId,
        currentStatus: report.status,
        history: statusHistory
      }
    });

  } catch (error) {
    console.error('Status history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching status history',
      error: error.message
    });
  }
};

// @desc    Get reports near a location
// @route   GET /api/reports/nearby/:longitude/:latitude
// @access  Public
exports.getNearbyReports = async (req, res) => {
  try {
    const { longitude, latitude } = req.params;
    const { maxDistance = 5000 } = req.query; // Default 5km

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const reports = await Report.findNear(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    ).populate('reportedBy', 'name email phone city state');

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update report assignment (Institutions only)
// @route   PUT /api/reports/:id/assignment
// @access  Private (Institution)
exports.updateReportAssignment = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    // Check if user is an institution
    if (req.user.type !== 'institution') {
      return res.status(403).json({
        success: false,
        message: 'Only institutions can assign reports'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update assignment
    report.assignedTo = assignedTo || null;
    
    // If assigning to someone, update status to IN_PROGRESS
    if (assignedTo && report.status === 'PENDING') {
      report.status = 'IN_PROGRESS';
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: assignedTo ? `Report assigned to ${assignedTo}` : 'Assignment removed',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update institution notes (Institutions only)
// @route   PUT /api/reports/:id/notes
// @access  Private (Institution)
exports.updateInstitutionNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    // Check if user is an institution
    if (req.user.type !== 'institution') {
      return res.status(403).json({
        success: false,
        message: 'Only institutions can add notes'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Validate notes length
    if (notes && notes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 2000 characters'
      });
    }

    report.institutionNotes = notes || '';
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Institution notes updated',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete report (Report owner only)
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user is the report creator
    if (report.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
