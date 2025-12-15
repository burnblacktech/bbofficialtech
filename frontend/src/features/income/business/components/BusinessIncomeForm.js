// =====================================================
// BUSINESS INCOME FORM COMPONENT
// For ITR-3 and ITR-4 forms
// Enhanced with detailed P&L statement
// =====================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Building2, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { useAISBusinessIncome } from '../hooks/use-ais-integration';
import AISBusinessPopup from './ais-business-popup';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import toast from 'react-hot-toast';

const BusinessIncomeForm = ({ filingId, data, onUpdate, selectedITR, onDataUploaded }) => {
  // Business income (detailed) is only applicable for ITR-3
  if (selectedITR !== 'ITR-3' && selectedITR !== 'ITR3') {
    return null;
  }

  const isITR4 = false; // Business income detailed form is not for ITR-4
  const isITR3 = true; // This form is only for ITR-3

  const [expandedSections, setExpandedSections] = useState({});
  const [showAISPopup, setShowAISPopup] = useState(false);

  // Fetch AIS data if filingId is available
  const { data: aisData, isLoading: isLoadingAIS } = useAISBusinessIncome(filingId);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleAISApplied = (appliedData) => {
    // Refresh data after AIS data is applied
    // The mutation will invalidate queries and refetch
    toast.success(`${appliedData.businesses?.length || 0} business${(appliedData.businesses?.length || 0) !== 1 ? 'es' : ''} added from AIS`);
  };

  const [businesses, setBusinesses] = useState(data?.businesses || [{
    businessName: '',
    businessNature: '',
    businessAddress: '',
    businessPAN: '',
    gstNumber: '',
    pnl: {
      grossReceipts: 0,
      openingStock: 0,
      purchases: 0,
      closingStock: 0,
      directExpenses: {
        rawMaterials: 0,
        wages: 0,
        powerFuel: 0,
        freight: 0,
        other: 0,
        total: 0,
      },
      indirectExpenses: {
        rent: 0,
        salary: 0,
        utilities: 0,
        insurance: 0,
        advertising: 0,
        professionalFees: 0,
        other: 0,
        total: 0,
      },
      depreciation: {
        building: 0,
        machinery: 0,
        vehicles: 0,
        furniture: 0,
        other: 0,
        total: 0,
      },
      otherExpenses: 0,
      netProfit: 0,
    },
  }]);

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const addBusiness = () => {
    const newBusiness = {
      businessName: '',
      businessNature: '',
      businessAddress: '',
      businessPAN: '',
      gstNumber: '',
      pnl: {
        grossReceipts: 0,
        openingStock: 0,
        purchases: 0,
        closingStock: 0,
        directExpenses: {
          rawMaterials: 0,
          wages: 0,
          powerFuel: 0,
          freight: 0,
          other: 0,
          total: 0,
        },
        indirectExpenses: {
          rent: 0,
          salary: 0,
          utilities: 0,
          insurance: 0,
          advertising: 0,
          professionalFees: 0,
          other: 0,
          total: 0,
        },
        depreciation: {
          building: 0,
          machinery: 0,
          vehicles: 0,
          furniture: 0,
          other: 0,
          total: 0,
        },
        otherExpenses: 0,
        netProfit: 0,
      },
    };
    const updated = [...businesses, newBusiness];
    setBusinesses(updated);
    onUpdate({ businesses: updated });
  };

  const removeBusiness = (index) => {
    const updated = businesses.filter((_, i) => i !== index);
    setBusinesses(updated);
    onUpdate({ businesses: updated });
  };

  const updateBusiness = (index, field, value) => {
    const updated = [...businesses];
    updated[index] = { ...updated[index], [field]: value };
    setBusinesses(updated);
    onUpdate({ businesses: updated });
  };

  const updatePNL = (businessIndex, field, value) => {
    const updated = [...businesses];
    updated[businessIndex].pnl = {
      ...updated[businessIndex].pnl,
      [field]: parseFloat(value) || 0,
    };

    // Recalculate net profit
    const pnl = updated[businessIndex].pnl;
    const directTotal = Object.entries(pnl.directExpenses || {}).reduce((sum, [key, val]) => {
      if (key === 'total') return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
    const indirectTotal = Object.entries(pnl.indirectExpenses || {}).reduce((sum, [key, val]) => {
      if (key === 'total') return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
    const depTotal = Object.entries(pnl.depreciation || {}).reduce((sum, [key, val]) => {
      if (key === 'total') return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    updated[businessIndex].pnl.directExpenses = {
      ...updated[businessIndex].pnl.directExpenses,
      total: directTotal,
    };
    updated[businessIndex].pnl.indirectExpenses = {
      ...updated[businessIndex].pnl.indirectExpenses,
      total: indirectTotal,
    };
    updated[businessIndex].pnl.depreciation = {
      ...updated[businessIndex].pnl.depreciation,
      total: depTotal,
    };

    updated[businessIndex].pnl.netProfit = (pnl.grossReceipts || 0) +
      (pnl.openingStock || 0) -
      (pnl.closingStock || 0) -
      (pnl.purchases || 0) -
      directTotal -
      indirectTotal -
      depTotal -
      (pnl.otherExpenses || 0);

    setBusinesses(updated);
    onUpdate({ businesses: updated });
  };

  const updateExpenseCategory = (businessIndex, category, field, value) => {
    const updated = [...businesses];
    updated[businessIndex].pnl = {
      ...updated[businessIndex].pnl,
      [category]: {
        ...updated[businessIndex].pnl[category],
        [field]: parseFloat(value) || 0,
      },
    };

    // Recalculate category total
    const categoryData = updated[businessIndex].pnl[category];
    const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
      if (key === 'total') return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    updated[businessIndex].pnl[category] = {
      ...categoryData,
      total: total,
    };

    // Recalculate net profit
    const pnl = updated[businessIndex].pnl;
    const directTotal = pnl.directExpenses?.total || 0;
    const indirectTotal = pnl.indirectExpenses?.total || 0;
    const depTotal = pnl.depreciation?.total || 0;

    updated[businessIndex].pnl.netProfit = (pnl.grossReceipts || 0) +
      (pnl.openingStock || 0) -
      (pnl.closingStock || 0) -
      (pnl.purchases || 0) -
      directTotal -
      indirectTotal -
      depTotal -
      (pnl.otherExpenses || 0);

    setBusinesses(updated);
    onUpdate({ businesses: updated });
  };

  // ITR-4: Presumptive taxation (simplified)
  if (isITR4) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gross Receipts/Turnover (₹)
          </label>
          <input
            type="number"
            value={data?.grossReceipts || 0}
            onChange={(e) => handleChange('grossReceipts', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            max={20000000}
          />
          <p className="text-xs text-gray-500 mt-1">Maximum ₹2 crores for ITR-4</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Presumptive Rate (%)
          </label>
          <select
            value={data?.presumptiveRate || 8}
            onChange={(e) => handleChange('presumptiveRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value={8}>8% (Digital Receipts)</option>
            <option value={6}>6% (Digital Receipts)</option>
            <option value={5}>5% (Non-Digital Receipts)</option>
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Presumptive Income:</span>
            <span className="text-lg font-bold text-gray-900">
              ₹{((data?.grossReceipts || 0) * (data?.presumptiveRate || 8) / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ITR-3: Detailed business income with P&L
  if (isITR3) {
    return (
      <div className="space-y-6">
        {/* AIS Business Income Popup */}
        {showAISPopup && filingId && (
          <AISBusinessPopup
            filingId={filingId}
            formBusinesses={businesses}
            onClose={() => setShowAISPopup(false)}
            onApplied={handleAISApplied}
          />
        )}

        {/* Data Source Options */}
        {filingId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AIS Integration */}
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">AIS Business Income</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Auto-populate business income from Annual Information Statement (AIS)
                  </p>
                  <button
                    onClick={() => setShowAISPopup(true)}
                    disabled={isLoadingAIS}
                    className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {isLoadingAIS ? 'Loading...' : 'Import from AIS'}
                  </button>
                  {aisData?.businessIncome && aisData.businessIncome.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      {aisData.businessIncome.length} business{aisData.businessIncome.length !== 1 ? 'es' : ''} found in AIS
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* GST/Broker Import Placeholder */}
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">GST Data Import</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Import business data from GST returns (coming soon)
                  </p>
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Businesses Support */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Income
          </h3>
          <button
            onClick={addBusiness}
            className="flex items-center gap-2 px-3 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Business
          </button>
        </div>

        {businesses.map((business, businessIndex) => (
          <div key={businessIndex} className="border border-gray-200 rounded-lg p-6 bg-white">
            {/* Business Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-md font-semibold text-gray-900">
                  Business {businessIndex + 1}
                  {business.businessName && ` - ${business.businessName}`}
                </h4>
                {business.source === 'ais' && <SourceChip source="ais" />}
              </div>
              {businesses.length > 1 && (
                <button
                  onClick={() => removeBusiness(businessIndex)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Business Details Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection(`businessDetails-${businessIndex}`)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Business Details</span>
                {expandedSections[`businessDetails-${businessIndex}`] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections[`businessDetails-${businessIndex}`] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={business.businessName || ''}
                      onChange={(e) => updateBusiness(businessIndex, 'businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business</label>
                    <input
                      type="text"
                      value={business.businessNature || ''}
                      onChange={(e) => updateBusiness(businessIndex, 'businessNature', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business PAN (if applicable)</label>
                    <input
                      type="text"
                      value={business.businessPAN || ''}
                      onChange={(e) => updateBusiness(businessIndex, 'businessPAN', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (if applicable)</label>
                    <input
                      type="text"
                      value={business.gstNumber || ''}
                      onChange={(e) => updateBusiness(businessIndex, 'gstNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea
                      value={business.businessAddress || ''}
                      onChange={(e) => updateBusiness(businessIndex, 'businessAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* P&L Statement */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 border-b pb-2">Profit & Loss Statement</h5>

              {/* Basic P&L Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">Gross Receipts/Turnover (₹)</label>
                    {business.source === 'ais' && business.pnl?.grossReceipts > 0 && (
                      <SourceChip source="ais" size="sm" />
                    )}
                  </div>
                  <input
                    type="number"
                    value={business.pnl?.grossReceipts || 0}
                    onChange={(e) => updatePNL(businessIndex, 'grossReceipts', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock (₹)</label>
                  <input
                    type="number"
                    value={business.pnl?.openingStock || 0}
                    onChange={(e) => updatePNL(businessIndex, 'openingStock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchases (₹)</label>
                  <input
                    type="number"
                    value={business.pnl?.purchases || 0}
                    onChange={(e) => updatePNL(businessIndex, 'purchases', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Stock (₹)</label>
                  <input
                    type="number"
                    value={business.pnl?.closingStock || 0}
                    onChange={(e) => updatePNL(businessIndex, 'closingStock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Direct Expenses - Expandable */}
              <div>
                <button
                  onClick={() => toggleSection(`directExpenses-${businessIndex}`)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Direct Expenses</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Total: ₹{(business.pnl?.directExpenses?.total || 0).toLocaleString('en-IN')}
                    </span>
                    {expandedSections[`directExpenses-${businessIndex}`] ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {expandedSections[`directExpenses-${businessIndex}`] && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Raw Materials (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.directExpenses?.rawMaterials || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'directExpenses', 'rawMaterials', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wages & Salaries (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.directExpenses?.wages || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'directExpenses', 'wages', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Power & Fuel (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.directExpenses?.powerFuel || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'directExpenses', 'powerFuel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Freight & Carriage (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.directExpenses?.freight || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'directExpenses', 'freight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Direct Expenses (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.directExpenses?.other || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'directExpenses', 'other', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Indirect Expenses - Expandable */}
              <div>
                <button
                  onClick={() => toggleSection(`indirectExpenses-${businessIndex}`)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Indirect Expenses</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Total: ₹{(business.pnl?.indirectExpenses?.total || 0).toLocaleString('en-IN')}
                    </span>
                    {expandedSections[`indirectExpenses-${businessIndex}`] ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {expandedSections[`indirectExpenses-${businessIndex}`] && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rent (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.rent || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'rent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salaries (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.salary || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'salary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Utilities (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.utilities || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'utilities', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.insurance || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'insurance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advertising (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.advertising || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'advertising', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Fees (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.professionalFees || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'professionalFees', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Indirect Expenses (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.indirectExpenses?.other || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'indirectExpenses', 'other', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Depreciation - Expandable */}
              <div>
                <button
                  onClick={() => toggleSection(`depreciation-${businessIndex}`)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Depreciation</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Total: ₹{(business.pnl?.depreciation?.total || 0).toLocaleString('en-IN')}
                    </span>
                    {expandedSections[`depreciation-${businessIndex}`] ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {expandedSections[`depreciation-${businessIndex}`] && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Building (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.depreciation?.building || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'depreciation', 'building', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Machinery (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.depreciation?.machinery || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'depreciation', 'machinery', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicles (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.depreciation?.vehicles || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'depreciation', 'vehicles', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Furniture & Fixtures (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.depreciation?.furniture || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'depreciation', 'furniture', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Assets (₹)</label>
                      <input
                        type="number"
                        value={business.pnl?.depreciation?.other || 0}
                        onChange={(e) => updateExpenseCategory(businessIndex, 'depreciation', 'other', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Other Expenses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Expenses (₹)</label>
                <input
                  type="number"
                  value={business.pnl?.otherExpenses || 0}
                  onChange={(e) => updatePNL(businessIndex, 'otherExpenses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Net Profit/Loss Display */}
              <div className={`rounded-lg p-4 ${
                (business.pnl?.netProfit || 0) >= 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {(business.pnl?.netProfit || 0) >= 0 ? 'Net Profit' : 'Net Loss'} from Business:
                  </span>
                  <span className={`text-lg font-bold ${
                    (business.pnl?.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ₹{Math.abs(business.pnl?.netProfit || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Total Business Income Summary */}
        {businesses.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total Net Business Income:</span>
              <span className="text-xl font-bold text-blue-900">
                ₹{businesses.reduce((sum, biz) => sum + (biz.pnl?.netProfit || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for non-ITR-3 (ITR-4 or legacy)
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
        <input
          type="text"
          value={data?.businessName || ''}
          onChange={(e) => handleChange('businessName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business</label>
        <input
          type="text"
          value={data?.businessNature || ''}
          onChange={(e) => handleChange('businessNature', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gross Receipts/Turnover (₹)</label>
          <input
            type="number"
            value={data?.grossReceipts || 0}
            onChange={(e) => handleChange('grossReceipts', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock (₹)</label>
          <input
            type="number"
            value={data?.openingStock || 0}
            onChange={(e) => handleChange('openingStock', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchases (₹)</label>
          <input
            type="number"
            value={data?.purchases || 0}
            onChange={(e) => handleChange('purchases', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Stock (₹)</label>
          <input
            type="number"
            value={data?.closingStock || 0}
            onChange={(e) => handleChange('closingStock', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direct Expenses (₹)</label>
          <input
            type="number"
            value={data?.directExpenses || 0}
            onChange={(e) => handleChange('directExpenses', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Indirect Expenses (₹)</label>
          <input
            type="number"
            value={data?.indirectExpenses || 0}
            onChange={(e) => handleChange('indirectExpenses', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation (₹)</label>
          <input
            type="number"
            value={data?.depreciation || 0}
            onChange={(e) => handleChange('depreciation', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Net Profit from Business:</span>
          <span className="text-lg font-bold text-gray-900">
            ₹{(
              (data?.grossReceipts || 0) +
              (data?.openingStock || 0) -
              (data?.closingStock || 0) -
              (data?.purchases || 0) -
              (data?.directExpenses || 0) -
              (data?.indirectExpenses || 0) -
              (data?.depreciation || 0)
            ).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessIncomeForm;

