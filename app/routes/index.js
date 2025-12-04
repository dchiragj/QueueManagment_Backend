const authRoutes = require('../components/auth/auth.route');
const queueRoutes = require('../components/queue/queue.route');
const userRoutes = require('../components/user/user.route');
const tokenRoutes = require('../components/token/token.route');
const notificationRoutes = require('../routes/send-approaching-notification');

/**
 * Init All routes here
 */
module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/token', tokenRoutes);
  app.use('/api/notification', notificationRoutes);
};
