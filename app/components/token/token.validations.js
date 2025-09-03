const { createValidationResponse } = require('../../utils/helpers');
const { isEmpty } = require('../../utils/validator');

class TokenValidator {
  /**
   * @description Create Token
   */
  create(req, res, next) {
    const errors = {};
    const { queue, number, date } = req.body;

    if (isEmpty(queue)) {
      errors.queue = 'Queue Id is required';
    }
    if (isEmpty(number)) {
      errors.number = 'Token Number is required';
    }
    if (isEmpty(date)) {
      errors.date = 'Token Date selection is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }

  /**
   * @description Validate get item
   */
  getItem(req, res, next) {
    const errors = {};
    const { id } = req.params;

    if (isEmpty(id)) {
      errors.id = 'Id is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }
}

const validationObj = new TokenValidator();
module.exports = validationObj;
