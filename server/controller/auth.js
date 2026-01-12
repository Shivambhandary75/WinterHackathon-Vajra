const User = require('../models/User');
const sendToken = require('../utils/jwtToken');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.Signup = async (req, res) => {
  try {
    const { name, email, phone, city, state, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !phone || !city || !state || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'User already exists with this email' 
          : 'User already exists with this phone number'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      city,
      state,
      password
    });

    // Send token
    sendToken(user, 201, res);
  } catch (error) {
    console.error('Signup Error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: messages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Signup failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (need to select password field explicitly)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token
    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.Logout = async (req, res) => {
  try {
    // In JWT, logout is typically handled on the client side
    // by removing the token from localStorage/sessionStorage
    // Optionally, you can maintain a blacklist on the server
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.GetMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.UpdateProfile = async (req, res) => {
  try {
    const { name, phone, city, state, bio, avatar, website, username } = req.body;

    // Build update object
    const updateData = {};

    if (name) {
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be more than 50 characters'
        });
      }
      updateData.name = name;
    }

    if (phone) {
      // Check if phone is already taken by another user
      const existingUser = await User.findOne({ 
        phone, 
        _id: { $ne: req.user.id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
      updateData.phone = phone;
    }

    if (city) {
      if (city.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'City cannot be more than 50 characters'
        });
      }
      updateData.city = city;
    }

    if (state) {
      if (state.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'State cannot be more than 50 characters'
        });
      }
      updateData.state = state;
    }

    if (bio) {
      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot be more than 500 characters'
        });
      }
      updateData.bio = bio;
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    if (website) {
      updateData.website = website;
    }

    if (username) {
      // Check if username is already taken
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updateData.username = username;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.ChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current password
    const isSameAsOld = await user.matchPassword(newPassword);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
};