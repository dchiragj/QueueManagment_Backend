const { hashSync, genSaltSync, compareSync } = require('bcrypt-nodejs');
const Desk = require('../models/desk');
const { getNextNumber } = require('../utils/helpers');
const { isEmpty } = require('../utils/validator');
const RepositoryWithUserService = require('./repositoryWithUserService');

const setDeskParams = (desks, queueId) => {
  return desks.map((item) => {
    const email = item.email ? String(item.email).trim() : null;
    const password = item.password ? String(item.password).trim() : null;
    return {
      ...item,
      email: email,
      extra1: password,
      password: password ? hashSync(password, genSaltSync(8), null) : null,
      queueId: queueId,
    };
  });
};

class DeskService extends RepositoryWithUserService {
  constructor() {
    super(Desk);
  }
  /**
   * @description get desks for a queue
   */
  async get(queueId) {
    try {
      return await Desk.findAll({
        where: { queueId },
        order: [['createdAt', 'DESC']],
      });
    } catch (e) {
      throw e;
    }
  }

  async getByCategory(categoryId) {
    return await Desk.findAll({
      where: { categoryId, status: true },
    });
  }

  /**
   * @description insert multiple items
   */
  async insertMany(userId, queueId, desks) {
    try {
      if (!desks || desks.length === 0) return false;

      const items = setDeskParams(desks, queueId);

      const result = await Desk.bulkCreate(items);
      return result;
    } catch (e) {
      console.error('ERROR while adding desks:', e);
      throw e;
    }
  }

  async validateDeskCredential(queueId, payload) {
    const desk = await Desk.findOne({
      where: {
        queueId: queueId,
        email: payload.email,
      },
    });
    if (desk && compareSync(payload.password, desk.password)) {
      return desk.toJSON();
    }
    return null;
  }

  async create(payload) {
    if (payload.password) {
      payload.extra1 = payload.password;
      payload.password = hashSync(payload.password, genSaltSync(8), null);
    }
    return await Desk.create(payload);
  }

  async update(id, payload) {
    if (payload.password) {
      payload.extra1 = payload.password;
      payload.password = hashSync(payload.password, genSaltSync(8), null);
    }
    const desk = await Desk.findByPk(id);
    if (!desk) return null;
    return await desk.update(payload);
  }

  async delete(id) {
    const desk = await Desk.findByPk(id);
    if (!desk) return null;
    return await desk.destroy();
  }

  async getByMerchant(merchantId) {
    return await Desk.findAll({
      include: [{
        model: require('../models/queue'),
        as: 'queue',
        where: { merchant: merchantId },
        required: true
      }],
      order: [['created_at', 'DESC']]
    });
  }
}

const service = new DeskService();
module.exports = service;
