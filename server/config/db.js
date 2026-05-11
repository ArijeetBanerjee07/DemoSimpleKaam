require('dotenv').config(); // safety net — ensures env is loaded before Pool is created

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Connected:', client.database);
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
