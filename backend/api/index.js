/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's serverless functions
 */

const app = require('../src/app');

// Initialize database on cold start
const { sequelize } = require('../src/config/database');
const models = require('../src/models');

let dbInitialized = false;

const initDB = async () => {
  if (dbInitialized) return;
  try {
    await sequelize.authenticate();
    dbInitialized = true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

module.exports = async (req, res) => {
  await initDB();
  return app(req, res);
};
