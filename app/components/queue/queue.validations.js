const { createValidationResponse } = require('../../utils/helpers');
const { isEmpty, isValidDate } = require('../../utils/validator');
const moment = require('moment');
const { PS_TYPES } = require('../../config/constants');

class QueueValidator {
  /**
   * @description Create Queue
   */
  // create(req, res, next) {
  //   const errors = {};
  //   const { category, name, description, start_date, end_date } = req.body;

  //   if (isEmpty(name)) {
  //     errors.name = 'Name is required';
  //   } else if (isEmpty(category)) {
  //     errors.category = 'Category is required';
  //   } else if (isEmpty(description)) {
  //     errors.description = 'Description is required';
  //     // } else if (isEmpty(status)) {
  //     //   errors.status = 'Queue status is required';
  //   } else if (!isValidDate(start_date)) {
  //     errors.start_date = 'Start date is required';
  //   } else if (!isValidDate(end_date)) {
  //     errors.end_date = 'End date is required';
  //   } else if (moment(new Date(end_date)).isBefore(new Date(start_date))) {
  //     errors.end_date = 'End date/time must be greater than start date/time';
  //   }

  //   if (Object.keys(errors).length > 0) {
  //     createValidationResponse(res, errors);
  //   } else {
  //     next();
  //   }
  // }
  create(req, res, next) {
    const errors = {};
    const {
      category,
      name,
      description,
      start_date,
      end_date,
      start_number,
      end_number,
      latitude,
      longitude,
      Desk,
      address,
    } = req.body;

    if (isEmpty(name)) {
      errors.name = 'Name is required';
    }
    if (isEmpty(category)) {
      errors.category = 'Category is required';
    }
    if (isEmpty(description)) {
      errors.description = 'Description is required';
    }
    if (!isValidDate(start_date)) {
      errors.start_date = 'Start date is required';
    }
    if (!isValidDate(end_date)) {
      errors.end_date = 'End date is required';
    }
    if (moment(new Date(end_date)).isBefore(new Date(start_date))) {
      errors.end_date = 'End date/time must be greater than start date/time';
    }
    if (!start_number || isNaN(start_number) || start_number < 1) {
      errors.start_number = 'Start number must be a positive integer';
    }
    if (!end_number || isNaN(end_number) || end_number <= start_number) {
      errors.end_number = 'End number must be greater than start number';
    }
    // if (!latitude || isNaN(latitude) || latitude < -90 || latitude > 90) {
    //   errors.latitude = 'Valid latitude is required (-90 to 90)';
    // }
    // if (!longitude || isNaN(longitude) || longitude < -180 || longitude > 180) {
    //   errors.longitude = 'Valid longitude is required (-180 to 180)';
    // }
    // if (noOfDesk && (isNaN(noOfDesk) || noOfDesk < 0)) {
    //   errors.noOfDesk = 'Number of desks must be a non-negative integer';
    // }
    if (isEmpty(address)) {
      errors.address = 'Address is required';
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
    const { categoryId, queueId } = req.body;
    // const { problems, solutions } = req.body;

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

  createBusiness(req, res, next) {
    const errors = {};
    const { businessName, businessAddress, businessPhoneNumber, businessRegistrationNumber } = req.body;

    if (isEmpty(businessName)) {
      errors.businessName = 'Business Name is required';
    }
    if (isEmpty(businessAddress)) {
      errors.businessAddress = 'Address is required';
    }
    if (isEmpty(businessPhoneNumber)) {
      errors.businessPhoneNumber = 'Phone number is required';
    }
    if (isEmpty(businessRegistrationNumber)) {
      errors.businessRegistrationNumber = 'Business Registration Number is required';
    }

    if (Object.keys(errors).length > 0) {
      return createValidationResponse(res, errors);
    }

    next();
  }

  submitContact(req, res, next) {
    const errors = {};
    const { firstName, lastName, email, subject, message } = req.body;

    if (isEmpty(firstName)) {
      errors.firstName = 'First name is required';
    }
    if (isEmpty(lastName)) {
      errors.lastName = 'Last name is required';
    }
    if (isEmpty(email)) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (isEmpty(subject)) {
      errors.subject = 'Subject is required';
    }
    if (isEmpty(message)) {
      errors.message = 'Message is required';
    }

    if (Object.keys(errors).length > 0) {
      return createValidationResponse(res, errors);
    }

    next();
  }

  createDesk(req, res, next) {
    const errors = {};
    const { queueId, name, email, password } = req.body;

    if (isEmpty(queueId)) errors.queueId = 'Queue ID is required';
    if (isEmpty(name)) errors.name = 'Desk name is required';
    if (isEmpty(email)) errors.email = 'Email is required';
    if (isEmpty(password)) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return createValidationResponse(res, errors);
    }
    next();
  }

  updateDesk(req, res, next) {
    const errors = {};
    const { id } = req.params;

    if (isEmpty(id)) errors.id = 'Desk ID is required';

    if (Object.keys(errors).length > 0) {
      return createValidationResponse(res, errors);
    }
    next();
  }
}

const validationObj = new QueueValidator();
module.exports = validationObj;
