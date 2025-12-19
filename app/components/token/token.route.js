const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const controller = require('./token.controller');
const validations = require('./token.validations');
const Queue = require('../../models/queue');
const { createError, createResponse, sendNotificationNewToken } = require('../../utils/helpers');
const Token = require('../../models/token');
const User = require('../../models/user');
const service = require('../../services/tokenService');
const { hashSync, genSaltSync } = require('bcryptjs');
const Category = require('../../models/category');
const twilio = require("twilio");
const { Op } = require('sequelize');
const { default: isEmail } = require('validator/lib/isEmail');

const client = new twilio(
  process.env.SMS_TWILIO_ACCOUNT_SID,
  process.env.SMS_TWILIO_AUTH_TOKEN
);


/**
 * @route GET api/token/list
 * @description get token
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
      const { queueId, categoryId } = req.body;
      if (!queueId || !categoryId) {
        return createError(res, { message: 'Queue ID or Category ID is required' });
      }
      if (isNaN(categoryId)) {
        console.error('Invalid categoryId received:', categoryId);
        return createError(res, { message: 'Category ID must be a number' });
      }
      // Fetch queue and verify ownership
      const queue = await service.getSingleQueuenextToken(req.user.id, queueId);

      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }

      // Check if customer already has a PENDING or SKIPPED token for this queue and category
      const existingToken = await Token.findOne({
        where: {
          queueId: queue.id,
          customerId: req.user.id,
          categoryId: parseInt(categoryId),
          status: ['PENDING', 'SKIPPED']
        }
      });

      if (existingToken) {
        return createError(res, "Your token is already generated");
      }

      // Find the maximum tokenNumber for this category (all queues, all customers)
      const maxToken = await Token.max('tokenNumber', {
        where: {
          categoryId: parseInt(categoryId)
        }
      });
      const nextTokenNumber = maxToken ? maxToken + 1 : 1;

      const token = {
        queueId: queue.id,
        queueName: queue.name,
        tokenNumber: nextTokenNumber,
        customerId: req.user.id,
        categoryId: parseInt(categoryId),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log(req.user);

      // Save token
      const savedToken = await Token.create(token);
      await sendNotificationNewToken(queue.user.fcmToken, queue.name, nextTokenNumber)
      return createResponse(res, 'ok', 'Token generated successfully', savedToken);

    } catch (e) {
      console.error('Generate token error:', e.message, e.stack);
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
      const { joinMethods, joinCode, link, lat, long, queueId, categoryId } = req.body;
      if (!joinMethods) {
        return createError(res, { message: 'joinMethods is required' });
      }
      if (joinMethods === 'private' && !joinCode) {
        return createError(res, { message: 'joinCode is required' });
      }

      if (joinMethods === 'link') {
        if (!link) {
          return createError(res, { message: 'link is required' });
        }
        const parsedUrl = new URL(link);
        const extractedQueueId = parsedUrl.searchParams.get("queueId");
        const extractedCategoryId = parsedUrl.searchParams.get("categoryId");
        if (!extractedQueueId || !extractedCategoryId) {
          return createError(res, { message: 'Invalid link provided' });
        }
      }
      if (joinMethods === 'location') {
        if (!lat || !long) {
          return createError(res, { message: 'lat & long required' });
        }
        const searchLat = parseFloat(lat);
        const searchLong = parseFloat(long);
        if (!searchLat || !searchLong) {
          return createError(res, { message: 'Invalid lat & long provided' });
        }
      }
      if (joinMethods === 'qr' && !queueId && !categoryId) {
        return createError(res, { message: 'Queue ID or Category ID is required' });
      }
      if (categoryId && isNaN(categoryId)) {
        return createError(res, { message: 'Category ID must be a number' });
      }

      const queue = await service.getSingleQueueByJoinMethod(req.user.id, { joinMethods, joinCode, link, lat, long, queueId, categoryId });
      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }
      let existingToken = await Token.findOne({
        where: {
          queueId: queue.id,
          customerId: req.user.id,
          categoryId: parseInt(queue.category),
          status: ['PENDING', 'SKIPPED'],  // Changed: Include SKIPPED
        },
      });


      if (!existingToken) {
        return createResponse(res, 'not ok', 'No token found for this queue and category', {
          "queueId": queue.id,
          "queueName": queue.name,
          "tokenRange": `${queue.start_number} to ${queue.end_number}`,
          "category": queue.category
        });
      }
      if (existingToken.status === 'SKIPPED') {
        const currentServingToken = await service.getNextToken(req.user.id, queue.id, null);  // Reuse existing service
        const nextAvailableNumber = currentServingToken ? currentServingToken + 1 : existingToken.tokenNumber;

        await existingToken.update({
          status: 'PENDING',
          tokenNumber: nextAvailableNumber,
          updatedAt: new Date(),
        });

        existingToken = await Token.findOne({
          where: { id: existingToken.id },
          include: [{ model: Queue, as: 'queue' }]
        });
        return createResponse(res, 'ok', 'Skipped token re-queued successfully', {
          ...existingToken.toJSON(),
          message: 'Your skipped token has been re-queued after current serving.'
        });
      }
      return createResponse(res, 'ok', 'Token found', {
        queueId: existingToken.queueId,
        tokenNumber: existingToken.tokenNumber,
        userId: existingToken.customerId,
        status: existingToken.status,
        createdAt: existingToken.createdAt,
        categoryId: existingToken.categoryId,
      }, 200);
    } catch (e) {
      console.error('Check token error:', e.message, e.stack);
      return createError(res, e);
    }
  }
);

router.post('/generate-token-web', async (req, res) => {
  try {
    const { queueId, categoryId, firstName, lastName, identifier } = req.body;

    // Validation
    if (!queueId || !categoryId || !firstName || !lastName || !identifier) {
      return createError(res, { message: 'All fields are required' });
    }

    if (isNaN(categoryId)) {
      return createError(res, { message: 'Category ID must be a number' });
    }
    const isEmail = identifier.includes('@')
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return createError(res, { message: 'Please enter valid email address' });
      }
    } else {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(identifier)) {
        return createError(res, { message: 'Valid 10-digit mobile number required' });
      }
    }
    // Find or create user
    let user = await User.findOne({
      // where: isEmail ? { Email: identifier } : { mobileNumber: identifier }
        where: { [isEmail ? 'Email' : 'MobileNumber']: identifier }
    });  
    const generatedEmail = `guest_${firstName.toLowerCase()}.${lastName.toLowerCase()}@queueapp.com`.replace(/\s+/g, '');

    if (!user) {
      const randomPassword = require('crypto').randomBytes(8).toString('hex');
      const hashedPassword = hashSync(randomPassword, genSaltSync(8));

      user = await User.create({
        firstName,
        lastName,
        email:isEmail ? identifier : generatedEmail,
        NormalizedEmail: generatedEmail.toUpperCase(),
        password: hashedPassword,
        mobileNumber: isEmail ? null : identifier,
        role: 'customer',
        isEmailVerified: false,
        isOnboarding: false,
      });
    }

    const customerId = user.id;

    // Fetch queue with host
    const queue = await Queue.findByPk(queueId, {
      include: [{ model: User, as: 'user', attributes: ['fcmToken'] }]
    });

    if (!queue) {
      return createError(res, { message: 'Queue not found' });
    }

    // Prevent duplicate token
    const existingToken = await Token.findOne({
      where: {
        queueId: queue.id,
        customerId,
        categoryId: parseInt(categoryId),
        status: ['PENDING', 'SKIPPED']
      }
    });

    if (existingToken) {
      return createError(res, { message: 'You already have an active token for this queue' });
    }

    // Get next token number (global per category)
    const maxToken = await Token.max('tokenNumber', {
      where: { categoryId: parseInt(categoryId) }
    });
    const nextTokenNumber = maxToken ? maxToken + 1 : 1;

    // Create token
    const token = await Token.create({
      queueId: queue.id,
      queueName: queue.name,
      tokenNumber: nextTokenNumber,
      customerId,
      categoryId: parseInt(categoryId),
      status: 'PENDING',
    });

    // Fetch category name
    const category = await Category.findByPk(parseInt(categoryId));
    const categoryName = category?.name || 'General';

    // Format time safely
    const formatTime = (t) => (t ? t.toString().slice(0, 5) : 'N/A');
    const startTime = queue.startTime ? formatTime(queue.startTime) : '09:00';
    const endTime = queue.endTime ? formatTime(queue.endTime) : '18:00';
    const trackingLink = `${process.env.WEB_JOIN_DOMAIN}/tokenstatus/${token.id}`
    console.log(trackingLink, "trackingLink");

    // Today's date
    const today = new Date().toLocaleDateString('en-GB'); // e.g., 10/12/2025

    // Professional English SMS
    const smsMessage = `Your Token is Ready! ✅

${queue.name}
🔢 Token No: ${nextTokenNumber}
 Date: ${today}
⏰ Time: ${startTime} - ${endTime}

👀 Track live status:
${trackingLink}

Please arrive on time.

Thank you! 🙏`;

    // Send SMS via Twilio
    try {
      const message = await client.messages.create({
        body: smsMessage,
        to: `+91${mobile}`,
        from: process.env.SMS_TWILIO_PHONE_NUMBER
      });
      console.log('SMS Sent ✅ SID:', message.sid);
    } catch (smsError) {
      console.error('SMS Failed:', smsError.message);
      // Don't block token generation if SMS fails
    }

    // Optional: Enhanced FCM to host
    try {
      await sendNotificationNewToken(
        queue.user?.fcmToken,
        queue.name,
        nextTokenNumber,
        categoryName
      );
    } catch (fcmError) {
      console.error('FCM Error:', fcmError.message);
    }

    // Success response
    return createResponse(res, 'ok', 'Token generated successfully', {
      tokenId: token.id,
      tokenNumber: nextTokenNumber,
      queueName: queue.name,
      category: categoryName,
      date: today,
      timeSlot: `${startTime} - ${endTime}`,
      smsSent: true
    });

  } catch (e) {
    console.error('Generate token error:', e.message);
    return createError(res, { message: 'Something went wrong', error: e.message });
  }
});

/**
 * @route   GET /api/public/queue/:id
 * @desc    Get queue details for public (no login required)
 * @access  Public
 */

