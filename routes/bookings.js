// routes/bookings.js
// ---------------------------------------------------------------------------
// DAY 13 - Booking Approvals & Management
// Endpoints managed:
//   POST /api/bookings              (Protected - STUDENT - Day 12, unchanged)
//   PUT  /api/bookings/:id/status   (Protected - TUTOR   - Day 13 NEW)
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
router.post('/', auth, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { tutor_id, booking_date } = req.body;
 
    // Step 1: Input Presence Validation
    if (!tutor_id || !booking_date) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Both tutor_id and booking_date variables are required fields."
      });
    }
 
    // Step 1B: tutor_id must be a positive whole number
    const tutorIdNumber = Number(tutor_id);
    if (!Number.isInteger(tutorIdNumber) || tutorIdNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: tutor_id must be a positive whole number."
      });
    }
 
    // Step 2: Calendar Date Sanity Evaluation
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
 
    // Step 3: Verify the selected tutor profile exists
    const tutorVerify = await db.query(
      'SELECT * FROM tutors WHERE id = \$1',
      [tutorIdNumber]
    );
    if (tutorVerify.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking rejected: The specified tutor profile ID does not exist on BrightMinds."
      });
    }
 
    // Step 4: Write the record into the bookings table
    const insertQuery = `
      INSERT INTO bookings (student_id, tutor_id, booking_date, status)
      VALUES ($1, $2, $3, 'PENDING')
      RETURNING id, student_id, tutor_id, booking_date, status, created_at;
    `;
    const executionResult = await db.query(insertQuery, [
      req.user.id,
      tutorIdNumber,
      parsedDate
    ]);
 
    return res.status(201).json({
      success: true,
      message: "Success! Your lesson scheduling request has been filed as PENDING.",
      booking: executionResult.rows[0]
    });
 
  } catch (error) {
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
 
// @route   PUT /api/bookings/:id/status
// @desc    Modify the operational confirmation state of a specific lesson booking
// @access  Protected (restricted strictly to authenticated users with a TUTOR role)
router.put('/:id/status', auth, authorizeRoles('TUTOR'), async (req, res) => {
  try {
    const { status } = req.body;
 
    // Step 0: The booking id in the URL must be a positive whole number
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: The booking id in the URL must be a positive whole number."
      });
    }
 
    // Step 1: Input Status Presence & Boundary Evaluation
    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Validation failed: The status parameter string is strictly required."
      });
    }
 
    const validStates = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStates.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: Status must match exactly CONFIRMED, COMPLETED, or CANCELLED."
      });
    }
 
    // Step 2: Fetch the targeted booking record from the database to check ownership
    const bookingCheck = await db.query(
      'SELECT * FROM bookings WHERE id = \$1',
      [bookingId]
    );
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modification rejected: The target booking record index does not exist."
      });
    }
    const targetBooking = bookingCheck.rows[0];
 
    // Step 3: Verify the tutor's record ID to ensure ownership
    const tutorLookup = await db.query(
      'SELECT id FROM tutors WHERE user_id = \$1',
      [req.user.id]
    );
 
    if (tutorLookup.rows.length === 0 || targetBooking.tutor_id !== tutorLookup.rows[0].id) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are unauthorized to alter booking records assigned to other instructors."
      });
    }
 
    // Step 4: Execute the SQL UPDATE statement
    const updateQuery = `
      UPDATE bookings
      SET status = $1
      WHERE id = $2
      RETURNING id, student_id, tutor_id, booking_date, status;
    `;
    const finalResult = await db.query(updateQuery, [status.toUpperCase(), bookingId]);
 
    return res.status(200).json({
      success: true,
      message: "Success! The target lesson booking state has been updated.",
      updated_booking: finalResult.rows[0]
    });
 
  } catch (error) {
    console.error("Day 13 Status Overhaul Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server exception occurred during booking status update operations.",
      error: error.message
    });
  }
});
 
module.exports = router;




