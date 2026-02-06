const { createResponse, createError, sendNotificationNextToken } = require('../../utils/helpers');
const service = require('../../services/tokenService');
const { USER_ROLE_TYPES } = require('../../config/constants');
const Queue = require('../../models/queue');
const Token = require('../../models/token');
const User = require('../../models/user');
const moment = require('moment');
const { Op } = require('sequelize');
// tokens.controller.js
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../../firebase-service-account.json')),
  });
}



class TokenController {
  /**
   * @description get token list
   */
  async getTokenList(req, res) {
    try {
      const { user } = req;

      // If merchant, get all tokens from their queues (only PENDING and ACTIVE)
      if (user.role === 'merchant') {
        const { businessId } = req.query;
        const where = {
          '$queue.merchant$': user.id,
          status: { [Op.in]: ['PENDING', 'ACTIVE', 'SKIPPED'] }
        };

        if (businessId && businessId !== 'all') {
          where['$queue.businessId$'] = businessId;
        }

        const tokens = await Token.findAll({
          where,
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['firstName', 'lastName']
            },
            {
              model: Queue,
              as: 'queue',
              attributes: ['name', 'merchant']
            }
          ],
          order: [['createdAt', 'DESC']]
        });

        const formattedTokens = tokens.map(t => ({
          ...t.toJSON(),
          customerName: `${t.customer.firstName} ${t.customer.lastName}`.trim(),
          queueName: t.queue.name
        }));

        return createResponse(res, 'ok', 'Token list', formattedTokens);
      }

      // For customers, use existing service
      const items = await service.gettokenlist(user.id, user.role);
      return createResponse(res, 'ok', 'token list not found ', items);
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get Completed token list
   */
  async getCompletedTokenList(req, res) {
    try {
      const { user } = req;

      // If merchant, get completed tokens from their queues
      if (user.role === 'merchant') {
        const { businessId } = req.query;
        const where = {
          '$queue.merchant$': user.id,
          status: 'COMPLETED'
        };

        if (businessId && businessId !== 'all') {
          where['$queue.businessId$'] = businessId;
        }

        const tokens = await Token.findAll({
          where,
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['firstName', 'lastName']
            },
            {
              model: Queue,
              as: 'queue',
              attributes: ['name', 'merchant']
            }
          ],
          order: [['completedAt', 'DESC']]
        });

        const formattedTokens = tokens.map(t => ({
          ...t.toJSON(),
          customerName: `${t.customer.firstName} ${t.customer.lastName}`.trim(),
          queueName: t.queue.name
        }));

        return createResponse(res, 'ok', 'Completed tokens', formattedTokens);
      }

