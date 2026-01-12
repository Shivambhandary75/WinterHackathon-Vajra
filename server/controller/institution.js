const Institution = require('../models/Institution');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc    Register new institution
 * @route   POST /api/institutions/register
 * @access  Public
 */
exports.registerInstitution = async (req, res) => {
  try {
    const {
      institutionName,
      institutionType,
      registrationNumber,
      institutionId,
      officialEmail,
      contactPerson,
      designation,
      phone,
      address,
      city,
      state,
      pincode,
      password
    } = req.body;

    // Validation
    if (!institutionName || !institutionType || !registrationNumber || 
        !institutionId || !officialEmail || !contactPerson || 
        !designation || !phone || !address || !city || !state || 
        !pincode || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [
        { institutionId },
        { registrationNumber },
        { officialEmail }
      ]
    });

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: 'Institution already registered with this ID, registration number or email'
      });
    }

    // Create institution
    const institution = await Institution.create({
      institutionName,
      institutionType,
      registrationNumber,
      institutionId,
      officialEmail,
      contactPerson: {
        name: contactPerson,
        designation,
        phone
      },
      address: {
        street: address,
        city,
        state,
        pincode
      },
      password
    });

    // Generate token
    const token = generateToken(institution._id);

    res.status(201).json({
      success: true,
      message: 'Institution registered successfully. Awaiting admin verification.',
      token,
      institution: {
        id: institution._id,
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        institutionId: institution.institutionId,
        role: institution.role,
        isVerified: institution.isVerified
      }
    });
  } catch (error) {
    console.error('Institution registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login institution
 * @route   POST /api/institutions/login
 * @access  Public
 */
exports.loginInstitution = async (req, res) => {
  try {
    const { institutionId, email, password } = req.body;

    // Validation
    if ((!institutionId && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide institution ID/email and password'
      });
    }

    // Find institution
    const institution = await Institution.findOne({
      $or: [
        { institutionId },
        { officialEmail: email }
      ]
    }).select('+password');

    if (!institution) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if institution is active
    if (!institution.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Institution account is deactivated. Please contact admin.'
      });
    }

    // Check password
    const isMatch = await institution.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(institution._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      institution: {
        id: institution._id,
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        institutionId: institution.institutionId,
        officialEmail: institution.officialEmail,
        role: institution.role,
        isVerified: institution.isVerified,
        permissions: institution.permissions,
        contactPerson: institution.contactPerson,
        address: institution.address
      }
    });
  } catch (error) {
    console.error('Institution login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get institution profile
 * @route   GET /api/institutions/me
 * @access  Private
 */
exports.getInstitutionProfile = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institution.id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Get institution profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update institution profile
 * @route   PUT /api/institutions/profile
 * @access  Private
 */
exports.updateInstitutionProfile = async (req, res) => {
  try {
    const {
      contactPerson,
      designation,
      phone,
      address,
      city,
      state,
      pincode,
      jurisdiction
    } = req.body;

    const updateData = {};

    if (contactPerson || designation || phone) {
      updateData.contactPerson = {
        name: contactPerson || req.institution.contactPerson.name,
        designation: designation || req.institution.contactPerson.designation,
        phone: phone || req.institution.contactPerson.phone
      };
    }

    if (address || city || state || pincode) {
      updateData.address = {
        street: address || req.institution.address.street,
        city: city || req.institution.address.city,
        state: state || req.institution.address.state,
        pincode: pincode || req.institution.address.pincode
      };
    }

    if (jurisdiction) {
      updateData.jurisdiction = jurisdiction;
    }

    const institution = await Institution.findByIdAndUpdate(
      req.institution.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: institution
    });
  } catch (error) {
    console.error('Update institution profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all institutions
 * @route   GET /api/institutions
 * @access  Public
 */
exports.getAllInstitutions = async (req, res) => {
  try {
    const { type, verified, active, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (type) {
      query.institutionType = type;
    }
    
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const skip = (page - 1) * limit;

    const institutions = await Institution.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Institution.countDocuments(query);

    res.status(200).json({
      success: true,
      count: institutions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: institutions
    });
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single institution
 * @route   GET /api/institutions/:id
 * @access  Public
 */
exports.getInstitution = async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id).select('-password');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify institution (Admin only)
 * @route   PUT /api/institutions/:id/verify
 * @access  Private/Admin
 */
exports.verifyInstitution = async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Institution verified successfully',
      data: institution
    });
  } catch (error) {
    console.error('Verify institution error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update institution status (Admin only)
 * @route   PUT /api/institutions/:id/status
 * @access  Private/Admin
 */
exports.updateInstitutionStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Institution ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: institution
    });
  } catch (error) {
    console.error('Update institution status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get institution statistics
 * @route   GET /api/institutions/:id/statistics
 * @access  Public
 */
exports.getInstitutionStatistics = async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    const statistics = institution.getStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get institution statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
