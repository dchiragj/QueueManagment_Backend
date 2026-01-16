// const { isNull } = require('lodash');
// const mongoose = require('mongoose');
// const mongooseDelete = require('mongoose-delete');

// const Schema = mongoose.Schema;

// const geoSchema = new Schema({
//   type: {
//     type: String,
//     default: 'Point',
//   },
//   coordinates: {
//     type: [Number],
//   },
// });

// geoSchema.methods = {
//   toJSON() {
//     return {
//       type: this.type,
//       coordinates: this.coordinates,
//     };
//   },
// };

// const queueSchema = new mongoose.Schema(
//   {
//     uid: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: true,
//     },
//     category: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     start_date: {
//       type: Schema.Types.Date,
//       required: true,
//     },
//     end_date: {
//       type: Schema.Types.Date,
//       required: true,
//     },
//     noOfDesk: {
//       type: Number,
//     },
//     start_number: {
//       type: Number,
//       required: true,
//     },
//     end_number: {
//       type: Number,
//       required: true,
//     },
//     status: {
//       type: Number,
//       // required: true
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     address: {
//       type: String,
//     },
//     location: {
//       type: geoSchema,
//       index: '2dsphere',
//     },
//     lattitude: {
//       type: Number,
//       required: true,
//     },
//     longitude: {
//       type: Number,
//       required: true,
//     },
//     isCancelled: {
//       type: Boolean,
//     },
//     cancelledBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: false,
//     },
//     cancelled_date: {
//       type: Schema.Types.Date,
//       required: false,
//     },
//     cancelled_comment: {
//       type: String,
//       required: false,
//     },
//     merchant: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: true,
//     },
//     customProps: {
//       type: Schema.Types.Mixed,
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

// queueSchema.plugin(mongooseDelete, { overrideMethods: true, deletedAt: true });

// queueSchema.methods = {
//   toJSON() {
//     return {
//       id: this._id,
//       category: this.category,
//       name: this.name,
//       description: this.description,
//       start_date: this.start_date,
//       end_date: this.end_date,
//       noOfDesk: this.noOfDesk,
//       start_number: this.start_number,
//       end_number: this.end_number,
//       status: this.status,
//       isActive: this.isActive,
//       address: this.address,
//       location: this.location ? this.location.toJSON() : {},
//       lattitude: this.lattitude,
//       longitude: this.longitude,
//       isCancelled: this.isCancelled,
//       cancelledBy: this.cancelledBy,
//       cancelled_date: this.cancelled_date,
//       cancelled_comment: this.cancelled_comment,
//       merchant: this.merchant && !isNull(this.merchant) ? this.merchant.toJSON() : undefined,
//       customProps: this.customProps,
//       createdBy: this.createdBy,
//       createdAt: this.createdAt,
//       updatedBy: this.updatedBy,
//       updatedAt: this.updatedAt,
//     };
//   },
// };
// module.exports = mongoose.model('queue', queueSchema);
// models/queue.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

const Queue = sequelize.define('Queue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  category: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Desk: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  start_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  end_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isDayQueue: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0
  },
  joinCode: {
    type: DataTypes.STRING(6),
    unique: true,
    allowNull: true,
  },
  joinMethods: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: ''
  },
  qrCode: {
    type: DataTypes.STRING(200),
    defaultValue: '',
    allowNull: true

  },
  webBaseqrCode: {
    type: DataTypes.STRING(200),
    defaultValue: '',
    allowNull: true

  },
  isCancelled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  cancelled_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_comment: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  merchant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  customProps: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  deletedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Queues',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeCreate: async (queue) => {
      console.log(queue, "paylo");

      // Generate unique 6-digit joinCode
      let joinCode;
      let isUnique = false;
      while (!isUnique) {
        joinCode = Math.floor(100000 + Math.random() * 900000).toString();
        const existingQueue = await Queue.findOne({ where: { joinCode } });
        if (!existingQueue) isUnique = true;
      }
      queue.joinCode = joinCode;
      // Ensure start_date and end_date are valid Date objects
      if (queue.dataValues.start_date && !(queue.dataValues.start_date instanceof Date)) {
        queue.dataValues.start_date = moment(queue.dataValues.start_date).toDate();
      }
      if (queue.dataValues.end_date && !(queue.dataValues.end_date instanceof Date)) {
        queue.dataValues.end_date = moment(queue.dataValues.end_date).toDate();
      }

      queue.createdAt = moment().utc().toDate();
      queue.updatedAt = moment().utc().toDate();

    },
    beforeUpdate: (queue) => {
      if (queue.start_date && !(queue.start_date instanceof Date)) {
        queue.start_date = moment(queue.start_date).toDate();
      }
      if (queue.end_date && !(queue.end_date instanceof Date)) {
        queue.end_date = moment(queue.end_date).toDate();
      }
      queue.updatedAt = moment().utc().toDate();
    },
  },
});

// Associations
Queue.belongsTo(require('./user'), { foreignKey: 'uid', as: 'user' });
Queue.belongsTo(require('./user'), { foreignKey: 'merchant', as: 'merchantUser' });
Queue.belongsTo(require('./category'), { foreignKey: 'category', as: 'categ' });
// Queue.belongsTo(require('./business'), { foreignKey: 'businessId', as: 'business' });
// Queue.belongsTo(require('./token'), { foreignKey: 'token', as: 'tokens' });
module.exports = Queue;