      // For customers, use existing service
      const items = await service.getCompletedTokens(user.id);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch token list' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get token list by queue
   */
  async getTokenListByQueueId(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const items = await service.getByQueueIds(user.id, queueId);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch token list by queueId' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description create queue item
   */
  async create(req, res) {
    try {
      const { user } = req;
      if (!(user.role === USER_ROLE_TYPES.CUSTOMER || user.role === USER_ROLE_TYPES.BOTH))
        return createError(res, { message: `You don't have access to create token, only customer can create token.` });

      const item = await service.create(user.id, req.body);
      if (item) return createResponse(res, 'ok', 'Token created successfully', item);
      else return createError(res, { message: 'Unable to create token' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get next token details
   */
  async getNextToken(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const { date } = req.query;
      const result = await service.getNextToken(user.id, queueId, date);
      if (result) return createResponse(res, 'ok', 'Next Token', { number: result });
      else return createError(res, { message: 'Unable to get next token number' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get item details
   */
  async getDetails(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const item = await service.getSingle(user.id, id);
      if (item) return createResponse(res, 'ok', 'Token', item);
      else return createError(res, { message: 'Token Item not found' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description Serve next token
   */
  async serveNextToken(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.body; // Expecting queueId in body

      if (!queueId) {
        return createError(res, { message: 'Queue ID is required' });
      }

      const token = await service.serveNext(user.id, queueId);

      if (token) {
        return createResponse(res, 'ok', 'Serving Token', token);
      } else {
        return createResponse(res, 'ok', 'No tokens available', null);
      }
    } catch (e) {
      return createError(res, e);
    }
  }

  async getServicingTokens(req, res) {
    try {
      const { user } = req;
      let { queueId } = req.params;

      let queue = await Queue.findByPk(queueId);

      // Fallback: If Queue not found and user is Desk, try to find a valid assigned queue
      if (!queue && user.role === 'desk') {
        const Desk = require('../../models/desk');
        const desk = await Desk.findByPk(user.id, {
          include: [{
            model: Queue,
            as: 'queues',
            where: { isActive: true },
            required: false
          }]
        });

        if (desk && desk.queues && desk.queues.length > 0) {
          queue = desk.queues[0]; // Pick the first available active queue
          queueId = queue.id;
        }
      }

      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }

      // Authorization Check
      let isAuthorized = false;
      if (user.role === 'desk') {
        if (user.queueId == queueId) {
          isAuthorized = true;
        } else {
          // Check if desk is mapped to this queue (multi-queue support)
          const Desk = require('../../models/desk');
          const count = await Desk.count({
            where: { id: user.id },
            include: [{
              model: Queue,
              as: 'queues',
              where: { id: queueId }
            }]
          });
          const countLegacy = await Desk.count({ where: { id: user.id, queueId: queueId } });

          if (count > 0 || countLegacy > 0) isAuthorized = true;
        }
      } else {
        // Merchant Check
        isAuthorized = queue.merchant === user.id;
      }

      if (!isAuthorized) {
        return createError(res, { message: 'Unauthorized to access this queue' }, 403);
      }

      // Include PENDING, SKIPPED, and ACTIVE tokens for the entire queue
      const tokens = await Token.findAll({
        where: {
          queueId: queueId,
          status: ['PENDING', 'SKIPPED', 'ACTIVE']
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'FirstName', 'LastName']
          },
          {
            model: Queue,
            as: 'queue',
            attributes: ['id', 'name']
          }
        ],
        // Sort by First Arrived (createdAt ASC) ensures FIFO
        order: [['createdAt', 'ASC']]
      });

      const enrichedTokens = (tokens || []).map(token => ({
        ...token.toJSON(),
        isSkipped: token.status === 'SKIPPED'
      }));
      return createResponse(res, 'ok', 'Servicing Tokens', enrichedTokens);
    } catch (e) {
      return createError(res, e);
    }
  }
  async getQueueTokenCounts(req, res) {

    try {
      const { category, merchantId, start_date, end_date, businessId } = req.query;
      const where = {};
      if (category) where.category = category;
      if (merchantId) where.merchant = merchantId;
      if (businessId && businessId !== 'all') where.businessId = businessId;
      if (start_date && end_date) {
        where.start_date = { [Op.lte]: new Date(end_date) };
        where.end_date = { [Op.gte]: new Date(start_date) };
      }

      const queues = await Queue.findAll({
        where,
        attributes: ['id', 'name', 'category', 'start_date', 'status', 'Desk', 'merchant'],
        raw: true
      });

      const result = await Promise.all(
        queues.map(async (queue) => {
          const tokenCount = await Token.count({ where: { queueId: queue.id } });
          return { ...queue, tokenCount };
        })
      );

      return res.json({ status: 'ok', message: 'Token counts', data: result });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  }
  async getSkippedTokens(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.params;

      const queue = await Queue.findByPk(queueId);
      if (!queue) {
        return createError(res, { message: 'Queue not found' });
      }

      const isAuthorized = user.role === 'desk'
        ? user.queueId == queueId
        : queue.merchant === user.id;

      if (!isAuthorized) {
        return createError(res, { message: 'Unauthorized to access this queue' }, 403);
      }

      const tokens = await Token.findAll({
        where: {
          queueId: queueId,
          status: 'SKIPPED'
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'FirstName', 'LastName']
          },
          {
            model: Queue,
            as: 'queue',
            attributes: ['id', 'name']
          }
        ],
        order: [['tokenNumber', 'ASC']]
      });

      const enrichedTokens = (tokens || []).map(token => ({
        ...token.toJSON(),
        isSkipped: true
      }));
      return createResponse(res, 'ok', 'Skipped Tokens', enrichedTokens);
    } catch (e) {
      return createError(res, e);
    }
  }
  /**
 * @description Skip a token by updating its status to SKIPPED
 */
  async skipTokens(req, res) {
    try {
      const { user } = req;
      const { tokenIds } = req.body;

      if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
        return createError(res, { message: 'Valid token IDs array is required' }, 400);
      }

      const updatedTokens = [];
      for (const id of tokenIds) {
        const tokenId = parseInt(id);
        if (isNaN(tokenId)) {
          continue;
        }

        const token = await Token.findOne({
          where: { id: tokenId },
          include: [
            {
              model: Queue,
              as: 'queue',
              attributes: ['id', 'merchant'],
            },
          ],
        });

        const isAuthorized = user.role === 'desk'
          ? user.queueId == token.queueId
          : token.queue.merchant === user.id;

        if (!token || !isAuthorized || ['SKIPPED', 'COMPLETED', 'CANCELLED'].includes(token.status)) {
          continue; // Skip invalid or unauthorized tokens
        }

        await token.update({
          status: 'SKIPPED',
          updatedAt: new Date(),
        });

        const updatedToken = await Token.findOne({
          where: { id: tokenId },
          include: [
            { model: User, as: 'customer', attributes: ['id', 'FirstName', 'LastName'] },
            { model: Queue, as: 'queue', attributes: ['id', 'name'] },
          ],
        });

        updatedTokens.push({
          id: updatedToken.id,
          queueId: updatedToken.queueId,
          queueName: updatedToken.queue.name,
          tokenNumber: updatedToken.tokenNumber,
          customerId: updatedToken.customerId,
          customerName: updatedToken.customer
            ? `${updatedToken.customer.FirstName} ${updatedToken.customer.LastName}`.trim()
            : 'Unknown Customer',
          categoryId: updatedToken.categoryId,
          status: updatedToken.status,
          createdAt: updatedToken.createdAt,
          updatedAt: updatedToken.updatedAt,
        });
      }

      if (updatedTokens.length === 0) {
        return createError(res, { message: 'No valid tokens to skip' }, 400);
      }

      return createResponse(res, 'ok', 'Tokens skipped successfully', updatedTokens);
    } catch (e) {
      console.error('Skip tokens error:', e.message, e.stack);
      return createError(res, { message: e.message || 'Failed to skip tokens' }, 500);
    }
  }
  /**
   * @description Recover a skipped token - set to PENDING and reassign next available token number
   */
  async recoverSkippedToken(req, res) {
    try {
      const { user } = req;
      const { tokenNumber } = req.body;
      console.log(tokenNumber, "tokenNumber1");


      if (!tokenNumber || isNaN(tokenNumber)) {
        return createError(res, { message: 'Valid tokenNumber is required' }, 400);
      }

      // Step 1: Find the SKIPPED token
      const token = await Token.findOne({
        where: {
          tokenNumber: parseInt(tokenNumber),
          status: 'SKIPPED'
        },
        include: [
          { model: Queue, as: 'queue', attributes: ['id', 'merchant', 'category'] }
        ]
      });

      const isAuthorized = user.role === 'desk'
        ? user.queueId == token.queueId
        : token.queue.merchant === user.id;

      if (!isAuthorized) {
        return createError(res, { message: 'Unauthorized' }, 403);
      }

      // if (token.queue.merchant !== user.id) {
      //   return createError(res, { message: 'Unauthorized' }, 403);
      // }

      // Step 2: Get current "now serving" token number
      const currentServingToken = await Token.findOne({
        where: {
          queueId: token.queueId,
          categoryId: token.categoryId,
          status: 'ACTIVE' // or use your logic for "now serving"
        },
        order: [['tokenNumber', 'DESC']]
      });

      // If no ACTIVE, find the highest PENDING token
      let nextTokenNumber;
      if (currentServingToken) {
        nextTokenNumber = currentServingToken.tokenNumber + 1;
      } else {
        const highestPending = await Token.findOne({
          where: {
            queueId: token.queueId,
            categoryId: token.categoryId,
            status: 'PENDING'
          },
          order: [['tokenNumber', 'DESC']]
        });
        nextTokenNumber = highestPending ? highestPending.tokenNumber + 1 : token.tokenNumber;
      }

      // Step 3: Update token
      await token.update({
        status: 'PENDING',
        tokenNumber: nextTokenNumber,
        updatedAt: new Date()
      });

      // Step 4: Return updated token
      const updatedToken = await Token.findOne({
        where: { id: token.id },
        include: [
          { model: User, as: 'customer', attributes: ['FirstName', 'LastName'] },
          { model: Queue, as: 'queue', attributes: ['name'] }
        ]
      });
      console.log(updatedToken, "updatedToken1");


      return createResponse(res, 'ok', 'Token recovered and re-queued', {
        id: updatedToken.id,
        oldTokenNumber: parseInt(tokenNumber),
        newTokenNumber: updatedToken.tokenNumber,
        status: 'PENDING',
        // customerName: `${updatedToken.customer.FirstName} ${updatedToken.customer.LastName}`.trim()
      });

    } catch (e) {
      console.error('Recover error:', e);
      return createError(res, { message: e.message || 'Failed to recover token' });
    }
  }

  /**
   * @description Complete token(s) - supports both single and multiple
   */
  async completeToken(req, res) {
    try {
      const { user } = req;
      const { tokenId, tokenIds } = req.body;

      const ids = tokenId ? [tokenId] : Array.isArray(tokenIds) ? tokenIds : [];

      if (ids.length === 0) {
        return createError(res, { message: "tokenId or tokenIds array is required" }, 400);
      }

      const completed = [];
      const errors = [];

      for (let id of ids) {

        const token = await Token.findOne({
          where: { id },
        });

        if (!token) {
          errors.push({ id, error: "Token not found" });
          continue;
        }
        const isAuthorized = user.role === 'desk'
          ? user.queueId == token.queueId
          : true; // Merchant check already covered by middleware if we want, but merchantId isn't on Token easily without include

        if (!isAuthorized) {
          errors.push({ id, error: "Unauthorized" });
          continue;
        }

        // 1️⃣ Mark current token as completed
        await token.update({
          status: "COMPLETED",
          completedAt: new Date()
        });

        completed.push({
          id: token.id,
          tokenNumber: token.tokenNumber,
          status: "COMPLETED"
        });

        // 2️⃣ Activate next PENDING token
        const nextToken = await Token.findOne({
          where: {
            queueId: token.queueId,
            categoryId: token.categoryId,
            status: "PENDING"
          },
          order: [["tokenNumber", "ASC"]],
        });

        if (nextToken) {
          await nextToken.update({ status: "ACTIVE" });
        }

        // 3️⃣ Send notification logic
        await sendNotificationNextToken(token.queueId, token.categoryId);
      }

      return createResponse(res, "ok", "Token(s) completed successfully", { completed, errors });

    } catch (e) {
      console.error(e.message);
      return createError(res, { message: "Server error" });
    }
  }


  async getCompletedHistory(req, res) {
    try {
      const { user } = req;
      const { queueId, categoryId, businessId } = req.query;

      // Build where clause dynamically
      const whereClause = {
        status: 'COMPLETED',
        '$queue.merchant$': user.id
      };

      // Add businessId filter only if provided
      if (businessId && businessId !== 'all') {
        whereClause['$queue.businessId$'] = businessId;
      }

      // Add queueId filter only if provided
      if (queueId) {
        whereClause.queueId = queueId;
      }

      // Add categoryId filter only if provided
      if (categoryId) {
        whereClause.categoryId = parseInt(categoryId);
      }

      const tokens = await Token.findAll({
        where: whereClause,
        include: [
          { model: User, as: 'customer', attributes: ['firstName', 'lastName'] },
          { model: Queue, as: 'queue', attributes: ['id', 'name', 'merchant', 'businessId'] }
        ],
        order: [['completedAt', 'DESC']],
        limit: 50
      });

      const history = tokens.map(t => ({
        id: t.id,
        tokenNumber: t.tokenNumber,
        name: `${t.customer.firstName} ${t.customer.lastName}`.trim(),
        service: t.queue.name,
        completedAt: t.completedAt
      }));

      return createResponse(res, 'ok', 'Completed History', { data: history });
    } catch (e) {
      return createError(res, e);
    }
  }

  async getCurrentToken(req, res) {
    try {
      const { queueId, categoryId } = req.query;

      if (!queueId || !categoryId) {
        return createError(res, { message: "queueId and categoryId are required" }, 400);
      }
      const activeToken = await Token.findOne({
        where: {
          queueId: parseInt(queueId),
          categoryId: parseInt(categoryId),
          status: "ACTIVE"
        },
        include: [
          {
            model: User,
            as: "customer",
            attributes: ["firstName", "lastName", "fcmToken"]
          },
          {
            model: Queue,
            as: "queue",
            attributes: ["name"]
          }
        ],
        order: [["tokenNumber", "ASC"]]
      });

      // 2. Next 3 upcoming tokens (PENDING)
      const upcomingTokens = await Token.findAll({
        where: {
          queueId: parseInt(queueId),
          categoryId: parseInt(categoryId),
          status: "PENDING"
        },
        include: [
          {
            model: User,
            as: "customer",
            attributes: ["firstName", "lastName"]
          }
        ],
        order: [["tokenNumber", "ASC"]],
        limit: 5
      });

      // Response
      const response = {
        current: activeToken ? {
          tokenNumber: activeToken.tokenNumber,
          customerName: activeToken.customer
            ? `${activeToken.customer.firstName} ${activeToken.customer.lastName}`.trim()
            : "N/A",
          service: activeToken.queue?.name || "Unknown",
          since: activeToken.updatedAt
        } : null,

        upcoming: upcomingTokens.map((t, index) => ({
          position: index + 1,
          tokenNumber: t.tokenNumber,
          customerName: t.customer
            ? `${t.customer.firstName} ${t.customer.lastName}`.trim()
            : "N/A"
        }))
      };

      if (upcomingTokens && upcomingTokens.length) {
        await sendNotificationNextToken(upcomingTokens[0].queueId, upcomingTokens[0].categoryId);
      }
      return createResponse(res, "ok", "Current token fetched", response);

    } catch (error) {
      console.error("Error in getCurrentToken:", error.message);
      return createError(res, { message: "Server error" });
    }
  }
  //  async sendNotificationNextToken(queueId, categoryId) {
  //   try {
  //     const tokens = await Token.findAll({
  //       where: {
  //         queueId,
  //         categoryId,
  //         // isSkipped: false,
  //         status: 'PENDING',
  //       },
  //       include: [{ model: User, attributes: ['fcmToken', 'firstName', 'lastName'], as: 'customer' }],
  //       order: [['tokenNumber', 'ASC']],
  //     });

  //     console.log(tokens, "tokez123");

  //     // if (tokens.length < 3) {
  //     //   return res.json({ message: 'Less than 3 tokens, no notification sent' });
  //     // }

  //     const thirdToken = tokens[0];
  //     const user = thirdToken.customer;
  //     console.log(user, "userfcm123");

  //     if (!user?.fcmToken) {
  //       return { message: 'No FCM token for user', tokenNumber: thirdToken.tokenNumber };
  //     }

  //     const message = {
  //       token: user.fcmToken,
  //       notification: {
  //         title: 'Your turn has arrived!',
  //         body: `Token ${thirdToken.tokenNumber} - Please come now!`,
  //       },
  //       data: {
  //         type: 'turn_approaching',
  //         tokenNumber: thirdToken.tokenNumber.toString(),
  //         queueId: queueId.toString(),
  //       },
  //       android: {
  //         priority: 'high',
  //         notification: {
  //           sound: 'default',
  //           channelId: 'queue_alert',
  //         },
  //       },
  //     };


  //     await admin.messaging().send(message);
  //     return {
  //       success: true,
  //       notifiedToken: thirdToken.tokenNumber,
  //       customer: `${user.firstName} ${user.lastName}`,
  //     };

  //   } catch (error) {
  //     console.error('FCM Error:', error.message);
  //     return { error: error.message };
  //   }
  // }

  /**
   * @description get merchant analytics
   */
  async getMerchantAnalytics(req, res) {
    try {
      const { user } = req;
      const { businessId } = req.query; // Added businessId from query
      const todayStart = moment().startOf('day').toDate();
      const todayEnd = moment().endOf('day').toDate();

      // Find all queues for this merchant (optionally filtered by businessId)
      const whereClause = { merchant: user.id };
      if (businessId && businessId !== 'all') {
        whereClause.businessId = businessId;
      }

      const queues = await Queue.findAll({
        where: whereClause,
        attributes: ['id']
      });
      const queueIds = queues.map(q => q.id);

      if (queueIds.length === 0) {
        return createResponse(res, 'ok', 'No analytics found', {
          summary: { totalServed: 0, avgWaitTime: 0, completionRate: 0, peakHour: 'N/A' },
          history: []
        });
      }

      // Fetch all tokens created today (Availability / Demand)
      const tokensCreatedToday = await Token.findAll({
        where: {
          queueId: { [Op.in]: queueIds },
          createdAt: { [Op.between]: [todayStart, todayEnd] }
        }
      });
      const totalCreated = tokensCreatedToday.length;

      // Fetch tokens SERVED (completed) today, regardless of when they were created
      // This ensures we count work done today even on backlog items
      const tokensServedToday = await Token.findAll({
        where: {
          queueId: { [Op.in]: queueIds },
          status: 'COMPLETED',
          completedAt: { [Op.between]: [todayStart, todayEnd] }
        }
      });
      const totalServed = tokensServedToday.length;

      console.log('Total Created Today:', totalCreated);
      console.log('Total Served Today:', totalServed);

      // Completion Rate: (Served Today / Created Today) * 100
      // If no new tokens created but we served backlog customers, rate should be 100% (or reflects high productivity)
      const completionRate = totalCreated > 0 ? Math.round((totalServed / totalCreated) * 100) : (totalServed > 0 ? 100 : 0);

      // Avg Wait Time (using proxy: completedAt - createdAt for tokens SERVED today)
      // let totalWaitTime = 0;
      // tokensServedToday.forEach(t => {
      //   if (t.createdAt && t.completedAt) {
      //     const diff = moment(t.completedAt).diff(moment(t.createdAt), 'minutes');
      //     totalWaitTime += diff;
      //   }
      // });
      // const avgWaitTime = totalServed > 0 ? Math.round(totalWaitTime / totalServed) : 0;
      const avgWaitTime = 15; // Static 15 min as requested

      // Peak Hour calculation based on Service Time (Throughput)
      // This shows when the merchant was busiest serving customers
      const hourCounts = {};
      tokensServedToday.forEach(t => {
        if (t.completedAt) {
          const hour = moment(t.completedAt).format('hh:00 A');
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      let peakHour = 'N/A';
      let maxCount = 0;
      for (const hour in hourCounts) {
        if (hourCounts[hour] > maxCount) {
          maxCount = hourCounts[hour];
          peakHour = hour;
        }
      }

      // History: Recent 50 served/skipped/cancelled tokens
      const historyTokens = await Token.findAll({
        where: {
          queueId: { [Op.in]: queueIds },
          status: { [Op.in]: ['COMPLETED', 'SKIPPED', 'CANCELLED'] }
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 50
      });

      const history = historyTokens.map(t => ({
        id: t.id,
        tokenNumber: t.tokenNumber,
        customerName: t.customer ? `${t.customer.firstName} ${t.customer.lastName}`.trim() : 'Guest',
        completedAt: t.completedAt || t.updatedAt,
        status: t.status
      }));

      return createResponse(res, 'ok', 'Analytics fetched', {
        summary: { totalServed, avgWaitTime, completionRate, peakHour },
        history
      });

    } catch (e) {
      console.error('Merchant Analytics Error:', e);
      return createError(res, e);
    }
  }
}

const tokenController = new TokenController();
module.exports = tokenController;
