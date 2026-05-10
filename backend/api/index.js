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
        dbReady = true;
        // Sync schema in background (non-blocking) — adds missing tables/columns
        sequelize.sync({ alter: true }).catch(e => console.error('DB sync error (non-blocking):', e.message));
        console.log('DB connected');
      } catch (dbErr) {
        console.error('DB init failed:', dbErr.message);
        dbReady = true;
      }
    }

    return app(req, res);
  } catch (err) {
    console.error('Serverless function error:', err.message, err.stack);
    res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
};