router.get('/queue/:queueId/:categoryId', async (req, res) => {
  try {
    const { queueId, categoryId } = req.params;

    if (!queueId || isNaN(queueId)) {
      return createError(res, { message: 'Invalid queue ID' });
    }

    const queue = await Queue.findByPk(queueId, {
      attributes: [
        'id',
        'name',
        'start_number',
        'end_number',
        'status',
        'category',
        'isActive',
      ],
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false,
          as: 'categ',
        },
        {
          model: User,                    // ← Add this
          as: 'user',                    // ← Match the alias you defined
          attributes: ['businessName', 'businessAddress', 'mobileNumber'], // Only needed fields
          required: true,                 // Queue must have an owner
        },
      ],
    });
    console.log(User, "testuser");

    console.log(queue.toJSON().isActive, "tokenqueue");
    if (!queue) {
      return createError(res, { message: 'Queue not found' });
    }

    console.log(queue.isActive, "isActive123");

    if (!queue.isActive) {
      return createError(res, { message: 'Queue is closed or not active' });
    }


    return createResponse(res, 'ok', 'Queue found', {
      id: queue.id,
      name: queue.name,
      categoryName: queue.categ?.name || 'General',
      categoryId: queue.categ?.id,
      start_number: queue.start_number,
      end_number: queue.end_number,
      status: queue.status,
      // Add business details
      businessName: queue.user?.businessName || null,
      businessAddress: queue.user?.businessAddress || null,
      mobileNumber: queue.user.mobileNumber || null

    });
  } catch (error) {
    console.error('Public queue details error:', error);
    return createError(res, { message: 'Server error' });
  }
});


