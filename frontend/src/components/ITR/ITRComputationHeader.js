// =====================================================
// ITR COMPUTATION HEADER
// Header component with back button, title, toggles, and actions
// =====================================================

import React from 'react';
import { ArrowLeft, Save, Download, FileText, Cloud, CloudOff, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import RegimeToggle from './RegimeToggle';
import ITRToggle from './ITRToggle';
import PauseResumeButton from './PauseResumeButton';
import InvoiceBadge from './InvoiceBadge';
import PDFExportButton from '../../features/pdf-export/components/pdf-export-button';

const ITRComputationHeader = ({
  onBack,
  userDisplayName,
  assessmentYear,
  selectedITR,
  onITRChange,
  taxRegime,
  onRegimeChange,
  regimeComparison,
  isComputingTax,
  autoSaveStatus,
  isReadOnly,
  isSaving,
  isDownloading,
  onSaveDraft,
  onDownloadJSON,
  onFileReturns,
  currentFiling,
  draftId,
  filingId,
  formData,
  onValidateCompatibility,
  exportDraftPDF,
}) => {
  const getFinancialYear = (ay) => {
    const [start, end] = ay.split('-');
    const fyStart = parseInt(start) - 1;
    const fyEnd = parseInt(end) - 1;
    return `FY ${fyStart}-${fyEnd.toString().slice(-2)}`;
  };

  return (
    <header className="bg-white border-b border-neutral-200 z-50 flex-shrink-0">
      <div className="max-w-[1400px] mx-auto px-3">
        {/* Main Header Bar - Compact 48px height */}
        <div className="flex items-center justify-between h-12">
          {/* Left: Back + Title - Compact spacing */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-display text-neutral-900">
                Income Tax Computation
              </h1>
              {userDisplayName && (
                <>
                  <span className="text-neutral-300 text-xs">•</span>
                  <span className="text-xs font-medium text-neutral-700">{userDisplayName}</span>
                </>
              )}
              <span className="text-neutral-300 text-xs">•</span>
              <span className="text-xs font-medium text-neutral-700">{getFinancialYear(assessmentYear)}</span>
            </div>
          </div>

          {/* Center: ITR Toggle and Regime Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <ITRToggle
              selectedITR={selectedITR}
              onITRChange={onITRChange}
              currentFormData={formData}
              onValidateCompatibility={onValidateCompatibility}
            />
            <RegimeToggle
              regime={taxRegime}
              onRegimeChange={onRegimeChange}
              savings={regimeComparison ? {
                amount: Math.abs(regimeComparison.savings || 0),
                betterRegime: (regimeComparison.savings || 0) > 0 ? 'new' : 'old',
              } : null}
              isLoading={isComputingTax}
            />
          </div>

          {/* Right: Actions - Compact */}
          <div className="flex items-center gap-1.5">
            {/* Auto-save indicator - compact */}
            {!isReadOnly && (
              <div className="hidden sm:flex items-center text-[10px] text-neutral-500" style={{ gap: '2px' }}>
                {!navigator.onLine ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-warning-500"
                    style={{ gap: '2px' }}
                  >
                    <CloudOff className="w-3 h-3" />
                  </motion.span>
                ) : autoSaveStatus === 'saving' ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-info-500"
                    style={{ gap: '2px' }}
                  >
                    <Cloud className="w-3 h-3 animate-pulse" />
                  </motion.span>
                ) : autoSaveStatus === 'error' ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-error-500"
                    style={{ gap: '2px' }}
                  >
                    <AlertCircle className="w-3 h-3" />
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-success-500"
                    style={{ gap: '2px' }}
                  >
                    <Check className="w-3 h-3" />
                  </motion.span>
                )}
              </div>
            )}

            {/* Pause/Resume Button */}
            {!isReadOnly && (draftId || filingId) && (
              <PauseResumeButton
                filingId={filingId}
                draftId={draftId}
                currentFiling={currentFiling}
                onPaused={() => {}}
                onResumed={() => {}}
              />
            )}

            {/* Invoice Badge */}
            {currentFiling?.invoiceId && (
              <InvoiceBadge invoiceId={currentFiling.invoiceId} />
            )}

            {/* Save Button */}
            {!isReadOnly && (
              <button
                onClick={onSaveDraft}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            {/* PDF Export */}
            {!isReadOnly && (draftId || filingId) && (
              <PDFExportButton
                draftId={draftId}
                filingId={filingId}
                onExport={exportDraftPDF}
              />
            )}

            {/* Download JSON */}
            <button
              onClick={onDownloadJSON}
              disabled={isDownloading}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            {/* File Returns Button */}
            {!isReadOnly && (
              <button
                onClick={onFileReturns}
                className="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">File</span>
              </button>
            )}
          </div>
        </div>

        {/* Tax Computation Bar */}
        <div className="border-t border-neutral-100">
          {/* TaxComputationBar will be rendered here by parent */}
        </div>
      </div>
    </header>
  );
};

export default React.memo(ITRComputationHeader);

