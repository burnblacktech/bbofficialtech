// =====================================================
// DATABASE CONFIGURATION - POSTGRESQL
// =====================================================

const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  require('dotenv').config();
} catch {
  // dotenv may not be available in some environments
}

const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../utils/logger');

let sequelize;

// Support a single DATABASE_URL connection string, or individual DB_* vars
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const cleanConnectionString = connectionString.replace(/^["']|["']$/g, '');

  enterpriseLogger.info('Initializing database via connection string');

  sequelize = new Sequelize(cleanConnectionString, {
    dialect: 'postgres',
    logging: (sql, timing) => {
      if (process.env.NODE_ENV === 'development' || process.env.DB_QUERY_LOGGING === 'true') {
        enterpriseLogger.debug('SQL', { query: sql, timing: timing ? `${timing}ms` : undefined });
      } else if (timing && timing > 100) {
        enterpriseLogger.warn('Slow query', { query: sql.substring(0, 200), duration: `${timing}ms` });
      }
    },
    benchmark: true,
    dialectOptions: {
      connectTimeout: 30000,
      // Enable SSL if DATABASE_SSL=true (most cloud providers need this)
      ...(process.env.DATABASE_SSL === 'true' ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      } : {}),
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
} else {
  // Individual config vars
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'burnblack_itr',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: (sql, timing) => {
      if (process.env.NODE_ENV === 'development' || process.env.DB_QUERY_LOGGING === 'true') {
        enterpriseLogger.debug('SQL', { query: sql, timing: timing ? `${timing}ms` : undefined });
      } else if (timing && timing > 100) {
        enterpriseLogger.warn('Slow query', { query: sql.substring(0, 200), duration: `${timing}ms` });
      }
    },
    benchmark: true,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 30000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  };

  sequelize = new Sequelize(dbConfig);
  enterpriseLogger.info('Using local PostgreSQL configuration');
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    enterpriseLogger.info('Database connection established successfully');
    return true;
  } catch (error) {
    enterpriseLogger.error('Unable to connect to database', {
      error: error.message,
    });
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      await sequelize.sync({ alter: false });
      enterpriseLogger.info('Database initialized successfully');
      return true;
    }
    enterpriseLogger.error('Database initialization failed');
    return false;
  } catch (error) {
    enterpriseLogger.error('Database initialization error', { error: error.message });
    return false;
  }
};

const closeDatabase = async () => {
  try {
    await sequelize.close();
    enterpriseLogger.info('Database connection closed');
  } catch (error) {
    enterpriseLogger.error('Error closing database connection', { error: error.message });
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  closeDatabase,
};
