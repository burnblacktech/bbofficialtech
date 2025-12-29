// =====================================================
// DEADLINE SERVICE
// Manages tax deadlines and reminders
// =====================================================

const { query: dbQuery } = require('../../utils/dbQuery');
const enterpriseLogger = require('../../utils/logger');
const YearService = require('./YearService');
const EmailService = require('../integration/EmailService');

class DeadlineService {
  constructor() {
    this.yearService = new YearService();
  }

  /**
   * Get deadlines for a user
   * @param {string} userId - User ID
   * @param {object} options - Options including year, type
   * @returns {array} Array of deadlines
   */
  async getDeadlines(userId, options = {}) {
    try {
      const { year, type } = options;
      const currentFY = this.yearService.getCurrentFY();

      // Get standard tax deadlines
      const standardDeadlines = this.getStandardDeadlines(currentFY, year);

      // Get user-specific deadlines from database
      const userDeadlines = await this.getUserDeadlines(userId, { year, type });

      // Combine and sort by date
      const allDeadlines = [...standardDeadlines, ...userDeadlines].sort(
        (a, b) => new Date(a.deadline_date) - new Date(b.deadline_date)
      );

      return allDeadlines;
    } catch (error) {
      enterpriseLogger.error('Get deadlines failed', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get standard tax deadlines for a financial year
   */
  getStandardDeadlines(currentFY, requestedYear = null) {
    const fy = requestedYear || currentFY;
    const [startYear] = fy.split('-').map(Number);
    const endYear = startYear + 1;

    const deadlines = [];

    // ITR Filing Deadline - July 31 of assessment year
    deadlines.push({
      id: `itr-filing-${fy}`,
      deadline_type: 'itr_filing',
      title: 'ITR Filing Deadline',
      deadline_date: new Date(endYear, 6, 31), // July 31
      description: `Last date to file ITR for FY ${fy}`,
      is_standard: true,
      reminder_enabled: true,
    });

    // Advance Tax Due Dates
    const advanceTaxDates = [
      { quarter: 'Q1', date: new Date(startYear, 5, 15), label: '15% of estimated tax' }, // June 15
      { quarter: 'Q2', date: new Date(startYear, 8, 15), label: '45% of estimated tax' }, // September 15
      { quarter: 'Q3', date: new Date(startYear, 11, 15), label: '75% of estimated tax' }, // December 15
      { quarter: 'Q4', date: new Date(endYear, 2, 15), label: '100% of estimated tax' }, // March 15
    ];

    advanceTaxDates.forEach(({ quarter, date, label }) => {
      deadlines.push({
        id: `advance-tax-${fy}-${quarter}`,
        deadline_type: 'advance_tax',
        title: `Advance Tax - ${quarter}`,
        deadline_date: date,
        description: `Advance tax payment due (${label})`,
        is_standard: true,
        reminder_enabled: true,
      });
    });

    // TDS Deposit Dates (monthly)
    for (let month = 3; month <= 14; month++) {
      const year = month <= 11 ? startYear : endYear;
      const monthIndex = month <= 11 ? month : month - 12;
      deadlines.push({
        id: `tds-deposit-${fy}-${month}`,
        deadline_type: 'tds_deposit',
        title: 'TDS Deposit',
        deadline_date: new Date(year, monthIndex, 7), // 7th of each month
        description: 'TDS deposit due for previous month',
        is_standard: true,
        reminder_enabled: true,
      });
    }

    return deadlines;
  }

  /**
   * Get user-specific deadlines from database
   */
  async getUserDeadlines(userId, options = {}) {
    try {
      const { year, type } = options;
      let query = `
        SELECT id, user_id, deadline_type, deadline_date, title, description,
               reminder_enabled, reminder_days, created_at, updated_at
        FROM tax_deadlines
        WHERE user_id = $1
      `;
      const params = [userId];

      if (year) {
        query += ` AND EXTRACT(YEAR FROM deadline_date) = $${params.length + 1}`;
        params.push(parseInt(year));
      }

      if (type) {
        query += ` AND deadline_type = $${params.length + 1}`;
        params.push(type);
      }

      query += ` ORDER BY deadline_date ASC`;

      const result = await dbQuery(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        deadline_type: row.deadline_type,
        title: row.title,
        deadline_date: row.deadline_date,
        description: row.description,
        reminder_enabled: row.reminder_enabled,
        reminder_days: row.reminder_days,
        is_standard: false,
      }));
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a reminder for a deadline
   */
  async createReminder(userId, deadlineId, reminderDays) {
    try {
      // Check if reminder already exists
      const checkQuery = `
        SELECT id FROM user_reminders
        WHERE user_id = $1 AND deadline_id = $2
      `;
      const checkResult = await dbQuery(checkQuery, [userId, deadlineId]);

      if (checkResult.rows.length > 0) {
        // Update existing reminder
        const updateQuery = `
          UPDATE user_reminders
          SET reminder_days = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        const updateResult = await dbQuery(updateQuery, [
          JSON.stringify(reminderDays),
          checkResult.rows[0].id,
        ]);
        return updateResult.rows[0];
      }

      // Create new reminder
      const insertQuery = `
        INSERT INTO user_reminders (user_id, deadline_id, reminder_days, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const insertResult = await dbQuery(insertQuery, [
        userId,
        deadlineId,
        JSON.stringify(reminderDays),
      ]);

      return insertResult.rows[0];
    } catch (error) {
      // If table doesn't exist, create a mock reminder object
      if (error.message.includes('does not exist')) {
        return {
          id: `temp-${Date.now()}`,
          user_id: userId,
          deadline_id: deadlineId,
          reminder_days: reminderDays,
        };
      }
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(userId, reminderId, updateData) {
    try {
      const { reminderDays, enabled } = updateData;
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (reminderDays !== undefined) {
        updates.push(`reminder_days = $${paramIndex}`);
        params.push(JSON.stringify(reminderDays));
        paramIndex++;
      }

      if (enabled !== undefined) {
        updates.push(`enabled = $${paramIndex}`);
        params.push(enabled);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No update data provided');
      }

      updates.push(`updated_at = NOW()`);
      params.push(reminderId, userId);

      const query = `
        UPDATE user_reminders
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await dbQuery(query, params);

      if (result.rows.length === 0) {
        throw new Error('Reminder not found or unauthorized');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message.includes('does not exist')) {
        throw new Error('Reminders table does not exist');
      }
      throw error;
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(userId, reminderId) {
    try {
      const query = `
        DELETE FROM user_reminders
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await dbQuery(query, [reminderId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Reminder not found or unauthorized');
      }

      return { success: true };
    } catch (error) {
      if (error.message.includes('does not exist')) {
        throw new Error('Reminders table does not exist');
      }
      throw error;
    }
  }

  /**
   * Process reminders and send emails (to be called by cron job)
   */
  async processReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active reminders
      const query = `
        SELECT ur.id, ur.user_id, ur.deadline_id, ur.reminder_days,
               td.deadline_date, td.title, td.description, td.deadline_type,
               u.email, u.full_name
        FROM user_reminders ur
        JOIN tax_deadlines td ON ur.deadline_id = td.id
        JOIN users u ON ur.user_id = u.id
        WHERE ur.enabled = true
          AND ur.sent_at IS NULL
      `;

      const result = await dbQuery(query);
      const remindersToSend = [];

      for (const reminder of result.rows) {
        const deadlineDate = new Date(reminder.deadline_date);
        deadlineDate.setHours(0, 0, 0, 0);

        const reminderDays = JSON.parse(reminder.reminder_days || '[]');
        const daysUntilDeadline = Math.ceil(
          (deadlineDate - today) / (1000 * 60 * 60 * 24)
        );

        // Check if any reminder day matches
        if (reminderDays.includes(daysUntilDeadline)) {
          remindersToSend.push({
            ...reminder,
            daysUntilDeadline,
          });
        }
      }

      // Send reminder emails
      for (const reminder of remindersToSend) {
        try {
          await EmailService.sendReminderEmail(
            reminder.email,
            {
              id: reminder.deadline_id,
              deadline_type: reminder.deadline_type,
              deadline_date: reminder.deadline_date,
              title: reminder.title,
              description: reminder.description,
            },
            reminder.daysUntilDeadline
          );

          // Mark reminder as sent
          await dbQuery(
            `UPDATE user_reminders SET sent_at = NOW() WHERE id = $1`,
            [reminder.id]
          );

          enterpriseLogger.info('Reminder email sent', {
            userId: reminder.user_id,
            deadlineId: reminder.deadline_id,
            daysUntilDeadline: reminder.daysUntilDeadline,
          });
        } catch (emailError) {
          enterpriseLogger.error('Failed to send reminder email', {
            error: emailError.message,
            userId: reminder.user_id,
            deadlineId: reminder.deadline_id,
          });
        }
      }

      return {
        processed: remindersToSend.length,
        sent: remindersToSend.length,
      };
    } catch (error) {
      enterpriseLogger.error('Process reminders failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new DeadlineService();

