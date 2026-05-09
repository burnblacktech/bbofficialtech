/**
 * Vercel Serverless Entry Point
 */

// Explicit requires so Vercel's bundler includes these dynamic deps
require('pg');

let app;
let dbReady = false;

module.exports = async (req, res) => {
  try {
    // Lazy-load on first request (cold start)
    if (!app) {
      app = require('../src/app');
    }

    // Init DB once
    if (!dbReady) {
      try {
        const { sequelize } = require('../src/config/database');
        require('../src/models');
        await sequelize.authenticate();

        // Add missing columns that sync({ alter }) may fail on due to index constraints
        const qi = sequelize.getQueryInterface();
        const addColIfMissing = async (table, col, type) => {
          try {
            const cols = await qi.describeTable(table);
            if (!cols[col]) {
              await qi.addColumn(table, col, { type, allowNull: true });
              console.log(`Added ${table}.${col}`);
            }
          } catch (e) {
            // Table might not exist yet — sync will create it
          }
        };
        await addColIfMissing('user_profiles', 'pan_number_hash', 'VARCHAR(255)');
        await addColIfMissing('user_profiles', 'aadhaar_number_hash', 'VARCHAR(255)');
        await addColIfMissing('users', 'pan_verified_at', 'TIMESTAMP WITH TIME ZONE');
        await addColIfMissing('users', 'dob_verified', 'BOOLEAN');
        await addColIfMissing('users', 'dob_verified_at', 'TIMESTAMP WITH TIME ZONE');
        await addColIfMissing('users', 'aadhaar_verified', 'BOOLEAN');

        // Now sync remaining tables/columns
        await sequelize.sync({ alter: true });
        dbReady = true;
        console.log('DB connected and synced');
      } catch (dbErr) {
        console.error('DB init failed:', dbErr.message, dbErr.stack);
        // Continue anyway — some routes don't need DB
      }
    }

    return app(req, res);
  } catch (err) {
    console.error('Serverless function error:', err.message, err.stack);
    res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
};
