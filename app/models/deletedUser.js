const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const DeletedUser = sequelize.define('DeletedUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    originalUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
        type: DataTypes.STRING,
    },
    NormalizedEmail: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING(255),
    },
    mobileNumber: DataTypes.STRING,
    address: DataTypes.STRING,
    gender: DataTypes.STRING,
    ProfileUrl: {
        type: DataTypes.STRING,
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
    },
    isOnboarding: {
        type: DataTypes.BOOLEAN,
    },
    verificationCode: DataTypes.STRING,
    fcmToken: {
        type: DataTypes.STRING(500),
    },
    role: {
        type: DataTypes.STRING(50),
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    createdAt: {
        type: DataTypes.DATE,
    },
    updatedAt: {
        type: DataTypes.DATE,
    },
    deletedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
});

module.exports = DeletedUser;
