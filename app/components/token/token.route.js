const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const controller = require('./token.controller');
const validations = require('./token.validations');
const Queue = require( '../../models/queue' );
const { createError, createResponse } = require( '../../utils/helpers' );
const Token = require( '../../models/token' );
const User = require( '../../models/user' );
const service = require( '../../services/tokenService' );

/**
 * @route GET api/token
 * @description get token
 * @returns JSON
 * @access public
 */
router.get(
  '/',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getTokenList(req, res);
  },
);

/**
 * @route GET api/token/completed
 * @description get completed tokens
 * @returns JSON
 * @access public
 */
router.get(
  '/completed',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getCompletedTokenList(req, res);
  },
);

/**
 * @route GET api/token/:queueId
 * @description get token by queueId
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getTokenListByQueueId(req, res);
  },
);

/**
 * @route GET api/token/:queueId/next-token
 * @description Get next token details
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId/next-token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getNextToken(req, res);
  },
);

/**
 * @route POST api/token
 * @description create token
 * @returns JSON
 * @access public
 */
router.post(
  '/', 
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.create,
  (req, res) => {
    controller.create(req, res);
  },
);

/**
 * @route GET api/token/details/:id
 * @description Get token details
 * @returns JSON
 * @access public
 */
router.get(
  '/details/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.getItem,
  (req, res) => {
    controller.getDetails(req, res);
  },
);
/**
 * @route POST api/queue/generate-token
 * @description Generate a token by scanning QR code
 * @returns JSON
 * @access public
 */
router.post(
  '/generate-token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  async (req, res) => {
    try {
      const { queueId } = req.body; // Assume QR code scan provides queueId
      if (!queueId) {
        return createError(res, { message: 'Queue ID is required' });
      }

      // Verify queue exists
      const queue = await service.getSingle(req.user.id, queueId);
      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }

      // Generate token logic (example)
      const tokenNumber = await service.generateTokenNumber(queue); // Implement this function
      const token = {
        queueId: queue.id,
        tokenNumber,
        userId: req.user.id,
        status: 'ISSUED',
        createdAt: new Date(),
      };

      // Save token to database (assuming you have a Token model)
      const savedToken = await Token.create(token); // Adjust based on your database model
      return createResponse(res, 'ok', 'Token generated successfully', savedToken);
    } catch (e) {
      return createError(res, e);
    }
  }
);
router.post(
  '/check-token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  async (req, res) => {
    try {
      const { queueId } = req.body;
      if (!queueId) {
        return createError(res, { message: 'Queue ID is required' });
      }

      // Verify queue exists
      const queue = await service.getSingle(req.user.id, queueId);
      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }

      // Check if a token exists for the user and queue
      const existingToken = await Token.findOne({
        where: {
          queueId: queue.id,
          userId: req.user.id,
          status: 'ISSUED', // Only return active tokens
        },
      });

      if (!existingToken) {
        return createResponse(res, 'ok', 'No token found for this queue', null);
      }

      return createResponse(res, 'ok', 'Token found', {
        queueId: existingToken.queueId,
        tokenNumber: existingToken.tokenNumber,
        userId: existingToken.userId,
        status: existingToken.status,
        createdAt: existingToken.createdAt,
      });
    } catch (e) {
      return createError(res, e);
    }
  }
);

// /**
//  * @route POST api/token/join
//  * @description Join a queue and get a token
//  * @returns JSON
//  * @access public
//  */
// router.post(
//   '/join',
//   [
//     passport.authenticate('jwt', { session: false, failWithError: true }),
//     PassportErrorHandler.success,
//     PassportErrorHandler.error,
//   ],
//   async (req, res) => {
//     try {
//       const { user } = req;
// console.log(user,"userid");

//       const { joinCode } = req.body;
//       if(!joinCode) {
//         return createError(res, { message: 'joincode is required' }, 403);
//       }

//       if (user.role !== 'customer' && user.role !== 'both') {
//         return createError(res, { message: 'Only customers can join queues' }, 403);
//       }

//       const queue = await Queue.findOne({ where: { joinCode, isActive: true } });
//       if (!queue) {
//         return createError(res, { message: 'Invalid or inactive queue' }, 404);
//       }

