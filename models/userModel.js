const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3],
    maxlength: [20, "Username must be less than 20 characters"],
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: "Username can only contain letters, numbers, and underscores"
    }
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6]
  },
  name: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Use a more secure salt round (12-14 is recommended)
    const salt = await bcrypt.genSalt(14);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Custom validation for input
userSchema.methods.validateInput = function () {
  if (!validator.isLength(this.username, { min: 3, max: 20 })) {
    throw new Error("Username must be between 3 and 20 characters");
  }
  if (!validator.isLength(this.password, { min: 6 })) {
    throw new Error("Password must be at least 6 characters long");
  }
  if (!validator.isAlphanumeric(this.username)) {
    throw new Error("Username can only contain letters and numbers");
  }
};
module.exports = mongoose.model("User", userSchema);
