const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const seedPath = path.join(__dirname, '../../seed.sql');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    await db.query(schema);
    await db.query(seedData);

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
