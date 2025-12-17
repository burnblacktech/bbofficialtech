// =====================================================
// DATABASE CONFIGURATION - POSTGRESQL (LOCAL OR SUPABASE)
// =====================================================

// Ensure environment variables are available even when running standalone scripts (migrations, audits, etc.)
// Server entry (`src/server.js`) already loads dotenv; this is for direct script execution.
const path = require('path');
try {
  // Prefer backend/.env when executing from repo root or elsewhere
  // backend/src/config -> ../../.env
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  // Fallback to default dotenv behavior
  require('dotenv').config();
} catch {
  // dotenv may not be available in some environments; ignore
}

const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../utils/logger');

// Check if using Supabase (has supabase in host or SUPABASE_DATABASE_URL)
const isSupabase = process.env.DB_HOST?.includes('supabase') || !!process.env.SUPABASE_DATABASE_URL;

// Use connection string if available (Supabase), otherwise use individual config
let sequelize;

// Prefer DIRECT_URI (direct connection) - more reliable for migrations
// Fallback to pooler if direct not available
const connectionString = process.env.DIRECT_URI || process.env.SUPABASE_DATABASE_URL;

if (connectionString) {
  // Clean connection string (remove quotes if present)
  let cleanConnectionString = connectionString.replace(/^["']|["']$/g, '');
  
  // Auto-encode password if it contains special characters and isn't already encoded
  // Check if password part needs encoding (between : and @)
  const passwordMatch = cleanConnectionString.match(/:\/([^:]+):([^@]+)@/);
  if (passwordMatch) {
    const user = passwordMatch[1];
    const password = passwordMatch[2];
    // If password contains unencoded special chars, encode them
    if (password.includes('&') || password.includes('+') || password.includes('?')) {
      const encodedPassword = encodeURIComponent(password);
      cleanConnectionString = cleanConnectionString.replace(
        `:${user}:${password}@`,
        `:${user}:${encodedPassword}@`
      );
      enterpriseLogger.info('Auto-encoded password in connection string');
    }
  }
  
  enterpriseLogger.info('Initializing Supabase connection', {
    connectionType: process.env.DIRECT_URI ? 'Direct URI' : 'Pooler',
    connectionStringPreview: cleanConnectionString.substring(0, 50) + '...',
    hasSSL: true,
  });
  
  // Use Supabase connection string
  sequelize = new Sequelize(cleanConnectionString, {
    dialect: 'postgres',
    logging: (msg, timing) => {
      // Log all queries in development, slow queries (> 100ms) in production
      if (process.env.NODE_ENV === 'development' || process.env.DB_QUERY_LOGGING === 'true') {
        enterpriseLogger.debug('Sequelize Query', { query: msg, timing: timing ? `${timing}ms` : undefined });
      } else if (timing && timing > 100) {
        enterpriseLogger.warn('Slow Sequelize query detected', {
          query: msg.substring(0, 200),
          duration: `${timing}ms`,
        });
      }
    },
    benchmark: true, // Enable query timing
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Supabase uses self-signed certificates
      },
      connectTimeout: 60000,
      requestTimeout: 60000,
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    // Set default schema search path to public
    schema: 'public',
  });
  
  enterpriseLogger.info(`Using Supabase ${process.env.DIRECT_URI ? 'direct' : 'pooler'} connection`);
} else {
  // Use individual database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'burnblack_itr',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    dialect: 'postgres',
    logging: (msg, timing) => {
      // Log all queries in development, slow queries (> 100ms) in production
      if (process.env.NODE_ENV === 'development' || process.env.DB_QUERY_LOGGING === 'true') {
        enterpriseLogger.debug('Sequelize Query', { query: msg, timing: timing ? `${timing}ms` : undefined });
      } else if (timing && timing > 100) {
        enterpriseLogger.warn('Slow Sequelize query detected', {
          query: msg.substring(0, 200),
          duration: `${timing}ms`,
        });
      }
    },
    benchmark: true, // Enable query timing

    // Connection pool settings
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 50, // Increased from 20 to 50 for better concurrency
      min: parseInt(process.env.DB_POOL_MIN) || 10, // Increased from 5 to 10
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
      evict: parseInt(process.env.DB_POOL_EVICT) || 1000, // Check for idle connections every 1s
    },

    // Connection timeout settings
    dialectOptions: {
      connectTimeout: 60000,
      requestTimeout: 60000,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      // Enable SSL for Supabase, disable for local
      ...(isSupabase ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : {}),
    },

    // Additional options
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  };

  sequelize = new Sequelize(dbConfig);
  
  if (isSupabase) {
    enterpriseLogger.info('Using Supabase with individual config (SSL enabled)');
  } else {
    enterpriseLogger.info('Using local PostgreSQL configuration');
  }
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established successfully', {
      usingConnectionString: !!process.env.SUPABASE_DATABASE_URL,
      isSupabase: isSupabase,
    });
    return true;
  } catch (error) {
    enterpriseLogger.error('Unable to connect to database', {
      error: error.message,
      errorStack: error.stack,
      usingConnectionString: !!process.env.SUPABASE_DATABASE_URL,
      isSupabase: isSupabase,
    });
    return false;
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      // Sync models (create tables if they don't exist)
      await sequelize.sync({ alter: false }); // Don't alter existing tables
      enterpriseLogger.info('Local PostgreSQL database initialized successfully');
      return true;
    } else {
      enterpriseLogger.error('Local PostgreSQL database initialization failed');
      return false;
    }
  } catch (error) {
    enterpriseLogger.error('Local PostgreSQL database initialization error', { error: error.message });
    return false;
  }
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await sequelize.close();
    enterpriseLogger.info('Local PostgreSQL database connection closed');
  } catch (error) {
    enterpriseLogger.error('Error closing local PostgreSQL database connection', { error: error.message });
  }
};

// Export Sequelize instance and utilities
module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  closeDatabase,
};