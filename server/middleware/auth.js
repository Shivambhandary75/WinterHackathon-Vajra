const jwt = require('jsonwebtoken');
const User = require("../models/User");
const Institution = require("../models/Institution");

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find user first
    let user = await User.findById(decoded.id).select("-password");

    // If not a user, try to find institution
    if (!user) {
      const institution = await Institution.findById(decoded.id).select(
        "-password"
      );
      if (institution) {
        req.user = {
          id: institution._id,
          role: institution.role,
          type: "institution",
          institutionType: institution.institutionType,
          institutionName: institution.institutionName,
        };
        req.institution = institution;
      } else {
        return res.status(404).json({
          success: false,
          message: "User or Institution not found",
        });
      }
    } else {
      req.user = {
        id: user._id,
        role: user.role,
        type: "user",
        name: user.name,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

module.exports = { protect };
