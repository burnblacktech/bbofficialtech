// =====================================================
// PROFESSIONAL INCOME FORM COMPONENT
// For ITR-3 forms - Professional income with expenses
// =====================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Briefcase, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { useAISProfessionalIncome } from '../hooks/use-ais-integration';
import AISProfessionalPopup from './ais-professional-popup';
import SourceChip from '../../../../components/UI/SourceChip/SourceChip';
import toast from 'react-hot-toast';

const ProfessionalIncomeForm = ({ filingId, data, onUpdate, selectedITR, onDataUploaded }) => {
  const isITR3 = selectedITR === 'ITR-3' || selectedITR === 'ITR3';

  const [expandedSections, setExpandedSections] = useState({});
  const [showAISPopup, setShowAISPopup] = useState(false);

  // Fetch AIS data if filingId is available
  const { data: aisData, isLoading: isLoadingAIS } = useAISProfessionalIncome(filingId);

  const [professions, setProfessions] = useState(data?.professions || [{
    professionName: '',
    professionType: '',
    professionAddress: '',
    registrationNumber: '',
    pnl: {
      professionalFees: 0,
      expenses: {
        officeRent: 0,
        professionalFeesPaid: 0,
        travel: 0,
        communication: 0,
        booksPeriodicals: 0,
        other: 0,
        total: 0,
      },
      depreciation: {
        officeEquipment: 0,
        furniture: 0,
        vehicles: 0,
        other: 0,
        total: 0,
      },
      netIncome: 0,
    },
  }]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const addProfession = () => {
    const newProfession = {
      professionName: '',
      professionType: '',
      professionAddress: '',
      registrationNumber: '',
      pnl: {
        professionalFees: 0,
        expenses: {
          officeRent: 0,
          professionalFeesPaid: 0,
          travel: 0,
          communication: 0,
          booksPeriodicals: 0,
          other: 0,
          total: 0,
        },
        depreciation: {
          officeEquipment: 0,
          furniture: 0,
          vehicles: 0,
          other: 0,
          total: 0,
        },
        netIncome: 0,
      },
    };
    const updated = [...professions, newProfession];
    setProfessions(updated);
    onUpdate({ professions: updated });
  };

  const removeProfession = (index) => {
    const updated = professions.filter((_, i) => i !== index);
    setProfessions(updated);
    onUpdate({ professions: updated });
  };

  const updateProfession = (index, field, value) => {
    const updated = [...professions];
    updated[index] = { ...updated[index], [field]: value };
    setProfessions(updated);
    onUpdate({ professions: updated });
  };

  const updatePNL = (professionIndex, field, value) => {
    const updated = [...professions];
    updated[professionIndex].pnl[field] = parseFloat(value) || 0;

    // Recalculate net income
    const pnl = updated[professionIndex].pnl;
    const expensesTotal = Object.values(pnl.expenses || {}).reduce((sum, val) =>
      typeof val === 'number' ? sum + val : sum, 0) - (pnl.expenses?.total || 0);
    const depTotal = Object.values(pnl.depreciation || {}).reduce((sum, val) =>
      typeof val === 'number' ? sum + val : sum, 0) - (pnl.depreciation?.total || 0);

    pnl.expenses.total = expensesTotal;
    pnl.depreciation.total = depTotal;

    pnl.netIncome = (pnl.professionalFees || 0) -
      (pnl.expenses?.total || 0) -
      (pnl.depreciation?.total || 0);

    setProfessions(updated);
    onUpdate({ professions: updated });
  };

  const updateExpenseCategory = (professionIndex, category, field, value) => {
    const updated = [...professions];
    updated[professionIndex].pnl[category][field] = parseFloat(value) || 0;

    // Recalculate category total
    const categoryData = updated[professionIndex].pnl[category];
    const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
      if (key === 'total') return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
    categoryData.total = total;

    // Recalculate net income
    const pnl = updated[professionIndex].pnl;
    pnl.netIncome = (pnl.professionalFees || 0) -
      (pnl.expenses?.total || 0) -
      (pnl.depreciation?.total || 0);

    setProfessions(updated);
    onUpdate({ professions: updated });
  };

  const handleAISApplied = (appliedData) => {
    // Refresh data after AIS data is applied
    // The mutation will invalidate queries and refetch
    toast.success(`${appliedData.professions?.length || 0} profession${(appliedData.professions?.length || 0) !== 1 ? 's' : ''} added from AIS`);
  };

  if (!isITR3) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* AIS Professional Income Popup */}
      {showAISPopup && filingId && (
        <AISProfessionalPopup
          filingId={filingId}
          formProfessions={professions}
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
                <h4 className="font-semibold text-gray-900 mb-1">AIS Professional Income</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Auto-populate professional income from Annual Information Statement (AIS)
                </p>
                <button
                  onClick={() => setShowAISPopup(true)}
                  disabled={isLoadingAIS}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {isLoadingAIS ? 'Loading...' : 'Import from AIS'}
                </button>
                {aisData?.professionalIncome && aisData.professionalIncome.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {aisData.professionalIncome.length} profession{aisData.professionalIncome.length !== 1 ? 's' : ''} found in AIS
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client Import Placeholder */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Client Data Import</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Import professional income from client invoices (coming soon)
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

      {/* Multiple Professions Support */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Professional Income
        </h3>
        <button
          onClick={addProfession}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Profession
        </button>
      </div>

      {professions.map((profession, professionIndex) => (
        <div key={professionIndex} className="border border-gray-200 rounded-lg p-6 bg-white">
          {/* Profession Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-md font-semibold text-gray-900">
                Profession {professionIndex + 1}
                {profession.professionName && ` - ${profession.professionName}`}
              </h4>
              {profession.source === 'ais' && <SourceChip source="ais" />}
            </div>
            {professions.length > 1 && (
              <button
                onClick={() => removeProfession(professionIndex)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profession Details Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection(`professionDetails-${professionIndex}`)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-700">Profession Details</span>
              {expandedSections[`professionDetails-${professionIndex}`] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedSections[`professionDetails-${professionIndex}`] && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession Name</label>
                  <input
                    type="text"
                    value={profession.professionName || ''}
                    onChange={(e) => updateProfession(professionIndex, 'professionName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession Type</label>
                  <select
                    value={profession.professionType || ''}
                    onChange={(e) => updateProfession(professionIndex, 'professionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Select Profession</option>
                    <option value="ca">Chartered Accountant</option>
                    <option value="doctor">Doctor</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="architect">Architect</option>
                    <option value="engineer">Engineer</option>
                    <option value="consultant">Consultant</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={profession.registrationNumber || ''}
                    onChange={(e) => updateProfession(professionIndex, 'registrationNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="CA/Medical/Legal registration"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Address</label>
                  <textarea
                    value={profession.professionAddress || ''}
                    onChange={(e) => updateProfession(professionIndex, 'professionAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Professional Income & Expenses */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 border-b pb-2">Professional Income & Expenses</h5>

            {/* Professional Fees */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">Professional Fees Received (₹)</label>
                {profession.source === 'ais' && profession.pnl?.professionalFees > 0 && (
                  <SourceChip source="ais" size="sm" />
                )}
              </div>
              <input
                type="number"
                value={profession.pnl?.professionalFees || 0}
                onChange={(e) => updatePNL(professionIndex, 'professionalFees', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            {/* Professional Expenses - Expandable */}
            <div>
              <button
                onClick={() => toggleSection(`expenses-${professionIndex}`)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Professional Expenses</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Total: ₹{(profession.pnl?.expenses?.total || 0).toLocaleString('en-IN')}
                  </span>
                  {expandedSections[`expenses-${professionIndex}`] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>
              {expandedSections[`expenses-${professionIndex}`] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Rent (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.officeRent || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'officeRent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Fees Paid (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.professionalFeesPaid || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'professionalFeesPaid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Travel Expenses (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.travel || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'travel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.communication || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'communication', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Books & Periodicals (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.booksPeriodicals || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'booksPeriodicals', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Professional Expenses (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.expenses?.other || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'expenses', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Depreciation - Expandable */}
            <div>
              <button
                onClick={() => toggleSection(`depreciation-${professionIndex}`)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Depreciation on Professional Assets</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Total: ₹{(profession.pnl?.depreciation?.total || 0).toLocaleString('en-IN')}
                  </span>
                  {expandedSections[`depreciation-${professionIndex}`] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>
              {expandedSections[`depreciation-${professionIndex}`] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Equipment (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.depreciation?.officeEquipment || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'depreciation', 'officeEquipment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Furniture (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.depreciation?.furniture || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'depreciation', 'furniture', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicles (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.depreciation?.vehicles || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'depreciation', 'vehicles', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Assets (₹)</label>
                    <input
                      type="number"
                      value={profession.pnl?.depreciation?.other || 0}
                      onChange={(e) => updateExpenseCategory(professionIndex, 'depreciation', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Net Professional Income Display */}
            <div className={`rounded-lg p-4 ${
              (profession.pnl?.netIncome || 0) >= 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {(profession.pnl?.netIncome || 0) >= 0 ? 'Net Professional Income' : 'Net Professional Loss'}:
                </span>
                <span className={`text-lg font-bold ${
                  (profession.pnl?.netIncome || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  ₹{Math.abs(profession.pnl?.netIncome || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Total Professional Income Summary */}
      {professions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total Net Professional Income:</span>
            <span className="text-xl font-bold text-blue-900">
              ₹{professions.reduce((sum, prof) => sum + (prof.pnl?.netIncome || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalIncomeForm;

