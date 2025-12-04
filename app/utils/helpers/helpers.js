const bCrypt = require('bcrypt-nodejs');
const _ = require('lodash');
const { isEmpty, isString } = require('../validator');
const Token = require('../../models/token');
const User = require('../../models/user');

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../../firebase-service-account.json')),
  });
}

/**
 * @param {Object} res
 * @param {String} status ok | error
 * @param {String} msg Response message
 * @param {Object|Array} payload Array or Object
 * @param {Object} other This can be other object that user wants to add
 */
exports.createResponse = (res, status, msg, payload, other = undefined, statusCode = 200) => {
  return res.status(statusCode).json({
    status,
    message: msg,
    data: payload,
    ...other,
  });
};

/**
 * @param {Object} res
 * @param {Object} error
 * @param {Object} options
 */
exports.createError = (res, error, options = undefined, statusCode = 400) => {
  if (!options) options = {};
  if (!options.other) options.other = {};

  const message = (error && error.message) || (isString(error) && error) || options.message || 'Error Occurred';
  const stackTrace = error || message;

  console.error('ERROR:', message, stackTrace);

  res.locals.errorStr = message;

  const other = {
    ...options.other,
    ...(options.returnStackTrace ? { error: error.message } : {}),
  };

  return exports.createResponse(res, 'error', message, other, undefined, statusCode);
};

/**
 * @param {Object} res
 * @param {String} message
 * @param {Object} options
 */
exports.createServiceUnavailableError = (res, message, options = undefined) => {
  if (!options) options = {};
  if (!options.other) options.other = {};

  console.error('Service unavailable error:', message);

  return res.status(503).json({
    status: 'error',
    message,
    ...options.other,
  });
};

/**
 * @param {Object} res
 * @param {Object} errors
 */
exports.createValidationResponse = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: errors[Object.keys(errors)[0]],
    errors: {
      ...errors,
    },
  });
};

/**
 * @description Generate Hashed password
 * @param {String} password
 */
exports.generateHash = (password) => {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
};

/**
 * @descs Compare encrypted passwords
 * @param {*} userpass
 * @param {*} password
 */
exports.comparePassword = (password, DbPassword) => {
  return bCrypt.compareSync(password, DbPassword);
};

/**
 * @description Get Array From String
 * @param {String} str
 */
