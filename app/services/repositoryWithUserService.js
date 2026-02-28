const { where } = require('underscore');
const Queue = require('../models/queue');
const { isEmpty } = require('../utils/validator');
const { Op } = require('sequelize');
const User = require('../models/user');
const { RADIUS } = require('../config/constants');

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

class RepositoryWithUserService {
  constructor(collection) {
    this.collection = collection;
  }

  async get(userId) {
    try {
      const result = await this.collection.findAll({
        where: { merchant: userId },
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

  async gettokenlist(userId, role) {
    try {
      const result = await this.collection.findAll({
        where: { customerId: userId, status: { [Op.notIn]: ['CANCELLED', 'COMPLETED'] }, }, order: [['createdAt', 'DESC']],
      });

      if (result && result.length > 0) {
        return result.map((item) => item.toJSON());
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }


  async getRaw(userId) {
    try {
      const result = await this.collection.find({ uid: userId });
      if (result) return result;
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  async getSingle(userId, id) {
    try {
      if (!id) return;

      const result = await this.collection.findOne({ _id: id, uid: userId });
      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }
  async getSingleQueue(userId, id) {
    try {
      if (!id) return;
      const result = await Queue.findOne({ where: { id } });

      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }
  async getSingleQueuenextToken(userId, id) {
    try {
      if (!id) return;
      const result = await Queue.findOne({
        where: { id },
        include: [{ model: User, attributes: ['fcmToken'], as: 'user' }],
      });

      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }
  async getSingleQueueByJoinMethod(userId, options = {}) {
    try {
      const { joinMethods, joinCode, link, lat, long, queueId, categoryId } = options;

      if (!joinMethods)
        throw new Error('joinMethod is required to fetch queue');

      let whereCondition = {
        isActive: true,
        isCancelled: false,
      };

      // 🧭 Build dynamic where condition
      switch (joinMethods) {
        case 'private':
          if (!joinCode) throw new Error('joinCode is required for private join');
          whereCondition.joinCode = joinCode;
          break;

        case 'link':
          if (!link) throw new Error('link is required for link join');
          const parsedUrl = new URL(link);
          const extractedQueueId = parsedUrl.searchParams.get("queueId");
          const extractedCategoryId = parsedUrl.searchParams.get("categoryId");

          if (!extractedQueueId) throw new Error("queueId not found in link");
          whereCondition.id = extractedQueueId;
          whereCondition.category = extractedCategoryId;
          break;

        case 'location':
          if (!lat || !long) throw new Error('lat & long are required for location join');

          // Fetch queues that support location-based join
          const availableQueues = await Queue.findAll({
            where: {
              isActive: true,
              isCancelled: false,
              joinMethods: { [Op.like]: '%location%' } // Ensure it supports location join
            },
          });

          if (!availableQueues.length) return undefined;

          // Find the nearest queue within the allowed RADIUS
          const nearest = availableQueues.reduce((closest, q) => {
            const dist = calculateDistance(q.latitude, q.longitude, lat, long);

            if (dist <= RADIUS) {
              return !closest || dist < closest.dist ? { queue: q, dist } : closest;
            }
            return closest;
          }, null);

          return nearest?.queue?.toJSON() ?? undefined;

        case 'qr':
          if (!queueId) throw new Error('queueId is required for qr join');
          whereCondition.id = queueId;
          whereCondition.category = categoryId;
          break;

        default:
          throw new Error('Invalid joinMethod');
      }
      console.log(whereCondition, "conde123");


      const result = await Queue.findOne({
        where: whereCondition,
        attributes: [
          'id', 'name', 'description', 'category',
          'latitude', 'longitude', 'address',
          'start_date', 'end_date', 'joinCode',
          'joinMethods', 'merchant', 'isActive', 'start_number', 'end_number'
        ],
        include: [
          {
            model: User,
            as: 'merchantUser',
            attributes: ['id', 'FirstName', 'LastName', 'email'],
          },
          {
            model: require('../models/category'),
            as: 'categ',
            attributes: ['id', 'name'],
          },
        ],
      });

      return result ? result.toJSON() : undefined;
    } catch (e) {
      console.error('getSingleQueue error:', e.message);
      throw e;
    }
  }

  async getSingletoken(userId, id) {
    try {
      if (!id) return;
      // Look up a queue owned by the user


      const result = await this.collection.findOne({
        where: { customerId: userId, queueId: id }
      });
      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }
  async getSingleRaw(userId, id) {
    try {
      if (!id) return;

      const result = await this.collection.findOne({ _id: id, uid: userId });
      if (result) return result;
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  async create(userId, payload) {

    try {
      if (!payload) return;

      // Remove blank or undefined value from object
      Object.keys(payload).forEach((key) => {
        if (isEmpty(payload[key]) === true) delete payload[key];
      });

      const itemPayload = {
        ...payload,
        uid: userId,
        createdBy: userId,
      };
      const result = await this.collection.create(itemPayload);
      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  async update(userId, id, payload) {
    try {
      if (!userId) throw new Error('userId is required');
      if (!id) throw new Error('Id is required');
      if (!payload) throw new Error('Data is required');

      delete payload.createdBy;
      delete payload.createdAt;

      const itemPayload = {
        ...payload,
        id,
        uid: userId,
        updatedBy: userId,
      };

      const updatePromise = new Promise(async (resolve, reject) => {
        const query = { _id: id, uid: userId };
        await this.collection.findOneAndUpdate(query, itemPayload, { new: false }, (err, result) => {
          if (err) reject(err);
          return resolve(result);
        });
      });
      const result = await updatePromise;
      if (result) {
        const item = await this.getSingle(userId, id);
        return item;
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  async updateItem(userId, id, payload) {
    try {
      if (!userId) throw new Error('userId is required');
      if (!id) throw new Error('Id is required');
      if (!payload) throw new Error('Data is required');

      delete payload.createdBy;
      delete payload.createdAt;

      const itemPayload = {
        ...payload,
        id,
        uid: userId,
        updatedBy: userId,
      };

      const updatePromise = new Promise(async (resolve, reject) => {
        const query = { _id: id, uid: userId };
        await this.collection.findOneAndUpdate(query, itemPayload, { new: false }, (err, result) => {
          if (err) reject(err);
          return resolve(result);
        });
      });
      const result = await updatePromise;
      if (result) {
        const item = await this.getSingle(userId, id);
        return item;
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description delete
   */
  async delete(userId, id) {
    try {
      const query = { _id: id, uid: userId };
      const result = await this.collection.delete(query);
      if (result) {
        return true;
      }
      throw Error('Unable to delete item');
    } catch (e) {
      throw e;
    }
  }

  async getByIds(userId, ids = []) {
    try {
      const query = { uid: userId, _id: { $in: ids } };
      const result = await this.collection.find(query);
      return result;
    } catch (e) {
      throw e;
    }
  }

  async count(userId) {
    try {
      const query = { uid: userId };
      const result = await this.collection.count(query);
      if (result) return result;
      return 0;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description insert mutiple items
   */
  async insertMany(userId, items) {
    try {
      if (!items || items.length === 0) return false;
      const itemsPayload = [];
      items.forEach((item) => {
        const itemPayload = {
          ...item,
          uid: userId,
          createdBy: userId,
          createdAt: new Date(),
        };
        itemsPayload.push(itemPayload);
      });
      const result = await this.collection.insertMany(itemsPayload);
      return result;
    } catch (e) {
      throw e;
    }
  }
}
module.exports = RepositoryWithUserService;
