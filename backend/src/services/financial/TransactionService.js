/**
 * TransactionService.js
 * Manages granular financial transactions (Bank, Cash, Investments)
 */

const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const Transaction = require('../../models/Transaction');
const enterpriseLogger = require('../../utils/logger');

class TransactionService {

    /**
     * Create a new transaction
     * @param {Object} data 
     * @param {String} userId
     */
    async createTransaction(data, userId) {
        const transaction = await sequelize.transaction();
        try {
            const newTxn = await Transaction.create({
                ...data,
                userId,
            }, { transaction });

            await transaction.commit();
            return newTxn;
        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Create transaction failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Bulk create transactions (e.g. statement upload)
     * @param {Array} transactions 
     * @param {String} userId 
     */
    async bulkCreateTransactions(transactions, userId) {
        const transaction = await sequelize.transaction();
        try {
            const validTxns = transactions.map(t => ({ ...t, userId }));
            const created = await Transaction.bulkCreate(validTxns, { transaction });

            await transaction.commit();
            return created;
        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Bulk create transactions failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get transactions with filters
     * @param {String} userId 
     * @param {Object} filters { startDate, endDate, category, type, minAmount }
     * @param {Object} pagination { page, limit }
     */
    async getTransactions(userId, filters = {}, pagination = { page: 1, limit: 50 }) {
        try {
            const where = { userId };

            if (filters.startDate && filters.endDate) {
                where.transactionDate = { [Op.between]: [filters.startDate, filters.endDate] };
            }
            if (filters.category) where.category = filters.category;
            if (filters.type) where.type = filters.type;
            if (filters.minAmount) where.amount = { [Op.gte]: filters.minAmount };

            const offset = (pagination.page - 1) * pagination.limit;

            const { count, rows } = await Transaction.findAndCountAll({
                where,
                limit: pagination.limit,
                offset,
                order: [['transactionDate', 'DESC']],
            });

            return {
                total: count,
                page: pagination.page,
                limit: pagination.limit,
                transactions: rows
            };
        } catch (error) {
            enterpriseLogger.error('Get transactions failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get financial summary (Net Flow)
     * @param {String} userId 
     * @param {Object} dateRange { startDate, endDate }
     */
    async getSummary(userId, dateRange = {}) {
        try {
            const where = { userId };
            if (dateRange.startDate && dateRange.endDate) {
                where.transactionDate = { [Op.between]: [dateRange.startDate, dateRange.endDate] };
            }

            const summary = await Transaction.findAll({
                where,
                attributes: [
                    'type',
                    [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
                ],
                group: ['type']
            });

            const result = { CREDIT: 0, DEBIT: 0, NET: 0 };
            summary.forEach(s => {
                const type = s.type; // CREDIT or DEBIT
                const amount = parseFloat(s.dataValues.totalAmount || 0);
                result[type] = amount;
            });

            result.NET = result.CREDIT - result.DEBIT;
            return result;
        } catch (error) {
            enterpriseLogger.error('Get transaction summary failed', { userId, error: error.message });
            throw error;
        }
    }
}

module.exports = new TransactionService();
