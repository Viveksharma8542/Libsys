const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'lms_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err);
});

/**
 * Execute a query with optional parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
