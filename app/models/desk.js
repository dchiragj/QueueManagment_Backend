// const { compareSync } = require('bcrypt-nodejs');
// const { isNull } = require('lodash');
// const mongoose = require('mongoose');
// const mongooseDelete = require('mongoose-delete');
// const queue = require('./queue');

// const Schema = mongoose.Schema;

// const deskSchema = new mongoose.Schema(
//   {
//     queue: {
//       type: Schema.Types.ObjectId,
//       ref: queue,
//       required: true,
//     },
//     number: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     username: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     normalized_username: {
//       type: String,
//       required: true,
//     },
//     start_time: {
//       type: Schema.Types.Date,
//       required: true,
//     },
//     end_time: {
//       type: Schema.Types.Date,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     extra1: {
//       type: String,
//       required: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: false,
//     },
//     updatedBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: false,
//     },
//     deletedBy: {
//       type: String,
//       trim: true,
//     },
//   },
//   { timestamps: true, usePushEach: true }, // UTC format
// );

// deskSchema.plugin(mongooseDelete, { overrideMethods: true, deletedAt: true });

// deskSchema.methods = {
//   authenticateDesk(password) {
//     return compareSync(password, this.password);
//   },

//   toJSON() {
//     return {
//       id: this._id,
//       queue: this.queue && !isNull(this.queue) ? this.queue.toJSON() : undefined,
//       number: this.number,
//       username: this.username,
//       start_time: this.start_time,
//       end_time: this.end_time,
//       password: this.extra1,
//       isActive: this.isActive,
//       customProps: this.customProps,
//       createdBy: this.createdBy,
//       createdAt: this.createdAt,
//       updatedBy: this.updatedBy,
//       updatedAt: this.updatedAt,
//     };
//   },
// };
// module.exports = mongoose.model('desk', deskSchema);


const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require( './category' );

const Desk = sequelize.define('Desk', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'desks',
  timestamps: false,
});

// Define relationship
Desk.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = Desk;