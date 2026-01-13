const Institution = require("../models/Institution");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
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
      password,
    } = req.body;

    // Validation
    if (
      !institutionName ||
      !institutionType ||
      !registrationNumber ||
      !institutionId ||
      !officialEmail ||
      !contactPerson ||
      !designation ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Sanitize phone and pincode (remove spaces and special characters)
    const sanitizedPhone = phone.replace(/\D/g, "");
    const sanitizedPincode = pincode.replace(/\D/g, "");

    // Validate phone and pincode length
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    if (sanitizedPincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be 6 digits",
      });
    }

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [{ institutionId }, { registrationNumber }, { officialEmail }],
    });

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message:
          "Institution already registered with this ID, registration number or email",
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
        phone: sanitizedPhone,
      },
      address: {
        street: address,
        city,
        state,
        pincode: sanitizedPincode,
      },
      password,
    });

    // Generate token
    const token = generateToken(institution._id);

    res.status(201).json({
      success: true,
      message:
        "Institution registered successfully. Awaiting admin verification.",
      token,
      institution: {
        id: institution._id,
        institutionName: institution.institutionName,
        institutionType: institution.institutionType,
        institutionId: institution.institutionId,
        role: institution.role,
        isVerified: institution.isVerified,
      },
    });
  } catch (error) {
    console.error("Institution registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Please provide institution ID/email and password",
      });
    }

    // Find institution
    const institution = await Institution.findOne({
      $or: [{ institutionId }, { officialEmail: email }],
    }).select("+password");

    if (!institution) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if institution is active
    if (!institution.isActive) {
      return res.status(403).json({
        success: false,
        message: "Institution account is deactivated. Please contact admin.",
      });
    }

    // Check password
    const isMatch = await institution.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(institution._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
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
        address: institution.address,
      },
    });
  } catch (error) {
    console.error("Institution login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
    // req.institution is already set by the middleware, so we can use it directly
    const institution = req.institution;

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    res.status(200).json({
      success: true,
      data: institution,
    });
  } catch (error) {
    console.error("Get institution profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
      jurisdiction,
    } = req.body;

    console.log("Received update data:", req.body);

    const updateData = {};

    // Always update contactPerson if any field is provided
    if (
      contactPerson !== undefined ||
      designation !== undefined ||
      phone !== undefined
    ) {
      updateData.contactPerson = {
        name:
          contactPerson !== undefined
            ? contactPerson
            : req.institution.contactPerson?.name,
        designation:
          designation !== undefined
            ? designation
            : req.institution.contactPerson?.designation,
        phone:
          phone !== undefined ? phone : req.institution.contactPerson?.phone,
      };
    }

    // Always update address if any field is provided
    if (
      address !== undefined ||
      city !== undefined ||
      state !== undefined ||
      pincode !== undefined
    ) {
      updateData.address = {
        street:
          address !== undefined ? address : req.institution.address?.street,
        city: city !== undefined ? city : req.institution.address?.city,
        state: state !== undefined ? state : req.institution.address?.state,
        pincode:
          pincode !== undefined ? pincode : req.institution.address?.pincode,
      };
    }

    if (jurisdiction) {
      updateData.jurisdiction = jurisdiction;
    }

    console.log("Update data to be saved:", updateData);

    const institution = await Institution.findByIdAndUpdate(
      req.institution._id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log("Updated institution:", institution);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: institution,
    });
  } catch (error) {
    console.error("Update institution profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Change institution password
 * @route   PUT /api/institutions/change-password
 * @access  Private
 */
exports.changeInstitutionPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new password",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    // Get institution with password
    const institution = await Institution.findById(req.institution.id).select(
      "+password"
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    // Verify current password
    const isMatch = await institution.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    institution.password = newPassword;
    await institution.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change institution password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
      query.isVerified = verified === "true";
    }

    if (active !== undefined) {
      query.isActive = active === "true";
    }

    const skip = (page - 1) * limit;

    const institutions = await Institution.find(query)
      .select("-password")
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
      data: institutions,
    });
  } catch (error) {
    console.error("Get institutions error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
    const institution = await Institution.findById(req.params.id).select(
      "-password"
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    res.status(200).json({
      success: true,
      data: institution,
    });
  } catch (error) {
    console.error("Get institution error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Institution verified successfully",
      data: institution,
    });
  } catch (error) {
    console.error("Verify institution error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Institution not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Institution ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      data: institution,
    });
  } catch (error) {
    console.error("Update institution status error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Institution not found",
      });
    }

    const statistics = institution.getStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("Get institution statistics error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
