// =====================================================
// BROKER FILE UPLOAD COMPONENT
// Upload and import capital gains from broker Excel files
// =====================================================

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import { useAddSTCGEntry, useAddLTCGEntry } from '../../features/income/capital-gains/hooks/use-capital-gains';
import { enterpriseLogger } from '../../utils/logger';

const BrokerFileUpload = ({ filingId, onImportComplete, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importPreview, setImportPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Use new hooks if filingId is provided
  const addSTCGEntryMutation = filingId ? useAddSTCGEntry(filingId) : null;
  const addLTCGEntryMutation = filingId ? useAddLTCGEntry(filingId) : null;

  const supportedBrokers = [
    { value: 'zerodha', label: 'Zerodha' },
    { value: 'angelone', label: 'Angel One' },
    { value: 'groww', label: 'Groww' },
    { value: 'upstox', label: 'Upstox' },
    { value: 'icici', label: 'ICICI Direct' },
  ];

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedBroker) {
      toast.error('Please select a broker first');
      return;
    }

    // Validate file type
    const validExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Please upload Excel (.xls, .xlsx) or CSV file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('broker', selectedBroker);

      // Upload and process file
      const response = await apiClient.post('/api/broker/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        const result = response.data.data;

        // Map broker data to capital gains format
        const mappedData = mapBrokerDataToCapitalGains(result);
        setImportPreview(mappedData);
        toast.success(`File processed: ${result.transactions.length} transactions found`);
      } else {
        throw new Error(response.data.error || 'Failed to process file');
      }
    } catch (error) {
      enterpriseLogger.error('Broker file upload error', { error });
      setError(error.response?.data?.details || error.message || 'Failed to process broker file');
      toast.error('Failed to process broker file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const mapBrokerDataToCapitalGains = (brokerData) => {
    const stcgEntries = [];
    const ltcgEntries = [];

    brokerData.transactions?.forEach((transaction) => {
      const entry = {
        assetType: mapAssetType(transaction.symbol),
        saleValue: transaction.sellPrice * transaction.quantity,
        purchaseValue: transaction.buyPrice * transaction.quantity,
        expenses: 0, // Broker charges can be added if available
        gainAmount: transaction.profit,
        source: 'broker',
        sourceData: {
          broker: brokerData.broker,
          date: new Date().toISOString(),
          confidence: 0.95,
        },
        symbol: transaction.symbol,
        buyDate: transaction.buyDate,
        sellDate: transaction.sellDate,
        quantity: transaction.quantity,
      };

      if (transaction.type === 'short_term') {
        stcgEntries.push(entry);
      } else {
        ltcgEntries.push(entry);
      }
    });

    return {
      stcgDetails: stcgEntries,
      ltcgDetails: ltcgEntries,
      summary: {
        totalSTCG: brokerData.shortTerm || 0,
        totalLTCG: brokerData.longTerm || 0,
        totalExempt: brokerData.exemptLongTerm || 0,
        transactionCount: brokerData.transactions?.length || 0,
      },
    };
  };

  const mapAssetType = (symbol) => {
    // Simple mapping - can be enhanced
    if (symbol?.includes('MF') || symbol?.includes('MUTUAL')) {
      return 'mutual_funds';
    }
    if (symbol?.includes('BOND') || symbol?.includes('DEBT')) {
      return 'bonds';
    }
    return 'equity_shares';
  };

  const handleApplyImport = async () => {
    if (!importPreview) return;

    try {
      // If filingId is provided, use the new hooks to add entries
      if (filingId && addSTCGEntryMutation && addLTCGEntryMutation) {
        // Add STCG entries
        for (const entry of importPreview.stcgDetails) {
          await addSTCGEntryMutation.mutateAsync({
            assetType: entry.assetType,
            saleValue: entry.saleValue,
            purchaseValue: entry.purchaseValue,
            expenses: entry.expenses || 0,
            gainAmount: entry.gainAmount,
            symbol: entry.symbol,
            buyDate: entry.buyDate,
            sellDate: entry.sellDate,
            quantity: entry.quantity,
            source: 'broker_import',
          });
        }

        // Add LTCG entries
        for (const entry of importPreview.ltcgDetails) {
          await addLTCGEntryMutation.mutateAsync({
            assetType: entry.assetType,
            saleValue: entry.saleValue,
            purchaseValue: entry.purchaseValue,
            indexedCost: entry.indexedCost || 0,
            expenses: entry.expenses || 0,
            gainAmount: entry.gainAmount,
            symbol: entry.symbol,
            buyDate: entry.buyDate,
            sellDate: entry.sellDate,
            quantity: entry.quantity,
            source: 'broker_import',
          });
        }

        toast.success('Capital gains data imported successfully');
      } else if (onImportComplete) {
        // Fallback to old pattern if filingId not provided
        onImportComplete({
          hasCapitalGains: true,
          stcgDetails: importPreview.stcgDetails,
          ltcgDetails: importPreview.ltcgDetails,
        });
        toast.success('Capital gains data imported successfully');
      }

      setImportPreview(null);
      setSelectedBroker('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      enterpriseLogger.error('Failed to apply import', { error });
      toast.error('Failed to import capital gains data');
    }
  };

  const handleCancelImport = () => {
    setImportPreview(null);
    setSelectedBroker('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border border-slate-200 rounded-xl p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Import from Broker File</h4>
            <p className="text-body-regular text-slate-600 mb-3">
              Upload your capital gains statement from your broker (Excel/CSV format)
            </p>

            {/* Broker Selection */}
            <div className="mb-3">
              <label className="block text-body-regular font-medium text-slate-700 mb-1">Select Broker</label>
              <select
                value={selectedBroker}
                onChange={(e) => setSelectedBroker(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                disabled={isUploading}
              >
                <option value="">Select Broker</option>
                {supportedBrokers.map((broker) => (
                  <option key={broker.value} value={broker.value}>
                    {broker.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={handleFileSelect}
                disabled={!selectedBroker || isUploading}
                className="hidden"
                id="broker-file-input"
              />
              <label
                htmlFor="broker-file-input"
                className={`inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl cursor-pointer ${
                  !selectedBroker || isUploading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && uploadProgress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-body-small text-slate-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-3 bg-error-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-error-600 mr-2 mt-0.5" />
                  <p className="text-body-regular text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Preview */}
      {importPreview && (
        <div className="border border-green-200 rounded-xl p-4 bg-green-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900">Import Preview</h4>
                <p className="text-body-regular text-slate-600">
                  {importPreview.summary.transactionCount} transactions found
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelImport}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-2">
              <div className="text-body-small text-slate-600">STCG Entries</div>
              <div className="text-body-large font-semibold text-slate-900">
                {importPreview.stcgDetails.length}
              </div>
              <div className="text-body-small text-slate-500">
                {importPreview.summary.totalSTCG.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white rounded-xl p-2">
              <div className="text-body-small text-slate-600">LTCG Entries</div>
              <div className="text-body-large font-semibold text-slate-900">
                {importPreview.ltcgDetails.length}
              </div>
              <div className="text-body-small text-slate-500">
                {importPreview.summary.totalLTCG.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white rounded-xl p-2">
              <div className="text-body-small text-slate-600">Total STCG</div>
              <div className="text-body-large font-semibold text-green-600">
                ₹{importPreview.summary.totalSTCG.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white rounded-xl p-2">
              <div className="text-body-small text-slate-600">Total LTCG</div>
              <div className="text-body-large font-semibold text-green-600">
                ₹{importPreview.summary.totalLTCG.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleApplyImport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
            >
              Apply Import
            </button>
            <button
              onClick={handleCancelImport}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerFileUpload;

