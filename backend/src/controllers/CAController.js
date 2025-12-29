/**
 * CAController.js
 * V3.1 CA Actions
 */

const caInboxService = require('../services/ca/CAInboxService');
const errorResponse = require('../utils/errorResponse');

exports.getInbox = async (req, res, next) => {
    try {
        const { status, search, page, limit } = req.query;

        const result = await caInboxService.getInboxItems({
            status,
            search,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getFiling = async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const caFilingService = require('../services/ca/CAFilingService');

        // Pass req.user (CA) for access control
        const result = await caFilingService.getFilingForReview(filingId, req.user);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
