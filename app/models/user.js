const { hashSync, compareSync, genSaltSync } = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { EXPRESS_SECRET } = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    normalized_email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
    extra1: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
    },
    isOnboarding: {
      type: Boolean,
    },
    role: {
      type: String,
      enum: ['both', 'merchant', 'customer'],
      required: true,
    },
    address: {
      type: String,
    },
    profile_url: {
      type: String,
    },
    gender: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Number,
      required: false,
    },
    lastLogin: {
      type: Date,
    },
    ip: {
      type: String,
    },
  },
  { timestamps: true, usePushEach: true }, // UTC format
);

userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.extra1 = this.password;
    this.password = this._hashPassword(this.password);
    return next();
  }
  return next();
});

userSchema.pre('findOneAndUpdate', function(next) {
  const query = this;
  const update = query.getUpdate();
  if (update.password) {
    update.extra1 = update.password;
    update.password = hashSync(update.password, genSaltSync(8), null);
    return next();
  }
  return next();
});

userSchema.methods = {
  authenticateUser(password) {
    return compareSync(password, this.password);
  },

  _hashPassword(password) {
    return hashSync(password, genSaltSync(8), null);
  },

  getUserName() {
    return this.firstName + ' ' + this.lastName;
  },

  createToken() {
    return jwt.sign(
      {
        id: this._id,
        name: `${this.getUserName()}`,
        email: this.email,
        role: this.role,
      },
      EXPRESS_SECRET,
      { expiresIn: 5184000 },
    );
  },

  toAuthJSON() {
    return {
      id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      name: `${this.getUserName()}`,
      email: this.email,
      mobileNumber: this.mobileNumber,
      isActive: this.isActive,
      role: this.role,
      profile_url: this.profile_url,
      token: `${this.createToken()}`,
      verificationRequired: !this.isEmailVerified,
      onboardingRequired: this.isOnboarding,
    };
  },

  toJSON() {
    return {
      id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      name: `${this.getUserName()}`,
      email: this.email,
      mobileNumber: this.mobileNumber,
      isActive: this.isActive,
      role: this.role,
      address: this.address,
      profile_url: this.profile_url,
      gender: this.gender,
      isEmailVerified: this.isEmailVerified,
      onboardingRequired: this.isOnboarding,
    };
  },
};
module.exports = mongoose.model('users', userSchema);
