const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Please provide a report ID']
    },
    previousStatus: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      required: true
    },
    newStatus: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedByRole: {
      type: String,
      enum: ['POLICE', 'MUNICIPAL', 'ADMIN'],
      required: true
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

// Index for efficient query of status changes by report
statusLogSchema.index({ report: 1, timestamp: -1 });

// Index for tracking user's status update actions
statusLogSchema.index({ changedBy: 1, timestamp: -1 });

// Index for recent status changes
statusLogSchema.index({ timestamp: -1 });

// Method to get status history for a report
statusLogSchema.statics.getHistory = function (reportId) {
  return this.find({ report: new mongoose.Types.ObjectId(reportId) })
    .populate('changedBy', 'name email role')
    .sort({ timestamp: -1 });
};

module.exports = mongoose.model('StatusLog', statusLogSchema);
