// =====================================================
// LOGGER UTILITY - SIMPLIFIED VERSION
// =====================================================

class Logger {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  log(level, message, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();

    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }
}

// Create singleton instance
const enterpriseLogger = new Logger();

export { enterpriseLogger };
export default enterpriseLogger;
