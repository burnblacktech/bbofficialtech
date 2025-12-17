// =====================================================
// RENT RECEIPT OCR UPLOAD COMPONENT
// Enhanced UI for uploading and processing rent receipts via OCR
// =====================================================

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Edit2, Sparkles, Loader } from 'lucide-react';
import rentReceiptOCRService from '../../../../services/RentReceiptOCRService';
import toast from 'react-hot-toast';
import { FieldAutoFillIndicator } from '../../../../components/UI/AutoFillIndicator/AutoFillIndicator';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';

const RentReceiptOCRUpload = ({ onExtracted, propertyIndex = null, filingId = null }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setExtractedData(null);
    setShowEdit(false);

    try {
      const result = await rentReceiptOCRService.extractRentReceiptData(file);

      if (result.success) {
        const validation = rentReceiptOCRService.validateExtractedData(result.data);

        const data = {
          ...result.data,
          confidence: result.confidence,
          validation,
          fileName: file.name,
          fileSize: file.size,
        };

        setExtractedData(data);
        setEditedData(data);

        if (validation.isValid) {
          toast.success('Rent receipt processed successfully');
        } else {
          toast.warning('Rent receipt processed with warnings. Please review.');
        }
      }
    } catch (error) {
      console.error('Rent receipt processing error:', error);
      toast.error('Failed to process rent receipt: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setExtractedData(null);

    try {
      const result = await rentReceiptOCRService.batchProcessRentReceipts(files, filingId);

      if (result.success) {
        toast.success(`Processed ${result.successful} of ${result.totalProcessed} receipt(s)`);
        // For batch, we'll show the first successful result
        if (result.results && result.results.length > 0) {
          const firstSuccess = result.results.find((r) => r.success);
          if (firstSuccess) {
            setExtractedData({
              ...firstSuccess.extractedData,
              confidence: firstSuccess.confidence,
              fileName: firstSuccess.fileName,
              batchResults: result.results,
            });
            setEditedData({
              ...firstSuccess.extractedData,
              confidence: firstSuccess.confidence,
              fileName: firstSuccess.fileName,
            });
          }
        }
      }
    } catch (error) {
      console.error('Batch rent receipt processing error:', error);
      toast.error('Failed to process rent receipts: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = () => {
    setExtractedData(editedData);
    setShowEdit(false);
    toast.success('Data updated');
  };

  const handleApply = () => {
    if (onExtracted && extractedData) {
      onExtracted(extractedData, propertyIndex);
      setExtractedData(null);
      setEditedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    setExtractedData(null);
    setEditedData(null);
    setShowEdit(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-heading-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
              Smart OCR Upload
              <SourceChip source="ocr" />
            </h4>
            <p className="text-body-sm text-slate-600 mb-4">
              Upload rent receipt images or PDFs to automatically extract rent amount, dates, and landlord details
            </p>

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="rent-receipt-ocr-input"
              />
              <label
                htmlFor="rent-receipt-ocr-input"
                className={`inline-flex items-center px-4 py-2.5 border-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  isProcessing
                    ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Single Receipt
                  </>
                )}
              </label>

              <input
                ref={batchFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleBatchUpload}
                disabled={isProcessing}
                multiple
                className="hidden"
                id="batch-rent-receipt-ocr-input"
              />
              <label
                htmlFor="batch-rent-receipt-ocr-input"
                className={`inline-flex items-center px-4 py-2.5 border-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  isProcessing
                    ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Multiple Receipts
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Data Display */}
      {extractedData && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-elevation-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h5 className="text-heading-sm font-semibold text-slate-900 mb-1">Extracted Data</h5>
                <div className="flex items-center gap-2">
                  <span className="text-body-xs text-slate-500">
                    Confidence: {Math.round((extractedData.confidence || 0) * 100)}%
                  </span>
                  <FieldAutoFillIndicator source="ocr" confidence={extractedData.confidence} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEdit(!showEdit)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                title="Edit extracted data"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-error-600 rounded-xl hover:bg-error-50"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showEdit ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-body-xs font-medium text-slate-700 mb-1">Rent Amount (₹)</label>
                  <input
                    type="number"
                    value={editedData?.rentAmount || ''}
                    onChange={(e) => handleEditChange('rentAmount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-slate-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={editedData?.period || ''}
                    onChange={(e) => handleEditChange('period', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., January 2024"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-slate-700 mb-1">Landlord Name</label>
                  <input
                    type="text"
                    value={editedData?.landlordName || ''}
                    onChange={(e) => handleEditChange('landlordName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-slate-700 mb-1">TDS Deducted (₹)</label>
                  <input
                    type="number"
                    value={editedData?.tdsDeducted || ''}
                    onChange={(e) => handleEditChange('tdsDeducted', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-body-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEdit(false);
                    setEditedData(extractedData);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-gray-300 font-medium text-body-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-body-xs text-slate-600 block mb-1">Rent Amount</span>
                  <div className="text-heading-sm font-semibold text-slate-900">
                    ₹{extractedData.rentAmount?.toLocaleString('en-IN') || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-body-xs text-slate-600 block mb-1">Period</span>
                  <div className="text-heading-sm font-semibold text-slate-900">
                    {extractedData.period || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-body-xs text-slate-600 block mb-1">Landlord Name</span>
                  <div className="text-heading-sm font-semibold text-slate-900">
                    {extractedData.landlordName || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-body-xs text-slate-600 block mb-1">TDS Deducted</span>
                  <div className="text-heading-sm font-semibold text-slate-900">
                    {extractedData.tdsDeducted
                      ? `₹${extractedData.tdsDeducted.toLocaleString('en-IN')}`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {extractedData.validation?.warnings?.length > 0 && (
                <div className="mb-4 bg-warning-50 border border-warning-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-body-xs font-medium text-warning-800 mb-1">Validation Warnings</p>
                      <ul className="text-body-xs text-warning-700 space-y-1">
                        {extractedData.validation.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {onExtracted && (
                <button
                  onClick={handleApply}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply to Property
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RentReceiptOCRUpload;

