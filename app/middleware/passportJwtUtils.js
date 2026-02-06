const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.EXPRESS_SECRET;
module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
      try {
        const User = require('../models/user');
        const Desk = require('../models/desk');

        let user = await User.findOne({ where: { id: jwtPayload.id } });
        if (user) {
          return done(null, user);
        }

        // Try Desk
        let desk = await Desk.findOne({ where: { id: jwtPayload.id } });
        if (desk && jwtPayload.role === 'desk') {
          const deskData = desk.toJSON();
          if (!deskData.queueId) {
            const QueueDeskMapping = require('../models/QueueDeskMapping');
            const mapping = await QueueDeskMapping.findOne({
              where: { deskId: desk.id },
              order: [['id', 'DESC']]
            });
            if (mapping) {
              deskData.queueId = mapping.queueId;
            }
          }
          return done(null, { ...deskData, role: 'desk' });
        }

        return done(null, false);
      } catch (e) {
        return done(null, false);
      }
    }),
  );
};
