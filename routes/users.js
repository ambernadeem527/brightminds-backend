// routes/users.js
// ---------------------------------------------------------------------------
// DAY 6 - User Registration & Password Security
// Endpoint built today: POST /api/users/register
// ---------------------------------------------------------------------------
 
// Express is our web framework. Router lets us group related endpoints
// (every /api/users/... route) together inside one tidy file.
const express = require('express');
const router = express.Router();
 
// bcryptjs is our "password shredder": it converts a plain-text password into
// an irreversible, salted hash that is safe to store in the database.
const bcrypt = require('bcryptjs');
 
// Our active PostgreSQL connection pool (built on Day 5 in config/db.js).
// db.query(sql, values) is how every route talks to the database.
const db = require('../config/db'); // Import our active database pooling bridge
 
// @route   POST /api/users/register
// @desc    Register a real student, tutor, or admin account for BrightMinds
router.post('/register', async (req, res) => {
  try {
    // Pull the three fields we need out of the JSON body the client sent.
    // This only works because server.js contains app.use(express.json()).
    const { email, password, role } = req.body;
 
    // Step 1: Input Validation Checklist
    // WHY: Never trust client input. Reject incomplete requests early with a
    // 400 (Bad Request) so we skip a needless database round-trip.
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Email, password, and role are all strictly required."
      });
    }
 
    // Step 2: Ensure the submitted role matches our strict database constraints
    // WHY: The users table only accepts these three roles. Checking here gives
    // the client a friendly message instead of a raw database error.
    const allowedRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!allowedRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Role must be exactly STUDENT, TUTOR, or ADMIN."
      });
    }
 
    // Step 3: Check if the user account already exists inside the database
    // WHY: An email must identify exactly one account. We normalise it first
    // (lowercase + trim) so "Amber@x.com " and "amber@x.com" count as the same.
    // The \$1 placeholder is a parameterized value: the database treats it as
    // DATA, never as SQL code, which blocks SQL Injection attacks.
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = \$1',
      [email.toLowerCase().trim()]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Registration failed: An account with this email already exists " +
                 "on BrightMinds."
      });
    }
 
    // Step 4: Cryptographic Hashing (The Password Shredder)
    // A "salt" is random data mixed into the password before hashing, so two
    // users with the same password still receive different hashes.
    // The factor 10 means 2^10 rounds of work: slow enough to frustrate
    // attackers, fast enough that real users never notice.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
 
    // Step 5: Save record securely inside PostgreSQL via Parameterized Query
    // RETURNING hands back the new row immediately and deliberately leaves out
    // the password column, so the hash is never sent back to the client.
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
    // 201 Created is the correct status for "a new resource now exists".
    return res.status(201).json({
      success: true,
      message: "Success! New BrightMinds user account created safely.",
      user: newRecord.rows[0]
    });
 
  } catch (error) {
    // Safety net: log the technical detail in the terminal for the developer
    // and return a generic 500 (Internal Server Error) to the client.
    console.error("Day 6 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during registration.",
      error: error.message
    });
  }
});
 
// Export the router so server.js can mount it (app.use) at /api/users
module.exports = router;

