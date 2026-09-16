require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware Control: Convert raw input text string payloads into readable JS data objects
app.use(express.json());

// Import our custom department sub-routing scripts
const userCorridor = require('./routes/users');
const tutorCorridor = require('./routes/tutors');

// Link our custom sub-routers to clean, standardized web path access lines
app.use('/api/users', userCorridor);
app.use('/api/tutors', tutorCorridor);

app.get('/', (req, res) => {
    res.send('Welcome to the BrightMinds Online Tuition & Tutor Matching API Engine!');
});

app.listen(PORT, () => {
    console.log(`🚀 BrightMinds Specialized Routers Active on Connection Port: ${PORT}`);
});


