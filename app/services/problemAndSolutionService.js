const ProblemAndSolution = require('../models/problem-solution');
const { isEmpty } = require('../utils/validator');
const RepositoryWithUserService = require('./repositoryWithUserService');

class ProblemAndSolutionService extends RepositoryWithUserService {
  constructor() {
    super(ProblemAndSolution);
  }

  /**
   * @description get list by type like problems/solutions
   */
  async getByType(type) {
    try {
      const result = await ProblemAndSolution.find({ type });
      if (result) {
        return result.map((item) => item.toJSON());
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description insert mutiple items
   */
  async insertMany(userId, type, queueId, payload, categoryId = null) {
    try {
      if (!payload || payload.length === 0) return false;

      const itemsPayload = [];
      payload.forEach((probSol) => {
        let itemPayload = {
          name: String(probSol).trim(),
          normalized_name: String(probSol)
            .trim()
            .toUpperCase(),
          type,
        };

        if (!isEmpty(queueId)) itemPayload.queueId = queueId;
        else if (isEmpty(queueId) && !isEmpty(categoryId)) itemPayload.category = categoryId;
        itemsPayload.push(itemPayload);
      });
      const result = await super.insertMany(userId, itemsPayload);
      return result;
    } catch (e) {
      console.log('ERROR while adding problems/solutions');
      // throw e;
    }
  }
}

const service = new ProblemAndSolutionService();
module.exports = service;
