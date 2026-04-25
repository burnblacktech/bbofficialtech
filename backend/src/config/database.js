// =====================================================
// DATABASE CONFIGURATION — SWITCHABLE POSTGRESQL
// Supports: Local Postgres, Neon, Supabase, Railway, RDS
//
// Mode 1: DATABASE_URL (cloud) — single connection string
//   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
//   DATABASE_SSL=true (optional, auto-detected from URL)
//
// Mode 2: DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD (local)
//   No SSL by default. Set DATABASE_SSL=true to enable.
//
// Pool tuning: DB_POOL_MAX (default 5 for serverless, 20 for server)
// =====================================================

const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  require('dotenv').config();
} catch { /* dotenv optional */ }

const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../utils/logger');

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const connectionString = process.env.DATABASE_URL;

// Auto-detect SSL from connection string
const needsSSL = (url) => {
  if (process.env.DATABASE_SSL === 'true') return true;
  if (process.env.DATABASE_SSL === 'false') return false;
  if (!url) return false;
  return url.includes('sslmode=require') || url.includes('neon.tech') || url.includes('supabase');
};

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX) || (isServerless ? 3 : 20),
  min: parseInt(process.env.DB_POOL_MIN) || (isServerless ? 1 : 5),
  acquire: 30000,
  idle: isServerless ? 5000 : 10000,
  evict: isServerless ? 3000 : 10000,
};

const logQuery = (sql, timing) => {
  if (process.env.NODE_ENV === 'development' || process.env.DB_QUERY_LOGGING === 'true') {
    enterpriseLogger.debug('SQL', { query: sql, timing: timing ? `${timing}ms` : undefined });
  } else if (timing && timing > 100) {
    enterpriseLogger.warn('Slow query', { query: sql.substring(0, 200), duration: `${timing}ms` });
  }
};

const commonDefine = { timestamps: true, underscored: true, freezeTableName: true };

let sequelize;

if (connectionString) {
  const clean = connectionString.replace(/^["']|["']$/g, '');
  const ssl = needsSSL(clean);
  const provider = clean.includes('neon.tech') ? 'Neon' : clean.includes('supabase') ? 'Supabase' : 'Cloud';

  enterpriseLogger.info(`Database: ${provider} (SSL: ${ssl}, pool: ${poolConfig.max})`);

  sequelize = new Sequelize(clean, {
    dialect: 'postgres',
    logging: logQuery,
    benchmark: true,
    dialectOptions: {
      connectTimeout: 30000,
      ...(ssl ? { ssl: { require: true, rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } } : {}),
    },
    pool: poolConfig,
    define: commonDefine,
  });
} else {
  enterpriseLogger.info(`Database: Local PostgreSQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'burnblack_itr'})`);

  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'burnblack_itr',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: logQuery,
    benchmark: true,
    dialectOptions: { connectTimeout: 30000 },
    pool: poolConfig,
    define: commonDefine,
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established successfully');
    return true;
  } catch (error) {
    enterpriseLogger.error('Unable to connect to database', { error: error.message });
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    const ok = await testConnection();
    if (ok) { await sequelize.sync({ alter: false }); enterpriseLogger.info('Database initialized'); return true; }
    return false;
  } catch (error) {
    enterpriseLogger.error('Database init error', { error: error.message });
    return false;
  }
};

const closeDatabase = async () => {
  try { await sequelize.close(); enterpriseLogger.info('Database closed'); }
  catch (error) { enterpriseLogger.error('Error closing DB', { error: error.message }); }
};

module.exports = { sequelize, testConnection, initializeDatabase, closeDatabase };
