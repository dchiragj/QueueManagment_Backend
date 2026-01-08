const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');   // 👈 IMPORTANT — right path

const ContactUs = sequelize.define('ContactUs', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true   // Works in MSSQL — Sequelize converts to IDENTITY
  },

  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },

}, {
  tableName: 'ContactUs',
  timestamps: false,
});

module.exports = ContactUs;
