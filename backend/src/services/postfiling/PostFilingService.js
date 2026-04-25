/**
 * PostFilingService — Refund tracking, CPC decoding, revised return detection,
 * e-verification enforcement.
 */

const { ITRFiling } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');
const TaxBrainService = require('../tax/TaxBrainService');
const enterpriseLogger = require('../../utils/logger');

const n = (v) => Number(v) || 0;
const rs = (v) => `₹${Math.abs(n(v)).toLocaleString('en-IN')}`;

class PostFilingService {

  /**
   * Generate post-filing summary.
   */
  static async generateSummary(filingId) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    if (filing.lifecycleState !== 'eri_success' && filing.lifecycleState !== 'submitted_to_eri') {
      throw new AppError(ErrorCodes.PF_NOT_FILED, 'Filing has not been submitted yet', 409);
    }

    const comp = filing.taxComputation || {};
    const regime = filing.selectedRegime || 'new';
    const best = comp[regime === 'old' ? 'oldRegime' : 'newRegime'] || {};
    const tds = comp.tds || {};

    const isRefund = n(best.netPayable) <= 0;
    const amount = Math.abs(n(best.netPayable));

    const refundComposition = isRefund ? TaxBrainService.assembleRefundComposition(filing, comp) : null;

    return {
      filingId: filing.id,
      assessmentYear: filing.assessmentYear,
      itrType: filing.itrType,
      regime,
      isRefund,
      amount,
      totalTax: n(best.totalTax),
      totalCredits: n(tds.total),
      summary: isRefund
        ? `Your refund of ${rs(amount)} will be credited to your bank account after e-verification. ${refundComposition?.primaryReason || ''}`
        : `You have ${rs(amount)} tax payable. Pay via e-Pay Tax before the due date to avoid interest.`,
      refundComposition,
      acknowledgmentNumber: filing.acknowledgmentNumber,
      submittedAt: filing.submittedAt || filing.updatedAt,
    };
  }

  /**
   * Check refund status (mock for now — real implementation needs ERI/ITD API).
   */
  static async checkRefundStatus(filingId) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);

    // Mock refund status — in production, poll ITD via ERI
    const comp = filing.taxComputation || {};
    const regime = filing.selectedRegime || 'new';
    const best = comp[regime === 'old' ? 'oldRegime' : 'newRegime'] || {};
    const isRefund = n(best.netPayable) <= 0;

    if (!isRefund) return { hasRefund: false };

    return {
      hasRefund: true,
      amount: Math.abs(n(best.netPayable)),
      status: 'processed', // processed | issued | credited | failed
      lastChecked: new Date().toISOString(),
      message: 'Refund has been processed by CPC. Expected credit within 7-10 working days.',
      source: 'mock', // Will be 'eri' when live
    };
  }

  /**
   * Decode CPC intimation — delegates to TaxBrainService.
   */
  static async decodeCPCIntimation(filingId, intimationData) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);
    return TaxBrainService.decodeCPCIntimation(intimationData);
  }

  /**
   * Detect material differences between filed return and new document data.
   */
  static async detectDifferences(filingId, newDocumentData) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);

    const payload = filing.jsonPayload || {};
    const differences = [];

    // Compare TDS
    const filedTDS = n(payload.taxes?.tds?.fromSalary) + n(payload.taxes?.tds?.fromNonSalary);
    const newTDS = n(newDocumentData?.tds?.total);
    if (newTDS > 0 && Math.abs(filedTDS - newTDS) > 500) {
      differences.push({
        field: 'TDS',
        filed: filedTDS,
        new: newTDS,
        difference: newTDS - filedTDS,
        material: true,
        message: `TDS mismatch: filed ${rs(filedTDS)}, 26AS shows ${rs(newTDS)} (difference: ${rs(Math.abs(filedTDS - newTDS))})`,
      });
    }

    // Compare salary income
    const filedSalary = (payload.income?.salary?.employers || []).reduce((s, e) => s + n(e.grossSalary), 0);
    const newSalary = n(newDocumentData?.salary?.grossSalary);
    if (newSalary > 0 && Math.abs(filedSalary - newSalary) > 5000) {
      differences.push({
        field: 'Salary',
        filed: filedSalary,
        new: newSalary,
        difference: newSalary - filedSalary,
        material: true,
        message: `Salary mismatch: filed ${rs(filedSalary)}, Form 16 shows ${rs(newSalary)}`,
      });
    }

    // Check for missing income sources in new data
    if (newDocumentData?.otherIncome && !payload.income?.otherSources?.fdInterest && n(newDocumentData.otherIncome.fdInterest) > 0) {
      differences.push({
        field: 'FD Interest',
        filed: 0,
        new: n(newDocumentData.otherIncome.fdInterest),
        difference: n(newDocumentData.otherIncome.fdInterest),
        material: n(newDocumentData.otherIncome.fdInterest) > 5000,
        message: `FD interest of ${rs(newDocumentData.otherIncome.fdInterest)} found in new document but not in filed return`,
      });
    }

    const hasMaterialDifference = differences.some(d => d.material);

    return {
      differences,
      hasMaterialDifference,
      recommendation: hasMaterialDifference ? 'File a revised return to correct the discrepancies.' : 'No material differences found.',
    };
  }

  /**
   * Create a revised return from an original filing.
   */
  static async createRevisedReturn(originalFilingId, userId) {
    const original = await ITRFiling.findByPk(originalFilingId);
    if (!original) throw new AppError('Original filing not found', 404);
    if (original.createdBy !== userId) throw new AppError('Not authorized', 403);
    if (!original.acknowledgmentNumber) throw new AppError('Original filing has no acknowledgment number', 400);

    // Check deadline (before March 31 of AY)
    const canRevise = await this.canFileRevised(originalFilingId);
    if (!canRevise.allowed) {
      throw new AppError(ErrorCodes.PF_REVISED_DEADLINE, canRevise.reason, 409);
    }

    // Create revised filing
    const revised = await ITRFiling.create({
      createdBy: userId,
      assessmentYear: original.assessmentYear,
      taxpayerPan: original.taxpayerPan,
      itrType: original.itrType,
      filingType: 'revised',
      originalAckNumber: original.acknowledgmentNumber,
      originalFilingId: original.id,
      jsonPayload: { ...original.jsonPayload },
      selectedRegime: original.selectedRegime,
      lifecycleState: 'draft',
    });

    enterpriseLogger.info('Revised return created', { originalId: originalFilingId, revisedId: revised.id });
    return revised;
  }

  /**
   * Check if a revised return can be filed (deadline enforcement).
   */
  static async canFileRevised(originalFilingId) {
    const original = await ITRFiling.findByPk(originalFilingId);
    if (!original) return { allowed: false, reason: 'Original filing not found' };

    // Deadline: March 31 of the assessment year
    // AY 2025-26 → deadline is March 31, 2026
    const ayYear = parseInt(original.assessmentYear);
    const deadline = new Date(ayYear + 1, 2, 31); // March 31 of AY+1 (0-indexed month)

    if (new Date() > deadline) {
      return { allowed: false, reason: `Revised return deadline (March 31, ${ayYear + 1}) has passed.`, deadline };
    }

    return { allowed: true, deadline };
  }

  /**
   * Get e-verification status and deadline.
   */
  static async getEVerificationStatus(filingId) {
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) throw new AppError('Filing not found', 404);

    const isVerified = filing.verificationStatus === 'verified';
    const submittedAt = filing.submittedAt || filing.updatedAt;
    const deadline = submittedAt ? new Date(new Date(submittedAt).getTime() + 30 * 86400000) : null;
    const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 86400000)) : null;

    return {
      filingId: filing.id,
      isVerified,
      verificationDate: filing.verificationDate || null,
      verificationMethod: filing.verificationMethod || null,
      submittedAt,
      deadline: deadline?.toISOString(),
      daysLeft,
      severity: daysLeft === null ? 'none' : daysLeft <= 1 ? 'error' : daysLeft <= 7 ? 'warning' : 'info',
      message: isVerified
        ? 'Your return has been e-verified successfully.'
        : daysLeft <= 1
          ? 'URGENT: E-verify today or your return will be treated as not filed.'
          : `E-verify within ${daysLeft} days. Aadhaar OTP is the fastest method.`,
    };
  }
}

module.exports = PostFilingService;
