const sequelize = require('./app/config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Tokens');

        if (!tableInfo.servedByDeskId) {
            console.log('Adding servedByDeskId column to Tokens table...');
            await queryInterface.addColumn('Tokens', 'servedByDeskId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'desks', key: 'id' },
            });
            console.log('Column added successfully!');
        } else {
            console.log('Column servedByDeskId already exists.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