/**
 * @route   GET /api/public/queue/:queueId/history
 * @desc    Check if this mobile already has an active (PENDING) token in this queue
 * @access  Public (no login required)
 */
/**
 * @route DELETE api/token/delete/:id
 * @description Mark a token as CANCELLED by updating its status
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
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      // Validate token ID
      if (!id || isNaN(id)) {
        return createError(res, { message: 'Valid token ID is required' }, 400);
      }

      // Find the token
      const token = await Token.findOne({
        where: { id: parseInt(id) },
      });

      if (!token) {
        return createError(res, { message: 'Token not found' }, 404);
      }

      // Check if token is already CANCELLED
      if (token.status === 'CANCELLED') {
        return createError(res, { message: 'Token is already cancelled' }, 400);
      }

      // Check if token is COMPLETED (optional: prevent cancelling completed tokens)
      if (token.status === 'COMPLETED') {
        return createError(res, { message: 'Cannot cancel a completed token' }, 400);
      }

      // Update token status to CANCELLED
      await token.update({
        status: 'CANCELLED',
        updatedAt: new Date(),
      });

      // Return success response, excluding updatedAt
      return createResponse(res, 'ok', 'Token cancelled successfully', {
        id: token.id,
        queueId: token.queueId,
        queueName: token.queueName,
        tokenNumber: token.tokenNumber,
        customerId: token.customerId,
        categoryId: token.categoryId,
        status: token.status,
        createdAt: token.createdAt,
      });
    } catch (e) {
      console.error('Cancel token error:', e.message, e.stack);
      return createError(res, { message: e.message || 'Failed to cancel token' }, 500);
    }
  }
);

router.get(
  '/token-counts/count',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getQueueTokenCounts(req, res);
  }
);

router.get(
  '/servicing/:queueId',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getServicingTokens(req, res);
  }
);

/**
 * @route POST api/token/skip/:id
 * @description Skip a token by updating its status to SKIPPED
 * @returns JSON
 * @access public
 */
