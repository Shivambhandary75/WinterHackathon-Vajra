const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Please provide a report ID']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID']
    },
    voteType: {
      type: String,
      enum: ['UP', 'DOWN', 'FLAG'],
      required: [true, 'Please specify vote type: UP, DOWN, or FLAG']
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Ensure one vote per user per report (compound unique index)
voteSchema.index({ report: 1, user: 1 }, { unique: true });

// Index for finding votes by report
voteSchema.index({ report: 1 });

// Index for finding votes by user
voteSchema.index({ user: 1 });

// Index for finding votes by type
voteSchema.index({ report: 1, voteType: 1 });

// Static method to calculate verification score
voteSchema.statics.calculateVerificationScore = function (reportId) {
  return this.aggregate([
    { $match: { report: new mongoose.Types.ObjectId(reportId) } },
    {
      $group: {
        _id: null,
        upVotes: {
          $sum: { $cond: [{ $eq: ['$voteType', 'UP'] }, 1, 0] }
        },
        downVotes: {
          $sum: { $cond: [{ $eq: ['$voteType', 'DOWN'] }, 1, 0] }
        },
        flags: {
          $sum: { $cond: [{ $eq: ['$voteType', 'FLAG'] }, 1, 0] }
        },
        totalVotes: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get vote stats for a report
voteSchema.statics.getVoteStats = function (reportId) {
  return this.aggregate([
    { $match: { report: new mongoose.Types.ObjectId(reportId) } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              upVotes: {
                $sum: { $cond: [{ $eq: ['$voteType', 'UP'] }, 1, 0] }
              },
              downVotes: {
                $sum: { $cond: [{ $eq: ['$voteType', 'DOWN'] }, 1, 0] }
              },
              flags: {
                $sum: { $cond: [{ $eq: ['$voteType', 'FLAG'] }, 1, 0] }
              },
              totalVotes: { $sum: 1 }
            }
          }
        ],
        byType: [
          {
            $group: {
              _id: '$voteType',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);
};

module.exports = mongoose.model('Vote', voteSchema);
