// =====================================================
// JOB QUEUE SERVICE
// Background job processing using Bull with Redis
// Supports async processing for tax computation, OCR, document processing
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const redisService = require('./RedisService');

let Bull;
try {
  Bull = require('bull');
} catch (error) {
  // Bull not installed - Job queue functionality will be disabled
  enterpriseLogger.warn('bull not found - Job queue features will be disabled', {
    error: error.message,
  });
  Bull = null;
}

class JobQueueService {
  constructor() {
    this.queues = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize job queues
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (!Bull) {
      enterpriseLogger.warn('Job queue not initialized: Bull package not available');
      this.isInitialized = false;
      return false;
    }

    if (!redisService.isReady()) {
      enterpriseLogger.warn('Job queue not initialized: Redis not available');
      this.isInitialized = false;
      return false;
    }

    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
      };

      // Create queues for different job types
      this.queues.set('tax-computation', new Bull('tax-computation', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }));

      this.queues.set('ocr-processing', new Bull('ocr-processing', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 200,
          attempts: 2,
          timeout: 30000, // 30 second timeout
        },
      }));

      this.queues.set('document-processing', new Bull('document-processing', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 300,
          attempts: 2,
        },
      }));

      // Set up event handlers for each queue
      for (const [name, queue] of this.queues.entries()) {
        this.setupQueueHandlers(name, queue);
      }

      this.isInitialized = true;
      enterpriseLogger.info('Job queue service initialized', {
        queues: Array.from(this.queues.keys()),
      });

      return true;
    } catch (error) {
      enterpriseLogger.error('Failed to initialize job queue service', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Set up event handlers for a queue
   */
  setupQueueHandlers(name, queue) {
    queue.on('completed', (job, result) => {
      enterpriseLogger.info(`Job completed: ${name}`, {
        jobId: job.id,
        duration: Date.now() - job.timestamp,
      });
    });

    queue.on('failed', (job, error) => {
      enterpriseLogger.error(`Job failed: ${name}`, {
        jobId: job.id,
        error: error.message,
        attemptsMade: job.attemptsMade,
      });
    });

    queue.on('stalled', (job) => {
      enterpriseLogger.warn(`Job stalled: ${name}`, {
        jobId: job.id,
      });
    });

    queue.on('error', (error) => {
      enterpriseLogger.error(`Queue error: ${name}`, {
        error: error.message,
      });
    });
  }

  /**
   * Get a queue by name
   */
  getQueue(name) {
    if (!this.isInitialized) {
      throw new Error('Job queue service not initialized');
    }

    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue not found: ${name}`);
    }

    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName, jobData, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Job queue service not initialized');
    }

    const queue = this.getQueue(queueName);
    const job = await queue.add(jobData, options);

    enterpriseLogger.info(`Job added to queue: ${queueName}`, {
      jobId: job.id,
      dataKeys: Object.keys(jobData),
    });

    return job;
  }

  /**
   * Process jobs from a queue
   */
  processQueue(queueName, processor, concurrency = 1) {
    if (!this.isInitialized) {
      throw new Error('Job queue service not initialized');
    }

    const queue = this.getQueue(queueName);
    queue.process(concurrency, processor);

    enterpriseLogger.info(`Queue processor started: ${queueName}`, {
      concurrency,
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const queue = this.getQueue(queueName);
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      enterpriseLogger.error(`Error getting queue stats: ${queueName}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllStats() {
    const stats = {};
    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    return stats;
  }

  /**
   * Clean up old jobs
   */
  async cleanQueue(queueName, grace = 24 * 60 * 60 * 1000) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const queue = this.getQueue(queueName);
      await queue.clean(grace, 'completed');
      await queue.clean(grace * 2, 'failed');
      enterpriseLogger.info(`Cleaned queue: ${queueName}`, { grace });
    } catch (error) {
      enterpriseLogger.error(`Error cleaning queue: ${queueName}`, {
        error: error.message,
      });
    }
  }

  /**
   * Close all queues
   */
  async close() {
    if (!this.isInitialized || this.queues.size === 0) {
      enterpriseLogger.info('Job queue service not initialized, skipping close');
      return;
    }

    enterpriseLogger.info('Closing job queue service...');

    for (const [name, queue] of this.queues.entries()) {
      try {
        if (queue) {
          await queue.close();
          enterpriseLogger.info(`Queue closed: ${name}`);
        }
      } catch (error) {
        enterpriseLogger.error(`Error closing queue: ${name}`, {
          error: error.message,
        });
      }
    }

    this.queues.clear();
    this.isInitialized = false;
    enterpriseLogger.info('Job queue service closed');
  }
}

// Singleton instance
const jobQueueService = new JobQueueService();

module.exports = jobQueueService;

