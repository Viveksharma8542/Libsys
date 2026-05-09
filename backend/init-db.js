const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('\n❌ Please provide your Render Database URL:');
  console.error('   DATABASE_URL="postgres://user:pass@host:5432/lms_db" node init-db.js\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    console.log(' Connecting to database...');
    await pool.query('SELECT 1');
    console.log(' Connected!\n');

    console.log(' Running schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log(' Schema created successfully.\n');

    console.log(' Running seed.sql...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seed);
    console.log(' Seed data inserted successfully.\n');

    console.log(' All done! Your database is ready.');
    console.log(' Demo logins:');
    console.log('   Admin     → admin@library.edu / Admin@123');
    console.log('   Librarian → librarian@library.edu / Admin@123');
    console.log('   Student   → amit@student.edu / Admin@123\n');
  } catch (err) {
    console.error('\n Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
