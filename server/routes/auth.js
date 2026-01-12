const express = require('express');
const router = express.Router();
const { Signup, Login, Logout, GetMe } = require('../controller/auth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', Signup);
router.post('/login', Login);

// Private routes
router.post('/logout', protect, Logout);
router.get('/me', protect, GetMe);

module.exports = router;
