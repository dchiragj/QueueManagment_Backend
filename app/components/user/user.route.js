const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const UserController = require('./user.controller');
const UserValidations = require('./user.validations');
const upload = require('../../../upload');

/**
 * @route POST api/user/me
 * @description get my profile
 * @returns JSON
 * @access public
 */
router.get(
  '/me',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    UserController.getMyProfile(req, res);
  },
);

/**
 * @route POST api/user/profile
 * @description update my profile
 * @returns JSON
 * @access public
 */
router.post(
  '/profile',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  // upload.single('ProfileUrl'), 
  (req, res, next) => {
    if (req.fileValidationError) {
      console.error('Multer error:', req.fileValidationError.message);
      return res.status(400).json({ message: req.fileValidationError.message });
    }
    next();
  },
  UserValidations.updateProfile,
  (req, res) => {
    UserController.updateUser(req, res);
  }
);

module.exports = router;
