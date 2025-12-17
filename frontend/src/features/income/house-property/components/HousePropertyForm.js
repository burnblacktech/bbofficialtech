// =====================================================
// HOUSE PROPERTY FORM COMPONENT
// Enhanced for multiple properties (ITR-2, ITR-3, ITR-4)
// =====================================================

import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, FileText, CheckCircle, AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import rentReceiptOCRService from '../../../../services/RentReceiptOCRService';
import toast from 'react-hot-toast';
import PreConstructionCalculator from './pre-construction-calculator';
import RentReceiptOCRUpload from './RentReceiptOCRUpload';
import PropertyDocumentOCRUpload from './PropertyDocumentOCRUpload';
import AISRentalIncomePopup from './ais-rental-popup';
import { useAISRentalIncome } from '../hooks/use-ais-integration';
import { FieldAutoFillIndicator } from '../../../../components/UI/AutoFillIndicator/AutoFillIndicator';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import { enterpriseLogger } from '../../../../utils/logger';

const HousePropertyForm = ({ filingId, data, onUpdate, selectedITR, onDataUploaded }) => {
  const [properties, setProperties] = useState(data?.properties || []);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorPropertyIndex, setCalculatorPropertyIndex] = useState(null);
  const [showAISPopup, setShowAISPopup] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Fetch AIS data if filingId is available
  const { data: aisData, isLoading: isLoadingAIS } = useAISRentalIncome(filingId);

  const addProperty = () => {
    const newProperty = {
      propertyType: 'self_occupied',
      annualRentalIncome: 0,
      municipalTaxes: 0,
      interestOnLoan: 0,
      preConstructionInterest: 0,
      propertyAddress: '',
    };
    const updated = [...properties, newProperty];
    setProperties(updated);
    onUpdate({ properties: updated });
  };

  const removeProperty = (index) => {
    const updated = properties.filter((_, i) => i !== index);
    setProperties(updated);
    onUpdate({ properties: updated });
  };

  const updateProperty = (index, field, value) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
    onUpdate({ properties: updated });
  };

  const handleRentReceiptUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingReceipt(true);
    setReceiptPreview(null);

    try {
      const result = await rentReceiptOCRService.extractRentReceiptData(file);

      if (result.success) {
        const validation = rentReceiptOCRService.validateExtractedData(result.data);

        setReceiptPreview({
          ...result.data,
          confidence: result.confidence,
          validation,
          file: file.name,
        });

        if (validation.isValid) {
          toast.success('Rent receipt processed successfully');
        } else {
          toast.warning('Rent receipt processed with warnings. Please review.');
        }
      }
    } catch (error) {
      enterpriseLogger.error('Rent receipt processing error', { error });
      toast.error('Failed to process rent receipt: ' + error.message);
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const applyReceiptData = (propertyIndex) => {
    if (!receiptPreview) return;

    const property = properties[propertyIndex] || {};
    const updated = [...properties];

    updated[propertyIndex] = {
      ...property,
      annualRentalIncome: receiptPreview.rentAmount || property.annualRentalIncome,
      propertyAddress: receiptPreview.propertyAddress || property.propertyAddress,
      source: 'ocr',
      sourceData: {
        confidence: receiptPreview.confidence,
        date: receiptPreview.receiptDate,
      },
      receiptData: {
        landlordName: receiptPreview.landlordName,
        period: receiptPreview.period,
        receiptDate: receiptPreview.receiptDate,
        receiptNumber: receiptPreview.receiptNumber,
        tdsDeducted: receiptPreview.tdsDeducted,
      },
    };

    setProperties(updated);
    onUpdate({ properties: updated });

    // Notify parent about uploaded data for discrepancy checking
    if (onDataUploaded) {
      onDataUploaded({
        houseProperty: {
          properties: updated,
          uploadedReceipt: receiptPreview,
        },
      });
    }

    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Rent receipt data applied to property');
  };

  const handleCalculatorResult = (result, propertyIndex) => {
    if (result && result.success) {
      updateProperty(propertyIndex, 'preConstructionInterest', result.annualDeduction);
      setShowCalculator(false);
      setCalculatorPropertyIndex(null);
      toast.success('Pre-construction interest calculated and applied');
    }
  };

  const handleAISApplied = (appliedProperties) => {
    // Refresh properties after AIS data is applied
    // The mutation will invalidate queries and refetch
    toast.success(`${appliedProperties.length} propert${appliedProperties.length !== 1 ? 'ies' : 'y'} added from AIS`);
  };

  const handleBatchRentReceiptUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setBatchProcessing(true);
    setBatchResults(null);

    try {
      // First, process files through OCR
      const result = await rentReceiptOCRService.batchProcessRentReceipts(files, filingId);

      if (result.success) {
        setBatchResults(result);
        toast.success(`Processed ${result.successful} of ${result.totalProcessed} receipt(s)`);

        // If filingId is available, apply to filing
        if (filingId && result.results.length > 0) {
          const receipts = result.results
            .filter(r => r.success)
            .map(r => ({
              receiptId: r.receiptId || `receipt-${Date.now()}-${Math.random()}`,
              fileName: r.fileName,
              extractedData: r.extractedData,
              confidence: r.confidence,
            }));

          if (receipts.length > 0) {
            await rentReceiptOCRService.processRentReceiptsForFiling(receipts, filingId);
          }
        }
      }
    } catch (error) {
      enterpriseLogger.error('Batch rent receipt processing error', { error });
      toast.error('Failed to process rent receipts: ' + error.message);
    } finally {
      setBatchProcessing(false);
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
  };

  const applyBatchReceiptToProperty = async (propertyIndex) => {
    if (!batchResults || !batchResults.results || batchResults.results.length === 0) return;

    const successfulReceipts = batchResults.results.filter(r => r.success);
    if (successfulReceipts.length === 0) {
      toast.error('No successfully processed receipts to apply');
      return;
    }

    // Aggregate rent amounts from all receipts
    const totalRent = successfulReceipts.reduce((sum, receipt) => {
      return sum + (receipt.extractedData?.rentAmount || 0);
    }, 0);

    const property = properties[propertyIndex] || {};
    const updated = [...properties];

    // Use the first receipt's data for address and other details
    const firstReceipt = successfulReceipts[0];
    updated[propertyIndex] = {
      ...property,
      annualRentalIncome: (property.annualRentalIncome || 0) + totalRent,
      propertyAddress: firstReceipt.extractedData?.propertyAddress || property.propertyAddress,
      source: 'ocr',
      sourceData: {
        confidence: firstReceipt.confidence,
        date: new Date().toISOString(),
      },
      receiptData: {
        receipts: successfulReceipts.map(r => ({
          landlordName: r.extractedData?.landlordName,
          period: r.extractedData?.period,
          receiptDate: r.extractedData?.receiptDate,
          receiptNumber: r.extractedData?.receiptNumber,
          tdsDeducted: r.extractedData?.tdsDeducted || 0,
          rentAmount: r.extractedData?.rentAmount || 0,
        })),
      },
    };

    setProperties(updated);
    onUpdate({ properties: updated });

    // Notify parent about uploaded data
    if (onDataUploaded) {
      onDataUploaded({
        houseProperty: {
          properties: updated,
          uploadedReceipts: successfulReceipts,
        },
      });
    }

    setBatchResults(null);
    toast.success(`Applied ${successfulReceipts.length} receipt(s) to property`);
  };

  const openCalculator = (index) => {
    setCalculatorPropertyIndex(index);
    setShowCalculator(true);
  };

  return (
    <div className="space-y-4">
      {/* Pre-construction Calculator Modal */}
      {showCalculator && calculatorPropertyIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="text-heading-md text-gray-800">Pre-construction Interest Calculator</h3>
              <button
                onClick={() => {
                  setShowCalculator(false);
                  setCalculatorPropertyIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="text-heading-2">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <PreConstructionCalculator
                initialData={properties[calculatorPropertyIndex] || {}}
                onCalculate={(result) => handleCalculatorResult(result, calculatorPropertyIndex)}
              />
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Rent Receipt OCR Upload */}
      <RentReceiptOCRUpload
        filingId={filingId}
        onExtracted={(extractedData, propertyIndex) => {
          if (propertyIndex !== null && propertyIndex !== undefined) {
            applyReceiptData(propertyIndex);
          } else if (properties.length > 0) {
            // Apply to first property if no index specified
            applyReceiptData(0);
          } else {
            // Create new property with extracted data
            const newProperty = {
              propertyType: 'let_out',
              annualRentalIncome: extractedData.rentAmount || 0,
              propertyAddress: extractedData.propertyAddress || '',
              source: 'ocr',
              sourceData: {
                confidence: extractedData.confidence,
                date: extractedData.receiptDate || new Date().toISOString(),
              },
              receiptData: {
                landlordName: extractedData.landlordName,
                period: extractedData.period,
                receiptDate: extractedData.receiptDate,
                receiptNumber: extractedData.receiptNumber,
                tdsDeducted: extractedData.tdsDeducted,
              },
            };
            const updated = [...properties, newProperty];
            setProperties(updated);
            onUpdate({ properties: updated });
            toast.success('Property created with extracted data');
          }
        }}
      />

      {/* Property Document OCR Upload */}
      <PropertyDocumentOCRUpload
        filingId={filingId}
        onExtracted={(extractedData, propertyIndex) => {
          if (propertyIndex !== null && propertyIndex !== undefined) {
            // Apply to specific property
            const property = properties[propertyIndex] || {};
            const updated = [...properties];
            updated[propertyIndex] = {
              ...property,
              propertyAddress: extractedData.propertyAddress || property.propertyAddress,
              purchasePrice: extractedData.purchasePrice || property.purchasePrice,
              registrationNumber: extractedData.registrationNumber || property.registrationNumber,
              registrationDate: extractedData.registrationDate || property.registrationDate,
              propertyType: extractedData.propertyType || property.propertyType,
              area: extractedData.area || property.area,
              source: 'ocr',
              sourceData: {
                confidence: extractedData.confidence,
                date: new Date().toISOString(),
                documentType: extractedData.documentType,
              },
              documentData: {
                ownerName: extractedData.ownerName,
                sellerName: extractedData.sellerName,
                sellerPAN: extractedData.sellerPAN,
              },
            };
            setProperties(updated);
            onUpdate({ properties: updated });
            toast.success('Property document data applied');
          } else if (properties.length > 0) {
            // Apply to first property if no index specified
            const property = properties[0] || {};
            const updated = [...properties];
            updated[0] = {
              ...property,
              propertyAddress: extractedData.propertyAddress || property.propertyAddress,
              purchasePrice: extractedData.purchasePrice || property.purchasePrice,
              registrationNumber: extractedData.registrationNumber || property.registrationNumber,
              registrationDate: extractedData.registrationDate || property.registrationDate,
              propertyType: extractedData.propertyType || property.propertyType,
              area: extractedData.area || property.area,
              source: 'ocr',
              sourceData: {
                confidence: extractedData.confidence,
                date: new Date().toISOString(),
                documentType: extractedData.documentType,
              },
              documentData: {
                ownerName: extractedData.ownerName,
                sellerName: extractedData.sellerName,
                sellerPAN: extractedData.sellerPAN,
              },
            };
            setProperties(updated);
            onUpdate({ properties: updated });
            toast.success('Property document data applied');
          } else {
            // Create new property with extracted data
            const newProperty = {
              propertyType: 'self_occupied',
              propertyAddress: extractedData.propertyAddress || '',
              purchasePrice: extractedData.purchasePrice || null,
              registrationNumber: extractedData.registrationNumber || null,
              registrationDate: extractedData.registrationDate || null,
              propertyCategory: extractedData.propertyType || 'Residential',
              area: extractedData.area || null,
              source: 'ocr',
              sourceData: {
                confidence: extractedData.confidence,
                date: new Date().toISOString(),
                documentType: extractedData.documentType,
              },
              documentData: {
                ownerName: extractedData.ownerName,
                sellerName: extractedData.sellerName,
                sellerPAN: extractedData.sellerPAN,
              },
            };
            const updated = [...properties, newProperty];
            setProperties(updated);
            onUpdate({ properties: updated });
            toast.success('Property created with extracted document data');
          }
        }}
      />

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900">House Properties</h4>
        <button
          onClick={addProperty}
          className="flex items-center px-3 py-1.5 text-body-regular bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-500">No properties added yet</p>
          <button
            onClick={addProperty}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-slate-900">Property #{index + 1}</h5>
                <button
                  onClick={() => removeProperty(index)}
                  className="text-error-600 hover:text-error-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Data Provenance Indicator */}
              {property.source && (
                <div className="mb-3">
                  <FieldAutoFillIndicator
                    source={property.source}
                    sourceDocument={property.source === 'ais' ? 'AIS' : property.source === 'ocr' ? 'Rent Receipt' : null}
                    uploadDate={property.sourceData?.date || property.receiptData?.receiptDate}
                    isEdited={property.isEdited}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-1">Property Type</label>
                  <select
                    value={property.propertyType || 'self_occupied'}
                    onChange={(e) => updateProperty(index, 'propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="self_occupied">Self Occupied</option>
                    <option value="let_out">Let Out</option>
                    <option value="deemed_let_out">Deemed Let Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-1">
                    Annual Rental Income (₹)
                    {property.source && (
                      <SourceChip source={property.source} size="sm" className="ml-2" />
                    )}
                  </label>
                  <input
                    type="number"
                    value={property.annualRentalIncome || 0}
                    onChange={(e) => {
                      updateProperty(index, 'annualRentalIncome', parseFloat(e.target.value) || 0);
                      // Mark as edited if user changes AIS/OCR data
                      if (property.source && property.source !== 'manual') {
                        updateProperty(index, 'isEdited', true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-1">Municipal Taxes Paid (₹)</label>
                  <input
                    type="number"
                    value={property.municipalTaxes || 0}
                    onChange={(e) => updateProperty(index, 'municipalTaxes', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-1">Interest on Housing Loan (₹)</label>
                  <input
                    type="number"
                    value={property.interestOnLoan || 0}
                    onChange={(e) => updateProperty(index, 'interestOnLoan', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-body-regular font-medium text-slate-700">Pre-construction Interest (₹)</label>
                    <button
                      type="button"
                      onClick={() => openCalculator(index)}
                      className="flex items-center gap-1 text-body-small text-blue-600 hover:text-blue-700"
                    >
                      <Calculator className="w-3 h-3" />
                      Calculate
                    </button>
                  </div>
                  <input
                    type="number"
                    value={property.preConstructionInterest || 0}
                    onChange={(e) => updateProperty(index, 'preConstructionInterest', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-body-regular font-medium text-slate-700 mb-1">Property Address</label>
                  <textarea
                    value={property.propertyAddress || ''}
                    onChange={(e) => {
                      updateProperty(index, 'propertyAddress', e.target.value);
                      // Mark as edited if user changes OCR data
                      if (property.source && property.source !== 'manual') {
                        updateProperty(index, 'isEdited', true);
                      }
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter property address"
                  />
                </div>

                {/* Property Document OCR for this specific property */}
                <div className="md:col-span-2">
                  <PropertyDocumentOCRUpload
                    filingId={filingId}
                    propertyIndex={index}
                    onExtracted={(extractedData) => {
                      const updated = [...properties];
                      updated[index] = {
                        ...updated[index],
                        propertyAddress: extractedData.propertyAddress || updated[index].propertyAddress,
                        purchasePrice: extractedData.purchasePrice || updated[index].purchasePrice,
                        registrationNumber: extractedData.registrationNumber || updated[index].registrationNumber,
                        registrationDate: extractedData.registrationDate || updated[index].registrationDate,
                        propertyType: extractedData.propertyType || updated[index].propertyType,
                        area: extractedData.area || updated[index].area,
                        source: 'ocr',
                        sourceData: {
                          confidence: extractedData.confidence,
                          date: new Date().toISOString(),
                          documentType: extractedData.documentType,
                        },
                        documentData: {
                          ownerName: extractedData.ownerName,
                          sellerName: extractedData.sellerName,
                          sellerPAN: extractedData.sellerPAN,
                        },
                      };
                      setProperties(updated);
                      onUpdate({ properties: updated });
                      toast.success('Property document data applied');
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HousePropertyForm;

