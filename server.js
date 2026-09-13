// Step 1: Import the external Express structural framework logic module
const express = require('express');

// Step 2: Instantiate an operational web engine instance from the Express class blueprint
const app = express();

// Step 3: Establish the network gateway port coordinates where the engine will monitor paths
const PORT = 3000;

// Step 4: Map the primary base-level welcome gate route (Root URL endpoint)
app.get('/', (req, res) => {
    res.send('Welcome to the BrightMinds Online Tuition & Tutor Matching API Engine!');
});

// Step 5: Activate the network monitoring engine loop to intercept browser/client connections
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 BrightMinds Server is now LIVE and listening!`);
    console.log(`📡 URL Connection: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
