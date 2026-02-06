const Token = require('../models/token');
const { getNextNumber } = require('../utils/helpers');
const RepositoryWithUserService = require('./repositoryWithUserService');
const queueService = require('./queueService');
const { isEmpty } = require('../utils/validator');
const { TOKEN_STATUS } = require('../config/constants');

const validateTokenInputs = (token) => {
  try {
    if (!token) throw Error('Token data is required');
    else if (!token.queue) throw Error('Token queue Id is required');
    else if (!token.date) throw Error('Token date is required');
    else if (!token.number) throw Error('Token number is required');
    else if (!token.problemSolutions || token.problemSolutions.length === 0)
      throw Error('ProblemSolutions data is required');
    else if (
      token.problemSolutions.length !==
      token.problemSolutions.filter(
        (value, index, self) => self.findIndex((x) => x.problem.id === value.problem.id) === index,
      ).length
    ) {
      throw Error('Only unique problems are allowed');
    }
    if (token.isPostponed) {
      if (!token.postponed_date) throw Error('Postponed Date is required for postponed token');
      else if (token.isPostponed && isEmpty(token.postponed_reason))
        throw Error('Postponed Reason is required for postponed token');
    }
    if (token.isServed) {
      if (!token.servingStartedAt) throw Error('Serving start time must be defined');
      else if (!token.servingCompletedAt) throw Error('Serving completion time must be defined');
      else if (isEmpty(token.servedByDesk)) throw Error('Serving Desk is required');
    }
    if (token.isSkipped) {
      if (!token.skippedAt) throw Error('Skipped timing is required');
      else if (isEmpty(token.skippedByDesk)) throw Error('Skipped by Desk is required');
    }
    if (token.isOptedOut) {
      if (!token.optedOutOn) throw Error('Opted Out timing is required');
      else if (isEmpty(token.optedOutReason)) throw Error('Opted Out Reason is required');
    }

    for (let i = 0; i < token.problemSolutions.length; i++) {
      const parent_item = token.problemSolutions[i];

      if (!parent_item.problem || !parent_item.problem.name) throw Error('Problem is required');
      //   else if (!parent_item.solutions || parent_item.solutions.length === 0) throw Error('Solution(s) are required');

      //   for (let j = 0; j < parent_item.solutions.length; j++) {
      //     const item = parent_item.solutions[j];

      //     if (!item.solution) throw Error('Solution is required');
      //   }
    }
    return true;
  } catch (e) {
    throw e;
  }
};

const setTokenParams = async (userId, token) => {
  token.queue_details = { ...token.queue };
  token.queue = token.queue.id;
  token.uid = userId;
  token.number = token.number.trim();

  token.problemSolutions.forEach((parent_item) => {
    parent_item.problem_details = {
      id: parent_item.problem.id,
      name: parent_item.problem.name,
    };
    parent_item.problem = parent_item.problem.id;

    parent_item.solutions.forEach((item) => {
      item.solution_details = {
        id: item.solution.id,
        name: item.solution.name,
      };
      item.solution = item.solution.id;
    });
  });
  return token;
};

class TokenService extends RepositoryWithUserService {
  constructor() {
    super(Token);
  }

  async create(userId, payload) {
    try {
      if (!payload) return;
      if (validateTokenInputs(payload)) {
        let token = await setTokenParams(userId, payload);

        const isNumberExist = await this.isTokenNumberExist(userId, token.number, token.date);
        if (isNumberExist) throw Error('Token number already exist');

        token = {
          ...token,
          status: TOKEN_STATUS.WAITING,
        };
        const result = await super.create(userId, token);
        if (result) {
          const item = await this.getSingle(userId, result.id);
          return item;
        }
        return undefined;
      }
    } catch (e) {
      throw e;
    }
  }

