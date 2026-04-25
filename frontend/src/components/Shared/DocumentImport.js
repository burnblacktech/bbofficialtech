/**
 * DocumentImport — Reusable file import component with review screen.
 * Used by Income Tracker (salary slip) and Investment Logger (MF statement).
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  salary: '.pdf,.png,.jpeg,.jpg',
  investment: '.pdf',
};

export default function DocumentImport({
  type = 'salary',
  buttonLabel = 'Import',
  onImportComplete,
}) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  const accept = ACCEPTED_TYPES[type] || '.pdf';

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    if (selected.size > MAX_FILE_SIZE) {
      setError('File size must not exceed 10MB');
      return;
    }

    const ext = selected.name.split('.').pop().toLowerCase();
    const validExts = accept.replace(/\./g, '').split(',');
    if (!validExts.includes(ext)) {
      setError(`Unsupported format. Accepted: ${accept}`);
      return;
    }

    setFile(selected);
    processFile(selected);
  };

  const processFile = async (f) => {
    setIsProcessing(true);
    setError(null);

    // Simulate extraction (in production, this would call an OCR/parsing API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (type === 'salary') {
        setReviewData({
          sourceType: 'salary',
          amount: '',
          dateReceived: new Date().toISOString().split('T')[0],
          description: `Imported from ${f.name}`,
        });
      } else {
        setReviewData({
          investmentType: 'elss',
          amount: '',
          dateOfInvestment: new Date().toISOString().split('T')[0],
          referenceNumber: '',
          description: `Imported from ${f.name}`,
        });
      }
    } catch {
      setError('Failed to extract data from file. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (reviewData && onImportComplete) {
      onImportComplete(reviewData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setReviewData(null);
    setError(null);
    setIsProcessing(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        aria-label={`Import ${type} document`}
      />

      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'var(--bg-muted)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-light)',
        }}
      >
        <Upload size={14} />
        {buttonLabel}
      </button>

      {/* Processing / Review overlay */}
      <AnimatePresence>
        {(isProcessing || reviewData || error) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[90]"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[91] w-[90vw] max-w-[440px] rounded-xl p-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isProcessing ? 'Processing...' : 'Review Imported Data'}
                </h3>
                <button onClick={handleClose} style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              {isProcessing && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {type === 'salary' ? 'Extracting salary components...' : 'Extracting fund entries...'}
                  </p>
                </div>
              )}

              {error && !isProcessing && (
                <div className="flex items-center gap-2 p-3 rounded-lg mb-3" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                  <AlertCircle size={14} />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {reviewData && !isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <FileText size={14} />
                    <span>{file?.name}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Review and edit the extracted data below, then confirm to save.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleConfirm}
                      className="flex-1 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Open in Form
                    </button>
                    <button
                      onClick={handleClose}
                      className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
