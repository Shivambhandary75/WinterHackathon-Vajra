const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      required: [true, "Please provide institution name"],
      trim: true,
      unique: true,
    },
    institutionType: {
      type: String,
      enum: [
        "Police Department",
        "Municipal Corporation",
        "Disaster Management",
        "Fire Department",
        "Health Department",
        "Forest Department",
        "Other Government Body",
      ],
      required: [true, "Please provide institution type"],
    },
    registrationNumber: {
      type: String,
      required: [true, "Please provide registration number"],
      unique: true,
      trim: true,
    },
    institutionId: {
      type: String,
      required: [true, "Please provide institution ID"],
      unique: true,
      trim: true,
    },
    officialEmail: {
      type: String,
      required: [true, "Please provide official email"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    contactPerson: {
      name: {
        type: String,
        required: [true, "Please provide contact person name"],
      },
      designation: {
        type: String,
        required: [true, "Please provide designation"],
      },
      phone: {
        type: String,
        required: [true, "Please provide phone number"],
        match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
      },
    },
    address: {
      street: {
        type: String,
        required: [true, "Please provide address"],
      },
      city: {
        type: String,
        required: [true, "Please provide city"],
      },
      state: {
        type: String,
        required: [true, "Please provide state"],
      },
      pincode: {
        type: String,
        required: [true, "Please provide pincode"],
        match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
      },
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: [
        "POLICE",
        "MUNICIPAL",
        "DISASTER",
        "FIRE",
        "HEALTH",
        "FOREST",
        "ADMIN",
      ],
      default: function () {
        // Auto-assign role based on institution type
        const roleMap = {
          "Police Department": "POLICE",
          "Municipal Corporation": "MUNICIPAL",
          "Disaster Management": "DISASTER",
          "Fire Department": "FIRE",
          "Health Department": "HEALTH",
          "Forest Department": "FOREST",
        };
        return roleMap[this.institutionType] || "MUNICIPAL";
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    jurisdiction: {
      areas: [String],
      districts: [String],
    },
    permissions: {
      canVerifyReports: {
        type: Boolean,
        default: true,
      },
      canUpdateStatus: {
        type: Boolean,
        default: true,
      },
      canAssignReports: {
        type: Boolean,
        default: true,
      },
      canAccessAlerts: {
        type: Boolean,
        default: true,
      },
    },
    statistics: {
      reportsHandled: {
        type: Number,
        default: 0,
      },
      reportsResolved: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
institutionSchema.index({ institutionType: 1, isActive: 1 });

// Hash password before saving
institutionSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
institutionSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get institution statistics
institutionSchema.methods.getStatistics = function () {
  return {
    reportsHandled: this.statistics.reportsHandled,
    reportsResolved: this.statistics.reportsResolved,
    averageResponseTime: this.statistics.averageResponseTime,
    resolutionRate:
      this.statistics.reportsHandled > 0
        ? (
            (this.statistics.reportsResolved / this.statistics.reportsHandled) *
            100
          ).toFixed(2)
        : 0,
  };
};

// Static method to get active institutions by type
institutionSchema.statics.getByType = function (type) {
  return this.find({ institutionType: type, isActive: true });
};

module.exports = mongoose.model("Institution", institutionSchema);
