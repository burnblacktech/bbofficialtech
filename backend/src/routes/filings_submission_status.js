/**
 * ERI Submission Outcome UX: Submission Status
 * GET /api/filings/:filingId/submission-status
 * Read-only projection of ERI submission outcome
 */
router.get('/:filingId/submission-status', authenticateToken, async (req, res, next) => {
    try {
        const { filingId } = req.params;
        const filing = await ITRFiling.findByPk(filingId);

        if (!filing) {
            throw new AppError('Filing not found', 404);
        }

        // Check ownership
        if (filing.createdBy !== req.user.userId) {
            throw new AppError('Not authorized to view this filing', 403);
        }

        const submissionStatus = await ERIOutcomeService.getSubmissionStatus(filingId);

        res.status(200).json({
            success: true,
            data: submissionStatus
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
