// const { hashSync, compareSync, genSaltSync } = require('bcrypt-nodejs');
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');
// const { EXPRESS_SECRET } = require('../config/env');

// const userSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     normalized_email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     mobileNumber: {
//       type: String,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     extra1: {
//       type: String,
//       required: true,
//     },
//     verificationCode: {
//       type: String,
//     },
//     isEmailVerified: {
//       type: Boolean,
//     },
//     isOnboarding: {
//       type: Boolean,
//     },
//     role: {
//       type: String,
//       enum: ['both', 'merchant', 'customer'],
//       required: true,
//     },
//     address: {
//       type: String,
//     },
//     profile_url: {
//       type: String,
//     },
//     gender: {
//       type: String,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     resetPasswordToken: {
//       type: String,
//       required: false,
//     },
//     resetPasswordExpires: {
//       type: Number,
//       required: false,
//     },
//     lastLogin: {
//       type: Date,
//     },
//     ip: {
//       type: String,
//     },
//   },
//   { timestamps: true, usePushEach: true }, // UTC format
// );

// userSchema.pre('save', function(next) {
//   if (this.isModified('password')) {
//     this.extra1 = this.password;
//     this.password = this._hashPassword(this.password);
//     return next();
//   }
//   return next();
// });

// userSchema.pre('findOneAndUpdate', function(next) {
//   const query = this;
//   const update = query.getUpdate();
//   if (update.password) {
//     update.extra1 = update.password;
//     update.password = hashSync(update.password, genSaltSync(8), null);
//     return next();
//   }
//   return next();
// });

// userSchema.methods = {
//   authenticateUser(password) {
//     return compareSync(password, this.password);
//   },

//   _hashPassword(password) {
//     return hashSync(password, genSaltSync(8), null);
//   },

//   getUserName() {
//     return this.firstName + ' ' + this.lastName;
//   },

//   createToken() {
//     return jwt.sign(
//       {
//         id: this._id,
//         name: `${this.getUserName()}`,
//         email: this.email,
//         role: this.role,
//       },
//       EXPRESS_SECRET,
//       { expiresIn: 5184000 },
//     );
//   },

//   toAuthJSON() {
//     return {
//       id: this._id,
//       firstName: this.firstName,
//       lastName: this.lastName,
//       name: `${this.getUserName()}`,
//       email: this.email,
//       mobileNumber: this.mobileNumber,
//       isActive: this.isActive,
//       role: this.role,
//       profile_url: this.profile_url,
//       token: `${this.createToken()}`,
//       verificationRequired: !this.isEmailVerified,
//       onboardingRequired: this.isOnboarding,
//     };
//   },

//   toJSON() {
//     return {
//       id: this._id,
//       firstName: this.firstName,
//       lastName: this.lastName,
//       name: `${this.getUserName()}`,
//       email: this.email,
//       mobileNumber: this.mobileNumber,
//       isActive: this.isActive,
//       role: this.role,
//       address: this.address,
//       profile_url: this.profile_url,
//       gender: this.gender,
//       isEmailVerified: this.isEmailVerified,
//       onboardingRequired: this.isOnboarding,
//     };
//   },
// };
// module.exports = mongoose.model('users', userSchema);
const { hashSync, compareSync, genSaltSync } = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const { EXPRESS_SECRET } = require('../config/env');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sqlserver');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  normalizedEmail: { type: DataTypes.STRING, allowNull: false, unique: true },
  mobileNumber: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  extra1: { type: DataTypes.STRING },
  verificationCode: { type: DataTypes.STRING },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isOnboarding: { type: DataTypes.BOOLEAN, defaultValue: false },
  role: { type: DataTypes.ENUM('both', 'merchant', 'customer'), allowNull: false },
  address: { type: DataTypes.STRING },
  profile_url: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpires: { type: DataTypes.DATE },
  lastLogin: { type: DataTypes.DATE },
  ip: { type: DataTypes.STRING }
}, {
  tableName: 'Users',
  timestamps: true,
});

// 🔹 Hooks (instead of mongoose pre)
User.beforeCreate((user) => {
  if (user.password) {
    user.extra1 = user.password;
    user.password = hashSync(user.password, genSaltSync(8), null);
  }
});

User.beforeUpdate((user) => {
  if (user.password) {
    user.extra1 = user.password;
    user.password = hashSync(user.password, genSaltSync(8), null);
  }
});

// 🔹 Custom instance methods
User.prototype.authenticateUser = function(password) {
  return compareSync(password, this.password);
};

User.prototype.getUserName = function() {
  return this.firstName + ' ' + this.lastName;
};

User.prototype.createToken = function() {
  return jwt.sign(
    {
      id: this.id,
      name: `${this.getUserName()}`,
      email: this.email,
      role: this.role,
    },
    EXPRESS_SECRET,
    { expiresIn: 5184000 } // 60 days
  );
};

User.prototype.toAuthJSON = function() {
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    name: this.getUserName(),
    email: this.email,
    mobileNumber: this.mobileNumber,
    isActive: this.isActive,
    role: this.role,
    profile_url: this.profile_url,
    token: this.createToken(),
    verificationRequired: !this.isEmailVerified,
    onboardingRequired: this.isOnboarding,
  };
};

User.prototype.toJSON = function() {
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    name: this.getUserName(),
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
};

module.exports = User;
