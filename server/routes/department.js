const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controller/department');
const { protect } = require('../middleware/auth');

// Middleware to check if user is ADMIN
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Public routes
router.get('/', getAllDepartments);
router.get('/:id', getDepartment);

// Admin only routes
router.post('/', protect, adminOnly, createDepartment);
router.put('/:id', protect, adminOnly, updateDepartment);
router.delete('/:id', protect, adminOnly, deleteDepartment);

module.exports = router;
