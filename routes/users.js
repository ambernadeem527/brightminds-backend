// routes/users.js
// ---------------------------------------------------------------------------
// DAY 8 - Express Middleware & Authentication Guards
// Endpoints in this file so far:
//   POST /api/users/register           (Day 6 - unchanged)
//   POST /api/users/login              (Day 7 - unchanged)
//   GET  /api/users/dashboard-sandbox  (Day 8 - NEW today, protected)
// ---------------------------------------------------------------------------
 
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Import our active database pooling bridge
 
// NEW TODAY: import our "security bouncer" from the middleware folder.
const authGuard = require('../middleware/auth'); // Import our bouncer
 
// @route   POST /api/users/register
// @desc    Register a real student, tutor, or admin account for BrightMinds
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
 
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Email, password, and role are all strictly required."
      });
    }
 
    const allowedRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!allowedRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Role must be exactly STUDENT, TUTOR, or ADMIN."
      });
    }
 
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = \$1',
      [email.toLowerCase().trim()]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Registration failed: An account with this email already exists on BrightMinds."
      });
    }
 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
 
    const insertQuery = `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, created_at;
    `;
    const newRecord = await db.query(insertQuery, [
      email.toLowerCase().trim(),
      hashedPassword,
      role.toUpperCase()
    ]);
 
    return res.status(201).json({
      success: true,
      message: "Success! New BrightMinds user account created safely.",
      user: newRecord.rows[0]
    });
 
  } catch (error) {
    console.error("Day 6 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during registration.",
      error: error.message
    });
  }
});
 
// @route   POST /api/users/login
// @desc    Authenticate user credentials and issue an encrypted JWT access wristband
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Login failed: Email and password fields must be filled out completely."
      });
    }
 
    const searchResult = await db.query(
      'SELECT * FROM users WHERE email = \$1',
      [email.toLowerCase().trim()]
    );
    if (searchResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid email or password credentials recorded."
      });
    }
    const userRecord = searchResult.rows[0];
 
    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid email or password credentials recorded."
      });
    }
 
    const tokenPayload = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role
    };
 
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    return res.status(200).json({
      success: true,
      message: "Authentication successful! Welcome to the BrightMinds platform portal.",
      token: token
    });
 
  } catch (error) {
    console.error("Day 7 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during login validation handles.",
      error: error.message
    });
  }
});
 
// @route   GET /api/users/dashboard-sandbox
// @desc    A temporary protected route space to verify our middleware blocks bad actors
router.get('/dashboard-sandbox', authGuard, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Access Granted! Welcome to the secure BrightMinds dashboard sandbox area.",
    decrypted_user_context_data: req.user 
  });
});
 
// Export the router so server.js can mount it (app.use) at /api/users
module.exports = router;



