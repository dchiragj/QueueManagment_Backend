const { createValidationResponse } = require('../../utils/helpers');
const { isEmpty, isValidDate } = require('../../utils/validator');
const moment = require('moment');
const { PS_TYPES } = require('../../config/constants');

class QueueValidator {
  /**
   * @description Create Queue
   */
  create(req, res, next) {
    const errors = {};
    const { category, name, description, start_date, end_date } = req.body;

    if (isEmpty(name)) {
      errors.name = 'Name is required';
    } else if (isEmpty(category)) {
      errors.category = 'Category is required';
    } else if (isEmpty(description)) {
      errors.description = 'Description is required';
      // } else if (isEmpty(status)) {
      //   errors.status = 'Queue status is required';
    } else if (!isValidDate(start_date)) {
      errors.start_date = 'Start date is required';
    } else if (!isValidDate(end_date)) {
      errors.end_date = 'End date is required';
    } else if (moment(new Date(end_date)).isBefore(new Date(start_date))) {
      errors.end_date = 'End date/time must be greater than start date/time';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }

  /**
   * @description Create Queue Problem/Solution
   */
  createProbSol(req, res, next) {
    const errors = {};
    const { type } = req.params;
    const { categoryId, queueId } = req.query;
    const { problems, solutions } = req.body;

    if (isEmpty(categoryId) && isEmpty(queueId)) {
      errors.queueId = 'queueId or categoryId is required';
    }
    if (Number(type) === PS_TYPES.PROBLEMS) {
      if (isEmpty(problems)) {
        errors.problems = 'Atleast one problem is required';
      }
    } else if (Number(type === PS_TYPES.SOLUTIONS)) {
      if (isEmpty(solutions)) {
        errors.solutions = 'Atleast one solution is required';
      }
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

  /**
   * @description Validate Sign in
   */
  deskLogin(req, res, next) {
    const errors = {};
    const { queueId } = req.params;
    const { username, password, number } = req.body;

    if (isEmpty(queueId)) {
      errors.queueId = 'queueId is required';
    }
    if (isEmpty(number)) {
      errors.number = 'Number is required';
    }
    if (isEmpty(username)) {
      errors.username = 'Username is required';
    }
    if (isEmpty(password)) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }
}

const validationObj = new QueueValidator();
module.exports = validationObj;
