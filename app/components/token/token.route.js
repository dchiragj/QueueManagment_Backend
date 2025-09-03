const express = require('express');
// Init Router
const router = express.Router();
const passport = require('passport');
const PassportErrorHandler = require('../../middleware/passportErrorResponse');
const controller = require('./token.controller');
const validations = require('./token.validations');

/**
 * @route GET api/token
 * @description get token
 * @returns JSON
 * @access public
 */
router.get(
  '/',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getTokenList(req, res);
  },
);

/**
 * @route GET api/token/completed
 * @description get completed tokens
 * @returns JSON
 * @access public
 */
router.get(
  '/completed',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getCompletedTokenList(req, res);
  },
);

/**
 * @route GET api/token/:queueId
 * @description get token by queueId
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getTokenListByQueueId(req, res);
  },
);

/**
 * @route GET api/token/:queueId/next-token
 * @description Get next token details
 * @returns JSON
 * @access public
 */
router.get(
  '/:queueId/next-token',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  (req, res) => {
    controller.getNextToken(req, res);
  },
);

/**
 * @route POST api/token
 * @description create token
 * @returns JSON
 * @access public
 */
router.post(
  '/',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.create,
  (req, res) => {
    controller.create(req, res);
  },
);

/**
 * @route GET api/token/details/:id
 * @description Get token details
 * @returns JSON
 * @access public
 */
router.get(
  '/details/:id',
  [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    PassportErrorHandler.success,
    PassportErrorHandler.error,
  ],
  validations.getItem,
  (req, res) => {
    controller.getDetails(req, res);
  },
);

module.exports = router;
