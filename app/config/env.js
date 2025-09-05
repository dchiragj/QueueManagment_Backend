// const path = require('path');
// const dotenv = require('dotenv');
// /**
//  * Load environment variables from .env file
//  */
// const envPostFix = process.env.APP_ENV ? `.${process.env.APP_ENV}` : '';

// dotenv.config({
//   path: path.resolve(__dirname, `../../../.env${envPostFix}`),
// });

// module.exports = {
//   NODE_ENV: process.env.NODE_ENV,
//   ENV: process.env.APP_ENV,
//   APP_BASE_URL: process.env.APP_BASE_URL,
//   PORT: process.env.PORT,
//   DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
//   EXPRESS_SECRET: process.env.EXPRESS_SECRET,
//   SEGMENT_KEY: process.env.SEGMENT_KEY,
//   MAX_RESPONSE_TIME: process.env.MAX_RESPONSE_TIME || 10000,
//   SENTRY_KEY: process.env.SENTRY_KEY,
//   SENDGRID_API_KEY: '',
//   SENDGRID_SENDER_EMAIL: '',
//   SMTP_HOST: process.env.SMTP_HOST,
//   SMTP_PORT: process.env.SMTP_PORT,
//   SMTP_USERNAME: process.env.SMTP_USERNAME,
//   SMTP_PASSWORD: process.env.SMTP_PASSWORD,
//   ADMIN_EMAIL: process.env.SMTP_USERNAME,
// };
// config/env.js
// config/env.js
const path = require('path');
const dotenv = require('dotenv');

/**
 * Load environment variables from .env file
 */
const envPostFix = process.env.APP_ENV ? `.${process.env.APP_ENV}` : '';

// dotenv.config({
//   path: path.resolve(__dirname, `../../../.env${envPostFix}`),
// });
// const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENV: process.env.APP_ENV || 'development',
  APP_BASE_URL: process.env.APP_BASE_URL || 'https://10.0.2.2:8008',
  PORT: process.env.PORT || 8008,
  DB_NAME: process.env.DB_NAME || 'QueueManagment',
  DB_USER: process.env.DB_USER || 'sa_TNB',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Ch!r@g@123456',
  DB_HOST: process.env.DB_HOST || 'mssql-116808-0.cloudclusters.net',
  DB_PORT: process.env.DB_PORT || 19246,
  EXPRESS_SECRET: process.env.EXPRESS_SECRET || '2crEqJ3UqysiHpug1pCUEAdPgLZrSiBH',
  SEGMENT_KEY: process.env.SEGMENT_KEY || '',
  MAX_RESPONSE_TIME: process.env.MAX_RESPONSE_TIME || 10000,
  SENTRY_KEY: process.env.SENTRY_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_NAME || 'Queue App',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USERNAME: process.env.SMTP_USERNAME || 'pontingr186@gmail.com',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || 'illjaixomlvbrelp',
  ADMIN_EMAIL: process.env.SMTP_USERNAME || 'pontingr186@gmail.com',
};