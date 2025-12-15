// =====================================================
// PROPERTY DOCUMENT OCR UPLOAD COMPONENT
// UI component for uploading and processing property documents (sale deed, registration, etc.) via OCR
// =====================================================

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Edit2, Sparkles, Loader, Home } from 'lucide-react';
import rentReceiptOCRService from '../../../../services/RentReceiptOCRService';
import toast from 'react-hot-toast';
import { FieldAutoFillIndicator } from '../../../../components/UI/AutoFillIndicator/AutoFillIndicator';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import apiClient from '../../../../services/core/APIClient';

const PropertyDocumentOCRUpload = ({ onExtracted, propertyIndex = null, filingId = null }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [documentType, setDocumentType] = useState('sale_deed');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setExtractedData(null);
    setShowEdit(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (filingId) {
        formData.append('propertyId', filingId);
      }

      const response = await apiClient.post('/api/ocr/property-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const data = {
          ...response.data.extractedData,
          confidence: response.data.confidence,
          fileName: file.name,
          fileSize: file.size,
          documentType,
        };

        setExtractedData(data);
        setEditedData(data);

        if (response.data.confidence >= 0.8) {
          toast.success('Property document processed successfully');
        } else {
          toast.warning('Property document processed with low confidence. Please review.');
        }
      }
    } catch (error) {
      console.error('Property document processing error', { error });
      toast.error('Failed to process property document: ' + (error.response?.data?.error || error.message));
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
    }
  };

  const handleClear = () => {
    setExtractedData(null);
    setEditedData(null);
    setShowEdit(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="bg-gradient-to-r from-primary-50 to-amber-50 border-2 border-primary-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Home className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-heading-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              Property Document OCR
              <SourceChip source="ocr" />
            </h4>
            <p className="text-body-sm text-gray-600 mb-4">
              Upload sale deed, registration certificate, or other property documents to automatically extract property details
            </p>

            {/* Document Type Selection */}
            <div className="mb-4">
              <label className="block text-body-xs font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-body-sm"
                disabled={isProcessing}
              >
                <option value="sale_deed">Sale Deed</option>
                <option value="registration">Registration Certificate</option>
                <option value="agreement">Agreement to Sell</option>
                <option value="other">Other Property Document</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="property-document-ocr-input"
              />
              <label
                htmlFor="property-document-ocr-input"
                className={`inline-flex items-center px-4 py-2.5 border-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  isProcessing
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-primary-700 border-primary-300 hover:bg-primary-50 hover:border-primary-400'
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
                    Upload Property Document
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Data Display */}
      {extractedData && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h5 className="text-heading-sm font-semibold text-gray-900 mb-1">Extracted Property Data</h5>
                <div className="flex items-center gap-2">
                  <span className="text-body-xs text-gray-500">
                    Confidence: {Math.round((extractedData.confidence || 0) * 100)}%
                  </span>
                  <FieldAutoFillIndicator source="ocr" confidence={extractedData.confidence} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEdit(!showEdit)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Edit extracted data"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
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
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Property Address</label>
                  <textarea
                    value={editedData?.propertyAddress || ''}
                    onChange={(e) => handleEditChange('propertyAddress', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editedData?.ownerName || ''}
                    onChange={(e) => handleEditChange('ownerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={editedData?.registrationNumber || ''}
                    onChange={(e) => handleEditChange('registrationNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={editedData?.registrationDate || ''}
                    onChange={(e) => handleEditChange('registrationDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={editedData?.purchasePrice || ''}
                    onChange={(e) => handleEditChange('purchasePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Property Type</label>
                  <select
                    value={editedData?.propertyType || 'Residential'}
                    onChange={(e) => handleEditChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Plot">Plot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    value={editedData?.area || ''}
                    onChange={(e) => handleEditChange('area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                    placeholder="e.g., 1200 sq ft"
                  />
                </div>
                <div>
                  <label className="block text-body-xs font-medium text-gray-700 mb-1">Seller PAN (Optional)</label>
                  <input
                    type="text"
                    value={editedData?.sellerPAN || ''}
                    onChange={(e) => handleEditChange('sellerPAN', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-body-sm"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-body-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEdit(false);
                    setEditedData(extractedData);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-body-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Property Address</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.propertyAddress || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Owner Name</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.ownerName || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Registration Number</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.registrationNumber || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Registration Date</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.registrationDate || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Purchase Price</span>
                  <div className="text-heading-sm font-semibold text-gray-900">
                    {extractedData.purchasePrice
                      ? `₹${parseFloat(extractedData.purchasePrice).toLocaleString('en-IN')}`
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Property Type</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.propertyType || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-body-xs text-gray-600 block mb-1">Area</span>
                  <div className="text-body-sm font-semibold text-gray-900">
                    {extractedData.area || 'N/A'}
                  </div>
                </div>
                {extractedData.sellerPAN && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-body-xs text-gray-600 block mb-1">Seller PAN</span>
                    <div className="text-body-sm font-semibold text-gray-900">
                      {extractedData.sellerPAN}
                    </div>
                  </div>
                )}
              </div>

              {extractedData.confidence < 0.8 && (
                <div className="mb-4 bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-body-xs font-medium text-warning-800 mb-1">Low Confidence Warning</p>
                      <p className="text-body-xs text-warning-700">
                        The OCR confidence is below 80%. Please review and correct the extracted data before applying.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {onExtracted && (
                <button
                  onClick={handleApply}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
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

export default PropertyDocumentOCRUpload;

