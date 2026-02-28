const { isEmpty } = require('./../../utils/validator');
const { createValidationResponse } = require('./../../utils/helpers');

class AuthenticationValidator {
  /**
   * @description Validate Sign in
   */
  signIn(req, res, next) {
    const errors = {};
    const { username, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isEmpty(username)) {
      errors.username = 'Username is required';
    } else if (!emailRegex.test(username)) {
      errors.username = 'Please provide a valid email address';
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
   * @description Validate Sign up
   */
  signUp(req, res, next) {
    const errors = {};
    const {
      firstName, lastName, email, password, mobileNumber, role,
      businessName, businessAddress, businessPhone
    } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (isEmpty(firstName)) {
      errors.firstName = 'First name is required';
    }
    if (isEmpty(lastName)) {
      errors.lastName = 'Last name is required';
    }

    if (isEmpty(email)) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (isEmpty(password)) {
      errors.password = 'Password is required';
    }

    if (isEmpty(mobileNumber)) {
      errors.mobileNumber = 'Mobile Number is required';
    } else if (!phoneRegex.test(mobileNumber)) {
      errors.mobileNumber = 'Please provide a valid 10-digit mobile number';
    }

    if (isEmpty(role)) {
      errors.role = 'User type merchant/customer is required';
    }

    if (role === 'merchant' || role === 'both') {
      if (isEmpty(businessName)) {
        errors.businessName = 'Business Name is required';
      }
      if (isEmpty(businessAddress)) {
        errors.businessAddress = 'Business Address is required';
      }
      if (isEmpty(businessPhone)) {
        errors.businessPhone = 'Business Phone is required';
      } else if (!phoneRegex.test(businessPhone)) {
        errors.businessPhone = 'Please provide a valid 10-digit business phone number';
      }
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
