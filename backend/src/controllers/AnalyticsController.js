// =====================================================
// ANALYTICS CONTROLLER
// Handles financial storytelling API endpoints
// =====================================================

const FinancialStoryService = require('../services/analytics/FinancialStoryService');
const TimelineService = require('../services/analytics/TimelineService');
const InsightsEngine = require('../services/analytics/InsightsEngine');
const enterpriseLogger = require('../utils/logger');

class AnalyticsController {
    /**
     * Get financial story for user
     * GET /api/analytics/financial-story
     */
    async getFinancialStory(req, res) {
        try {
            const userId = req.user.userId;
            const years = parseInt(req.query.years) || 5;

            const story = await FinancialStoryService.getFinancialStory(userId, years);

            return res.json({
                success: true,
                data: story,
            });
        } catch (error) {
            enterpriseLogger.error('Error in getFinancialStory', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch financial story',
                error: error.message,
            });
        }
    }

    /**
     * Get timeline
     * GET /api/analytics/timeline
     */
    async getTimeline(req, res) {
        try {
            const userId = req.user.userId;
            const { start, end } = req.query;

            const timeline = await TimelineService.getTimeline(userId, start, end);

            return res.json({
                success: true,
                data: timeline,
            });
        } catch (error) {
            enterpriseLogger.error('Error in getTimeline', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch timeline',
                error: error.message,
            });
        }
    }

    /**
     * Get year-over-year comparison
     * GET /api/analytics/year-comparison
     */
    async getYearComparison(req, res) {
        try {
            const userId = req.user.userId;
            const { current, previous } = req.query;

            if (!current || !previous) {
                return res.status(400).json({
                    success: false,
                    message: 'Both current and previous years are required',
                });
            }

            const comparison = await FinancialStoryService.getYearOverYearComparison(
                userId,
                current,
                previous
            );

            return res.json({
                success: true,
                data: comparison,
            });
        } catch (error) {
            enterpriseLogger.error('Error in getYearComparison', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch year comparison',
                error: error.message,
            });
        }
    }

    /**
     * Get insights for assessment year
     * GET /api/analytics/insights/:assessmentYear
     */
    async getInsights(req, res) {
        try {
            const userId = req.user.userId;
            const { assessmentYear } = req.params;

            const insights = await InsightsEngine.getInsights(userId, assessmentYear);

            return res.json({
                success: true,
                data: insights,
            });
        } catch (error) {
            enterpriseLogger.error('Error in getInsights', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch insights',
                error: error.message,
            });
        }
    }

    /**
     * Create snapshot from filing
     * POST /api/analytics/snapshot/:filingId
     */
    async createSnapshot(req, res) {
        try {
            const { filingId } = req.params;
            const userId = req.user.userId;

            // Create snapshot
            const snapshot = await FinancialStoryService.createSnapshotFromFiling(filingId);

            // Detect milestones
            await TimelineService.detectMilestones(userId, filingId);

            // Generate insights
            await InsightsEngine.generateInsights(userId, snapshot.assessmentYear);

            return res.json({
                success: true,
                message: 'Snapshot created successfully',
                data: snapshot,
            });
        } catch (error) {
            enterpriseLogger.error('Error in createSnapshot', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to create snapshot',
                error: error.message,
            });
        }
    }

    /**
     * Get growth metrics
     * GET /api/analytics/growth-metrics
     */
    async getGrowthMetrics(req, res) {
        try {
            const userId = req.user.userId;
            const years = parseInt(req.query.years) || 5;

            const metrics = await FinancialStoryService.calculateGrowthMetrics(userId, years);

            return res.json({
                success: true,
                data: metrics,
            });
        } catch (error) {
            enterpriseLogger.error('Error in getGrowthMetrics', {
                error: error.message,
                stack: error.stack,
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch growth metrics',
                error: error.message,
            });
        }
    }
    /**
     * Track analytics event
     * POST /api/analytics/events
     */
    async trackEvent(req, res) {
        try {
            const userId = req.user ? req.user.userId : 'anonymous';
            const { event, properties } = req.body;

            enterpriseLogger.info(`[Analytics] ${event}`, {
                userId,
                ...properties
            });

            return res.json({
                success: true,
                message: 'Event tracked successfully'
            });
        } catch (error) {
            // Don't block on analytics errors
            enterpriseLogger.error('Error in trackEvent', {
                error: error.message
            });
            return res.json({ success: true });
        }
    }
}

module.exports = new AnalyticsController();
