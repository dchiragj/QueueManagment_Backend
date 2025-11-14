// models/queueJoinSetting.js
const { DataTypes, Sequelize } = require('sequelize');

const QueueJoinSetting = Sequelize.define('QueueJoinSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  queueId: { type: DataTypes.INTEGER, allowNull: false },
  // bit-mask → 1=private, 2=link, 4=location, 8=qr
  joinMethods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  inviteCode: { type: DataTypes.STRING(20), unique: true, allowNull: true },
}, { timestamps: true, paranoid: true });

module.exports = QueueJoinSetting;