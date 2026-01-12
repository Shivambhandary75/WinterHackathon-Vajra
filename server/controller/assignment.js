const Department = require('../models/Department');
const Report = require('../models/Report');
const AssignmentLog = require('../models/AssignmentLog');

// @desc    Assign report to a department
// @route   PUT /api/reports/:id/assign
// @access  Private (POLICE, MUNICIPAL, ADMIN only)
exports.assignReport = async (req, res) => {
  try {
    const { departmentId, reason, notes } = req.body;
    const reportId = req.params.id;

    // Validate department ID is provided
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a department ID'
      });
    }

    // Fetch the report
    const report = await Report.findById(reportId)
      .populate('assignedTo', 'name description')
      .populate('reportedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Verify department exists and is active
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (!department.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Department is not active'
      });
    }

    // Prevent re-assigning to the same department
    if (report.assignedTo && report.assignedTo._id.toString() === departmentId) {
      return res.status(400).json({
        success: false,
        message: `Report is already assigned to ${department.name} department`
      });
    }

    // Store previous department for logging
    const previousDepartment = report.assignedTo ? report.assignedTo._id : null;

    // Update report assignment
    const updateData = {
      assignedTo: departmentId,
      assignedBy: req.user.id,
      assignedAt: new Date()
    };

    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name description contact')
      .populate('assignedBy', 'name email role')
      .populate('reportedBy', 'name email');

    // Update department assignment count
    if (previousDepartment) {
      await Department.findByIdAndUpdate(previousDepartment, {
        $inc: { assignedReports: -1 }
      });
    }
    await Department.findByIdAndUpdate(departmentId, {
      $inc: { assignedReports: 1 }
    });

    // Create assignment log entry
    const assignmentLog = await AssignmentLog.create({
      report: reportId,
      department: departmentId,
      assignedBy: req.user.id,
      assignedByRole: req.user.role,
      previousDepartment: previousDepartment,
      reason: reason || null,
      notes: notes || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    });

    // Populate assignment log details
    await assignmentLog.populate([
      { path: 'assignedBy', select: 'name email role' },
      { path: 'department', select: 'name description' },
      { path: 'previousDepartment', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: previousDepartment 
        ? `Report reassigned from ${report.assignedTo?.name || 'previous department'} to ${department.name}`
        : `Report assigned to ${department.name} department`,
      data: {
        report: updatedReport,
        assignmentLog: {
          id: assignmentLog._id,
          department: assignmentLog.department,
          previousDepartment: assignmentLog.previousDepartment,
          assignedBy: assignmentLog.assignedBy,
          assignedByRole: assignmentLog.assignedByRole,
          reason: assignmentLog.reason,
          notes: assignmentLog.notes,
          timestamp: assignmentLog.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning report to department',
      error: error.message
    });
  }
};

// @desc    Unassign report from department
// @route   PUT /api/reports/:id/unassign
// @access  Private (ADMIN only)
exports.unassignReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { reason, notes } = req.body;

    // Fetch the report
    const report = await Report.findById(reportId).populate('assignedTo', 'name');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Report is not assigned to any department'
      });
    }

    const previousDepartment = report.assignedTo._id;
    const previousDepartmentName = report.assignedTo.name;

    // Update report to remove assignment
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      {
        $unset: { assignedTo: 1, assignedBy: 1, assignedAt: 1 }
      },
      { new: true }
    ).populate('reportedBy', 'name email');

    // Decrease department assignment count
    await Department.findByIdAndUpdate(previousDepartment, {
      $inc: { assignedReports: -1 }
    });

    // Log the unassignment
    const assignmentLog = await AssignmentLog.create({
      report: reportId,
      department: previousDepartment,
      assignedBy: req.user.id,
      assignedByRole: req.user.role,
      reason: reason || 'Report unassigned',
      notes: notes || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Report unassigned from ${previousDepartmentName} department`,
      data: {
        report: updatedReport,
        previousDepartment: previousDepartmentName
      }
    });

  } catch (error) {
    console.error('Unassignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning report',
      error: error.message
    });
  }
};

// @desc    Get assignment history for a report
// @route   GET /api/reports/:id/assignment-history
// @access  Public
exports.getAssignmentHistory = async (req, res) => {
  try {
    const reportId = req.params.id;

    // Verify report exists
    const report = await Report.findById(reportId).populate('assignedTo', 'name');
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get assignment history
    const assignmentHistory = await AssignmentLog.getHistory(reportId);

    res.status(200).json({
      success: true,
      count: assignmentHistory.length,
      message: `Retrieved assignment history for report ${reportId}`,
      data: {
        reportId,
        currentDepartment: report.assignedTo,
        history: assignmentHistory
      }
    });

  } catch (error) {
    console.error('Assignment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment history',
      error: error.message
    });
  }
};

// @desc    Get all reports assigned to a department
// @route   GET /api/departments/:id/reports
// @access  Private
exports.getDepartmentReports = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Build filter
    const filter = { assignedTo: departmentId };
    if (status) filter.status = status.toUpperCase();
    if (priority) filter.priority = priority.toUpperCase();

    const skip = (page - 1) * limit;

    // Get assigned reports
    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email phone')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: {
        department: {
          id: department._id,
          name: department.name,
          description: department.description
        },
        reports
      }
    });

  } catch (error) {
    console.error('Department reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department reports',
      error: error.message
    });
  }
};