//       // Check if customer already has a token for this queue
//       const existingToken = await Token.findOne({
//         where: { queueId: queue.id, customerId: user.id },
//       });
//       if (existingToken) {
//         return createError(res, { message: 'You already have a token for this queue' }, 400);
//       }

//       // Assign the next available token number
//       const lastToken = await Token.findOne({
//         where: { queueId: queue.id },
//         order: [['tokenNumber', 'DESC']],
//       });
//       const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : queue.start_number;
//       if (nextTokenNumber > queue.end_number) {
//         return createError(res, { message: 'No more tokens available for this queue' }, 400);
//       }

//       const token = await Token.create({
//         queueId: queue.id,
//         customerId: user.id,
//         tokenNumber: nextTokenNumber,
//         status: 'PENDING',
//       });

//       return createResponse(res, 'ok', 'Token assigned successfully', {
//         tokenId: token.id,
//         tokenNumber: token.tokenNumber,
//         queueName: queue.name,
//         merchantId: queue.merchant,
//       });
//     } catch (e) {
//       return createError(res, e);
//     }
//   }
// );

// /**
//  * @route GET api/token/my-tokens
//  * @description Get list of tokens for the authenticated customer
//  * @returns JSON
//  * @access public
//  */

// router.get(
//   '/my-tokens',
//   [
//     passport.authenticate('jwt', { session: false, failWithError: true }),
//     PassportErrorHandler.success,
//     PassportErrorHandler.error,
//   ],
//   async (req, res) => {
//     try {
//       const { user } = req;
//       if (user.role !== 'CUSTOMER' && user.role !== 'BOTH') {
//         return createError(res, { message: 'Only customers can view their tokens' }, 403);
//       }

//       const { queueIds, page = 1, limit = 10, status } = req.query;
//       const offset = (page - 1) * limit;

//       const where = { customerId: user.id };
//       if (queueIds) {
//         const queueIdArray = queueIds.split(',').map(id => parseInt(id.trim()));
//         if (queueIdArray.some(id => isNaN(id))) {
//           return createError(res, { message: 'Invalid queueIds: must be comma-separated integers' }, 400);
//         }
//         where.queueId = queueIdArray;
//       }
//       if (status) {
//         if (!['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
//           return createError(res, { message: 'Invalid status filter' }, 400);
//         }
//         where.status = status;
//       }

//       const { count, rows: tokens } = await Token.findAndCountAll({
//         where,
//         include: [
//           {
//             model: Queue,
//             as: 'queue',
//             attributes: ['id', 'name', 'category', 'merchant', 'start_date', 'end_date', 'address', 'joinCode'],
//             include: [
//               {
//                 model: User,
//                 as: 'merchantUser',
//                 attributes: ['id', 'FirstName', 'LastName'],
//               },
//             ],
//           },
//         ],
//         limit: parseInt(limit),
//         offset: parseInt(offset),
//         order: [['createdAt', 'DESC']],
//       });

//       if (tokens.length === 0) {
//         return createResponse(res, 'ok', 'No tokens found', { total: 0, page, limit, data: [] });
//       }

//       return createResponse(res, 'ok', 'Token list', {
//         total: count,
//         page,
//         limit,
//         data: tokens.map(token => ({
//           tokenId: token.id,
//           tokenNumber: token.tokenNumber,
//           status: token.status,
//           queue: {
//             id: token.queue.id,
//             name: token.queue.name,
//             category: token.queue.category,
//             merchant: token.queue.merchantUser
//               ? `${token.queue.merchantUser.FirstName} ${token.queue.merchantUser.LastName}`
//               : 'Unknown',
//             start_date: token.queue.start_date,
//             end_date: token.queue.end_date,
//             address: token.queue.address,
//             joinCode: token.queue.joinCode,
//           },
//           createdAt: token.createdAt,
//         })),
//       });
//     } catch (e) {
//       console.error('Error fetching token list:', e.stack);
//       return createError(res, { message: e.message || 'Failed to fetch tokens' }, 500);
//     }
//   }
// );

module.exports = router;
