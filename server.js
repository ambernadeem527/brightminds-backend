require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import our centralized database query bridge module
const db = require('./config/db');

app.use(express.json());

// Diagnostic Test Endpoint: Query real-time clocks directly from the SQL engine
app.get('/api/db-test', async (req, res) => {
    try {
        // Query the database engine for its current internal time
        const dbResult = await db.query('SELECT NOW();');
        res.status(200).json({
            success: true,
            message: "Database communication channel is running perfectly!",
            timestamp: dbResult.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database connection failure. Check your credentials.",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server monitoring active on port: ${PORT}`);
});

// Verification Endpoint: Check if all structural tables exist in our public database schema
app.get('/api/schema-verify', async (req, res) => {
    try {
        const tableAudit = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        res.status(200).json({
            success: true,
            found_tables: tableAudit.rows.map(row => row.table_name)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



