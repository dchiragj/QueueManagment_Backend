const { createValidationResponse } = require('../../utils/helpers');
const { isEmpty } = require('../../utils/validator');

class UserValidator {
  /**
   * @description Update Profile
   */
  updateProfile(req, res, next) {
    const errors = {};
    const { firstName, lastName } = req.body;

    if (isEmpty(firstName) && isEmpty(lastName)) {
      errors.name = 'First/Last name is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }
}

const validationObj = new UserValidator();
module.exports = validationObj;
