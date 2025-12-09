// =====================================================
// TAXES PAID FORM COMPONENT
// For all ITR forms - Taxes paid details
// Enhanced with Form26AS auto-population and detailed TDS breakdown
// =====================================================

import React, { useState, useMemo, useCallback } from 'react';
import { CreditCard, Building2, Plus, Trash2, Info, AlertCircle, Download, Calculator, ChevronDown, ChevronUp, FileCheck } from 'lucide-react';
import SourceChip from '../../../components/UI/SourceChip/SourceChip';

const TaxesPaidForm = ({ data, onUpdate, autoFilledFields = {}, sources = {} }) => {
  const [showTDSDetails, setShowTDSDetails] = useState(false);
  const [showAdvanceTaxDetails, setShowAdvanceTaxDetails] = useState(false);
  const [tdsEntries, setTdsEntries] = useState(data?.tdsEntries || []);
  const [advanceTaxEntries, setAdvanceTaxEntries] = useState(data?.advanceTaxEntries || []);

  // Calculate totals
  const totalTDS = useMemo(() => {
    if (tdsEntries.length > 0) {
      return tdsEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    }
    return parseFloat(data?.tds) || 0;
  }, [tdsEntries, data?.tds]);

  const totalAdvanceTax = useMemo(() => {
    if (advanceTaxEntries.length > 0) {
      return advanceTaxEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    }
    return parseFloat(data?.advanceTax) || 0;
  }, [advanceTaxEntries, data?.advanceTax]);

  const totalTaxesPaid = useMemo(() => {
    return totalTDS + totalAdvanceTax + (parseFloat(data?.selfAssessmentTax) || 0) + (parseFloat(data?.tcs) || 0);
  }, [totalTDS, totalAdvanceTax, data?.selfAssessmentTax, data?.tcs]);

  // Handle field change
  const handleChange = useCallback((field, value) => {
    onUpdate({ [field]: parseFloat(value) || 0 });
  }, [onUpdate]);

  // Add TDS entry
  const handleAddTDSEntry = useCallback(() => {
    const newEntry = {
      id: Date.now(),
      deductorName: '',
      tan: '',
      amount: 0,
      section: '192',
      source: 'manual',
    };
    const updatedEntries = [...tdsEntries, newEntry];
    setTdsEntries(updatedEntries);
    onUpdate({ tdsEntries: updatedEntries, tds: updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0) });
  }, [tdsEntries, onUpdate]);

  // Update TDS entry
  const handleTDSEntryChange = useCallback((id, field, value) => {
    const updatedEntries = tdsEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : entry,
    );
    setTdsEntries(updatedEntries);
    const total = updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
    onUpdate({ tdsEntries: updatedEntries, tds: total });
  }, [tdsEntries, onUpdate]);

  // Remove TDS entry
  const handleRemoveTDSEntry = useCallback((id) => {
    const updatedEntries = tdsEntries.filter(entry => entry.id !== id);
    setTdsEntries(updatedEntries);
    const total = updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
    onUpdate({ tdsEntries: updatedEntries, tds: total });
  }, [tdsEntries, onUpdate]);

  // Add Advance Tax entry
  const handleAddAdvanceTaxEntry = useCallback(() => {
    const newEntry = {
      id: Date.now(),
      bsrCode: '',
      challanDate: '',
      challanNumber: '',
      amount: 0,
    };
    const updatedEntries = [...advanceTaxEntries, newEntry];
    setAdvanceTaxEntries(updatedEntries);
    onUpdate({ advanceTaxEntries: updatedEntries, advanceTax: updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0) });
  }, [advanceTaxEntries, onUpdate]);

  // Update Advance Tax entry
  const handleAdvanceTaxEntryChange = useCallback((id, field, value) => {
    const updatedEntries = advanceTaxEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : entry,
    );
    setAdvanceTaxEntries(updatedEntries);
    const total = updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
    onUpdate({ advanceTaxEntries: updatedEntries, advanceTax: total });
  }, [advanceTaxEntries, onUpdate]);

  // Remove Advance Tax entry
  const handleRemoveAdvanceTaxEntry = useCallback((id) => {
    const updatedEntries = advanceTaxEntries.filter(entry => entry.id !== id);
    setAdvanceTaxEntries(updatedEntries);
    const total = updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
    onUpdate({ advanceTaxEntries: updatedEntries, advanceTax: total });
  }, [advanceTaxEntries, onUpdate]);

  // Check if field is auto-filled
  const isAutoFilled = useCallback((field) => {
    return autoFilledFields?.taxesPaid?.includes(field);
  }, [autoFilledFields]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // TDS sections
  const tdsSections = [
    { value: '192', label: '192 - Salary' },
    { value: '193', label: '193 - Interest on Securities' },
    { value: '194', label: '194 - Dividends' },
    { value: '194A', label: '194A - Interest other than Securities' },
    { value: '194B', label: '194B - Winnings from Lottery' },
    { value: '194C', label: '194C - Contractor Payments' },
    { value: '194D', label: '194D - Insurance Commission' },
    { value: '194H', label: '194H - Commission/Brokerage' },
    { value: '194I', label: '194I - Rent' },
    { value: '194J', label: '194J - Professional/Technical Fees' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Form 26AS Auto-populate Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">Auto-fill from Form 26AS</h4>
            <p className="text-xs text-gray-600 mt-1">
              TDS details can be auto-populated from your Form 26AS. Connect to the Income Tax Portal to fetch your tax credit statement.
            </p>
            {sources?.form26as?.available && (
              <div className="mt-2 flex items-center text-xs text-green-700">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Form 26AS data available - Last updated: {sources.form26as.updatedAt || 'Recently'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TDS Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <CreditCard className="w-4 h-4 mr-2 text-gold-500" />
            Tax Deducted at Source (TDS)
            {isAutoFilled('tds') && <SourceChip source="26as" size="sm" className="ml-2" />}
          </h4>
          <button
            type="button"
            onClick={() => setShowTDSDetails(!showTDSDetails)}
            className="flex items-center text-sm text-gold-600 hover:text-gold-700 font-medium"
          >
            {showTDSDetails ? 'Simple View' : 'Detailed Entry'}
            {showTDSDetails ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        {/* Simple TDS Entry */}
        {!showTDSDetails && (
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={data?.tds || 0}
                onChange={(e) => handleChange('tds', e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg font-semibold ${
                  isAutoFilled('tds') ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total TDS deducted by all deductors</p>
          </div>
        )}

        {/* Detailed TDS Entries */}
        {showTDSDetails && (
          <div className="space-y-3">
            {tdsEntries.map((entry, index) => (
              <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">TDS Entry {index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {entry.source && <SourceChip source={entry.source} size="sm" />}
                    <button
                      type="button"
                      onClick={() => handleRemoveTDSEntry(entry.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Deductor Name</label>
                    <input
                      type="text"
                      value={entry.deductorName}
                      onChange={(e) => handleTDSEntryChange(entry.id, 'deductorName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                      placeholder="Company/Employer Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TAN</label>
                    <input
                      type="text"
                      value={entry.tan}
                      onChange={(e) => handleTDSEntryChange(entry.id, 'tan', e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm font-mono"
                      placeholder="ABCD12345E"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                    <select
                      value={entry.section}
                      onChange={(e) => handleTDSEntryChange(entry.id, 'section', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                    >
                      {tdsSections.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => handleTDSEntryChange(entry.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddTDSEntry}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gold-400 hover:text-gold-600 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add TDS Entry
            </button>

            {tdsEntries.length > 0 && (
              <div className="flex justify-end">
                <div className="text-sm font-semibold text-gray-900">
                  Total TDS: <span className="text-gold-600">{formatCurrency(totalTDS)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TCS Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
          <CreditCard className="w-4 h-4 mr-2 text-gold-500" />
          Tax Collected at Source (TCS)
        </h4>
        <div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={data?.tcs || 0}
              onChange={(e) => handleChange('tcs', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">TCS collected (e.g., on sale of goods, foreign remittance)</p>
        </div>
      </div>

      {/* Advance Tax Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-gold-500" />
            Advance Tax
          </h4>
          <button
            type="button"
            onClick={() => setShowAdvanceTaxDetails(!showAdvanceTaxDetails)}
            className="flex items-center text-sm text-gold-600 hover:text-gold-700 font-medium"
          >
            {showAdvanceTaxDetails ? 'Simple View' : 'Add Challans'}
            {showAdvanceTaxDetails ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        {/* Simple Advance Tax Entry */}
        {!showAdvanceTaxDetails && (
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={data?.advanceTax || 0}
                onChange={(e) => handleChange('advanceTax', e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total advance tax paid during the year</p>
          </div>
        )}

        {/* Detailed Advance Tax Entries */}
        {showAdvanceTaxDetails && (
          <div className="space-y-3">
            {advanceTaxEntries.map((entry, index) => (
              <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Challan {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdvanceTaxEntry(entry.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">BSR Code</label>
                    <input
                      type="text"
                      value={entry.bsrCode}
                      onChange={(e) => handleAdvanceTaxEntryChange(entry.id, 'bsrCode', e.target.value)}
                      maxLength={7}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm font-mono"
                      placeholder="1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Deposit</label>
                    <input
                      type="date"
                      value={entry.challanDate}
                      onChange={(e) => handleAdvanceTaxEntryChange(entry.id, 'challanDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Challan Serial No.</label>
                    <input
                      type="text"
                      value={entry.challanNumber}
                      onChange={(e) => handleAdvanceTaxEntryChange(entry.id, 'challanNumber', e.target.value)}
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm font-mono"
                      placeholder="00001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => handleAdvanceTaxEntryChange(entry.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAdvanceTaxEntry}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gold-400 hover:text-gold-600 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Advance Tax Challan
            </button>

            {advanceTaxEntries.length > 0 && (
              <div className="flex justify-end">
                <div className="text-sm font-semibold text-gray-900">
                  Total Advance Tax: <span className="text-gold-600">{formatCurrency(totalAdvanceTax)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Self Assessment Tax Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
          <Calculator className="w-4 h-4 mr-2 text-gold-500" />
          Self Assessment Tax
        </h4>
        <div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={data?.selfAssessmentTax || 0}
              onChange={(e) => handleChange('selfAssessmentTax', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Tax paid after calculating final tax liability (before filing)</p>
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center mb-3">
          <Calculator className="w-5 h-5 text-green-600 mr-2" />
          <h4 className="text-sm font-semibold text-gray-900">Taxes Paid Summary</h4>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">TDS</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalTDS)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">TCS</span>
            <span className="font-medium text-gray-900">{formatCurrency(data?.tcs || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Advance Tax</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalAdvanceTax)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Self Assessment Tax</span>
            <span className="font-medium text-gray-900">{formatCurrency(data?.selfAssessmentTax || 0)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total Taxes Paid</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalTaxesPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info about tax credit */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Ensure all TDS/TCS entries match with your Form 26AS. Any discrepancy may result in rejection of tax credit.
            You can verify your tax credits by downloading Form 26AS from the Income Tax Portal.
          </p>
        </div>
      </div>
    </div>
  );
};

// Add missing import
const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default TaxesPaidForm;

