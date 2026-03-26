// =====================================================
// ENTERPRISE LOGGER
// =====================================================

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  }),
);

// Build transports — skip file transports on serverless (read-only filesystem)
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

if (!isServerless) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log'), maxsize: 5242880, maxFiles: 5 }),
    );
  } catch { /* skip file logging if dir creation fails */ }
}

// Create logger instance
const enterpriseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'burnblack-itr' },
  transports,

  // Handle uncaught exceptions and rejections — console only on serverless
  exceptionHandlers: isServerless ? [new winston.transports.Console()] : [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
  ],
  rejectionHandlers: isServerless ? [new winston.transports.Console()] : [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') }),
  ],
});

// Add request logging method
enterpriseLogger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  };

  if (res.statusCode >= 400) {
    enterpriseLogger.warn('HTTP Request', logData);
  } else {
    enterpriseLogger.info('HTTP Request', logData);
  }
};

// Add security event logging
enterpriseLogger.logSecurityEvent = (event, details) => {
  enterpriseLogger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Add audit logging
enterpriseLogger.logAudit = (action, details) => {
  enterpriseLogger.info('Audit Event', {
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = enterpriseLogger;
