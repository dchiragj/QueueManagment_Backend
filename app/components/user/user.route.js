const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const UserController = require('./user.controller');
const UserValidations = require('./user.validations');
const upload = require( '../../../upload' );

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
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    console.log("Headers:", req.headers);
    console.log("Body keys:", Object.keys(req.body || {}));
    next();
  },
  // upload.single('ProfileUrl'),
  (req, res, next) => {
    console.log("After multer - req.body:", req.body);
    console.log("After multer - req.file:", req.file);

    if (!req.file && req.body.ProfileUrl) {
      console.log("File missing! Check client FormData field name and filename property");
    }
    next();
  },
  UserValidations.updateProfile,
  UserController.updateUser
);

module.exports = router;
