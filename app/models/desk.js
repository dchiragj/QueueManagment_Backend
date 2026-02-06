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
const Queue = require('./queue');
const Business = require('./business');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { EXPRESS_SECRET } = require('../config/env');

const Desk = sequelize.define('Desk', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  queueId: {
    type: DataTypes.INTEGER,
    field: 'queueId',
    allowNull: true,
  },
  businessId: {
    type: DataTypes.INTEGER,
    field: 'businessId',
    allowNull: true,
    references: {
      model: 'Businesses',
      key: 'id',
    },
  },
  uid: {
    type: DataTypes.INTEGER,
    field: 'uid',
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    field: 'username',
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  extra1: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    field: 'is_active',
    defaultValue: 1,
  },
  // createdAt: {
  //   type: DataTypes.DATE,
  //   field: 'created_at',
  //   defaultValue: DataTypes.NOW,
  // },
  // updatedAt: {
  //   type: DataTypes.DATE,
  //   field: 'updated_at',
  //   defaultValue: DataTypes.NOW,
  // },
}, {
  tableName: 'desks',
  timestamps: false,
  hooks: {
    beforeCreate: (desk) => {
      const now = new Date();   // ✅ Date object
      desk.createdAt = now;
      desk.updatedAt = now;
    },
    beforeUpdate: (desk) => {
      desk.updatedAt = new Date();
    },
  },

});

// Create JWT for Desk
Desk.prototype.createToken = function () {
  return jwt.sign(
    {
      id: this.id,
      name: this.name,
      email: this.email,
      role: 'desk',
      queueId: this.queueId,
      businessId: this.businessId,
    },
    EXPRESS_SECRET,
    { expiresIn: 5184000 }
  );
};

Desk.prototype.toAuthJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: 'desk',
    queueId: this.queueId,
    businessId: this.businessId,
    token: `${this.createToken()}`,
  };
};

module.exports = Desk;

// Define relationships
Desk.belongsTo(require('./queue'), { foreignKey: 'queueId', as: 'queue' });
Desk.belongsTo(require('./business'), { foreignKey: 'businessId', as: 'branch' });

// Desk <-> Queue (Many-to-Many via QueueDeskMapping)
Desk.belongsToMany(require('./queue'), { through: require('./QueueDeskMapping'), foreignKey: 'deskId', as: 'queues' });
Desk.hasMany(require('./QueueDeskMapping'), { foreignKey: 'deskId', as: 'queueMappings' });