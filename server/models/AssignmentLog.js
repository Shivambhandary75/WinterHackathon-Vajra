const mongoose = require('mongoose');

const assignmentLogSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Please provide a report ID']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Please provide a department ID']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedByRole: {
      type: String,
      enum: ['POLICE', 'MUNICIPAL', 'ADMIN'],
      required: true
    },
    previousDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    ipAddress: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

// Index for efficient query of assignments by report
assignmentLogSchema.index({ report: 1, timestamp: -1 });

// Index for tracking user's assignment actions
assignmentLogSchema.index({ assignedBy: 1, timestamp: -1 });

// Index for department assignments
assignmentLogSchema.index({ department: 1, timestamp: -1 });

// Index for recent assignments
assignmentLogSchema.index({ timestamp: -1 });

// Method to get assignment history for a report
assignmentLogSchema.statics.getHistory = function (reportId) {
  return this.find({ report: new mongoose.Types.ObjectId(reportId) })
    .populate('assignedBy', 'name email role')
    .populate('department', 'name description')
    .populate('previousDepartment', 'name')
    .sort({ timestamp: -1 });
};

// Method to get assignments by department
assignmentLogSchema.statics.getDepartmentAssignments = function (departmentId) {
  return this.find({ department: new mongoose.Types.ObjectId(departmentId) })
    .populate('report', 'title category status priority')
    .populate('assignedBy', 'name email')
    .sort({ timestamp: -1 });
};

module.exports = mongoose.model('AssignmentLog', assignmentLogSchema);
