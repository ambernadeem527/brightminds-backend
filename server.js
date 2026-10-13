// server.js
// ---------------------------------------------------------------------------
// DAY 14 - Application entry point with centralized error handling
// ---------------------------------------------------------------------------
 
// Load variables from the .env file into process.env. This must run FIRST.
const path = require('path');

require('dotenv').config();
 
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
 
// Import our database configuration unit (used by the diagnostic route below)
const db = require('./config/db');
 
// Global Middleware Layer: parse raw text bodies into JSON objects (req.body)
// This MUST stay above the route mounts.
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// TEMPORARY DAY 15 DIAGNOSTIC LOGGER - Remove before final push
app.use((req, res, next) => {
  console.log(`[Diagnostic] Incoming Request: ${req.method} ${req.url}`);
  console.log(`[Diagnostic] Auth Header Received:`, req.headers['authorization']);
  next();
});

 
// Import and mount our modular routing channels
app.use('/api/users', require('./routes/users'));
app.use('/api/tutors', require('./routes/tutors'));
app.use('/api/bookings', require('./routes/bookings'));
 
// Primary baseline welcome gate route
app.get('/', (req, res) => {
  res.send('Welcome to the BrightMinds Online Tuition & Tutor Matching API Engine!');
});
 
// Diagnostic Simulation Route: purposefully trigger a database error to test
// our new engine. TEMPORARY - remove this route before any real deployment.
app.get('/api/cause-crash', async (req, res, next) => {
  try {
    // Run a broken SQL statement against a non-existent column to force a crash
    const brokenResult = await db.query('SELECT SEVERE_ERROR_COLUMN FROM tutors;');
    return res.status(200).json({ success: true, data: brokenResult.rows });
  } catch (error) {
    // CRITICAL UPDATE: pass the error object to the global handler using next()
    next(error);
  }
});
 
// REGISTRATION RULE: global error handling middleware must be registered LAST,
// after all other application routes and corridors have been mounted!
const globalErrorHandlerInstance = require('./middleware/errorHandler');
app.use(globalErrorHandlerInstance);
 
app.listen(PORT, () => {
  console.log(`BrightMinds Enterprise Engine running smoothly on port: ${PORT}`);
});




