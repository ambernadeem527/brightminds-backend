// routes/tutors.js
// ---------------------------------------------------------------------------
// DAY 10 - Tutor Onboarding & Profile Initialization
// Endpoint built today: POST /api/tutors/onboard  (TUTOR role only)
// ---------------------------------------------------------------------------
 
const express = require('express');
const router = express.Router();
 
// Our PostgreSQL connection pool (config/db.js from Day 5).
const db = require('../config/db');
 
// Import our verified security filters (both built in Days 8 and 9):
//   auth           -> proves WHO the caller is (valid token)
//   authorizeRoles -> proves the caller is ALLOWED here (correct role)
const { auth, authorizeRoles } = require('../middleware/auth');
 
// @route   POST /api/tutors/onboard
// @desc    Initialize a professional tutor dossier log sheet linked to an active user
//          account ID
// @access  Protected (Restricted to logged-in users with a role status of TUTOR only)
router.post('/onboard', auth, authorizeRoles('TUTOR'), async (req, res) => {
  try {
    // Read the three professional fields the tutor submitted in the JSON body.
    const { subject_expertise, bio, hourly_rate } = req.body;
 
    // Step 1: Comprehensive Input Validation Check
    if (!subject_expertise || !bio || !hourly_rate) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Subject expertise, bio description, and " +
                 "hourly rate parameters are required."
      });
    }
 
    // Step 2: Validate that the submitted hourly rate is a positive number
    const rateNumber = parseFloat(hourly_rate);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Hourly rate must be a valid positive " +
                 "currency number format."
      });
    }
 
    // Step 3: Check if this user account already has an existing tutor folder on file
    const duplicateCheckQuery = 'SELECT * FROM tutors WHERE user_id = \$1';
    const duplicateCheck = await db.query(duplicateCheckQuery, [req.user.id]);
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Onboarding blocked: This user account has already established " +
                 "an active tutor profile card."
      });
    }
 
    // Step 4: Write records into the tutors table via a secure Parameterized Query
    const insertQuery = `
      INSERT INTO tutors (user_id, subject_expertise, bio, hourly_rate)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, subject_expertise, bio, hourly_rate, is_verified;
    `;
    const newTutorProfile = await db.query(insertQuery, [
      req.user.id,
      subject_expertise.trim(),
      bio.trim(),
      rateNumber
    ]);
 
    // Step 5: Deliver the newly created cross-referenced tutor record to the client
    return res.status(201).json({
      success: true,
      message: "Success! Your BrightMinds professional tutor profile has been initialized.",
      tutor_profile: newTutorProfile.rows[0]
    });
 
  } catch (error) {
    console.error("Day 10 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during tutor initialization.",
      error: error.message
    });
  }
});
 
module.exports = router;

