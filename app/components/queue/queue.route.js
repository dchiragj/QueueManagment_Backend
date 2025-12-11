const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const controller = require('./queue.controller');
const validations = require('./queue.validations');
const Token = require('../../models/token');
const User = require('../../models/user');
const { createResponse, createError } = require('../../utils/helpers');

/**
 * @route GET api/queue
 * @description get queue list
 * @returns JSON
 * @access public
 */
router.get(
  '/list',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getQueueList(req, res);
  },
);

/**
 * @route GET api/queue/completed
 * @description get completed queues
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
    controller.getCompletedQueueList(req, res);
  },
);

/**
 * @route GET api/queue
 * @description get queue list
 * @returns JSON
 * @access public
 */
router.get(
  '/by-user',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getQueueListByUserId(req, res);
  },
);

/**
 * @route POST api/queue
 * @description create queue
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
 * @route POST api/queue/category
 * @description create category
 * @returns JSON
 * @access public
 */
router.post(
  '/category',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.createCategory(req, res);
  },
);

/**
 * @route GET api/queue/categories
 * @description get queue categories
 * @returns JSON
 * @access public
 */
router.get(
  '/category',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getCategories(req, res);
  },
);
/**
 * @route GET api/queue/desks/:categoryId
 * @description Get desks for a category (used when creating a queue)
 */
router.get(
  '/desks/:categoryId',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getDesksByCategory(req, res);
  }
);

/**
 * @route POST api/queue/:type?queueId=''&categoryId=''
 * @description create problem/solution
 * @returns JSON
 * @access public
 */
// router.post(
//   '/:type',
//   [
//     passport.authenticate('jwt', { session: false, failWithError: true }),
//     PassportErrorHandler.success,
//     PassportErrorHandler.error,
//   ],
//   validations.createProbSol,
//   (req, res) => {
//     controller.createProbSol(req, res);
//   },
// );

/**
 * @route GET api/queue/:type
 * @description get queue problems/solutions
 * @returns JSON
 * @access public
 */
router.get(
  '/:type',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getProbSolList(req, res);
  },
);

/**
 * @route GET api/queue/:queueId/desk
 * @description get queue desks
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId/desks',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getDesks(req, res);
  },
);

/**
 * @route GET api/queue/:queueId/next-desk
 * @description Get next queue desk details
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId/next-desk',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getNextDesk(req, res);
  },
);

/**
 * @route POST api/queue/:queueId/desk-login
 * @description login in queue desks
 * @returns JSON
 * @access public
 */
router.post(
  '/:queueId/desk-login',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.deskLogin,
  (req, res) => {
    controller.deskLogin(req, res);
  },
);

/**
 * @route GET api/queue/details/:id
 * @description Get queue details
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

router.get('/:queueId/history', async (req, res) => {
  try {
    const { queueId } = req.params;
    const { mobile } = req.query;

    console.log('History check:', { queueId, mobile });
    if (!queueId || isNaN(queueId)) {
      return createError(res, { message: 'Invalid queue ID' });
    }
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
      return createError(res, { message: 'Valid 10-digit mobile number required' });
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    // Find user by mobile
    const user = await User.findOne({
      where: { mobileNumber: cleanMobile } 
    });

    console.log(user,queueId,'Found user for mobile:', user ? user.id : 'None');

    if (!user) {
      return createResponse(res, 'ok', 'No user found', { hasToken: false });
    }

    // Look for PENDING token in this queue
    const token = await Token.findOne({
      where: {
        queueId: parseInt(queueId),
        customerId: user.id,
        status: 'PENDING'
      },
      include: [
        {
          model: User,
          as: 'customer',
          where: { mobileNumber: cleanMobile },
          attributes: ['id', 'firstName', 'lastName', 'mobileNumber'],
          required: true
        }
      ],
      attributes: ['tokenNumber', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });  
    if (!token) {
      return createResponse(res, 'ok', 'No active token', {
        hasToken: false,
        User: {
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber
      }
      });
    }

    return createResponse(res, 'ok', 'Active token found', {
      hasToken: true,
      tokenNumber: token.tokenNumber,
      status: token.status,
      createdAt: token.createdAt,
    });

  } catch (error) {
    console.error('Token history API error:', error);
    return createError(res, { message: 'Server error' });
  }
});
/**
 * @route DELETE api/queue/delete/:id
 * @description Delete a queue by ID
 * @returns JSON
 * @access public
 */
router.delete(
  '/delete/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.getItem, // Reuse existing validation for ID
  (req, res) => {
    controller.cancelQueue(req, res);
  },
);
// ✅ Guest Join APIs (No Auth Required)
router.post('/:id/join-guest', (req, res) => {
  controller.guestJoin(req, res);
});

router.get('/track/:queueId/:trackingToken', (req, res) => {
  controller.trackStatus(req, res);
});

router.post('/track/:queueId/:trackingToken/cancel', (req, res) => {
  controller.cancelGuestToken(req, res);
});
module.exports = router;
