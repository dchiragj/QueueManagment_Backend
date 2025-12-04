const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
// const { Token, User } = require('../models');
// const { Token, User } = require('../models');
const Token = require('../models/token');
const User = require('../models/user');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../firebase-service-account.json')),
  });
}



router.post('/notify-third', async (req, res) => {
  const { queueId, categoryId } = req.body;
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

    console.log(tokens, "tokez123");

    // if (tokens.length < 3) {
    //   return res.json({ message: 'Less than 3 tokens, no notification sent' });
    // }

    const thirdToken = tokens[0].toJSON();
    const user = thirdToken.customer;
    console.log(user, "userfcm123");

    if (!user?.fcmToken) {
      return res.json({ message: 'No FCM token for user', tokenNumber: thirdToken.tokenNumber });
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
    res.json({
      success: true,
      notifiedToken: thirdToken.tokenNumber,
      customer: `${user.firstName} ${user.lastName}`,
    });

  } catch (error) {
    console.error('FCM Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;