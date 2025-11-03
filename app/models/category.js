// const mongoose = require('mongoose');

// const categorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     slug: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: false, usePushEach: true }, // UTC format
// );

// categorySchema.methods = {
//   toJSON() {
//     return {
//       id: this._id,
//       name: this.name,
//       slug: this.slug,
//       isActive: this.isActive,
//     };
//   },
// };
// module.exports = mongoose.model('category', categorySchema);

// models/category.js

const { DataTypes } = require('sequelize');
const sequelize = require( '../config/database' );
// const sequelize = require('../config/sequelize'); // your sequelize instance

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // version: {
  //   type: DataTypes.INTEGER,
  //   defaultValue: 0,
  // },
}, {
  tableName: 'categories',
  timestamps: false,
});

module.exports = Category;
