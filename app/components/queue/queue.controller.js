const { createResponse, createError } = require('../../utils/helpers');
const problemAndSolutionService = require('./../../services/problemAndSolutionService');
const categoryService = require('./../../services/categoryService');
const deskService = require('./../../services/deskService');
const service = require('./../../services/queueService');
const { PS_TYPES, USER_ROLE_TYPES } = require('../../config/constants');
const queue = require( '../../models/queue' );
const Queue = require( '../../models/queue' );
const moment = require('moment');
const Desk = require( '../../models/desk' );

class QueueController {
  /**
   * @description get queue list
   */
  async getQueueList(req, res) {
    
    try {
      const { user } = req;
      const { category, merchantId, start_date, end_date, coordinates } = req.query;
      const items = await service.getByFilter(category, merchantId, start_date, end_date, coordinates);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch queue list' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get completed queue list
   */
  async getCompletedQueueList(req, res) {
    try {
      const { user } = req;
      const items = await service.getCompletedQueues(user.id);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch queue list' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get queue list
   */
  async getQueueListByUserId(req, res) {
    try {
      const { user } = req;
      const items = await service.get(user.id);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch queue List' });
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
      if (!(user.role === USER_ROLE_TYPES.MERCHANT || user.role === USER_ROLE_TYPES.BOTH))
        return createError(res, { message: `You don't have access to create queue, only merchant can create queue.` });

      const payload = {
        ...req.body,
        merchant: user.id,
      };

      const item = await service.create(user.id, payload);
      if (item) return createResponse(res, 'ok', 'Queue created successfully', item);
      else return createError(res, { message: 'Unable to create queue' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description create queue category add bulk items
   */
  async createCategory(req, res) {
    try {
      const { user } = req;
      const { categories } = req.body;
      const items = await categoryService.insertMany(categories);
      if (items) return createResponse(res, 'ok', 'Queue Categories created successfully', items);
      else return createError(res, { message: 'Unable to create queue categories' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get queue categories list
   */
  async getCategories(req, res) {
    try {
      const { user } = req;
      const items = await categoryService.get();
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch categories' });
    } catch (e) {
      return createError(res, e);
    }
  }
/**
 * @description Get desks by categoryId
 */
async getDesksByCategory(req, res) {
  try {
    const { categoryId } = req.params;

    // ← desks is an ARRAY
    const desks = await deskService.getByCategory(categoryId);

    // ← Check if we got data
    if (desks && desks.length > 0) {
      const list = desks.map(d => ({
        key: d.id,
        value: d.name,
      }));
      return createResponse(res, 'ok', 'Desks', list);
    }

    // ← No desks found
    return createError(res, { message: 'No desks found for this category' });
  } catch (e) {
    console.error('getDesksByCategory error:', e);
    return createError(res, e);
  }
}
  /**
   * @description create problems/solutions based on type add bulk items
   */
  async createProbSol(req, res) {
    try {
      const { user } = req;
      const { type } = req.params;
      const { categoryId, queueId } = req.body;
      const { problems, solutions } = req.body;

      let payload = {};
      if (Number(type) === PS_TYPES.PROBLEMS) payload = problems;
      else payload = solutions;
      const item = await problemAndSolutionService.insertMany(user.id, type, queueId, payload, categoryId);
      if (item) return createResponse(res, 'ok', 'Queue Prob/Sol created successfully', item);
      else return createError(res, { message: 'Unable to create queue prob/sol' },);
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get queue problem/solution list based on type
   * type 1: problems; 2: solutions
   */
  async getProbSolList(req, res) {
    try {
      const { user } = req;
      const { type } = req.params;
      const items = await problemAndSolutionService.getByType(type);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch data' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get queue desks list
   */
  async getDesks(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const items = await deskService.get(queueId);
      if (items) return createResponse(res, 'ok', 'List', items);
      else return createError(res, { message: 'Unable to fetch desks' });
    } catch (e) {
      return createError(res, e);
    }
  }

  /**
   * @description get next desk details
   */
  async getNextDesk(req, res) {
    try {
      const { user } = req;
      const { queueId } = req.params;
      const result = await deskService.getNextDesk(queueId);
      if (result) return createResponse(res, 'ok', 'Next Desk No', { number: result });
      else return createError(res, { message: 'Unable to get next desk number' });
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
      const item = await service.getSingleQueue(user.id, id);
      if (item) return createResponse(res, 'ok', 'Queue', item);
      else return createError(res, { message: 'Queue Item not found' });
    } catch (e) {
      return createError(res, e);
    }
  }


  async cancelQueue (req, res) {
  try {
    const { id } = req.params;
    const { cancelled_comment } = req.body;
    const userId = req.user.id; // Assuming req.user contains the authenticated user's data from passport

    // Find the queue
    const queue = await Queue.findByPk(id);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Check if queue is already canceled
    if (queue.isCancelled) {
      return res.status(400).json({ message: 'Queue is already canceled' });
    }

    // Current date and time in UTC (e.g., 2025-10-09 10:21:00 UTC from your example, adjusted to current time)
    const currentUtcTime = moment().utc().toDate();

    // Update cancellation fields to match the example
    await queue.update({
      isCancelled: true,
      cancelledBy: userId,
      cancelled_date: currentUtcTime,
      cancelled_comment: cancelled_comment || null,
      status: 2, // Assuming 2 represents "CANCELED" (adjust based on your status mapping)
      deletedAt: currentUtcTime, // For soft delete (paranoid: true)
    });

    return res.status(200).json({ message: 'Queue canceled successfully' });
  } catch (error) {
    console.error('Error canceling queue:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

  /**
   * @description Sign in with email and password
   */
  async deskLogin(req, res) {
    try {
      const { queueId } = req.params;
      const desk = await deskService.validateDeskCredential(queueId, req.body);
      if (desk) {
        createResponse(res, 'ok', 'Desk Login successful', desk);
      } else {
        createError(res, {}, { message: 'Invalid Credentials' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  // ✅ Guest join a queue
       // for tracking link
async guestJoin (req, res)  {
  try {
    const queueId = req.params.id;

    // 1. Validate queue
    const queue = await queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, message: "Queue not found" });
    }
    if (queue.status !== "active") {
      return res.status(400).json({ success: false, message: "Queue not active" });
    }

    // 2. Increment last_token_number
    queue.last_token_number = (queue.last_token_number || 0) + 1;
    await queue.save();

    // 3. Create new Token (Queue Slot)
    const trackingToken = shortid.generate(); // e.g., abc123
    const newToken = await Token.create({
      queue_id: queueId,
      token_no: queue.last_token_number,
      status: "waiting",
      join_type: "guest",
      tracking_token: trackingToken
    });

    // 4. Compute current_serving (smallest active called token or last done +1)
    const servingToken = await Token.findOne({
      queue_id: queueId,
      status: "called"
    }).sort({ token_no: 1 });

    const current_serving = servingToken ? servingToken.token_no : 1;

    // 5. Compute people_ahead (waiting tokens before mine)
    const people_ahead = await Token.countDocuments({
      queue_id: queueId,
      status: "waiting",
      token_no: { $lt: newToken.token_no }
    });

    // 6. ETA (basic formula: people_ahead * avg_service_time)
    const avgServiceTime = queue.avg_service_time || 5; // minutes (default)
    const eta = people_ahead * avgServiceTime + " minutes";

    // 7. Response
    return res.json({
      success: true,
      data: {
        token_no: newToken.token_no,
        queue_id: queueId,
        tracking_link: `/track/${queueId}/${trackingToken}`,
        current_serving,
        people_ahead,
        eta
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

}

const queueController = new QueueController();
module.exports = queueController;
