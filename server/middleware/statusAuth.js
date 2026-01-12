// Role-based authorization middleware for report status updates
// Only POLICE, MUNICIPAL, and ADMIN roles can update report status

exports.authorizeStatusUpdate = (req, res, next) => {
  try {
    // Check if user is authenticated (should have req.user from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to perform this action'
      });
    }

    // Check if user has required role
    const authorizedRoles = ['POLICE', 'MUNICIPAL', 'ADMIN'];
    if (!authorizedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Only POLICE, MUNICIPAL, and ADMIN users can update report status. You are: ${req.user.role || 'USER'}`,
        requiredRoles: authorizedRoles,
        userRole: req.user.role
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message
    });
  }
};

// Middleware to validate status transition
exports.validateStatusTransition = (req, res, next) => {
  try {
    const { newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the new status'
      });
    }

    // Define valid transitions
    // Status flow: PENDING → IN_PROGRESS → RESOLVED or CLOSED
    // UNDER_REVIEW → IN_PROGRESS or RESOLVED or CLOSED
    const validTransitions = {
      'PENDING': ['IN_PROGRESS', 'UNDER_REVIEW', 'CLOSED'],
      'IN_PROGRESS': ['RESOLVED', 'CLOSED'],
      'UNDER_REVIEW': ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      'RESOLVED': ['CLOSED'],
      'CLOSED': [] // No transitions from CLOSED
    };

    // Store validation info in request for use in controller
    req.validTransitions = validTransitions;
    req.body.newStatus = newStatus.toUpperCase();

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Transition validation failed',
      error: error.message
    });
  }
};
