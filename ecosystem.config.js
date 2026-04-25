// =====================================================
// PM2 ECOSYSTEM CONFIGURATION - BURNBACK PRODUCTION
// Process management configuration for production deployment
// =====================================================

module.exports = {
  apps: [
    {
      name: 'burnblack-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/burnblack',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        FRONTEND_URL: 'https://burnblack.com',
        ADMIN_URL: 'https://admin.burnblack.com'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        FRONTEND_URL: 'https://burnblack.com',
        ADMIN_URL: 'https://admin.burnblack.com'
      },
      // Logging
      log_file: '/var/log/burnblack/combined.log',
      out_file: '/var/log/burnblack/out.log',
      error_file: '/var/log/burnblack/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced features
      merge_logs: true,
      time: true,
      
      // Environment variables (loaded from .env.production)
      env_file: '/var/www/burnblack/backend/.env.production'
    }
  ],

  // =====================================================
  // DEPLOYMENT CONFIGURATION
  // =====================================================
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-lightsail-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/burnblack.git',
      path: '/var/www/burnblack',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
