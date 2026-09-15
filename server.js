// Step 1: Boot up the dotenv engine to capture hidden environment attributes into memory
require('dotenv').config();
const express = require('express');
const app = express();

// Step 2: Extract the custom Port allocation parameter. Fall back to 3000 if the file card is missing.
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome to the BrightMinds Online Tuition & Tutor Matching API Engine!');
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 BrightMinds Server running via Environment Control!`);
    console.log(`📡 URL Connection: http://localhost:${PORT}`);
    console.log(`====================================================`);
});

