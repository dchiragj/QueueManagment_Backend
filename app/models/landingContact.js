const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LandingContact = sequelize.define('LandingContact', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },

}, {
    tableName: 'LandingContact',
    timestamps: true,
});

module.exports = LandingContact;
