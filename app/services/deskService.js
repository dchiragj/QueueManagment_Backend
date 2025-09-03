const { hashSync, genSaltSync } = require('bcrypt-nodejs');
const Desk = require('../models/desk');
const { getNextNumber } = require('../utils/helpers');
const { isEmpty } = require('../utils/validator');
const RepositoryWithUserService = require('./RepositoryWithUserService');

const setDeskParams = async (queueId, desks) => {
  desks.forEach((item) => {
    item.username = String(item.username).trim();
    item.normalized_username = String(item.username)
      .toUpperCase()
      .trim();
    item.extra1 = String(item.password).trim();
    item.password = hashSync(String(item.password).trim(), genSaltSync(8), null);
    item.start_time = item.start_time;
    item.end_time = item.end_time;
    item.queue = queueId;
  });
  return desks;
};

class deskService extends RepositoryWithUserService {
  constructor() {
    super(Desk);
  }
  /**
   * @description get desks
   */
  async get(queueId) {
    try {
      const result = await Desk.find({ queue: queueId }).sort({ createdAt: -1, number: 1 });
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
  async insertMany(userId, queueId, desks) {
    try {
      if (!desks || desks.length === 0) return false;

      if (
        desks.length !==
        desks.filter((value, index, self) => self.findIndex((x) => x.username === value.username) === index).length
      ) {
        throw Error('Only one line allowed per username');
      }

      const items = await setDeskParams(queueId, desks);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const prevItem = items[i - 1];
        const prevNumber = prevItem ? prevItem.number : undefined;
        item.number = await this.getNextDesk(queueId, prevNumber);
      }

      const result = await super.insertMany(userId, items);
      if (result) return result;
      return;
    } catch (e) {
      console.log('ERROR while adding desks');
      throw e;
    }
  }

  async isDeskNumberExist(queueId, desk_no, id) {
    try {
      let query = { queue: queueId, number: desk_no };
      if (id) query = { queue: queueId, number: desk_no, _id: { $ne: id } };

      const result = await new Promise((resolve, reject) => {
        Desk.countDocuments(query, (err, count) => {
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

  async getNextDesk(queueId, lastDeskNo) {
    try {
      if (isEmpty(lastDeskNo)) {
        const result = await Desk.findOne({ queue: queueId }).sort({ createdAt: -1 });
        lastDeskNo = result ? result.number : ``;
      }
      let next_number;
      let isExist = false;
      do {
        next_number = getNextNumber(next_number || lastDeskNo, 2);
        isExist = await this.isDeskNumberExist(queueId, next_number);
      } while (isExist);
      return next_number;
    } catch (e) {
      throw e;
    }
  }

  async validateDeskCredential(queueId, payload) {
    const normalized_username = String(payload.username)
      .toUpperCase()
      .trim();
    const desk = await Desk.findOne({
      queue: queueId,
      number: payload.number,
      $or: [{ username: payload.username }, { normalized_username }],
    });
    if (desk && desk.authenticateDesk(payload.password)) return desk.toJSON();
    return null;
  }
}

const service = new deskService();
module.exports = service;
