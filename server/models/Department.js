const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['POLICE', 'MUNICIPAL', 'DISASTER'],
      required: [true, 'Please provide department name'],
      unique: true
    },
    description: {
      type: String,
      required: [true, 'Please provide department description'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    contact: {
      email: {
        type: String,
        required: [true, 'Please provide department email'],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid email'
        ]
      },
      phone: {
        type: String,
        required: [true, 'Please provide department phone'],
        match: [
          /^[+]?[0-9]{1,3}?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{0,4}$/,
          'Please provide a valid phone number'
        ]
      },
      address: {
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters']
      }
    },
    head: {
      name: {
        type: String,
        maxlength: [100, 'Name cannot exceed 100 characters']
      },
      designation: {
        type: String,
        maxlength: [100, 'Designation cannot exceed 100 characters']
      }
    },
    categories: [
      {
        type: String,
        enum: ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER']
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    assignedReports: {
      type: Number,
      default: 0
    },
    resolvedReports: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for fast lookup by department name
departmentSchema.index({ name: 1 });

// Index for active departments
departmentSchema.index({ isActive: 1 });

// Method to get department statistics
departmentSchema.methods.getStatistics = function () {
  return {
    name: this.name,
    totalAssigned: this.assignedReports,
    totalResolved: this.resolvedReports,
    pending: this.assignedReports - this.resolvedReports,
    resolutionRate: this.assignedReports > 0 
      ? ((this.resolvedReports / this.assignedReports) * 100).toFixed(2) + '%'
      : '0%'
  };
};

// Static method to get all active departments
departmentSchema.statics.getActiveDepartments = function () {
  return this.find({ isActive: true }).select('name description contact categories');
};

module.exports = mongoose.model('Department', departmentSchema);
