const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Please provide alert message'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    area: {
      name: {
        type: String,
        required: [true, 'Please provide area name'],
        trim: true
      },
      center: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      },
      radius: {
        type: Number,
        default: 1000, // meters
        description: 'Alert radius in meters'
      }
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      required: true
    },
    category: {
      type: String,
      enum: ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'],
      required: [true, 'Please provide alert category']
    },
    reportCount: {
      type: Number,
      default: 0,
      description: 'Number of reports that triggered this alert'
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 3,
      description: 'Minimum reports to trigger alert'
    },
    timeWindow: {
      type: Number,
      default: 24,
      description: 'Time window in hours'
    },
    affectedArea: {
      type: String,
      description: 'Description of affected area'
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial index for location-based queries
alertSchema.index({ 'area.center.coordinates': '2dsphere' });

// Index for active alerts
alertSchema.index({ isActive: 1, createdAt: -1 });

// Index for category and severity
alertSchema.index({ category: 1, severity: 1 });

// Virtual for latitude
alertSchema.virtual('latitude').get(function () {
  return this.area?.center?.coordinates[1];
});

// Virtual for longitude
alertSchema.virtual('longitude').get(function () {
  return this.area?.center?.coordinates[0];
});

// Method to resolve alert
alertSchema.methods.resolve = async function (userId) {
  this.isActive = false;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  return await this.save();
};

// Static method to find active alerts near a location
alertSchema.statics.findNearbyAlerts = function (longitude, latitude, maxDistance = 5000) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true
      }
    },
    {
      $match: { isActive: true }
    },
    {
      $sort: { severity: -1, createdAt: -1 }
    }
  ]);
};

// Static method to get active alerts by severity
alertSchema.statics.getActiveBySeverity = function (severity) {
  return this.find({ isActive: true, severity })
    .populate('reports', 'title category status')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Alert', alertSchema);
