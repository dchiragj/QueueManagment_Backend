const cron = require('node-cron');
const Queue = require('./app/models/queue');
const Token = require('./app/models/token');


// Daily at 12:00 AM (midnight) cleanup job
const queueClenup = async () => {

    console.log('🧹 Starting daily queue cleanup at midnight...');
    try {
        const dayEndQueues = await Queue.findAll({
            where: {
                isDayQueue: 1
            },
            attributes: ['id']
        });
        if (dayEndQueues.length === 0) {
            console.log('No queues to clean today.');
            return;
        }

        const queueIds = dayEndQueues.map(q => q.id);

        await Token.destroy({
            where: {
                queueId: queueIds
            }
        });
        console.log(`Deleted tokens for ${queueIds.length} queues.`);

        await Queue.update(
            {
                status: 0,
                isActive: 0,
                isDayQueue: 0,
            },
            {
                where: {
                    id: queueIds
                }
            }
        );
        console.log(`Cleaned ${queueIds.length} non-day queues (isDayQueue: 1).`);

    } catch (error) {
        console.error('Error during daily queue cleanup:', error);
    }
}

const queueClenupJob = () => {
        console.log("📌 cron.js loaded");
    cron.schedule('0 0 0 * * *', async () => {
        console.log("🧹 Running scheduled queue cleanup job at midnight...");
        try {
            await queueClenup();
            console.log("✅ Queue clenup job successfully processed.");

        } catch (err) {
            console.error('Error in scheduled queue cleanup:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}


const StartJOBCron = () => {
    // queueClenup()
    queueClenupJob()
}
module.exports = StartJOBCron;