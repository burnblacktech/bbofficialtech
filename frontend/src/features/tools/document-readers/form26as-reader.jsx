// =====================================================
// FORM 26AS READER COMPONENT
// Component to read and display Form 26AS data
// =====================================================

import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { AISForm26ASService } from '../../../services/AISForm26ASService';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';

const Form26ASReader = ({ onDataExtracted, filingId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [form26ASData, setForm26ASData] = useState(null);
  const [error, setError] = useState(null);
  const [fileInputRef] = useState(React.createRef());

  const form26ASService = new AISForm26ASService();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would parse the Form 26AS PDF file
      const result = await form26ASService.fetchForm26ASData(
        filingId || 'current-user',
        'auth-token-placeholder',
        '2024-25',
      );

      if (result.success) {
        setForm26ASData(result.data);
        if (onDataExtracted) {
          onDataExtracted(result.data);
        }
        toast.success('Form 26AS data loaded successfully');
      } else {
        setError(result.error || 'Failed to load Form 26AS data');
        toast.error(result.error || 'Failed to load Form 26AS data');
      }
    } catch (error) {
      console.error('Form 26AS read error:', error);
      setError(error.message || 'Failed to process Form 26AS file');
      toast.error('Failed to process Form 26AS file');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-gold-600" />
        <h3 className="text-heading-md text-gray-800">Form 26AS Reader</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">About Form 26AS:</p>
            <p className="text-blue-700">
              Form 26AS is a consolidated tax statement showing TDS, TCS, advance tax, self-assessment tax,
              and other taxes paid during the financial year.
            </p>
          </div>
        </div>
      </div>

      {!form26ASData && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-body-md text-gray-600 mb-4">
              Upload Form 26AS file or fetch from Income Tax Portal
            </p>
            <div className="flex gap-3 justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="form26as-file-input"
              />
              <label
                htmlFor="form26as-file-input"
                className={`inline-flex items-center px-4 py-2 border rounded-lg cursor-pointer ${
                  isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Upload Form 26AS'}
              </label>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const result = await form26ASService.fetchForm26ASData(
                      filingId || 'current-user',
                      'auth-token-placeholder',
                      '2024-25',
                    );
                    if (result.success) {
                      setForm26ASData(result.data);
                      if (onDataExtracted) {
                        onDataExtracted(result.data);
                      }
                      toast.success('Form 26AS data fetched successfully');
                    }
                  } catch (error) {
                    toast.error('Failed to fetch Form 26AS data');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Fetch from Portal
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-body-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {form26ASData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-body-md font-semibold text-gray-800">Form 26AS Summary</h4>
            <Button
              size="sm"
              onClick={() => {
                setForm26ASData(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Clear
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-body-sm text-gray-600 mb-1">Total TDS</p>
              <p className="text-heading-md font-semibold text-green-700">
                {formatCurrency(form26ASData.totalTDS || 0)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-body-sm text-gray-600 mb-1">Total TCS</p>
              <p className="text-heading-md font-semibold text-blue-700">
                {formatCurrency(form26ASData.totalTCS || 0)}
              </p>
            </div>
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
              <p className="text-body-sm text-gray-600 mb-1">Advance Tax</p>
              <p className="text-heading-md font-semibold text-gold-700">
                {formatCurrency(form26ASData.advanceTax || 0)}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-body-sm text-gray-600 mb-1">Self Assessment Tax</p>
              <p className="text-heading-md font-semibold text-purple-700">
                {formatCurrency(form26ASData.selfAssessmentTax || 0)}
              </p>
            </div>
          </div>

          {/* TDS Details */}
          {form26ASData.tdsDetails && form26ASData.tdsDetails.length > 0 && (
            <div>
              <h5 className="text-body-md font-semibold text-gray-800 mb-3">TDS Details</h5>
              <div className="space-y-2">
                {form26ASData.tdsDetails.map((tds, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-800">
                          {tds.deductorName || 'Deductor'}
                        </p>
                        <p className="text-body-xs text-gray-600 mt-1">
                          TAN: {tds.tan || 'N/A'} | Section: {tds.section || 'N/A'} |
                          Amount: {formatCurrency(tds.amount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-md font-semibold text-gray-800">
                          {formatCurrency(tds.tdsAmount || 0)}
                        </p>
                        {tds.date && (
                          <p className="text-body-xs text-gray-500">{formatDate(tds.date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax Paid Details */}
          {form26ASData.taxPaidDetails && form26ASData.taxPaidDetails.length > 0 && (
            <div>
              <h5 className="text-body-md font-semibold text-gray-800 mb-3">Tax Paid Details</h5>
              <div className="space-y-2">
                {form26ASData.taxPaidDetails.map((tax, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-800">
                          {tax.type || 'Tax Type'}
                        </p>
                        <p className="text-body-xs text-gray-600 mt-1">
                          BSR Code: {tax.bsrCode || 'N/A'} | Challan No: {tax.challanNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-md font-semibold text-gray-800">
                          {formatCurrency(tax.amount || 0)}
                        </p>
                        {tax.date && (
                          <p className="text-body-xs text-gray-500">{formatDate(tax.date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {onDataExtracted && (
              <Button
                onClick={() => {
                  if (onDataExtracted) {
                    onDataExtracted(form26ASData);
                  }
                  toast.success('Form 26AS data applied to ITR');
                }}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply to ITR
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Form26ASReader;

