const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a report title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    category: {
      type: String,
      enum: ['CRIME', 'MISSING', 'DOG', 'HAZARD', 'NATURAL_DISASTER'],
      required: [true, 'Please select a category']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    images: [
      {
        type: String,
        url: String
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide location coordinates']
      },
      address: {
        type: String,
        required: [true, 'Please provide a street address']
      }
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      default: 'PENDING'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationScore: {
      type: Number,
      default: 0
    },
    upVotes: {
      type: Number,
      default: 0
    },
    downVotes: {
      type: Number,
      default: 0
    },
    flags: {
      type: Number,
      default: 0
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date
    },
    assignedOfficer: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100
    },
    institutionNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
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

// Create geospatial index for location-based queries
reportSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for latitude
reportSchema.virtual('latitude').get(function () {
  return this.location?.coordinates[1];
});

// Virtual for longitude
reportSchema.virtual('longitude').get(function () {
  return this.location?.coordinates[0];
});

// Method to get reports near a location (within specified km)
reportSchema.statics.findNear = function (longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Method for map-based filtering with geospatial queries
reportSchema.statics.findMapReports = function (filters = {}) {
  const query = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.verified !== undefined) {
    query.verified = filters.verified;
  }

  // Geospatial query if coordinates provided
  if (filters.longitude !== undefined && filters.latitude !== undefined) {
    const maxDistance = filters.radius || 5000; // Default 5km
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [filters.longitude, filters.latitude]
        },
        $maxDistance: maxDistance
      }
    };
  }

  return query;
};

// Method to get minimal data for map pins
reportSchema.statics.getMapPins = function (query, options = {}) {
  const limit = options.limit || 1000;
  const skip = options.skip || 0;

  return this.find(query)
    .select('title category priority status verified location latitude longitude createdAt views')
    .limit(limit)
    .skip(skip)
    .lean();
};

module.exports = mongoose.model('Report', reportSchema);
