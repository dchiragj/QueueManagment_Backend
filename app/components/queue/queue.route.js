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
const Queue = require('../../models/queue');

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
 * @route PUT api/queue/update/:id
 * @description update queue
 * @returns JSON
 * @access public
 */
router.put(
  '/update/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.updateQueue(req, res);
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
    if (!queueId || isNaN(queueId)) {
      return createError(res, { message: 'Invalid queue ID' });
    }

    const isEmail = mobile.includes('@')
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(mobile)) {
        return createError(res, { message: 'Please enter valid email address' });
      }
    } else {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobile)) {
        return createError(res, { message: 'Valid 10-digit mobile number required' });
      }
    }
    const user = await User.findOne({
      where: { [isEmail ? 'Email' : 'MobileNumber']: mobile }

    });
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
          // where: { mobileNumber: mobile },
          attributes: ['id', 'firstName', 'lastName', 'mobileNumber'],
          required: true
        }
      ],
      attributes: ['tokenNumber', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const usersAllTokens = await Token.findAll({
      where: {
        customerId: user.id
      },
      include: [
        {
          model: Queue, // Queue model
          as: 'queue',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'tokenNumber', 'status', 'queueId', 'createdAt', 'completedAt'],
      order: [['createdAt', 'DESC']]
    });

    if (!token) {
      return createResponse(res, 'ok', 'No active token', {
        hasToken: false,
        User: {
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber
        },
        usersAllTokens
      });
    }

    return createResponse(res, 'ok', 'Active token found', {
      hasToken: true,
      tokenNumber: token.tokenNumber,
      status: token.status,
      createdAt: token.createdAt,
      usersAllTokens
    });

  } catch (error) {
    console.error('Token history API error:', error);
    return createError(res, { message: 'Server error' });
  }
});
// route: GET /api/user/token-history?mobile=8200956950
// router.get('//token-history', async (req, res) => {
//   try {
//     const { mobile } = req.query;

//     if (!mobile || mobile.replace(/\D/g, '').length < 10) {
//       return createError(res, { message: 'Valid 10-digit mobile number required' });
//     }

//     const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

//     const user = await User.findOne({
//       where: { mobileNumber: cleanMobile }
//     });

//     if (!user) {
//       return createResponse(res, 'ok', 'No user found with this mobile', {
//         hasToken: false,
//         tokens: []
//       });
//     }

//     const allTokens = await Token.findAll({
//       where: {
//         customerId: user.id
//       },
//       include: [
//         {
//           model: Queue, // Queue model
//           as: 'queue',
//           attributes: ['id', 'name']
//         }
//       ],
//       attributes: ['id', 'tokenNumber', 'status', 'queueId', 'createdAt', 'completedAt'],
//       order: [['createdAt', 'DESC']]
//     });

//     return createResponse(res, 'ok', 'Full token history fetched', {
//       hasToken: allTokens.length > 0,
//       totalTokens: allTokens.length,
//       user: {
//         firstName: user.firstName,
//         lastName: user.lastName,
//         mobileNumber: user.mobileNumber
//       },
//       tokens: allTokens.map(t => ({
//         tokenId: t.id,
//         tokenNumber: t.tokenNumber,
//         status: t.status,
//         queueId: t.queueId,
//         queueName: t.queue?.name || 'Unknown Queue',
//         location: t.queue?.location || null,
//         createdAt: t.createdAt,
//         completedAt: t.completedAt
//       }))
//     });

//   } catch (error) {
//     console.error('Full history API error:', error);
//     return createError(res, { message: 'Server error' });
//   }
// });

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

// ⭐ GET My Business List
router.get(
  '/business/list',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.getMyBusinesses(req, res)
);

// ⭐ CREATE Business
router.post(
  '/business/create',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.createBusiness,
  (req, res) => controller.createBusiness(req, res)
);

// ⭐ UPDATE Business
router.put(
  '/business/update/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.createBusiness, // Reuse business validation for update
  (req, res) => controller.updateBusiness(req, res)
);

// ⭐ DELETE Business
router.delete(
  '/business/delete/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.deleteBusiness(req, res)
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
/**
 * @route POST api/queue/submit-contact
 * @description Submit contact form
 * @returns JSON
 * @access public
 */
router.post(
  '/submit-contact',
  validations.submitContact,
  (req, res) => {
    controller.submitContact(req, res);
  },
);

// --- Desk CRUD Routes ---

/**
 * @route POST api/queue/desk/create
 */
router.post(
  '/desk/create',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.createDesk,
  (req, res) => controller.createDesk(req, res)
);

/**
 * @route PUT api/queue/desk/update/:id
 */
router.put(
  '/desk/update/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.updateDesk,
  (req, res) => controller.updateDesk(req, res)
);

/**
 * @route DELETE api/queue/desk/delete/:id
 */
router.delete(
  '/desk/delete/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.deleteDesk(req, res)
);

/**
 * @route GET api/queue/desk/details/:id
 */
router.get(
  '/desk/details/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.getDeskDetails(req, res)
);

/**
 * @route GET api/queue/desk/list
 */
router.get(
  '/desk/list',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.getDeskList(req, res)
);

/**
 * @route GET api/queue/desk/assigned-queues
 */
router.get(
  '/desk/assigned-queues',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => controller.getAssignedQueues(req, res)
);

/**
 * @route POST api/queue/desk-login-admin
 * @description desk login from admin panel
 */
router.post(
  '/desk-login-admin',
  (req, res) => {
    controller.deskLoginAdmin(req, res);
  },
);

module.exports = router;