exports.arrayFromString = (str) => {
  const newStr = str.slice(2, str.length - 2);
  const replacedStr = newStr.replace(/“|”|"/g, '');
  const array = replacedStr.split(',').map(String);
  return array;
};

/**
 * @description Convert String to Object Key
 * @param {String} str
 */
exports.stringToKey = (str) => {
  const newStr = str.replace(/ /g, '_');
  return newStr;
};

/**
 * @description Create valid Object Key
 * @param {String} str
 */
exports.createValidKey = (str) => {
  const newStr = str.replace(/-| |_/g, '_');
  return newStr;
};

/**
 * @description Get Default sort Order
 * @param sortOrder
 */
exports.getDefaultSortOrder = (sortOrder) => {
  const order = !isEmpty(sortOrder) && ['ASC', 'DESC'].indexOf(sortOrder) !== -1 ? sortOrder : 'DESC';
  return order;
};

/**
 * @description encode string to base64 string
 * @param data string
 */
exports.encodingToBase64 = (data) => {
  if (!data) return data;
  const buff = new Buffer.from(data);
  return buff.toString('base64');
};

/**
 * @description decode base64 to string
 * @param data base64 string
 */
exports.decodeBase64ToString = (data) => {
  if (!data) return data;
  const buff = new Buffer.from(data, 'base64');
  return buff.toString('utf8');
};

exports.formatCurrency = (num) => {
  try {
    if (num && Number.isNaN(num) === false) return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  } catch (e) {
    return num;
  }
  return num;
};

exports.jsonParseSafe = (s, defaultVal) => {
  try {
    if (_.isEmpty(s)) {
      return defaultVal;
    }

    return JSON.parse(s);
  } catch (e) {
    return defaultVal;
  }
};

exports.isEmail = (value) => {
  // eslint-disable-next-line max-len
  const myRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const isValid = myRegEx.test(value);
  return !!isValid;
};

exports.getUserDataId = (user) => {
  if (user) {
    if (user.data_uid) return user.data_uid;
    return user.id;
  }
};

exports.mathRounding = (num, digit = 2) => {
  const result = parseFloat(num).toFixed(digit);
  // eslint-disable-next-line no-restricted-globals
  if (result && isNaN(result) === false) return Number(result);
  return 0;
};

exports.leftJoinArray = (
  array1 = [],
  array2 = [],
  array1FieldName,
  array2FieldName,
  name1 = 'left',
  name2 = 'right',
) => {
  if (!array1 || !array2) throw Error('Both array are required');
  const result = [];
  array1.forEach((item) => {
    const joinItem = {
      [name1]: item,
      [name2]: array2.find((x) => x[array2FieldName] === item[array1FieldName]),
    };
    result.push(joinItem);
  });
  return result;
};

exports.groupBy = (collection, iteratee) => {
  const groupResult = _.groupBy(collection, iteratee);
  return Object.keys(groupResult).map((key) => {
    return { name: key, value: groupResult[key] };
  });
};

exports.getDate = (date) => {
  if (date) date = new Date(date);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

/**
 * @desc get user friendly string from the given value
 * @param {*} value
 * @param {*} replaceChar
 */
exports.userFriendlyString = (value, replaceChar) => {
  if (!value) return '';
  value = value.trim();

  if (!replaceChar) replaceChar = '_';
  return value === undefined
    ? ''
    : value
        .replace(/[^a-z0-9_]+/gi, replaceChar)
        .replace(/^-|-$/g, '')
        .toLowerCase();
};

exports.getNextNumber = (key = '', type = 1) => {
  try {
    // type: 1: numbers; 2: alphabets
    console.log('key', key);
    if (!key) {
      // ascii value for before number & character. i.e next will be 1 or A
      key = type === 1 ? '0' : '@';
    }
    if (key === 'Z' || key === 'z') {
      return String.fromCharCode(key.charCodeAt() - 25) + String.fromCharCode(key.charCodeAt() - 25); // AA or aa
    } else {
      var lastChar = key.slice(-1);
      var sub = key.slice(0, -1);
      if (lastChar === 'Z' || lastChar === 'z') {
        // If a string of length > 1 ends in Z/z,
        // increment the string (excluding the last Z/z) recursively,
        // and append A/a (depending on casing) to it
        return getNextKey(sub) + String.fromCharCode(lastChar.charCodeAt() - 25);
      } else {
        // (take till last char) append with (increment last char)
        return sub + String.fromCharCode(lastChar.charCodeAt() + 1);
      }
    }
  } catch (e) {
    console.log('ERROR', e);
    return key;
  }
};

exports.sendNotificationNextToken = async (queueId, categoryId) => {
  try {
      const tokens = await Token.findAll({
        where: {
          queueId,
          categoryId,
          // isSkipped: false,
          status: 'PENDING',
        },
        include: [{ model: User, attributes: ['fcmToken', 'firstName', 'lastName'], as: 'customer' }],
        order: [['tokenNumber', 'ASC']],
      });
      // if (tokens.length < 3) {
      //   return res.json({ message: 'Less than 3 tokens, no notification sent' });
      // }

      const thirdToken = tokens[0];
      const user = thirdToken.customer;

      if (!user?.fcmToken) {
        return { message: 'No FCM token for user', tokenNumber: thirdToken.tokenNumber };
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: 'Your turn has arrived!',
          body: `Token ${thirdToken.tokenNumber} - Please come now!`,
        },
        data: {
          type: 'turn_approaching',
          tokenNumber: thirdToken.tokenNumber.toString(),
          queueId: queueId.toString(),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'queue_alert',
          },
        },
      };

      await admin.messaging().send(message);
      return {
        success: true,
        notifiedToken: thirdToken.tokenNumber,
        customer: `${user.firstName} ${user.lastName}`,
      };

    } catch (error) {
      console.error('FCM Error:', error.message);
      return { error: error.message };
    }
  // }
  // try {

  //   // 1️⃣ Find the ACTIVE token
  //   const activeToken = await Token.findOne({
  //     where: {
  //       queueId,
  //       categoryId,
  //       status: "ACTIVE",
  //     },
  //     include: [
  //       {
  //         model: User,
  //         as: "customer",
  //         attributes: ["fcmToken", "firstName", "lastName"]
  //       }
  //     ],
  //     order: [["tokenNumber", "ASC"]],
  //   });

  //   if (!activeToken) {
  //     console.log("No ACTIVE token found");
  //     return;
  //   }

  //   // 2️⃣ Notify ACTIVE USER (Your turn)
  //   if (activeToken.customer?.fcmToken) {
  //     await admin.messaging().send({
  //       token: activeToken.customer.fcmToken,
  //       notification: {
  //         title: "Your turn has arrived!",
  //         body: `Token ${activeToken.tokenNumber} - Please come now.`,
  //       },
  //       data: {
  //         type: "your_turn",
  //         tokenNumber: activeToken.tokenNumber.toString(),
  //         queueId: queueId.toString(),
  //       },
  //       android: { priority: "high" }
  //     });
  //   }

  //   // 3️⃣ Notify NEXT USER (Turn approaching)
  //   const approachingToken = await Token.findOne({
  //     where: {
  //       queueId,
  //       categoryId,
  //       tokenNumber: activeToken.tokenNumber + 1,
  //       status: "PENDING"
  //     },
  //     include: [
  //       {
  //         model: User,
  //         as: "customer",
  //         attributes: ["fcmToken", "firstName", "lastName"]
  //       }
  //     ]
  //   });

  //   if (approachingToken?.customer?.fcmToken) {
  //     await admin.messaging().send({
  //       token: approachingToken.customer.fcmToken,
  //       notification: {
  //         title: "Your turn is coming soon",
  //         body: `Token ${approachingToken.tokenNumber} - Be ready, your turn is near.`,
  //       },
  //       data: {
  //         type: "turn_approaching",
  //         tokenNumber: approachingToken.tokenNumber.toString(),
  //         queueId: queueId.toString(),
  //       },
  //       android: { priority: "high" }
  //     });

  //     return {
  //       success: true,
  //       active: activeToken.tokenNumber,
  //       approaching: approachingToken.tokenNumber
  //     };
  //   }

  //   return {
  //     success: true,
  //     active: activeToken.tokenNumber,
  //     approaching: null
  //   };

  // } catch (error) {
  //   console.error("Error in sendNotificationNextToken:", error.message);
  //   return { error: error.message };
  // }
};


