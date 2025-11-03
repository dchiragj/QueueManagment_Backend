// const { isNull } = require('lodash');
// const mongoose = require('mongoose');
// const mongooseDelete = require('mongoose-delete');
// const problemAndSolution = require('./problem-solution');
// const queue = require('./queue');


// const Schema = mongoose.Schema;

// const tokenSchema = new mongoose.Schema(
//   {
//     uid: {
//       type: Schema.Types.ObjectId,
//       ref: 'users',
//       required: true,
//     },
//     queue: {
//       type: Schema.Types.ObjectId,
//       ref: queue,
//       required: true,
//     },
//     queue_details: {
//       type: Schema.Types.Mixed,
//       required: true,
//     },
//     number: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     date: {
//       type: Schema.Types.Date, // in format YYYY-MMM-DD
//       required: true,
//     },
//     isActive: {
//       type: String,
//       default: true,
//     },
//     isPostponed: {
//       type: Boolean,
//     },
//     postponed_date: {
//       type: Schema.Types.Date,
//     },
//     postponed_reason: {
//       type: String,
//     },
//     isServed: {
//       type: Boolean,
//     },
//     servingStartedAt: {
//       type: Schema.Types.Date,
//     },
//     servingCompletedAt: {
//       type: Schema.Types.Date,
//     },
//     servedByDesk: {
//       type: Number,
//       // type: Schema.Types.ObjectId,
//       // ref: 'users',
//     },
//     isSkipped: {
//       type: Boolean,
//     },
//     skippedAt: {
//       type: Schema.Types.Date,
//     },
//     skippedByDesk: {
//       type: Number,
//       // type: Schema.Types.ObjectId,
//       // ref: 'users',
//     },
//     isOptedOut: {
//       type: Boolean,
//     },
//     optedOutOn: {
//       type: Schema.Types.Date,
//     },
//     optedOutReason: {
//       type: String,
//     },
//     problemSolutions: [
//       {
//         problem: {
//           type: Schema.Types.ObjectId,
//           ref: problemAndSolution,
//           required: true,
//         },
//         problem_details: {
//           type: Schema.Types.Mixed,
//           required: true,
//         },
//         solutions: [
//           {
//             solution: {
//               type: Schema.Types.ObjectId,
//               ref: problemAndSolution,
//             },
//             solution_details: {
//               type: Schema.Types.Mixed,
//             },
//           },
//         ],
//       },
//     ],
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

// tokenSchema.plugin(mongooseDelete, { overrideMethods: true, deletedAt: true });

// tokenSchema.methods = {
//   toJSONWithObject(hasFullObj = false) {
//     return {
//       id: this._id,
//       uid: this.uid,
//       number: this.number,
//       queue: this.queue_details || (this.queue && !isNull(this.queue) ? this.queue.toJSON() : undefined),
//       date: this.date,
//       isPostponed: this.isPostponed,
//       postponed_date: this.postponed_date,
//       postponed_reason: this.postponed_reason,
//       isServed: this.isServed,
//       servingStartedAt: this.servingStartedAt,
//       servingCompletedAt: this.servingCompletedAt,
//       servedByDesk: this.servedByDesk,
//       isSkipped: this.isSkipped,
//       skippedAt: this.skippedAt,
//       skippedByDesk: this.skippedByDesk,
//       isOptedOut: this.isOptedOut,
//       optedOutOn: this.optedOutOn,
//       optedOutReason: this.optedOutReason,
//       problemSolutions:
//         hasFullObj &&
//         this.problemSolutions.map((parent_item) => {
//           const problem = parent_item.problem && !isNull(parent_item.problem) ? parent_item.problem.toJSON() : {};
//           if (parent_item.problem_details) problem.name = parent_item.problem_details.name;
//           return {
//             problem,
//             solutions: parent_item.solutions.map((item) => {
//               const solution = item.solution && !isNull(item.solution) ? item.solution.toJSON() : {};
//               if (item.solution_details) solution.name = item.solution_details.name;
//               return {
//                 solution,
//               };
//             }),
//           };
//         }),
//       isActive: this.isActive,
//       customProps: this.customProps,
//       createdBy: this.createdBy,
//       createdAt: this.createdAt,
//     };
//   },

//   toJSON() {
//     return {
//       id: this._id,
//       uid: this.uid,
//       number: this.number,
//       queue: this.queue,
//       date: this.date,
//       isPostponed: this.isPostponed,
//       postponed_date: this.postponed_date,
//       postponed_reason: this.postponed_reason,
//       isServed: this.isServed,
//       servingStartedAt: this.servingStartedAt,
//       servingCompletedAt: this.servingCompletedAt,
//       servedByDesk: this.servedByDesk,
//       isSkipped: this.isSkipped,
//       skippedAt: this.skippedAt,
//       skippedByDesk: this.skippedByDesk,
//       isOptedOut: this.isOptedOut,
//       optedOutOn: this.optedOutOn,
//       optedOutReason: this.optedOutReason,
//       problemSolutions: this.problemSolutions,
//       isActive: this.isActive,
//       customProps: this.customProps,
//       createdBy: this.createdBy,
//       createdAt: this.createdAt,
//     };
//   },
// };
// module.exports = mongoose.model('token', tokenSchema);
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  queueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Queues', key: 'id' },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
   categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Category', key: 'id' },
  },
    queueName: {
    type: DataTypes.STRING,
    allowNull: false,  
  },
  tokenNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SKIPPED'),
    defaultValue: 'PENDING',
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
  tableName: 'Tokens',
  timestamps: true,
});

// Associations
Token.belongsTo(require('./queue'), { foreignKey: 'queueId', as: 'queue' });
Token.belongsTo(require('./user'), { foreignKey: 'customerId', as: 'customer' });
Token.belongsTo(require('./category'), { foreignKey: 'categoryId', as: 'category' });

module.exports = Token;