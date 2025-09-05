const { hashSync, compareSync, genSaltSync } = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const { EXPRESS_SECRET } = require('../config/env');
const moment = require('moment');

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
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mobileNumber: DataTypes.STRING,
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isOnboarding: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  verificationCode: DataTypes.STRING,

  // ✅ Fix here: use NOW or Date object instead of string
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Sequelize will handle it
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },role: {
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
      user.createdAt = moment.utc().toDate(); // ✅ JS Date
      user.updatedAt = moment.utc().toDate();
    },
    beforeUpdate: (user) => {
      if (user.password) {
        user.password = hashSync(user.password, genSaltSync(8));
      }
      user.updatedAt = moment.utc().toDate(); // ✅ JS Date
    },
  },
});

// Compare password
User.prototype.authenticateUser = function(password) {
  return compareSync(password, this.password);
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
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    name: `${this.firstName} ${this.lastName}`,
    email: this.email,
    mobileNumber: this.mobileNumber,
    isActive: this.isActive,
    role: this.role,
    profile_url: this.profile_url,
    token: `${this.createToken()}`,
    verificationRequired: !this.isEmailVerified,
    onboardingRequired: this.isOnboarding,
  };
};

module.exports = User;
