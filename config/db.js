const { Pool } = require('pg');

// Initialize the master configuration pool using variables from our secret .env file
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

// Run an internal event listener to confirm connection handshakes
pool.on('connect', () => {
    console.log('🐘 PostgreSQL Database resource pool connected successfully!');
});

// Catch errors that happen on idle connections
pool.on('error', (err) => {
    console.error('❌ Unexpected database pool anomaly:', err);
});

// Export the query helper interface so our separate route modules can use it
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
