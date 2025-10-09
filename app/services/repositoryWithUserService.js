const { where } = require( 'underscore' );
const Queue = require( '../models/queue' );
const { isEmpty } = require('../utils/validator');
const { Op } = require( 'sequelize' );

class RepositoryWithUserService {
  constructor(collection) {
    this.collection = collection;
  }

 async get(userId) {
    try {
      const result = await this.collection.find({ uid: userId });
      if (result) {
        return result.map((item) => item.toJSON());
      }
      return undefined;
    } catch (e) {
      throw e;
    }
  }

async gettokenlist(userId,role) {
  try {
    const result = await this.collection.findAll({
      where: {customerId: userId, status: { [Op.ne]: 'CANCELLED' },},order: [['createdAt', 'DESC']],
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
      const result = await Queue.findOne({where: { id} });

      if (result) return result.toJSON();
      return undefined;
    } catch (e) {
      throw e;
    }
  }
  async getSingletoken(userId, id) {
   console.log(userId, "useridget", id, "getsingle1");
  try {
    if (!id) return;
    // Look up a queue owned by the user
    console.log(this.collection,"this.collection");
    
    const result = await this.collection.findOne({
      where: { customerId:userId, queueId: id }  
    });
    console.log(result, "1234");
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
    console.log(this.collection,"this");
    
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
