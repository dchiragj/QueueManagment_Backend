const { hashSync, genSaltSync, compareSync } = require('bcrypt-nodejs');
const Desk = require('../models/desk');
const { getNextNumber } = require('../utils/helpers');
const { isEmpty } = require('../utils/validator');
const RepositoryWithUserService = require('./repositoryWithUserService');
const Queue = require('../models/queue');

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
        order: [['id', 'DESC']],
      });
    } catch (e) {
      throw e;
    }
  }

  async getByCategory(categoryId) {
    const Business = require('../models/business');
    return await Desk.findAll({
      where: { categoryId, status: true },
      include: [{
        model: Business,
        as: 'branch',
        required: false
      }]
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

  async validateDeskOnly(payload) {
    const desk = await Desk.findOne({
      where: {
        email: payload.email,
      },
    });
    if (desk && compareSync(payload.password, desk.password)) {
      return desk.toJSON();
    }
    return null;
  }

  async validateDeskOnlyRaw(payload) {
    const QueueDeskMapping = require('../models/QueueDeskMapping');
    const { compareSync } = require('bcrypt-nodejs');

    const desk = await Desk.findOne({
      where: {
        email: payload.email,
      },
    });

    if (desk && compareSync(payload.password, desk.password)) {
      // If direct queueId is null, fetch from mapping table
      if (!desk.queueId) {
        const mapping = await QueueDeskMapping.findOne({
          where: { deskId: desk.id },
          order: [['id', 'DESC']]
        });
        if (mapping) {
          desk.setDataValue('queueId', mapping.queueId);
        }
      }
      return desk;
    }
    return null;
  }

  async create(payload) {
    const { Op } = require('sequelize');

    // Check for duplicate email
    if (payload.email) {
      const existingEmail = await Desk.findOne({ where: { email: payload.email } });
      if (existingEmail) {
        const error = new Error('Desk with this email already exists');
        error.status = 400;
        throw error;
      }
    }

    // Check for duplicate name in the same business
    if (payload.name && payload.businessId) {
      const existingName = await Desk.findOne({
        where: {
          name: payload.name,
          businessId: payload.businessId
        }
      });
      if (existingName) {
        const error = new Error('Desk with this name already exists in this business');
        error.status = 400;
        throw error;
      }
    }

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
    const Business = require('../models/business');
    return await Desk.findAll({
      where: { uid: merchantId },
      include: [
        {
          model: Queue,
          as: 'queue',
          required: false
        },
        {
          model: Business,
          as: 'branch',
          required: false
        }
      ],
      order: [['id', 'DESC']]
    });
  }

  async getByBusiness(businessId, merchantId) {
    const Business = require('../models/business');
    const { Op } = require('sequelize');
    const where = { businessId: businessId };
    if (merchantId) where.uid = merchantId;

    return await Desk.findAll({
      where,
      include: [{
        model: Business,
        as: 'branch',
        required: false
      }],
      order: [['id', 'DESC']]
    });
  }

  async assignDesksToQueue(deskIds, queueId) {
    const { Op } = require('sequelize');
    if (!deskIds || !Array.isArray(deskIds) || deskIds.length === 0) return false;

    return await Desk.update(
      { queueId: queueId },
      {
        where: { id: { [Op.in]: deskIds } },
        individualHooks: true
      }
    );
  }

  /**
   * @description Get all queues assigned to a specific desk
   * @param {number} deskId 
   */
  async getAssignedQueues(deskId) {
    const QueueDeskMapping = require('../models/QueueDeskMapping');
    const mapping = await QueueDeskMapping.findAll({
      where: { deskId },
      include: [{
        model: Queue,
        as: 'queue',
        attributes: ['id', 'name', 'category', 'start_date', 'status', 'merchant']
      }]
    });

    // Extract queue objects
    return mapping.map(m => m.queue).filter(q => q); // filter nulls if any
  }
}

const service = new DeskService();
module.exports = service;