  async isTokenNumberExist(userId, token_no, date, id) {
    try {
      let query = { uid: userId, number: token_no, date };
      if (id) query = { uid: userId, number: token_no, date, _id: { $ne: id } };

      const result = await new Promise((resolve, reject) => {
        Token.countDocuments(query, (err, count) => {
          if (err) return reject(err);
          return resolve(count);
        });
      });
      if (result > 0) return true;
      return false;
    } catch (e) {
      throw e;
    }
  }

  async getNextToken(userId, queueId, date) {
    try {
      const token = await Token.findOne({ queue: queueId, date }).sort({ createdAt: -1, number: -1 });
      let lastTokenNo = ``;

      const queue = await queueService.getSingleById(queueId);
      if (!queue) throw Error('Queue does not exists');

      if (!token) {
        lastTokenNo = String(queue.start_number);
      } else {
        lastTokenNo = token.number;
      }
      if (lastTokenNo < queue.start_number)
        throw Error(`Minimum token number must be ${queue.start_number}, can't be smaller than that`);
      else if (lastTokenNo >= queue.end_number)
        throw Error(`Tokens for this queue for this date are completed. You can check another date or another queue.`);
      let next_number;
      let isExist = false;
      do {
        next_number = getNextNumber(next_number || lastTokenNo);
        isExist = await this.isTokenNumberExist(userId, next_number, date);
      } while (isExist);
      return next_number;
    } catch (e) {
      throw e;
    }
  }
  async generateTokenNumber(queue) {
    // Check if there are available token numbers
    const usedTokens = await Token.findAll({
      where: { queueId: queue.id },
      attributes: ['tokenNumber'],
    });
    const usedTokenNumbers = usedTokens.map(token => token.tokenNumber);

    // Find the next available token number
    let tokenNumber = queue.start_number;
    while (usedTokenNumbers.includes(tokenNumber) && tokenNumber <= queue.end_number) {
      tokenNumber++;
    }

    if (tokenNumber > queue.end_number) {
      throw new Error('No available token numbers in this queue');
    }

    return tokenNumber;
  }
  async getByQueueIds(userId, queue) {
    try {
      const result = await Token.findAll({
        where: { customerId: userId, queueId: queue },
        include: [{ model: require('../models/queue'), as: 'queue' }],
        order: [['createdAt', 'DESC']]
      });
      if (result) {
        return result.map((item) => item.toJSON());
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  async getCompletedTokens(userId) {
    try {
      const result = await Token.findAll({
        where: { customerId: userId, status: 'COMPLETED' },
        include: [{ model: require('../models/queue'), as: 'queue' }],
        order: [['createdAt', 'DESC']]
      });

      if (result) {
        return result.map((item) => item.toJSON());
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description Serve the next token for a queue atomically
   * @param {number} userId - Desk ID
   * @param {number} queueId
   */
  async serveNext(userId, queueId) {
    try {
      // 1. Find potential candidates securely
      const candidates = await Token.findAll({
        where: {
          queueId: queueId,
          status: 'PENDING'
        },
        order: [['tokenNumber', 'ASC']], // FCFS
        limit: 5 // Fetch a few to try avoiding collision
      });

      if (!candidates || candidates.length === 0) {
        return null; // No tokens to serve
      }

      // 2. Try to lock one
      for (const candidate of candidates) {
        const [updatedCount] = await Token.update(
          {
            status: 'ACTIVE',
            startTime: new Date(),
            // servedBy: userId // Uncomment if we track who served it in Token model
            updatedAt: new Date()
          },
          {
            where: {
              id: candidate.id,
              status: 'PENDING' // Optimistic Lock Condition
            }
          }
        );

        if (updatedCount > 0) {
          // Success! We grabbed this token.
          // Fetch fresh data including customer info
          return await Token.findByPk(candidate.id, {
            include: [
              { model: require('../models/user'), as: 'customer', attributes: ['firstName', 'lastName'] },
              { model: require('../models/queue'), as: 'queue', attributes: ['name'] }
            ]
          });
        }
      }

      return null; // Could not grab any token (unexpected high contention)
    } catch (e) {
      throw e;
    }
  }
}

const service = new TokenService();
module.exports = service;
