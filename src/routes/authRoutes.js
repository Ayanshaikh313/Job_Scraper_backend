const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', login);

/**
 * GET /api/auth/profile
 * Get user profile - Protected
 */
router.get('/profile', authenticate, getProfile);

/**
 * PUT /api/auth/profile
 * Update user profile - Protected
 */
router.put('/profile', authenticate, updateProfile);

module.exports = router;
