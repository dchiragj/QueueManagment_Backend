const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Middleware to verify JWT (assuming you have auth middleware)




module.exports = upload;