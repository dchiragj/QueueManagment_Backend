const { isEmpty } = require('./../../utils/validator');
const { createValidationResponse } = require('./../../utils/helpers');

class AuthenticationValidator {
  /**
   * @description Validate Sign in
   */
  signIn(req, res, next) {
    const errors = {};
    const { username, password, role } = req.body;

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

  /**
   * @description Validate Sign in
   */
  signUp(req, res, next) {
    const errors = {};
    const { firstName, lastName, email, password, mobileNumber, role } = req.body;
    if (isEmpty(firstName)) {
      errors.firstName = 'First name is required';
    } else if (isEmpty(lastName)) {
      errors.lastName = 'Last name is required';
    } else if (isEmpty(email)) {
      errors.email = 'Email is required';
    } else if (isEmpty(password)) {
      errors.password = 'Password is required';
    } else if (isEmpty(mobileNumber)) {
      errors.mobileNumber = 'Mobile Number is required';
    } else if (isEmpty(role)) {
      errors.role = 'User type merchant/customer is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }

  /**
   * @description Validate Forgot Password
   */
  forgotPassword(req, res, next) {
    const errors = {};
    const { email } = req.body;

    if (isEmpty(email)) {
      errors.phone = 'Email is required';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }

  /**
   * @description Reset Password
   */
  resetPassword(req, res, next) {
    const errors = {};
    const { token, password } = req.body;

    if (isEmpty(token)) {
      errors.token = 'Token is required';
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

  verifyOtp(req, res, next) {
    const errors = {};
    const { email, otp } = req.body;

    if (isEmpty(email)) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (isEmpty(otp)) {
      errors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      errors.otp = 'OTP must be a 6-digit number';
    }

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else {
      next();
    }
  }


  createUserContact(req, res, next) {
    const errors = {};
    const { firstName, lastName, email, phoneNumber } = req.body;

    if (isEmpty(firstName)) errors.firstName = "First Name is required";
    if (isEmpty(lastName)) errors.lastName = "Last Name is required";
    if (isEmpty(email)) errors.email = "Email is required";
    if (isEmpty(phoneNumber)) errors.phoneNumber = "Phone Number is required";

    if (Object.keys(errors).length > 0) {
      createValidationResponse(res, errors);
    } else next();
  }

}

const validationObj = new AuthenticationValidator();
module.exports = validationObj;
