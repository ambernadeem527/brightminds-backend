// routes/users.js
// ---------------------------------------------------------------------------
// DAY 9 - Profile Management & Role Access Controls
// Endpoints in this file so far:
//   POST /api/users/register             (Day 6 - unchanged)
//   POST /api/users/login                (Day 7 - unchanged)
//   GET  /api/users/dashboard-sandbox    (Day 8 - now uses the new 'auth' name)
//   GET  /api/users/profile              (Day 9 - NEW today, protected)
//   GET  /api/users/admin-only-dashboard (Day 9 - NEW today, ADMIN only)
// ---------------------------------------------------------------------------
 
// CHANGED TODAY: middleware/auth.js now exports TWO tools inside one object,
// so we import them with curly braces ("destructuring"):
const { auth, authorizeRoles } = require('../middleware/auth');
const db = require('../config/db');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
 
// @route   POST /api/users/register
// @desc    Register a real student, tutor, or admin account for BrightMinds
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
 
    // Step 1: Input Validation Checklist
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Email, password, and role are all strictly required."
      });
    }
 
    // Step 2: Ensure the submitted role matches our strict database constraints
    const allowedRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!allowedRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Role must be exactly STUDENT, TUTOR, or ADMIN."
      });
    }
 
    // Step 3: Check if the user account already exists inside the database
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
 
    // Step 4: Cryptographic Hashing (The Password Shredder)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
 
    // Step 5: Save record securely inside PostgreSQL via Parameterized Query
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
 
    // Step 6: Return the successful creation payload (Excluding the password)
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
 
    // Step 1: Input Validation Checks
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Login failed: Email and password fields must be filled out completely."
      });
    }
 
    // Step 2: Query the database to locate matching account rows
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
 
    // Step 3: Compare submitted text password with the encrypted database hash
    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid email or password credentials recorded."
      });
    }
 
    // Step 4: Construct the payload data parcel
    const tokenPayload = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role
    };
 
    // Step 5: Sign the token with our secret system environment signature
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    // Step 6: Hand the token back to the client application
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
router.get('/dashboard-sandbox', auth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Access Granted! Welcome to the secure BrightMinds dashboard sandbox area.",
    decrypted_user_context_data: req.user
  });
});
 
// @route   GET /api/users/profile
// @desc    Fetch current logged-in user's profile details directly from the database rows
router.get('/profile', auth, async (req, res) => {
  try {
    // Look up the user row matching the exact ID embedded inside their access token.
    // Explicitly exclude the password column from our SQL SELECT for safety.
    const sqlQuery = 'SELECT id, email, role, created_at FROM users WHERE id = \$1';
    const profileLookup = await db.query(sqlQuery, [req.user.id]);
 
    if (profileLookup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account entity record not found inside database columns."
      });
    }
 
    return res.status(200).json({
      success: true,
      data: profileLookup.rows[0]
    });
 
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
// @route   GET /api/users/admin-only-dashboard
// @desc    Strict administrative control corridor restricted to users with ADMIN status roles
router.get('/admin-only-dashboard', auth, authorizeRoles('ADMIN'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome Master Administrator. High-level corporate configurations active."
  });
});
 
module.exports = router;
