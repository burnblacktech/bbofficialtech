// =====================================================
// ENTERPRISE DEBUGGER SERVICE - SIMPLIFIED VERSION
// =====================================================

class EnterpriseDebugger {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.logs = [];
  }

  log(level, message, data = {}) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: new Error().stack,
    };

    this.logs.push(logEntry);

    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
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

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  startTimer(label) {
    if (!this.isEnabled) return;
    console.time(label);
  }

  endTimer(label) {
    if (!this.isEnabled) return;
    console.timeEnd(label);
  }

  // Component lifecycle tracking
  trackComponentMount(componentName, props) {
    this.info(`Component mounted: ${componentName}`, { props });
  }

  trackComponentUnmount(componentName) {
    this.info(`Component unmounted: ${componentName}`);
  }

  trackComponentUpdate(componentName, prevProps, nextProps) {
    this.debug(`Component updated: ${componentName}`, { prevProps, nextProps });
  }

  // Performance tracking
  trackPerformance(operation, duration, metadata) {
    this.info(`Performance: ${operation}`, { duration, ...metadata });
  }

  // Error tracking
  trackError(error, context) {
    this.error(`Error occurred: ${error.message}`, { error, context });
  }

  // API tracking
  trackAPIRequest(url, method, data) {
    this.debug(`API Request: ${method} ${url}`, { data });
  }

  trackAPIResponse(url, method, response, duration) {
    this.debug(`API Response: ${method} ${url}`, { response, duration });
  }

  trackAPIError(url, method, error) {
    this.error(`API Error: ${method} ${url}`, { error });
  }

  // Auth state tracking
  trackAuthState(user, isAuthenticated) {
    this.info('Auth state changed', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
    });
  }

  trackLoginAttempt(email, success) {
    this.info('Login attempt', { email, success });
  }

  trackLogout(userId) {
    this.info('User logged out', { userId });
  }
}

// Create singleton instance
const enterpriseDebugger = new EnterpriseDebugger();

export default enterpriseDebugger;
