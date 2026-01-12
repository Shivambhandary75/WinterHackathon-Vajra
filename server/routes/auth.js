const express = require('express');
const router = express.Router();
const {
  Signup,
  Login,
  Logout,
  GetMe,
  UpdateProfile,
  ChangePassword,
} = require("../controller/auth");
const { protect } = require("../middleware/auth");

// Public routes
router.post("/signup", Signup);
router.post("/login", Login);

// Private routes
router.post("/logout", protect, Logout);
router.get("/me", protect, GetMe);
router.put("/profile", protect, UpdateProfile);
router.put("/change-password", protect, ChangePassword);

module.exports = router;
