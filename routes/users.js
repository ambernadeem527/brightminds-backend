// routes/users.js
// ---------------------------------------------------------------------------
// DAY 15 REFRESHED MASTER PRODUCTION ROUTE - Identity & Account Corridors
// ---------------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { auth, authorizeRoles } = require('../middleware/auth');

// 🔐 CORRIDOR 1: REGISTER A NEW ACCOUNT
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Missing required identity parameters."
      });
    }

    // Check for duplicate account
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Registration failed: An account with this email already exists on BrightMinds."
      });
    }

    // Cryptographic hashing layer
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, hashedPassword, role.toUpperCase()]
    );

    return res.status(201).json({
      success: true,
      message: "Identity row successfully created within BrightMinds center matrix.",
      user: newUser.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 🔐 CORRIDOR 2: IDENTITY VERIFICATION LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Credentials must be supplied."
      });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication Failed: Invalid credentials matched."
      });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Authentication Failed: Invalid credentials matched."
      });
    }

    // Form matching payload explicitly
    const tokenPayload = { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    };

    // Sign the token with synchronized fallback safety
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'BrightMindsSuperSecretTokenKey2026',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: "Authentication successful! Welcome to the BrightMinds platform portal.",
      token: token
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during login validation handles.",
      error: err.message
    });
  }
});

// 🔐 CORRIDOR 3: SECURE PROFILE RETRIEVAL
router.get('/profile', auth, async (req, res, next) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      profile: userResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 🔐 CORRIDOR 4: ADMIN RESTRICTED CORRIDOR
router.get('/admin-only-dashboard', auth, authorizeRoles('ADMIN'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome elite administrator. Access granted to private configuration matrices."
  });
});

module.exports = router;