router.post(
  '/skip',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  async (req, res) => {
    controller.skipTokens(req, res);
  }
);


router.get(
  '/skippedTokens/:queueId',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getSkippedTokens(req, res);
  }
);


/**
 * @route POST api/token/recover-token
 * @description Recover a skipped token (set status back to PENDING + reassign token number)
 * @returns JSON
 * @access private (merchant only)
 */
router.post(
  '/recover-token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  controller.recoverSkippedToken
);
/**
 * @route POST api/token/complete
 * @description Complete (serve) one or more tokens
 * @body { tokenIds: [101, 102] }
 * @access Merchant only
 */
router.post(
  '/complete',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  controller.completeToken
);
router.get(
  '/completed/history',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  controller.getCompletedHistory
);

router.get(
  '/current/token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  controller.getCurrentToken
);

router.get('/tokenstatus/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = await Token.findByPk(tokenId, {
      attributes: ['id', 'tokenNumber', 'queueName', 'categoryId', 'createdAt', 'completedAt', 'status',],
      include: [
        {
          model: Queue,
          as: 'queue',
          attributes: ['name'],
          required: false
        }
      ]
    });

    if (!token) {
      return res.status(404).json({
        error: 'Token not found'
      });
    }

    const category = await Category.findByPk(token.categoryId, {
      attributes: ['name']
    });

    const currentServing = await Token.findOne({
      where: {
        categoryId: token.categoryId,
        status: 'SERVING'
      },
      order: [['tokenNumber', 'ASC']],
      attributes: ['tokenNumber']
    });
    // Tokens ahead
    const tokensAhead = await Token.count({
      where: {
        categoryId: token.categoryId,
        tokenNumber: { [Op.lt]: token.tokenNumber },
        status: 'PENDING'
      }
    });

    // Status message for frontend
    let statusMessage = '';
    if (token.status === 'COMPLETED') {
      statusMessage = '✅ Your token has been served.';
    } else if (token.status === 'SKIPPED') {
      statusMessage = '⏭️ Your token was skipped. Please contact the counter.';
    } else if (tokensAhead === 0) {
      statusMessage = "🎉 It's your turn! Please proceed now.";
    } else if (tokensAhead === 1) {
      statusMessage = "⏳ You're next! Get ready.";
    } else {
      statusMessage = `⏳ ${tokensAhead} tokens ahead of you.`;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB'); // 25/12/2025

    const queueStart = token.queue?.startTime || '10:00'; // HH:MM format (24-hour)
    const queueEnd = token.queue?.endTime || '18:00';

    // 24-hour to 12-hour with AM/PM
    const formatTo12Hour = (time24) => {
      if (!time24) return 'N/A';
      const [hour, minute] = time24.split(':');
      const h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    };
    const startTime12 = formatTo12Hour(queueStart);
    const endTime12 = formatTo12Hour(queueEnd);
    const timeSlot = `${formattedDate} ${startTime12} - ${endTime12}`;

    // Success response
    return createResponse(res, 'ok', 'Token status fetched successfully', {
      tokenNumber: token.tokenNumber,
      queueName: token.queueName || token.queue?.name || 'Unknown Queue',
      categoryName: category?.name || 'General',
      status: token.status,
      currentServingToken: currentServing?.tokenNumber || null,
      tokensAhead,
      statusMessage,
      timeSlot,
      updatedAt: token.updatedAt // optional: last update time
    });

  } catch (error) {
    console.error('Token status error:', error);
    return createError(res, { message: 'Something went wrong' });
  }
});
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
