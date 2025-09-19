// const path = require('path');
// const http = require('http');
// const express = require('express');
// const app = express();
// const server = http.Server(app);
// // Init Router
// const favicon = require('express-favicon');
// const chalk = require('chalk');
// const middlewares = require('./middleware');
// const routes = require('./routes');
// const env = require('./config/env');
// const connect = require('./config/database');
// const logErrorService = require('./utils/errorLog/log');

// // Initialize all middlewares here
// middlewares.init(app);

// // Routes initialization
// routes(app);
// const buildPath = path.join(__dirname, '../../', 'build');
// app.use(favicon(path.join(buildPath, 'favicon.ico')));
// app.use(express.static(buildPath));

// // API Health check
// app.all('/api/health-check', (req, res) => {
//   return res.status(200).json({ status: 200, message: `Working Fine - ENV: ${String(env.NODE_ENV)}` });
// });
// // Invalid Route
// app.all('/api/*', (req, res) => {
//   return res.status(400).json({ status: 400, message: 'Bad Request' });
// });

// // Invalid Route
// app.all('/*', (req, res) => {
//   res.sendFile(path.join(buildPath, 'index.html'));
//   // return res.status(400).json({ status: 400, message: 'Bad Request' });
// });

// // Error handler
// app.use(logErrorService);

// // start the server & connect to Mongo
// connect(env.DB_CONNECTION_STRING)
//   .then(() => {
//     console.log('%s database connected', chalk.green('✓'));
//   })
//   .catch((e) => {
//     if (e.name === 'MongoParseError') {
//       console.error(`\n\n${e.name}: Please set NODE_ENV to "production", "development", or "staging".\n\n`);
//     } else if (e.name === 'MongoNetworkError') {
//       console.error(`\n\n${e.name}: Please start MongoDB\n\n`);
//     } else {
//       console.log(e);
//     }
//   });

// /**
//  * Start Express server.
//  */
// server.listen(process.env.PORT, () => {
//   console.log(
//     '%s App is running at http://localhost:%d in %s mode',
//     chalk.green('✓'),
//     process.env.PORT,
//     process.env.NODE_ENV,
//   );
//   console.log('  Press CTRL-C to stop\n');
// });
// app/server.js
// app/server.jsconst path = require('path');
// app/server.jsconst path = require('path');const path = require('path'); // Add this line
const http = require('http');
const express = require('express');
const chalk = require('chalk');
const fs = require('fs').promises; // For file operations if needed
const middlewares = require('./middleware');
const routes = require('./routes');
const env = require('./config/env');
const sequelize = require('./config/database');
const logErrorService = require('./utils/errorLog/log');
const path = require('path');
const app = express();
const server = http.Server(app);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize middlewares
middlewares.init(app);

// Initialize routes
routes(app);

// API Health check
app.all('/api/health-check', (req, res) => {
  return res.status(200).json({ status: 200, message: `Working Fine - ENV: ${env.NODE_ENV}` });
});

// Invalid API Route
app.all('/api/*', (req, res) => {
  return res.status(400).json({ status: 400, message: 'Bad Request' });
});

// Error handler
app.use(logErrorService);

// Connect to SQL Server and start the server
sequelize
  .authenticate()
  .then(() => {
    console.log('%s SQL Server connected', chalk.green('✓'));
    return sequelize.sync({ force: false });
  })
  .then(() => {
    server.listen(env.PORT, () => {
      console.log(
        '%s App is running at http://localhost:%d in %s mode',
        chalk.green('✓'),
        env.PORT,
        env.NODE_ENV
      );
      console.log('  Press CTRL-C to stop\n');
    });
  })
  .catch((e) => {
    console.error('Database connection error:', e);
    if (e.name === 'SequelizeConnectionError') {
      console.error('Check DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, and DB_PORT in .env');
    }
    process.exit(1);
  });