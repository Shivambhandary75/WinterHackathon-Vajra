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