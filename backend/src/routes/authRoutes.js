// Đường dẫn: backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

// API: POST /api/auth/login
router.post('/login', authController.login);

// API: PUT /api/auth/profile
router.put('/profile', authMiddleware.verifyToken, authController.updateProfile);

module.exports = router;