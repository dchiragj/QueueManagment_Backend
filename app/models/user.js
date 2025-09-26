const { hashSync, compareSync, genSaltSync ,compare } = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const { EXPRESS_SECRET } = require('../config/env');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
// Define the User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  NormalizedEmail: { 
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mobileNumber: DataTypes.STRING,
  address: DataTypes.STRING,
  gender: DataTypes.STRING,
   ProfileUrl: {
    type: DataTypes.STRING, // Added for profile image
    allowNull: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isOnboarding: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  verificationCode: DataTypes.STRING,

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Sequelize will handle it
  },
  Otp:{
    type:DataTypes.NUMBER,
    defaultValue:null,
      allowNull: true,
  },
  OtpExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  role: {
  type: DataTypes.STRING(50),
  allowNull: false,
  defaultValue: 'user',  // or whatever makes sense in your app
},

}, {
  hooks: {
    beforeCreate: (user) => {  
      if (user.password) {
        user.password = hashSync(user.password, genSaltSync(8));
      }
      if (user.email) {
        user.NormalizedEmail = user.email.toUpperCase().trim(); // Set NormalizedEmail
      }
      user.createdAt = moment.utc().toDate(); // ✅ JS Date
      user.updatedAt = moment.utc().toDate();
    },
    beforeUpdate: (user) => {
      if (user.password) {
        user.password = hashSync(user.password, genSaltSync(8));
      }
      if (user.email) {
        user.NormalizedEmail = user.email.toUpperCase().trim(); // Update NormalizedEmail
      }
      user.updatedAt = moment.utc().toDate(); // ✅ JS Date
    },
  },
});

// Compare password
// Try async approach instead
User.prototype.authenticateUser = async function(password) {
  try {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Create JWT
User.prototype.createToken = function() {
  return jwt.sign(
    {
      id: this.id,
      name: `${this.firstName} ${this.lastName}`,
      email: this.email,
      role: this.role,
    },
    EXPRESS_SECRET,
    { expiresIn: 5184000 }
  );
};

User.prototype.toAuthJSON = function() {
  const profileUrl = this.ProfileUrl
    ? `${BASE_URL}/uploads/${this.ProfileUrl}`
    : null;
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    name: `${this.firstName} ${this.lastName}`,
    email: this.email,
    mobileNumber: this.mobileNumber,
    isActive: this.isActive,
    role: this.role,
    ProfileUrl: profileUrl,   // 👈 backend URL
    token: `${this.createToken()}`,
    verificationRequired: !this.isEmailVerified,
    onboardingRequired: this.isOnboarding,
  };
};

module.exports = User;
