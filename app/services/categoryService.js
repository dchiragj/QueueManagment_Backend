const Category = require('../models/category');
const { userFriendlyString } = require('../utils/helpers');
const RepositoryService = require('./RepositoryService');

class categoryService extends RepositoryService {
  constructor() {
    super(Category);
  }

  /**
   * @description get list
   */
  async get() {
    try {
      const result = await Category.find({});
      if (result) {
        return result
          .filter((value, index, self) => {
            return self.findIndex((x) => x.slug === value.slug) === index;
          })
          .map((item) => item.toJSON());
      }
      return result.toJSON();
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description get category by slug
   */
  async getCategoryBySlug(slug) {
    try {
      const result = await Category.findOne({ slug });
      if (result) {
        return result.toJSON();
      }
      return result.toJSON();
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description insert mutiple items
   */
  async insertMany(categories) {
    try {
      if (!categories || categories.length === 0) return false;

      const itemsPayload = [];
      for (let i = 0; i < categories.length; i++) {
        const item = categories[i];

        const isSlugExist = await this.isCategorySlugExist(userFriendlyString(String(item)));
        if (isSlugExist) throw Error(`Category ${item} already exists`);

        const itemPayload = {
          name: String(item).trim(),
          slug: userFriendlyString(String(item)),
        };
        itemsPayload.push(itemPayload);
      }
      const result = await Category.insertMany(itemsPayload);
      if (result) return result;
      return;
    } catch (e) {
      console.log('ERROR while adding categories');
      throw e;
    }
  }

  async isCategorySlugExist(slug) {
    try {
      const result = await new Promise((resolve, reject) => {
        Category.countDocuments({ slug }, (err, count) => {
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
}

const service = new categoryService();
module.exports = service;
