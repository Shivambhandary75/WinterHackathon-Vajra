const Department = require('../models/Department');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (ADMIN only)
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, contact, head, categories } = req.body;

    // Validate required fields
    if (!name || !description || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and contact information'
      });
    }

    // Check if department already exists
    const existingDept = await Department.findOne({ name: name.toUpperCase() });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: `${name} department already exists`
      });
    }

    // Create department
    const department = await Department.create({
      name: name.toUpperCase(),
      description,
      contact,
      head,
      categories: categories || []
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });

  } catch (error) {
    console.error('Department creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
exports.getAllDepartments = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
};

// @desc    Get single department with statistics
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const statistics = department.getStatistics();

    res.status(200).json({
      success: true,
      data: {
        department,
        statistics
      }
    });

  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (ADMIN only)
exports.updateDepartment = async (req, res) => {
  try {
    const { description, contact, head, categories, isActive } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Update fields
    if (description) department.description = description;
    if (contact) department.contact = { ...department.contact, ...contact };
    if (head) department.head = { ...department.head, ...head };
    if (categories) department.categories = categories;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });

  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (ADMIN only)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has assigned reports
    if (department.assignedReports > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with assigned reports. Please reassign reports first.'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
};
