// routes/users.js
// ---------------------------------------------------------------------------
// DAY 7 - User Login & JWT Token Generation
// Endpoints in this file so far:
//   POST /api/users/register   (Day 6 - unchanged)
//   POST /api/users/login      (Day 7 - NEW today)
// ---------------------------------------------------------------------------
 
// Express is our web framework. Router lets us group related endpoints
// (every /api/users/... route) together inside one tidy file.
const express = require('express');
const router = express.Router();
 
// bcryptjs hashes passwords (Day 6) and now also COMPARES them (Day 7).
const bcrypt = require('bcryptjs');
 
// jsonwebtoken creates ("signs") the digital wristbands we hand to users.
// NEW TODAY - without this import, the login route cannot issue tokens.
const jwt = require('jsonwebtoken');
 
// Our active PostgreSQL connection pool (built on Day 5 in config/db.js).
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
 
// @route   POST /api/users/login
// @desc    Authenticate user credentials and issue an encrypted JWT access wristband
router.post('/login', async (req, res) => {
  try {
    // Read the two credentials the client submitted in the JSON body.
    const { email, password } = req.body;
 
    // Step 1: Input Validation Checks
    // WHY: Stop obviously incomplete requests before touching the database.
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Login failed: Email and password fields must be filled out completely."
      });
    }
 
    // Step 2: Query the database to locate matching account rows
    // WHY: We must fetch the stored hash for this email before we can compare.
    // The email is normalised exactly as it was on registration.
    const searchResult = await db.query(
      'SELECT * FROM users WHERE email = \$1',
      [email.toLowerCase().trim()]
    );
    if (searchResult.rows.length === 0) {
      // 401 Unauthorized = "we could not verify who you are".
      // The message is deliberately vague: we never reveal WHETHER the email
      // or the password was wrong, so attackers cannot probe for valid emails.
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid email or password credentials recorded."
      });
    }
    const userRecord = searchResult.rows[0];
 
    // Step 3: Compare submitted text password with the encrypted database hash
    // bcrypt.compare re-hashes the submitted password using the salt stored
    // inside the saved hash, then checks whether the two results match.
    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid email or password credentials recorded."
      });
    }
 
    // Step 4: Construct the payload data parcel (What goes inside the wristband)
    // WHY: Keep it small and non-sensitive. NEVER place the password or hash
    // here - a token payload can be read by anyone who holds the token.
    const tokenPayload = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role
    };
 
    // Step 5: Sign the token with our secret system environment signature
    // process.env.JWT_SECRET comes from your .env file. Only our server knows
    // it, so only our server can create tokens that pass verification later.
    // expiresIn: '24h' limits the damage if a token is ever stolen.
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    // Step 6: Hand the token back to the client application
    // 200 OK = the request succeeded (nothing new was created, so not 201).
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
 
// Export the router so server.js can mount it (app.use) at /api/users
module.exports = router;


