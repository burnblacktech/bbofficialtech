// =====================================================
// FORM 16 UPLOADER - Enhanced with Multi-File Support
// Matches UX.md PATH A specification
// =====================================================

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle, Loader, AlertCircle, IndianRupee } from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs } from '../../lib/motion';
import { form16ExtractionService } from '../../services';
import toast from 'react-hot-toast';

const Form16Uploader = ({ onComplete, onSummaryUpdate }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (files) => {
    const newFiles = Array.from(files);

    for (const file of newFiles) {
      // Validate file
      const validation = form16ExtractionService.validateForm16File(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.errors.join(', ')}`);
        continue;
      }

      // Create file entry
      const fileEntry = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        status: 'uploading',
        extractedData: null,
        error: null,
      };

      setUploadedFiles((prev) => [...prev, fileEntry]);

      try {
        // Extract data
        const result = await form16ExtractionService.extractForm16Data(file);

        if (result.success) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileEntry.id
                ? {
                    ...f,
                    status: 'success',
                    extractedData: result.data,
                    employer: result.data?.employer?.name || 'Unknown',
                    income: result.data?.salary?.gross || 0,
                    tds: result.data?.tds?.total || 0,
                    period: result.data?.period || 'N/A',
                  }
                : f,
            ),
          );
        } else {
          throw new Error('Extraction failed');
        }
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, status: 'error', error: error.message } : f,
          ),
        );
        toast.error(`Failed to extract ${file.name}`);
      }
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect],
  );

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Calculate summary
  const summary = React.useMemo(() => {
    const successfulFiles = uploadedFiles.filter((f) => f.status === 'success');
    const totalIncome = successfulFiles.reduce((sum, f) => sum + (f.income || 0), 0);
    const totalTDS = successfulFiles.reduce((sum, f) => sum + (f.tds || 0), 0);
    const standardDeduction = totalIncome > 0 ? 75000 : 0;

    // Suggest ITR form based on detected income
    let suggestedITR = 'ITR-1';
    if (totalIncome > 5000000) {
      suggestedITR = 'ITR-2';
    }

    return {
      totalIncome,
      totalTDS,
      standardDeduction,
      suggestedITR,
      fileCount: successfulFiles.length,
    };
  }, [uploadedFiles]);

  // Update parent when summary changes
  React.useEffect(() => {
    if (onSummaryUpdate && summary.fileCount > 0) {
      onSummaryUpdate(summary);
    }
  }, [summary, onSummaryUpdate]);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50/50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-body-lg font-semibold text-slate-900 mb-2">
          Drop files here or click to upload
        </p>
        <p className="text-body-sm text-slate-600">
          Multiple Form 16s? Upload all of them.
        </p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((fileEntry) => (
            <motion.div
              key={fileEntry.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {fileEntry.status === 'uploading' ? (
                    <Loader className="w-5 h-5 text-primary-500 animate-spin" />
                  ) : fileEntry.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-error-500" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-body-md font-medium text-slate-900 truncate">
                        {fileEntry.name}
                      </span>
                    </div>
                    {fileEntry.status === 'success' && (
                      <div className="grid grid-cols-3 gap-4 mt-2 text-body-regular">
                        <div>
                          <span className="text-slate-500">Employer:</span>
                          <span className="ml-2 font-medium text-slate-900">{fileEntry.employer}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Income:</span>
                          <span className="ml-2 font-medium text-slate-900">{formatCurrency(fileEntry.income)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">TDS:</span>
                          <span className="ml-2 font-medium text-slate-900">{formatCurrency(fileEntry.tds)}</span>
                        </div>
                      </div>
                    )}
                    {fileEntry.status === 'error' && (
                      <p className="text-body-regular text-error-600 mt-1">{fileEntry.error}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileEntry.id);
                  }}
                  className="ml-4 p-2 text-slate-400 hover:text-error-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Combined Summary */}
      {summary.fileCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6"
        >
          <h3 className="text-heading-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Combined Summary
          </h3>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-body-md text-slate-700">Total Salary Income:</span>
              <span className="text-heading-md font-semibold text-slate-900">
                {formatCurrency(summary.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-md text-slate-700">Total TDS Deducted:</span>
              <span className="text-heading-md font-semibold text-slate-900">
                {formatCurrency(summary.totalTDS)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-md text-slate-700">Standard Deduction:</span>
              <span className="text-body-md font-medium text-slate-700">
                {formatCurrency(summary.standardDeduction)} (auto-applied)
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <p className="text-body-md font-medium text-blue-900 mb-2">
              Suggested Form: {summary.suggestedITR}
            </p>
            <p className="text-body-sm text-blue-700 mb-4">
              (Only salary income detected)
            </p>

            <div className="bg-white/60 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-body-sm text-blue-800">
                Have capital gains, foreign income, or business income? You may need ITR-2 or ITR-3.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Form16Uploader;

