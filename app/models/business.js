const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

const Business = sequelize.define('Business', {
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
    businessName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    businessAddress: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    businessRegistrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    businessPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    
})

// Associations
Business.belongsTo(require('./user'), { foreignKey: 'uid', as: 'user' });
module.exports = Business;