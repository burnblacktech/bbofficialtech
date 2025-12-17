// =====================================================
// ITR TOGGLE COMPONENT
// ITR type selector with comparison view and switch confirmation
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertTriangle, CheckCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const ITR_OPTIONS = [
  { value: 'ITR-1', label: 'ITR-1 (Sahaj)', description: 'For salaried individuals' },
  { value: 'ITR-2', label: 'ITR-2', description: 'For individuals with capital gains' },
  { value: 'ITR-3', label: 'ITR-3', description: 'For business/profession income' },
  { value: 'ITR-4', label: 'ITR-4 (Sugam)', description: 'For presumptive taxation' },
];

const ITRToggle = ({
  selectedITR,
  onITRChange,
  currentFormData = {},
  onValidateCompatibility = null,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [proposedITR, setProposedITR] = useState(null);
  const [compatibilityResult, setCompatibilityResult] = useState(null);

  const handleITRSelect = async (itrValue) => {
    if (itrValue === selectedITR) {
      setIsOpen(false);
      return;
    }

    // Validate compatibility if validator provided
    if (onValidateCompatibility) {
      try {
        const result = await onValidateCompatibility(selectedITR, itrValue, currentFormData);
        setCompatibilityResult(result);
        setProposedITR(itrValue);
        setShowComparison(true);
      } catch (error) {
        console.error('Compatibility check failed:', error);
        // Proceed with switch if validation fails
        onITRChange(itrValue);
        setIsOpen(false);
      }
    } else {
      // Direct switch if no validator
      onITRChange(itrValue);
      setIsOpen(false);
    }
  };

  const handleConfirmSwitch = () => {
    if (proposedITR) {
      onITRChange(proposedITR);
      setShowComparison(false);
      setProposedITR(null);
      setCompatibilityResult(null);
      setIsOpen(false);
    }
  };

  const handleCancelSwitch = () => {
    setShowComparison(false);
    setProposedITR(null);
    setCompatibilityResult(null);
  };

  const currentITROption = ITR_OPTIONS.find(opt => opt.value === selectedITR) || ITR_OPTIONS[0];

  return (
    <>
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200',
            'bg-white hover:bg-slate-50 transition-colors',
            'text-sm font-medium text-slate-700',
          )}
        >
          <FileText className="w-4 h-4" />
          <span>{currentITROption.label}</span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-elevation-3 border border-slate-200 z-50 overflow-hidden"
            >
              <div className="p-2">
                {ITR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleITRSelect(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                      'hover:bg-slate-50',
                      selectedITR === option.value && 'bg-gold-50 text-gold-800 font-medium',
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-body-small text-slate-500 mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && compatibilityResult && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-elevation-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-heading-4 font-bold text-slate-900">ITR Type Switch</h3>
                  <button
                    onClick={handleCancelSwitch}
                    className="p-1 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {compatibilityResult.isCompatible ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Compatible switch detected</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-xl">
                        <div className="text-body-regular text-slate-500 mb-1">Current</div>
                        <div className="font-semibold text-slate-900">{selectedITR}</div>
                      </div>
                      <div className="p-4 border border-gold-200 bg-gold-50 rounded-xl">
                        <div className="text-body-regular text-gold-600 mb-1">Proposed</div>
                        <div className="font-semibold text-gold-800">{proposedITR}</div>
                      </div>
                    </div>

                    {compatibilityResult.compatibleFields?.length > 0 && (
                      <div>
                        <div className="text-body-regular font-medium text-slate-700 mb-2">Compatible Fields (will be migrated):</div>
                        <div className="flex flex-wrap gap-2">
                          {compatibilityResult.compatibleFields.map((field) => (
                            <span
                              key={field}
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-body-small"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleConfirmSwitch}
                        className="flex-1 px-4 py-2 bg-gold-600 text-white rounded-xl font-medium hover:bg-gold-700 transition-colors"
                      >
                        Confirm Switch
                      </button>
                      <button
                        onClick={handleCancelSwitch}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Incompatible switch detected</span>
                    </div>

                    <div className="text-body-regular text-slate-600">
                      {compatibilityResult.reason || 'Switching to this ITR type may cause data loss.'}
                    </div>

                    {compatibilityResult.incompatibleFields?.length > 0 && (
                      <div>
                        <div className="text-body-regular font-medium text-slate-700 mb-2">Incompatible Fields (will be cleared):</div>
                        <div className="flex flex-wrap gap-2">
                          {compatibilityResult.incompatibleFields.map((field) => (
                            <span
                              key={field}
                              className="px-2 py-1 bg-error-100 text-error-700 rounded text-body-small"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleConfirmSwitch}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                      >
                        Switch Anyway
                      </button>
                      <button
                        onClick={handleCancelSwitch}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ITRToggle;

