// routes/fcm.js
const express = require('express');
const router = express.Router();
const { User } = require('../models'); // adjust path
const auth = require('../middleware/auth'); // your JWT middleware

// POST /api/fcm/token
router.post('/token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    await User.update(
      { fcmToken },
      { where: { id: req.user.id } }
    );

    res.json({ message: 'FCM token saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;