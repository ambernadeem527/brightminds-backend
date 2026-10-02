// routes/tutors.js
// ---------------------------------------------------------------------------
// DAY 11 - Advanced Search Mechanics & Filtering
// Endpoints active in this file:
// POST /api/tutors/onboard (Protected - TUTOR only - Day 10, unchanged)
// GET /api/tutors (Public - Open Search Directory - Day 11 NEW)
// ---------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

// Our PostgreSQL connection pool (config/db.js from Day 5).
const db = require('../config/db');

// Security filters built on Days 8 and 9
const { auth, authorizeRoles } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// DAY 10 ROUTE - kept exactly as you built it
// ---------------------------------------------------------------------------

router.post('/onboard', auth, authorizeRoles('TUTOR'), async (req, res) => {
  try {
    const { subject_expertise, bio, hourly_rate } = req.body;

    if (!subject_expertise || !bio || !hourly_rate) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Subject expertise, bio description, and " +
                 "hourly rate parameters are required."
      });
    }

    const rateNumber = parseFloat(hourly_rate);

    if (isNaN(rateNumber) || rateNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Hourly rate must be a valid positive " +
                 "currency number format."
      });
    }

    const duplicateCheckQuery = 'SELECT * FROM tutors WHERE user_id = $1';
    const duplicateCheck = await db.query(
      duplicateCheckQuery,
      [req.user.id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Onboarding blocked: This user account has already established " +
                 "an active tutor profile card."
      });
    }

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

// ---------------------------------------------------------------------------
// DAY 11 ROUTE - NEW TODAY: public tutor directory search
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    // Step 1: Extract optional query parameters
    const subject =
      typeof req.query.subject === 'string' ? req.query.subject : '';

    const maxPrice =
      typeof req.query.maxPrice === 'string' ? req.query.maxPrice : '';

    // Step 2: Initialize base SQL query
    let baseQuery = `
      SELECT id, user_id, subject_expertise, bio, hourly_rate, is_verified
      FROM tutors
    `;

    const queryParams = [];
    const whereClauses = [];

    // Step 3: Subject filter
    if (subject.trim() !== '') {
      queryParams.push(`%${subject.trim()}%`);

      whereClauses.push(
        `subject_expertise ILIKE $${queryParams.length}`
      );
    }

    // Step 4: Maximum price filter
    if (maxPrice.trim() !== '') {
      const parsedPrice = parseFloat(maxPrice);

      if (!isNaN(parsedPrice)) {
        queryParams.push(parsedPrice);

        whereClauses.push(
          `hourly_rate <= $${queryParams.length}`
        );
      }
    }

    // Step 5: Add WHERE conditions
    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Sort cheapest first
    baseQuery += ' ORDER BY hourly_rate ASC;';

    // Step 6: Secure parameterized query
    const searchResult = await db.query(baseQuery, queryParams);

    return res.status(200).json({
      success: true,
      count: searchResult.rows.length,
      message: "Tutor directory lookup successfully parsed.",
      data: searchResult.rows
    });

  } catch (error) {
    console.error("Day 11 Directory Search Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Critical server anomaly encountered during directory search execution.",
      error: error.message
    });
  }
});

module.exports = router;

