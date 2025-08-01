const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  // 🔐 Secure password reset fields
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  passwordHistory: [
    {
      password: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  passwordExpires: {
    type: Date,
    default: () => Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
  },
});

// Validate password complexity
userSchema.methods.validatePasswordComplexity = function (password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/;
  return passwordRegex.test(password);
};

// Check if password was used recently
userSchema.methods.isPasswordReused = async function (newPassword) {
  const history = this.passwordHistory.slice(-3); // Check last 3 passwords
  for (const entry of history) {
    const match = await bcrypt.compare(newPassword, entry.password);
    if (match) return true;
  }
  return false;
};

// Update password history
userSchema.methods.updatePasswordHistory = async function (newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  this.passwordHistory.push({ password: hashedPassword });
  if (this.passwordHistory.length > 3) {
    this.passwordHistory.shift(); // Keep only the last 3 passwords
  }
  this.passwordExpires = Date.now() + 90 * 24 * 60 * 60 * 1000; // Reset expiry
};

// Hash password before saving, only if modified and not already hashed
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    if (!this.password.startsWith("$2")) {
      if (!this.validatePasswordComplexity(this.password)) {
        return next(
          new Error(
            "Password must be 8-50 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character"
          )
        );
      }
      if (await this.isPasswordReused(this.password)) {
        return next(new Error("Cannot reuse a recent password"));
      }
      await this.updatePasswordHistory(this.password);
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

module.exports = mongoose.model("User", userSchema);