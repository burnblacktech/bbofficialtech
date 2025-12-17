// =====================================================
// DEDUCTION BREAKDOWN COMPONENT
// Granular display of individual deduction components
// =====================================================

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, FileText, Shield, Heart, GraduationCap, Gift, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { DeductionOCRService } from '../../services/DeductionOCRService';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const DeductionBreakdown = ({ formData, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});
  const fileInputRefs = useRef({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCurrency = (amount) => {
    return `₹${(parseFloat(amount) || 0).toLocaleString('en-IN')}`;
  };

  const handleDocumentUpload = async (field, file) => {
    setUploadingFields(prev => ({ ...prev, [field]: true }));

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('deductionType', field);

      const response = await apiClient.post('/api/ocr/deduction', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const extractedData = response.data.extractedData || {};
        const amount = extractedData.amount || 0;

        // Update form data with extracted amount and source tagging
        if (onUpdate && amount > 0) {
          const updates = {};
          updates[field] = amount;
          // Tag data source as OCR
          updates[`${field}_source`] = 'ocr';
          updates[`${field}_extractedAt`] = new Date().toISOString();
          updates[`${field}_confidence`] = response.data.confidence || 0;
          onUpdate(updates);
        }

        setUploadedDocs(prev => ({
          ...prev,
          [field]: {
            fileName: file.name,
            amount: amount,
            confidence: response.data.confidence || 0,
            extractedData: extractedData,
          },
        }));

        toast.success(`Document processed: ₹${amount.toLocaleString('en-IN')} extracted`);
      }
    } catch (error) {
      console.error('Document upload error', { error });
      toast.error('Failed to process document: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const renderDocumentUpload = (field, label) => {
    const isUploading = uploadingFields[field];
    const uploadedDoc = uploadedDocs[field];

    return (
      <div className="mt-2">
        <input
          ref={el => fileInputRefs.current[field] = el}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleDocumentUpload(field, e.target.files[0]);
            }
          }}
          disabled={isUploading}
          className="hidden"
          id={`deduction-upload-${field}`}
        />
        <label
          htmlFor={`deduction-upload-${field}`}
          className={`inline-flex items-center px-3 py-1.5 text-xs border rounded-xl cursor-pointer ${
            isUploading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
          }`}
        >
          <Upload className="w-3 h-3 mr-1" />
          {isUploading ? 'Processing...' : 'Upload Proof'}
        </label>

        {uploadedDoc && (
          <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded p-2 text-body-small">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-800">
                {uploadedDoc.fileName} - ₹{uploadedDoc.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => {
                setUploadedDocs(prev => {
                  const updated = { ...prev };
                  delete updated[field];
                  return updated;
                });
                if (fileInputRefs.current[field]) {
                  fileInputRefs.current[field].value = '';
                }
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Section 80C Breakdown
  const renderSection80C = () => {
    const section80C = formData.deductions?.section80C;
    if (!section80C || section80C === 0) return null;

    // If it's a number, show it
    if (typeof section80C === 'number') {
      const amount = Math.min(section80C, 150000);
      return (
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-slate-900">Section 80C</h4>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
              <span className="text-body-small text-slate-500 block">Limit: ₹1,50,000</span>
            </div>
          </div>
        </div>
      );
    }

    // If it's an object with breakdown
    const breakdown = section80C;
    const elss = parseFloat(breakdown.elss) || 0;
    const ppf = parseFloat(breakdown.ppf) || 0;
    const lic = parseFloat(breakdown.lic) || 0;
    const nsc = parseFloat(breakdown.nsc) || 0;
    const fd = parseFloat(breakdown.fd) || 0;
    const homeLoan = parseFloat(breakdown.homeLoan) || 0;
    const other = parseFloat(breakdown.other) || 0;
    const total = elss + ppf + lic + nsc + fd + homeLoan + other;
    const capped = Math.min(total, 150000);

    if (total === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('section80C')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-slate-900">Section 80C</h4>
          </div>
          <div className="text-right mr-2">
            <span className="font-semibold text-slate-900">{formatCurrency(capped)}</span>
            <span className="text-body-small text-slate-500 block">of ₹1,50,000 limit</span>
          </div>
          {expandedSections.section80C ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.section80C && (
          <div className="mt-4 space-y-2">
            {elss > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">ELSS Mutual Funds:</span>
                <span className="font-medium">{formatCurrency(elss)}</span>
              </div>
            )}
            {ppf > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">PPF:</span>
                <span className="font-medium">{formatCurrency(ppf)}</span>
              </div>
            )}
            {lic > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">LIC Premium:</span>
                <span className="font-medium">{formatCurrency(lic)}</span>
              </div>
            )}
            {nsc > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">NSC:</span>
                <span className="font-medium">{formatCurrency(nsc)}</span>
              </div>
            )}
            {fd > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Tax Saving FD:</span>
                <span className="font-medium">{formatCurrency(fd)}</span>
              </div>
            )}
            {homeLoan > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Home Loan Principal:</span>
                <span className="font-medium">{formatCurrency(homeLoan)}</span>
              </div>
            )}
            {other > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Other:</span>
                <span className="font-medium">{formatCurrency(other)}</span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-2 flex justify-between">
              <span className="font-medium text-slate-700">Total (before cap):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
            </div>
            {total > 150000 && (
              <div className="text-body-small text-yellow-600 bg-yellow-50 p-2 rounded">
                Amount capped at ₹1,50,000 limit
              </div>
            )}
            {/* Document Upload */}
            {renderDocumentUpload('section80C', 'Section 80C')}
          </div>
        )}
      </div>
    );
  };

  // Section 80D Breakdown
  const renderSection80D = () => {
    const section80D = formData.deductions?.section80D;
    if (!section80D || section80D === 0) return null;

    // If it's a number, show it
    if (typeof section80D === 'number') {
      const amount = Math.min(section80D, 25000);
      return (
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-slate-900">Section 80D</h4>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
              <span className="text-body-small text-slate-500 block">Limit: ₹25,000</span>
            </div>
          </div>
        </div>
      );
    }

    // If it's an object with breakdown
    const breakdown = section80D;
    const self = parseFloat(breakdown.self) || 0;
    const parents = parseFloat(breakdown.parents) || 0;
    const seniorCitizen = parseFloat(breakdown.seniorCitizen) || 0;
    const total = self + parents + seniorCitizen;
    const capped = Math.min(total, 25000);

    if (total === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('section80D')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-slate-900">Section 80D</h4>
          </div>
          <div className="text-right mr-2">
            <span className="font-semibold text-slate-900">{formatCurrency(capped)}</span>
            <span className="text-body-small text-slate-500 block">of ₹25,000 limit</span>
          </div>
          {expandedSections.section80D ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.section80D && (
          <div className="mt-4 space-y-2">
            {self > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Self & Family:</span>
                <span className="font-medium">{formatCurrency(self)}</span>
              </div>
            )}
            {parents > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Parents:</span>
                <span className="font-medium">{formatCurrency(parents)}</span>
              </div>
            )}
            {seniorCitizen > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Senior Citizen:</span>
                <span className="font-medium">{formatCurrency(seniorCitizen)}</span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-2 flex justify-between">
              <span className="font-medium text-slate-700">Total (before cap):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
            </div>
            {total > 25000 && (
              <div className="text-body-small text-yellow-600 bg-yellow-50 p-2 rounded">
                Amount capped at ₹25,000 limit
              </div>
            )}
            {/* Document Upload */}
            {renderDocumentUpload('section80D', 'Section 80D')}
          </div>
        )}
      </div>
    );
  };

  // Section 80G Breakdown
  const renderSection80G = () => {
    const section80G = formData.deductions?.section80G;
    if (!section80G || section80G === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-slate-900">Section 80G</h4>
            <span className="text-body-small text-slate-500">(Donations)</span>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(section80G)}</span>
        </div>
      </div>
    );
  };

  // Section 80E Breakdown (Education Loan)
  const renderSection80E = () => {
    const section80E = formData.deductions?.section80E;
    if (!section80E || section80E === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-slate-900">Section 80E</h4>
            <span className="text-body-small text-slate-500">(Education Loan Interest)</span>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(section80E)}</span>
        </div>
      </div>
    );
  };

  // Section 80TTA/TTB Breakdown
  const renderSection80TTA = () => {
    const section80TTA = formData.deductions?.section80TTA;
    const section80TTB = formData.deductions?.section80TTB;

    if ((!section80TTA || section80TTA === 0) && (!section80TTB || section80TTB === 0)) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="space-y-2">
          {section80TTA > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-slate-900">Section 80TTA</h4>
                <span className="text-body-small text-slate-500">(Savings Interest)</span>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(section80TTA)}</span>
            </div>
          )}
          {section80TTB > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-slate-900">Section 80TTB</h4>
                <span className="text-body-small text-slate-500">(Senior Citizen Interest)</span>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(section80TTB)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Other Deductions
  const renderOtherDeductions = () => {
    const otherDeductions = formData.deductions?.otherDeductions;
    if (!otherDeductions) return null;

    const standardDeduction = parseFloat(otherDeductions.standardDeduction) || 0;
    const hra = parseFloat(otherDeductions.hra) || 0;
    const other = parseFloat(otherDeductions.other) || 0;
    const total = standardDeduction + hra + other;

    if (total === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('otherDeductions')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-slate-900">Other Deductions</h4>
          </div>
          <span className="font-semibold text-slate-900 mr-2">{formatCurrency(total)}</span>
          {expandedSections.otherDeductions ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.otherDeductions && (
          <div className="mt-4 space-y-2">
            {standardDeduction > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Standard Deduction:</span>
                <span className="font-medium">{formatCurrency(standardDeduction)}</span>
              </div>
            )}
            {hra > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">HRA:</span>
                <span className="font-medium">{formatCurrency(hra)}</span>
              </div>
            )}
            {other > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Other:</span>
                <span className="font-medium">{formatCurrency(other)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderSection80C()}
      {renderSection80D()}
      {renderSection80G()}
      {renderSection80E()}
      {renderSection80TTA()}
      {renderOtherDeductions()}
    </div>
  );
};

export default DeductionBreakdown;

