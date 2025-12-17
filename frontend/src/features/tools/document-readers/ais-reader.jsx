// =====================================================
// AIS READER COMPONENT
// Component to read and display AIS (Annual Information Statement) data
// =====================================================

import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { AISForm26ASService } from '../../../services/AISForm26ASService';
import Button from '../../../components/DesignSystem/components/Button';
import toast from 'react-hot-toast';

const AISReader = ({ onDataExtracted, filingId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aisData, setAisData] = useState(null);
  const [error, setError] = useState(null);
  const [fileInputRef] = useState(React.createRef());

  const aisService = new AISForm26ASService();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would parse the AIS PDF/JSON file
      // For now, we'll use the service to fetch AIS data
      const result = await aisService.fetchAISData(
        filingId || 'current-user',
        'auth-token-placeholder',
        '2024-25',
      );

      if (result.success) {
        setAisData(result.data);
        if (onDataExtracted) {
          onDataExtracted(result.data);
        }
        toast.success('AIS data loaded successfully');
      } else {
        setError(result.error || 'Failed to load AIS data');
        toast.error(result.error || 'Failed to load AIS data');
      }
    } catch (error) {
      console.error('AIS read error:', error);
      setError(error.message || 'Failed to process AIS file');
      toast.error('Failed to process AIS file');
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
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-gold-600" />
        <h3 className="text-heading-md text-gray-800">AIS (Annual Information Statement) Reader</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-body-sm text-blue-800">
            <p className="font-semibold mb-1">About AIS:</p>
            <p className="text-blue-700">
              AIS contains comprehensive information about your financial transactions including TDS, TCS,
              interest income, dividends, and other income sources as reported by various entities.
            </p>
          </div>
        </div>
      </div>

      {!aisData && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-body-md text-slate-600 mb-4">
              Upload AIS file or fetch from Income Tax Portal
            </p>
            <div className="flex gap-3 justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.json"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="ais-file-input"
              />
              <label
                htmlFor="ais-file-input"
                className={`inline-flex items-center px-4 py-2 border rounded-xl cursor-pointer ${
                  isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Upload AIS File'}
              </label>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const result = await aisService.fetchAISData(
                      filingId || 'current-user',
                      'auth-token-placeholder',
                      '2024-25',
                    );
                    if (result.success) {
                      setAisData(result.data);
                      if (onDataExtracted) {
                        onDataExtracted(result.data);
                      }
                      toast.success('AIS data fetched successfully');
                    }
                  } catch (error) {
                    toast.error('Failed to fetch AIS data');
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
        <div className="bg-error-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
            <p className="text-body-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {aisData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-body-md font-semibold text-gray-800">AIS Data Summary</h4>
            <Button
              size="sm"
              onClick={() => {
                setAisData(null);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-body-sm text-slate-600 mb-1">Total Income</p>
              <p className="text-heading-md font-semibold text-green-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {formatCurrency(aisData.totalIncome || 0)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-body-sm text-slate-600 mb-1">Total TDS</p>
              <p className="text-heading-md font-semibold text-blue-700">
                {formatCurrency(aisData.totalTDS || 0)}
              </p>
            </div>
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
              <p className="text-body-sm text-slate-600 mb-1">Total TCS</p>
              <p className="text-heading-md font-semibold text-gold-700">
                {formatCurrency(aisData.totalTCS || 0)}
              </p>
            </div>
          </div>

          {/* Income Details */}
          {aisData.incomeDetails && aisData.incomeDetails.length > 0 && (
            <div>
              <h5 className="text-body-md font-semibold text-gray-800 mb-3">Income Details</h5>
              <div className="space-y-2">
                {aisData.incomeDetails.map((income, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-800">
                          {income.source || 'Income Source'}
                        </p>
                        <p className="text-body-xs text-slate-600 mt-1">
                          {income.description || 'Description'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-md font-semibold text-gray-800">
                          {formatCurrency(income.amount || 0)}
                        </p>
                        {income.date && (
                          <p className="text-body-xs text-slate-500">{formatDate(income.date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TDS Details */}
          {aisData.tdsDetails && aisData.tdsDetails.length > 0 && (
            <div>
              <h5 className="text-body-md font-semibold text-gray-800 mb-3">TDS Details</h5>
              <div className="space-y-2">
                {aisData.tdsDetails.map((tds, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-800">
                          {tds.deductorName || 'Deductor'}
                        </p>
                        <p className="text-body-xs text-slate-600 mt-1">
                          TAN: {tds.tan || 'N/A'} | Section: {tds.section || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-md font-semibold text-gray-800">
                          {formatCurrency(tds.tdsAmount || 0)}
                        </p>
                        {tds.date && (
                          <p className="text-body-xs text-slate-500">{formatDate(tds.date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {onDataExtracted && (
              <Button
                onClick={() => {
                  if (onDataExtracted) {
                    onDataExtracted(aisData);
                  }
                  toast.success('AIS data applied to ITR');
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

export default AISReader;

