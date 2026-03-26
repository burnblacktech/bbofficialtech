// =====================================================
// LOGGER — Console-only in production/serverless, files in local dev
// =====================================================

const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  }),
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

// Only add file transports in local dev (not serverless, not production)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    const fs = require('fs');
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log'), maxsize: 5242880, maxFiles: 5 }),
    );
  } catch { /* skip */ }
}

const enterpriseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'burnblack-itr' },
  transports,
});

enterpriseLogger.logRequest = (req, res, responseTime) => {
  const d = { method: req.method, url: req.url, statusCode: res.statusCode, responseTime: `${responseTime}ms`, ip: req.ip };
  res.statusCode >= 400 ? enterpriseLogger.warn('HTTP', d) : enterpriseLogger.info('HTTP', d);
};

enterpriseLogger.logSecurityEvent = (event, details) => {
  enterpriseLogger.warn('Security', { event, ...details });
};

enterpriseLogger.logAudit = (action, details) => {
  enterpriseLogger.info('Audit', { action, ...details });
};

module.exports = enterpriseLogger;
