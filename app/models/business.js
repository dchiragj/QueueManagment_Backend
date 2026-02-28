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
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    placeid: {
        type: DataTypes.STRING(100),
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
        defaultValue: 0,
    },
})

// Associations
Business.belongsTo(require('./user'), { foreignKey: 'uid', as: 'user' });
module.exports = Business;