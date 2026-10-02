// routes/bookings.js
// ---------------------------------------------------------------------------
// DAY 12 - The Booking Lifecycle Engine
// Endpoints managed:
//   POST /api/bookings   (Protected - STUDENT role only - creates lesson logs)
// ---------------------------------------------------------------------------
 
const express = require('express');
const router = express.Router();
 
// Our PostgreSQL connection pool (config/db.js from Day 5).
const db = require('../config/db');
 
// Security filters from Days 8 and 9:
//   auth           -> proves WHO the caller is (valid token)
//   authorizeRoles -> proves the caller is ALLOWED here (correct role)
const { auth, authorizeRoles } = require('../middleware/auth');
 
// @route   POST /api/bookings
// @desc    Construct a new lesson connection schedule booking record
// @access  Protected (restricted strictly to authenticated users with a STUDENT role)
// Guards run in order: auth (valid token) -> authorizeRoles('STUDENT') -> handler.
router.post('/', auth, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    // Extract the target tutor reference and the scheduled date from the JSON body.
    // Note: student_id is NOT read from the body. It comes from the verified token.
    const { tutor_id, booking_date } = req.body;
 
    // Step 1: Input Presence Validation
    if (!tutor_id || !booking_date) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Both tutor_id and booking_date variables are required fields."
      });
    }
 
    // Step 1B: tutor_id must be a positive whole number
    // WHY: Sending text such as "abc" into an INTEGER column would make PostgreSQL
    // throw a raw type error (a 500). We reject it early with a friendly 400.
    const tutorIdNumber = Number(tutor_id);
    if (!Number.isInteger(tutorIdNumber) || tutorIdNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: tutor_id must be a positive whole number."
      });
    }
 
    // Step 2: Calendar Date Sanity Evaluation
    // new Date(...) understands ISO strings such as "2026-12-15T16:00:00.000Z".
    // An unreadable string produces an "Invalid Date", whose getTime() is NaN.
    const parsedDate = new Date(booking_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: The provided booking_date is not a valid date format."
      });
    }
 
    // Enforce that bookings can only be scheduled for future dates
    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Lesson schedules must be booked for future dates."
      });
    }
 
    // Step 3: Verify the selected tutor profile exists before attempting the insert
    // 404 Not Found = the thing you referenced does not exist.
    const tutorVerify = await db.query(
      'SELECT * FROM tutors WHERE id = $1',
      [tutorIdNumber]
    );
    if (tutorVerify.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking rejected: The specified tutor profile ID does not exist on BrightMinds."
      });
    }
 
    // Step 4: Write the record into the bookings table via a Parameterized Query
    // Pass student_id extracted from their access token (req.user.id) as the
    // master student link. New bookings always start life as 'PENDING'.
    const insertQuery = `
      INSERT INTO bookings (student_id, tutor_id, booking_date, status)
      VALUES ($1, $2, $3, 'PENDING')
      RETURNING id, student_id, tutor_id, booking_date, status, created_at;
    `;
    const executionResult = await db.query(insertQuery, [
      req.user.id,      // The authenticated student's user ID from the token
      tutorIdNumber,
      parsedDate
    ]);
 
    // Step 5: Deliver the successful creation JSON response back to the client
    return res.status(201).json({
      success: true,
      message: "Success! Your lesson scheduling request has been filed as PENDING.",
      booking: executionResult.rows[0]
    });
 
  } catch (error) {
    // Intercept data constraint breaks gracefully.
    // PostgreSQL error code 23503 = foreign key violation. Example: the token
    // belongs to a student row that no longer exists after a database reset.
    if (error.code === '23503') {
      return res.status(404).json({
        success: false,
        message: "Booking rejected: A referenced student or tutor record no longer exists. Please log in again."
      });
    }
    console.error("Day 12 Booking Engine Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Critical server error encountered during calendar logging transactions.",
      error: error.message
    });
  }
});
 
module.exports = router;



