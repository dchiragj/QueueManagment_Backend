const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

const QueueDeskMapping = sequelize.define('QueueDeskMappings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    queueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Queues',
            key: 'id',
        }
    },
    deskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'desks',
            key: 'id',
        }
    }
}, {
    tableName: 'QueueDeskMappings',
    timestamps: true
});

module.exports = QueueDeskMapping;

// Define relationships
QueueDeskMapping.belongsTo(require('./queue'), { foreignKey: 'queueId', as: 'queue' });
QueueDeskMapping.belongsTo(require('./desk'), { foreignKey: 'deskId', as: 'desk' });
