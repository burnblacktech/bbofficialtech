// =====================================================
// CAPITAL GAINS FORM COMPONENT
// For ITR-2 and ITR-3 forms
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, AlertCircle, TrendingUp, Upload, FileText, CheckCircle } from 'lucide-react';
import BrokerFileUpload from '../../../../components/ITR/BrokerFileUpload';
import { useCapitalGains, useAddSTCGEntry, useRemoveSTCGEntry, useAddLTCGEntry, useRemoveLTCGEntry, useUpdateCapitalGains } from '../hooks/use-capital-gains';
import { useAISCapitalGains } from '../hooks/use-ais-integration';
import AISCapitalGainsPopup from './ais-capital-gains-popup';
import TaxHarvestingHelper from './tax-harvesting-helper';
import { FieldAutoFillIndicator } from '../../../../components/UI/AutoFillIndicator/AutoFillIndicator';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import capitalGainsOCRService from '../../../../services/CapitalGainsOCRService';
import toast from 'react-hot-toast';

const CapitalGainsForm = ({ filingId, data, onUpdate, selectedITR, onDataUploaded }) => {
  // Use new hooks if filingId is provided, otherwise fallback to local state
  const { data: capitalGainsData, isLoading } = filingId ? useCapitalGains(filingId) : { data: null, isLoading: false };
  const updateMutation = filingId ? useUpdateCapitalGains(filingId) : null;
  const addSTCGEntryMutation = filingId ? useAddSTCGEntry(filingId) : null;
  const removeSTCGEntryMutation = filingId ? useRemoveSTCGEntry(filingId) : null;
  const addLTCGEntryMutation = filingId ? useAddLTCGEntry(filingId) : null;
  const removeLTCGEntryMutation = filingId ? useRemoveLTCGEntry(filingId) : null;

  // Use data from hook if available, otherwise use props
  const currentData = capitalGainsData || data || {};
  const [hasCapitalGains, setHasCapitalGains] = useState(currentData?.hasCapitalGains || false);
  const [stcgDetails, setStcgDetails] = useState(currentData?.stcgDetails || []);
  const [ltcgDetails, setLtcgDetails] = useState(currentData?.ltcgDetails || []);
  const [showAISPopup, setShowAISPopup] = useState(false);
  const [isProcessingSaleDeed, setIsProcessingSaleDeed] = useState(false);
  const [saleDeedPreview, setSaleDeedPreview] = useState(null);
  const [isProcessingBrokerStatement, setIsProcessingBrokerStatement] = useState(false);
  const [brokerStatementPreview, setBrokerStatementPreview] = useState(null);
  const saleDeedFileInputRef = useRef(null);
  const brokerStatementFileInputRef = useRef(null);

  // Fetch AIS data if filingId is available
  const { data: aisData, isLoading: isLoadingAIS } = useAISCapitalGains(filingId);

  // Sync with hook data when it changes
  useEffect(() => {
    if (capitalGainsData) {
      setHasCapitalGains(capitalGainsData.hasCapitalGains || false);
      setStcgDetails(capitalGainsData.stcgDetails || []);
      setLtcgDetails(capitalGainsData.ltcgDetails || []);
    }
  }, [capitalGainsData]);

  const handleHasCapitalGainsChange = async (value) => {
    setHasCapitalGains(value);
    if (filingId && updateMutation) {
      try {
        await updateMutation.mutateAsync({
          hasCapitalGains: value,
          stcgDetails,
          ltcgDetails,
        });
      } catch (error) {
        toast.error('Failed to update capital gains');
      }
    } else if (onUpdate) {
      onUpdate({ hasCapitalGains: value });
    }
  };

  const addSTCGEntry = async () => {
    const newEntry = {
      assetType: '',
      saleValue: 0,
      purchaseValue: 0,
      expenses: 0,
      gainAmount: 0,
    };

    if (filingId && addSTCGEntryMutation) {
      try {
        await addSTCGEntryMutation.mutateAsync(newEntry);
        // Data will be updated via React Query
      } catch (error) {
        toast.error('Failed to add STCG entry');
      }
    } else {
      const updated = [...stcgDetails, newEntry];
      setStcgDetails(updated);
      if (onUpdate) onUpdate({ stcgDetails: updated });
    }
  };

  const removeSTCGEntry = async (index) => {
    const entry = stcgDetails[index];
    if (filingId && removeSTCGEntryMutation && entry?.id) {
      try {
        await removeSTCGEntryMutation.mutateAsync(entry.id);
      } catch (error) {
        toast.error('Failed to remove STCG entry');
      }
    } else {
      const updated = stcgDetails.filter((_, i) => i !== index);
      setStcgDetails(updated);
      if (onUpdate) onUpdate({ stcgDetails: updated });
    }
  };

  const updateSTCGEntry = async (index, field, value) => {
    const updated = [...stcgDetails];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate gain amount
    if (field === 'saleValue' || field === 'purchaseValue' || field === 'expenses') {
      const saleValue = field === 'saleValue' ? parseFloat(value) || 0 : updated[index].saleValue || 0;
      const purchaseValue = field === 'purchaseValue' ? parseFloat(value) || 0 : updated[index].purchaseValue || 0;
      const expenses = field === 'expenses' ? parseFloat(value) || 0 : updated[index].expenses || 0;
      updated[index].gainAmount = Math.max(0, saleValue - purchaseValue - expenses);
    }

    setStcgDetails(updated);

    if (filingId && updateMutation) {
      try {
        await updateMutation.mutateAsync({
          hasCapitalGains,
          stcgDetails: updated,
          ltcgDetails,
        });
      } catch (error) {
        toast.error('Failed to update STCG entry');
      }
    } else if (onUpdate) {
      onUpdate({ stcgDetails: updated });
    }
  };

  const addLTCGEntry = async () => {
    const newEntry = {
      assetType: '',
      saleValue: 0,
      indexedCost: 0,
      expenses: 0,
      gainAmount: 0,
    };

    if (filingId && addLTCGEntryMutation) {
      try {
        await addLTCGEntryMutation.mutateAsync(newEntry);
      } catch (error) {
        toast.error('Failed to add LTCG entry');
      }
    } else {
      const updated = [...ltcgDetails, newEntry];
      setLtcgDetails(updated);
      if (onUpdate) onUpdate({ ltcgDetails: updated });
    }
  };

  const removeLTCGEntry = async (index) => {
    const entry = ltcgDetails[index];
    if (filingId && removeLTCGEntryMutation && entry?.id) {
      try {
        await removeLTCGEntryMutation.mutateAsync(entry.id);
      } catch (error) {
        toast.error('Failed to remove LTCG entry');
      }
    } else {
      const updated = ltcgDetails.filter((_, i) => i !== index);
      setLtcgDetails(updated);
      if (onUpdate) onUpdate({ ltcgDetails: updated });
    }
  };

  const updateLTCGEntry = async (index, field, value) => {
    const updated = [...ltcgDetails];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate gain amount
    if (field === 'saleValue' || field === 'indexedCost' || field === 'expenses') {
      const saleValue = field === 'saleValue' ? parseFloat(value) || 0 : updated[index].saleValue || 0;
      const indexedCost = field === 'indexedCost' ? parseFloat(value) || 0 : updated[index].indexedCost || 0;
      const expenses = field === 'expenses' ? parseFloat(value) || 0 : updated[index].expenses || 0;
      updated[index].gainAmount = Math.max(0, saleValue - indexedCost - expenses);
    }

    setLtcgDetails(updated);

    if (filingId && updateMutation) {
      try {
        await updateMutation.mutateAsync({
          hasCapitalGains,
          stcgDetails,
          ltcgDetails: updated,
        });
      } catch (error) {
        toast.error('Failed to update LTCG entry');
      }
    } else if (onUpdate) {
      onUpdate({ ltcgDetails: updated });
    }
  };

  const calculateTotalSTCG = () => {
    return stcgDetails.reduce((sum, entry) => sum + (parseFloat(entry.gainAmount) || 0), 0);
  };

  const calculateTotalLTCG = () => {
    return ltcgDetails.reduce((sum, entry) => sum + (parseFloat(entry.gainAmount) || 0), 0);
  };

  const handleAISApplied = (appliedData) => {
    // Refresh data after AIS data is applied
    // The mutation will invalidate queries and refetch
    toast.success(`${(appliedData.stcgEntries?.length || 0) + (appliedData.ltcgEntries?.length || 0)} transaction${((appliedData.stcgEntries?.length || 0) + (appliedData.ltcgEntries?.length || 0)) !== 1 ? 's' : ''} added from AIS`);
  };

  const handleSaleDeedUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingSaleDeed(true);
    setSaleDeedPreview(null);

    try {
      const result = await capitalGainsOCRService.extractSaleDeedData(file);

      if (result.success) {
        const validation = capitalGainsOCRService.validateSaleDeedData(result.data);

        setSaleDeedPreview({
          ...result.data,
          confidence: result.confidence,
          validation,
          file: file.name,
        });

        if (validation.isValid) {
          toast.success('Sale deed processed successfully');
        } else {
          toast.warning('Sale deed processed with warnings. Please review.');
        }
      }
    } catch (error) {
      console.error('Sale deed processing error:', error);
      toast.error('Failed to process sale deed: ' + error.message);
    } finally {
      setIsProcessingSaleDeed(false);
    }
  };

  const applySaleDeedData = (entryIndex, isLTCG = false) => {
    if (!saleDeedPreview) return;

    const entry = isLTCG ? ltcgDetails[entryIndex] : stcgDetails[entryIndex];
    const updated = isLTCG ? [...ltcgDetails] : [...stcgDetails];

    updated[entryIndex] = {
      ...entry,
      assetType: saleDeedPreview.assetType || entry.assetType,
      saleValue: saleDeedPreview.saleValue || entry.saleValue,
      purchaseValue: saleDeedPreview.purchaseValue || entry.purchaseValue,
      expenses: (saleDeedPreview.stampDuty || 0) + (saleDeedPreview.registrationFee || 0) + (entry.expenses || 0),
      source: 'ocr',
      sourceData: {
        confidence: saleDeedPreview.confidence,
        date: saleDeedPreview.registrationDate || new Date().toISOString(),
      },
      saleDeedData: {
        registrationNumber: saleDeedPreview.registrationNumber,
        registrationDate: saleDeedPreview.registrationDate,
        sellerName: saleDeedPreview.sellerName,
        propertyAddress: saleDeedPreview.propertyAddress,
      },
    };

    if (isLTCG) {
      setLtcgDetails(updated);
      if (filingId && updateMutation) {
        updateMutation.mutateAsync({
          hasCapitalGains,
          stcgDetails,
          ltcgDetails: updated,
        });
      } else if (onUpdate) {
        onUpdate({ ltcgDetails: updated });
      }
    } else {
      setStcgDetails(updated);
      if (filingId && updateMutation) {
        updateMutation.mutateAsync({
          hasCapitalGains,
          stcgDetails: updated,
          ltcgDetails,
        });
      } else if (onUpdate) {
        onUpdate({ stcgDetails: updated });
      }
    }

    setSaleDeedPreview(null);
    if (saleDeedFileInputRef.current) {
      saleDeedFileInputRef.current.value = '';
    }
    toast.success('Sale deed data applied to transaction');
  };

  const handleBrokerStatementOCRUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingBrokerStatement(true);
    setBrokerStatementPreview(null);

    try {
      const result = await capitalGainsOCRService.extractBrokerStatementData(file);

      if (result.success) {
        const validation = capitalGainsOCRService.validateBrokerStatementData(result.data);

        setBrokerStatementPreview({
          ...result.data,
          confidence: result.confidence,
          validation,
          file: file.name,
        });

        if (validation.isValid) {
          toast.success('Broker statement processed successfully');
        } else {
          toast.warning('Broker statement processed with warnings. Please review.');
        }
      }
    } catch (error) {
      console.error('Broker statement OCR processing error:', error);
      toast.error('Failed to process broker statement: ' + error.message);
    } finally {
      setIsProcessingBrokerStatement(false);
    }
  };

  const applyBrokerStatementData = () => {
    if (!brokerStatementPreview || !brokerStatementPreview.transactions) return;

    const newSTCGEntries = [];
    const newLTCGEntries = [];

    brokerStatementPreview.transactions.forEach((tx) => {
      const entry = {
        assetType: tx.scriptName || 'Equity',
        saleValue: tx.sellValue || 0,
        purchaseValue: tx.buyValue || 0,
        expenses: (tx.stt || 0) + (tx.brokerage || 0) + (tx.stampDuty || 0),
        gainAmount: tx.profit || 0,
        source: 'ocr',
        sourceData: {
          confidence: brokerStatementPreview.confidence,
          date: brokerStatementPreview.statementPeriod || new Date().toISOString(),
        },
        brokerData: {
          brokerName: brokerStatementPreview.brokerName,
          buyDate: tx.buyDate,
          sellDate: tx.sellDate,
          quantity: tx.quantity,
        },
      };

      if (tx.transactionType === 'LTCG' || tx.transactionType === 'ltcg') {
        entry.indexedCost = tx.buyValue || 0;
        newLTCGEntries.push(entry);
      } else {
        newSTCGEntries.push(entry);
      }
    });

    const updatedSTCG = [...stcgDetails, ...newSTCGEntries];
    const updatedLTCG = [...ltcgDetails, ...newLTCGEntries];

    setStcgDetails(updatedSTCG);
    setLtcgDetails(updatedLTCG);

    if (filingId && updateMutation) {
      updateMutation.mutateAsync({
        hasCapitalGains: true,
        stcgDetails: updatedSTCG,
        ltcgDetails: updatedLTCG,
      });
    } else if (onUpdate) {
      onUpdate({
        hasCapitalGains: true,
        stcgDetails: updatedSTCG,
        ltcgDetails: updatedLTCG,
      });
    }

    // Notify parent about uploaded data
    if (onDataUploaded) {
      onDataUploaded({
        capitalGains: {
          stcgDetails: updatedSTCG,
          ltcgDetails: updatedLTCG,
          uploadedBrokerStatement: brokerStatementPreview,
        },
      });
    }

    setBrokerStatementPreview(null);
    if (brokerStatementFileInputRef.current) {
      brokerStatementFileInputRef.current.value = '';
    }
    toast.success(`${newSTCGEntries.length + newLTCGEntries.length} transaction(s) added from broker statement`);
  };

  if (!hasCapitalGains) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="hasCapitalGains"
              checked={hasCapitalGains === false}
              onChange={() => handleHasCapitalGainsChange(false)}
              className="mr-2"
            />
            No Capital Gains
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="hasCapitalGains"
              checked={hasCapitalGains === true}
              onChange={() => handleHasCapitalGainsChange(true)}
              className="mr-2"
            />
            Yes, I have Capital Gains
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AIS Capital Gains Popup */}
      {showAISPopup && filingId && (
        <AISCapitalGainsPopup
          filingId={filingId}
          formSTCG={stcgDetails}
          formLTCG={ltcgDetails}
          onClose={() => setShowAISPopup(false)}
          onApplied={handleAISApplied}
        />
      )}

      {/* Data Source Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AIS Integration */}
        {filingId && (
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">AIS Capital Gains</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Auto-populate capital gains from Annual Information Statement (AIS)
                </p>
                <button
                  onClick={() => setShowAISPopup(true)}
                  disabled={isLoadingAIS}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {isLoadingAIS ? 'Loading...' : 'Import from AIS'}
                </button>
                {aisData?.capitalGains && aisData.capitalGains.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {aisData.capitalGains.length} transaction{aisData.capitalGains.length !== 1 ? 's' : ''} found in AIS
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Broker File Import */}
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Broker File Import</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload broker statement files (Excel/CSV) to auto-populate capital gains
              </p>
              <BrokerFileUpload
                filingId={filingId}
                onImportComplete={(importedData) => {
                  if (!filingId) {
                    // Fallback to old pattern
                    setHasCapitalGains(true);
                    setStcgDetails(importedData.stcgDetails || []);
                    setLtcgDetails(importedData.ltcgDetails || []);
                    if (onUpdate) onUpdate(importedData);
                  }
                  // Notify parent about uploaded data for discrepancy checking
                  if (onDataUploaded) {
                    onDataUploaded({
                      capitalGains: importedData,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* OCR Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Sale Deed OCR Upload */}
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Upload Sale Deed</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload sale deed images/PDFs to auto-populate property sale details
              </p>
              <input
                ref={saleDeedFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleSaleDeedUpload}
                disabled={isProcessingSaleDeed}
                className="hidden"
                id="sale-deed-input"
              />
              <label
                htmlFor="sale-deed-input"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                  isProcessingSaleDeed
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessingSaleDeed ? 'Processing...' : 'Choose Sale Deed'}
              </label>
            </div>
          </div>

          {/* Sale Deed Preview */}
          {saleDeedPreview && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-gray-900">Extracted Data</h5>
                    <p className="text-xs text-gray-500">
                      Confidence: {Math.round(saleDeedPreview.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-xs text-gray-600">Sale Value:</span>
                  <div className="font-semibold">₹{saleDeedPreview.saleValue?.toLocaleString('en-IN') || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Purchase Value:</span>
                  <div className="font-semibold">₹{saleDeedPreview.purchaseValue?.toLocaleString('en-IN') || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Registration Date:</span>
                  <div className="font-medium">{saleDeedPreview.registrationDate || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Registration No:</span>
                  <div className="font-medium">{saleDeedPreview.registrationNumber || 'N/A'}</div>
                </div>
              </div>

              {saleDeedPreview.validation?.warnings?.length > 0 && (
                <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                  {saleDeedPreview.validation.warnings.map((warning, idx) => (
                    <div key={idx} className="text-xs text-yellow-800 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-600 mb-2">Apply to transaction:</p>
              <div className="flex gap-2">
                {stcgDetails.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value !== '') {
                        applySaleDeedData(parseInt(e.target.value), false);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    defaultValue=""
                  >
                    <option value="">Select STCG entry</option>
                    {stcgDetails.map((entry, idx) => (
                      <option key={idx} value={idx}>
                        STCG Entry #{idx + 1}
                      </option>
                    ))}
                  </select>
                )}
                {ltcgDetails.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value !== '') {
                        applySaleDeedData(parseInt(e.target.value), true);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    defaultValue=""
                  >
                    <option value="">Select LTCG entry</option>
                    {ltcgDetails.map((entry, idx) => (
                      <option key={idx} value={idx}>
                        LTCG Entry #{idx + 1}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Broker Statement OCR Upload */}
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Upload Broker Statement (OCR)</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload broker statement images/PDFs to auto-populate capital gains
              </p>
              <input
                ref={brokerStatementFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleBrokerStatementOCRUpload}
                disabled={isProcessingBrokerStatement}
                className="hidden"
                id="broker-statement-ocr-input"
              />
              <label
                htmlFor="broker-statement-ocr-input"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                  isProcessingBrokerStatement
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessingBrokerStatement ? 'Processing...' : 'Choose Broker Statement'}
              </label>
            </div>
          </div>

          {/* Broker Statement Preview */}
          {brokerStatementPreview && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-gray-900">Extracted Data</h5>
                    <p className="text-xs text-gray-500">
                      Confidence: {Math.round(brokerStatementPreview.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Broker:</span> {brokerStatementPreview.brokerName || 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Period:</span> {brokerStatementPreview.statementPeriod || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Transactions:</span> {brokerStatementPreview.transactions?.length || 0}
                </div>
              </div>

              {brokerStatementPreview.validation?.warnings?.length > 0 && (
                <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                  {brokerStatementPreview.validation.warnings.map((warning, idx) => (
                    <div key={idx} className="text-xs text-yellow-800 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={applyBrokerStatementData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Apply {brokerStatementPreview.transactions?.length || 0} Transaction(s)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="hasCapitalGains"
            checked={hasCapitalGains === false}
            onChange={() => handleHasCapitalGainsChange(false)}
            className="mr-2"
          />
          No Capital Gains
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="hasCapitalGains"
            checked={hasCapitalGains === true}
            onChange={() => handleHasCapitalGainsChange(true)}
            className="mr-2"
          />
          Yes, I have Capital Gains
        </label>
      </div>

      {/* Short-term Capital Gains */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Short-term Capital Gains (STCG)</h4>
          <button
            onClick={addSTCGEntry}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Entry
          </button>
        </div>

        {stcgDetails.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No STCG entries added yet</p>
        ) : (
          <div className="space-y-4">
            {stcgDetails.map((entry, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Entry #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    {entry.source && (
                      <SourceChip source={entry.source} size="sm" />
                    )}
                    <button
                      onClick={() => removeSTCGEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Data Provenance Indicator */}
                {entry.source && (
                  <div className="mb-3">
                    <FieldAutoFillIndicator
                      source={entry.source}
                      sourceDocument={entry.source === 'ais' ? 'AIS' : entry.source === 'broker' ? 'Broker Statement' : null}
                      uploadDate={entry.sourceData?.date}
                      isEdited={entry.isEdited}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                    <select
                      value={entry.assetType || ''}
                      onChange={(e) => updateSTCGEntry(index, 'assetType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="">Select Asset Type</option>
                      <option value="equity_shares">Equity Shares</option>
                      <option value="mutual_funds">Mutual Funds</option>
                      <option value="property">Property</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Value (₹)
                      {entry.source && (
                        <SourceChip source={entry.source} size="sm" className="ml-2" />
                      )}
                    </label>
                    <input
                      type="number"
                      value={entry.saleValue || 0}
                      onChange={(e) => {
                        updateSTCGEntry(index, 'saleValue', e.target.value);
                        // Mark as edited if user changes AIS/broker data
                        if (entry.source && entry.source !== 'manual') {
                          const updated = [...stcgDetails];
                          updated[index] = { ...updated[index], isEdited: true };
                          setStcgDetails(updated);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Value (₹)</label>
                    <input
                      type="number"
                      value={entry.purchaseValue || 0}
                      onChange={(e) => updateSTCGEntry(index, 'purchaseValue', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expenses on Transfer (₹)</label>
                    <input
                      type="number"
                      value={entry.expenses || 0}
                      onChange={(e) => updateSTCGEntry(index, 'expenses', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gain Amount (₹)</label>
                    <input
                      type="number"
                      value={entry.gainAmount || 0}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total STCG:</span>
                <span className="text-lg font-bold text-gray-900">₹{calculateTotalSTCG().toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Long-term Capital Gains */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Long-term Capital Gains (LTCG)</h4>
          <button
            onClick={addLTCGEntry}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Entry
          </button>
        </div>

        {ltcgDetails.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No LTCG entries added yet</p>
        ) : (
          <div className="space-y-4">
            {ltcgDetails.map((entry, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Entry #{index + 1}</span>
                  <button
                    onClick={() => removeLTCGEntry(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                    <select
                      value={entry.assetType || ''}
                      onChange={(e) => updateLTCGEntry(index, 'assetType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="">Select Asset Type</option>
                      <option value="equity_shares">Equity Shares</option>
                      <option value="mutual_funds">Mutual Funds</option>
                      <option value="property">Property</option>
                      <option value="bonds">Bonds</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Value (₹)</label>
                    <input
                      type="number"
                      value={entry.saleValue || 0}
                      onChange={(e) => updateLTCGEntry(index, 'saleValue', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indexed Cost of Acquisition (₹)</label>
                    <input
                      type="number"
                      value={entry.indexedCost || 0}
                      onChange={(e) => updateLTCGEntry(index, 'indexedCost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expenses on Transfer (₹)</label>
                    <input
                      type="number"
                      value={entry.expenses || 0}
                      onChange={(e) => updateLTCGEntry(index, 'expenses', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gain Amount (₹)</label>
                    <input
                      type="number"
                      value={entry.gainAmount || 0}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total LTCG:</span>
                <span className="text-lg font-bold text-gray-900">₹{calculateTotalLTCG().toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Harvesting Suggestions */}
      {hasCapitalGains && (stcgDetails.length > 0 || ltcgDetails.length > 0) && (
        <TaxHarvestingHelper
          stcgEntries={stcgDetails}
          ltcgEntries={ltcgDetails}
          lossEntries={(() => {
            // Extract loss entries from STCG and LTCG details
            const losses = [];
            stcgDetails.forEach((entry) => {
              if (entry.gainAmount < 0) {
                losses.push({
                  ...entry,
                  isLongTerm: false,
                  lossAmount: Math.abs(entry.gainAmount),
                });
              }
            });
            ltcgDetails.forEach((entry) => {
              if (entry.gainAmount < 0) {
                losses.push({
                  ...entry,
                  isLongTerm: true,
                  lossAmount: Math.abs(entry.gainAmount),
                });
              }
            });
            return losses;
          })()}
          onApplySuggestion={(suggestion) => {
            // Handle applying tax harvesting suggestions
            if (suggestion.type === 'offset') {
              // Apply offset logic
              if (suggestion.title.includes('Short-term')) {
                // Offset STCG with STCL
                const updatedSTCG = stcgDetails.map((entry) => {
                  if (entry.gainAmount > 0) {
                    const lossEntries = stcgDetails.filter((e) => e.gainAmount < 0);
                    const totalLoss = lossEntries.reduce((sum, e) => sum + Math.abs(e.gainAmount || 0), 0);
                    const offsetAmount = Math.min(entry.gainAmount, totalLoss);
                    return {
                      ...entry,
                      gainAmount: entry.gainAmount - offsetAmount,
                      offsetApplied: true,
                      offsetAmount,
                    };
                  }
                  return entry;
                });
                setStcgDetails(updatedSTCG);
                if (filingId && updateMutation) {
                  updateMutation.mutateAsync({
                    hasCapitalGains,
                    stcgDetails: updatedSTCG,
                    ltcgDetails,
                  });
                } else if (onUpdate) {
                  onUpdate({ stcgDetails: updatedSTCG });
                }
                toast.success('STCG offset applied successfully');
              } else if (suggestion.title.includes('Long-term')) {
                // Offset LTCG with LTCL
                const updatedLTCG = ltcgDetails.map((entry) => {
                  if (entry.gainAmount > 0) {
                    const lossEntries = ltcgDetails.filter((e) => e.gainAmount < 0);
                    const totalLoss = lossEntries.reduce((sum, e) => sum + Math.abs(e.gainAmount || 0), 0);
                    const offsetAmount = Math.min(entry.gainAmount, totalLoss);
                    return {
                      ...entry,
                      gainAmount: entry.gainAmount - offsetAmount,
                      offsetApplied: true,
                      offsetAmount,
                    };
                  }
                  return entry;
                });
                setLtcgDetails(updatedLTCG);
                if (filingId && updateMutation) {
                  updateMutation.mutateAsync({
                    hasCapitalGains,
                    stcgDetails,
                    ltcgDetails: updatedLTCG,
                  });
                } else if (onUpdate) {
                  onUpdate({ ltcgDetails: updatedLTCG });
                }
                toast.success('LTCG offset applied successfully');
              }
            } else if (suggestion.type === 'carryforward') {
              toast.info('Loss carry forward will be handled automatically in your filing');
            }
          }}
        />
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total Capital Gains:</span>
          <span className="text-xl font-bold text-gray-900">
            ₹{(calculateTotalSTCG() + calculateTotalLTCG()).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          STCG: ₹{calculateTotalSTCG().toLocaleString('en-IN')} | LTCG: ₹{calculateTotalLTCG().toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
};

export default CapitalGainsForm;

