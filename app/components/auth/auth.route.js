const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const AuthController = require('./auth.controller');
const AuthValidations = require('./auth.validations');
const  User  = require('../../models/user');

/**
 * @route POST api/auth/login
 * @description Sign in with phone and password
 * @returns JSON
 * @access public
 */
router.post('/login', AuthValidations.signIn, (req, res) => {
  AuthController.signIn(req, res);
});

/**
 * @route POST api/auth/signup-new
 * @description Sign up User
 * @returns JSON
 * @access public
 */
router.post('/signup', AuthValidations.signUp, (req, res) => {
  AuthController.signUp(req, res);
});

/**
 * @route GET api/auth/secure
 * @description Get list of media for a project
 * @returns JSON
 * @access public
 */
router.get(
  '/secure',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    return res.status(200).json({
      status: 'ok',
      message: 'Success',
      data: {},
    });
  },
);

/**
 * @route POST api/auth/forgot-password
 * @description forgot password
 * @returns JSON
 * @access public
 */
router.post('/forgot-password', AuthValidations.forgotPassword, (req, res) => {
  AuthController.forgotPassword(req, res);
});

/**
 * @route POST api/auth/reset-password
 * @description reset password
 * @returns JSON
 * @access public
 */
router.post('/reset-password',  (req, res) => {
  AuthController.resetPassword(req, res);
});
router.post('/verify-otp', AuthValidations.verifyOtp, (req, res) => {
  
  AuthController.verifyOtp(req, res);
});
/**
 * @route POST api/auth/verification-code
 * @description verification code
 * @returns JSON
 * @access public
 */
router.post(
  '/verification-code',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    AuthController.verificationCode(req, res);
  },
);

/**
 * @route POST api/auth/verify
 * @description verify code
 * @returns JSON
 * @access public
 */
router.post(
  '/verify',
  [
    (req, res, next) => {
      next();
    },
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    AuthController.verifyEmailCode(req, res);
  },
);

router.post('/save-fcm-token',[
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ], async (req, res) => {
  const { fcmToken } = req.body;
  try {
    await User.update(
      { fcmToken },
      { where: { id: req.user.id } }
    );

    res.json({ success: true, message: 'FCM Token saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// contactus route
router.post(
  "/contact-us",
  AuthValidations.createUserContact,
  (req, res) => AuthController.ContactUsUser(req, res)
);
module.exports = router;
