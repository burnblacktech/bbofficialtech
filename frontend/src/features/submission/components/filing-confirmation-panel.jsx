// =====================================================
// FILING CONFIRMATION PANEL
// Safety confirmation step before submitting ITR
// Shows filing summary and requires explicit confirmation
// =====================================================

import React from 'react';
import { FileCheck, AlertTriangle, X, Calculator, Calendar, IndianRupee, CheckCircle, Download } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';

/**
 * FilingConfirmationPanel
 *
 * A safety panel that appears when the user triggers the file_itr action.
 * Summarizes key filing details and requires explicit confirmation before submission.
 *
 * @param {object} props
 * @param {object} props.blueprint - Financial blueprint data
 * @param {object} props.formData - Current form data
 * @param {object} props.taxComputation - Tax computation result
 * @param {string} props.selectedITR - Selected ITR type (ITR-1, ITR-2, etc.)
 * @param {string} props.assessmentYear - Assessment year (e.g., "2025-26")
 * @param {string} props.taxRegime - Selected tax regime ('old' or 'new')
 * @param {boolean} props.isSubmitting - Whether submission is in progress
 * @param {function} props.onConfirm - Called when user confirms filing
 * @param {function} props.onCancel - Called when user cancels
 */
const FilingConfirmationPanel = ({
    blueprint,
    formData,
    taxComputation,
    selectedITR,
    assessmentYear,
    taxRegime,
    isSubmitting,
    onConfirm,
    onCancel,
    downloadUrl,
}) => {
    // Derive values from blueprint or taxComputation
    const taxPayable = taxComputation?.finalTaxLiability ||
        blueprint?.tax?.taxAfterSavings ||
        blueprint?.tax?.afterDeductions ||
        0;

    const refundAmount = taxComputation?.refundAmount ||
        (taxPayable < 0 ? Math.abs(taxPayable) : 0);

    const isRefund = refundAmount > 0 || taxPayable < 0;

    const grossTotalIncome = taxComputation?.grossTotalIncome ||
        blueprint?.income?.grossTotal ||
        blueprint?.income?.grossTotalIncome ||
        0;

    const totalDeductions = taxComputation?.totalDeductions ||
        blueprint?.savings?.fromDeductions ||
        0;

    const filingMode = 'Online'; // Currently only online filing is supported

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Confirm Filing</h2>
                                <p className="text-sm text-green-100">Review before you file</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="px-6 py-5 space-y-4">
                    {/* Filing Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* ITR Type */}
                        <div className="bg-slate-50 rounded-xl p-3">
                            <div className="text-body-small text-slate-600 mb-1">ITR Type</div>
                            <div className="text-body-regular font-semibold text-slate-900">
                                {selectedITR || 'N/A'}
                            </div>
                        </div>

                        {/* Assessment Year */}
                        <div className="bg-slate-50 rounded-xl p-3">
                            <div className="text-body-small text-slate-600 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Assessment Year
                            </div>
                            <div className="text-body-regular font-semibold text-slate-900">
                                {assessmentYear || 'N/A'}
                            </div>
                        </div>

                        {/* Tax Regime */}
                        <div className="bg-slate-50 rounded-xl p-3">
                            <div className="text-body-small text-slate-600 mb-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Tax Regime
                            </div>
                            <div className="text-body-regular font-semibold text-slate-900 capitalize">
                                {taxRegime === 'new' ? 'New Regime' : 'Old Regime'}
                            </div>
                        </div>

                        {/* Filing Mode */}
                        <div className="bg-slate-50 rounded-xl p-3">
                            <div className="text-body-small text-slate-600 mb-1">Filing Mode</div>
                            <div className="text-body-regular font-semibold text-slate-900">
                                {filingMode}
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-body-regular text-slate-600">Gross Total Income</span>
                            <span className="text-body-regular font-semibold text-slate-900">
                                {formatIndianCurrency(grossTotalIncome)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-body-regular text-slate-600">Total Deductions</span>
                            <span className="text-body-regular font-semibold text-slate-900">
                                {formatIndianCurrency(totalDeductions)}
                            </span>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-body-regular font-medium text-slate-700">
                                    {isRefund ? 'Refund Amount' : 'Tax Payable'}
                                </span>
                                <span className={`text-heading-5 font-bold ${isRefund ? 'text-green-600' : 'text-amber-600'}`}>
                                    {formatIndianCurrency(isRefund ? refundAmount : Math.abs(taxPayable))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-body-small text-amber-900">
                                <p className="font-semibold mb-1">Please verify before filing</p>
                                <p>
                                    Once submitted, the ITR cannot be modified. You may file a revised return
                                    if corrections are needed later.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Download Nudge */}
                    {downloadUrl && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-blue-600" />
                                <div className="text-body-small text-blue-900">
                                    <p className="font-semibold">Optional: Archive your return</p>
                                    <p className="text-[10px]">Download a copy for your personal records.</p>
                                </div>
                            </div>
                            <a
                                href={downloadUrl}
                                download
                                className="text-body-small font-bold text-blue-600 hover:text-blue-700 underline"
                            >
                                Download JSON
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="bg-slate-50 px-6 py-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Filing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Confirm & File
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilingConfirmationPanel;
