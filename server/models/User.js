const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      unique: true,
      match: [
        /^[+]?[0-9]{1,3}?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{0,4}$/,
        "Please provide a valid phone number",
      ],
    },
    city: {
      type: String,
      required: [true, "Please provide a city"],
      trim: true,
      maxlength: [50, "City cannot be more than 50 characters"],
    },
    state: {
      type: String,
      required: [true, "Please provide a state"],
      trim: true,
      maxlength: [50, "State cannot be more than 50 characters"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot be more than 500 characters"],
    },
    avatar: {
      type: String,
    },
    website: {
      type: String,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["USER", "POLICE", "MUNICIPAL", "ADMIN"],
      default: "USER",
      description:
        "User role - only POLICE, MUNICIPAL, and ADMIN can update report status",
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
