// /* eslint-disable no-console */

// /**
//  * Configuration for the database
//  */

// const mongoose = require('mongoose');

// // Remove the warning with Promise
// mongoose.Promise = global.Promise;

// // If debug run the mongoose debug options
// mongoose.set('debug', process.env.MONGOOSE_DEBUG);
// mongoose.set('useFindAndModify', false);
// const connect = (url) =>
//   mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
// module.exports = connect;
// db.js
// config/database.js
// config/database.js
// config/database.js
// config/database.js
const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ SQL Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });

module.exports = sequelize;

