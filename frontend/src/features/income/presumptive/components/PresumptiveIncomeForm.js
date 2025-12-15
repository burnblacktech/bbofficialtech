// =====================================================
// PRESUMPTIVE INCOME FORM COMPONENT
// Enhanced with Section 44AD, 44ADA, and 44AE
// =====================================================

import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertCircle, Building2, Briefcase, Truck } from 'lucide-react';

const PresumptiveIncomeForm = ({ data = {}, onChange, onNext, onPrevious, filingId, selectedITR }) => {
  // Presumptive income is only applicable for ITR-4
  if (selectedITR !== 'ITR-4' && selectedITR !== 'ITR4') {
    return null;
  }
  const [section, setSection] = useState(data.section || '44AD');
  const [formData, setFormData] = useState({
    section: data.section || '44AD',
    // Section 44AD (Business)
    businessType: data.businessType || '',
    grossReceipts: data.grossReceipts || 0,
    presumptiveRate: data.presumptiveRate || 8,
    digitalReceipts: data.digitalReceipts || false,
    // Section 44ADA (Profession)
    professionType: data.professionType || '',
    grossReceiptsProfession: data.grossReceiptsProfession || 0,
    presumptiveRateProfession: data.presumptiveRateProfession || 50,
    // Section 44AE (Goods Carriage)
    vehicleType: data.vehicleType || '',
    vehicleCount: data.vehicleCount || 0,
    heavyVehicleCount: data.heavyVehicleCount || 0,
    lightVehicleCount: data.lightVehicleCount || 0,
    ...data,
  });

  useEffect(() => {
    calculatePresumptiveIncome();
  }, [formData.grossReceipts, formData.presumptiveRate, formData.grossReceiptsProfession, formData.presumptiveRateProfession, formData.vehicleCount, formData.heavyVehicleCount, formData.lightVehicleCount, section]);

  const calculatePresumptiveIncome = () => {
    let presumptiveIncome = 0;

    if (section === '44AD') {
      // Section 44AD: 8% of gross receipts (digital) or 6% (digital) or 5% (non-digital)
      const rate = formData.digitalReceipts
        ? (formData.presumptiveRate === 8 ? 8 : 6)
        : 5;
      presumptiveIncome = (formData.grossReceipts || 0) * (rate / 100);
    } else if (section === '44ADA') {
      // Section 44ADA: 50% of gross receipts (profession)
      presumptiveIncome = (formData.grossReceiptsProfession || 0) * (formData.presumptiveRateProfession / 100);
    } else if (section === '44AE') {
      // Section 44AE: Goods carriage - ₹7,500 per month for heavy vehicle, ₹7,500 per month for light vehicle
      const heavyVehicleIncome = (formData.heavyVehicleCount || 0) * 7500 * 12;
      const lightVehicleIncome = (formData.lightVehicleCount || 0) * 7500 * 12;
      presumptiveIncome = heavyVehicleIncome + lightVehicleIncome;
    }

    const newData = { ...formData, presumptiveIncome };
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
    calculatePresumptiveIncome();
  };

  const handleSectionChange = (newSection) => {
    setSection(newSection);
    const newData = { ...formData, section: newSection };
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext(formData);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Presumptive Taxation (ITR-4)
        </h3>

        {/* Section Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Presumptive Taxation Section
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleSectionChange('44AD')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                section === '44AD'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-5 w-5 text-primary-600 mb-2" />
              <div className="font-semibold text-gray-900">Section 44AD</div>
              <div className="text-xs text-gray-600 mt-1">Business (Turnover ≤ ₹2 Cr)</div>
            </button>
            <button
              onClick={() => handleSectionChange('44ADA')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                section === '44ADA'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Briefcase className="h-5 w-5 text-primary-600 mb-2" />
              <div className="font-semibold text-gray-900">Section 44ADA</div>
              <div className="text-xs text-gray-600 mt-1">Profession (Receipts ≤ ₹50 L)</div>
            </button>
            <button
              onClick={() => handleSectionChange('44AE')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                section === '44AE'
                  ? 'border-success-500 bg-success-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Truck className="h-5 w-5 text-success-600 mb-2" />
              <div className="font-semibold text-gray-900">Section 44AE</div>
              <div className="text-xs text-gray-600 mt-1">Goods Carriage</div>
            </button>
          </div>
        </div>

        {/* Section 44AD - Business */}
        {section === '44AD' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Section 44AD - Presumptive Taxation for Business</p>
                  <p>Applicable if gross receipts/turnover ≤ ₹2 crores. Presumptive income: 8% (digital receipts) or 6% (digital) or 5% (non-digital receipts).</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nature of Business
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select business type</option>
                  <option value="retail_trade">Retail Trade</option>
                  <option value="wholesale_trade">Wholesale Trade</option>
                  <option value="civil_construction">Civil Construction</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Receipts/Turnover (₹)
                </label>
                <input
                  type="number"
                  value={formData.grossReceipts}
                  onChange={(e) => handleChange('grossReceipts', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter gross receipts"
                  max={20000000}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum ₹2 crores for Section 44AD</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Receipts
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.digitalReceipts}
                    onChange={(e) => handleChange('digitalReceipts', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">All receipts are digital (8% or 6% rate)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presumptive Rate (%)
                </label>
                <select
                  value={formData.presumptiveRate}
                  onChange={(e) => handleChange('presumptiveRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.digitalReceipts}
                >
                  <option value={8}>8% (Digital Receipts - General)</option>
                  <option value={6}>6% (Digital Receipts - Specific)</option>
                </select>
                {!formData.digitalReceipts && (
                  <p className="text-xs text-gray-500 mt-1">Non-digital receipts: 5% rate (auto-applied)</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Presumptive Income (Section 44AD):</span>
                <span className="text-xl font-bold text-green-700">
                  ₹{formData.presumptiveIncome?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 44ADA - Profession */}
        {section === '44ADA' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold mb-1">Section 44ADA - Presumptive Taxation for Profession</p>
                  <p>Applicable if gross receipts ≤ ₹50 lakhs. Presumptive income: 50% of gross receipts.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Profession
                </label>
                <select
                  value={formData.professionType}
                  onChange={(e) => handleChange('professionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select profession type</option>
                  <option value="legal">Legal</option>
                  <option value="medical">Medical</option>
                  <option value="engineering">Engineering</option>
                  <option value="architecture">Architecture</option>
                  <option value="accountancy">Accountancy</option>
                  <option value="technical_consultancy">Technical Consultancy</option>
                  <option value="interior_decoration">Interior Decoration</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Receipts (₹)
                </label>
                <input
                  type="number"
                  value={formData.grossReceiptsProfession}
                  onChange={(e) => handleChange('grossReceiptsProfession', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter gross receipts"
                  max={5000000}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum ₹50 lakhs for Section 44ADA</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presumptive Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.presumptiveRateProfession}
                  onChange={(e) => handleChange('presumptiveRateProfession', parseFloat(e.target.value) || 50)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled
                  value={50}
                />
                <p className="text-xs text-gray-500 mt-1">Fixed at 50% for Section 44ADA</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Presumptive Income (Section 44ADA):</span>
                <span className="text-xl font-bold text-green-700">
                  ₹{formData.presumptiveIncome?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 44AE - Goods Carriage */}
        {section === '44AE' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Section 44AE - Presumptive Taxation for Goods Carriage</p>
                  <p>Presumptive income: ₹7,500 per month per vehicle (heavy or light goods vehicle).</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heavy Goods Vehicle Count
                </label>
                <input
                  type="number"
                  value={formData.heavyVehicleCount}
                  onChange={(e) => handleChange('heavyVehicleCount', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Number of heavy vehicles"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">₹7,500/month per vehicle</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Light Goods Vehicle Count
                </label>
                <input
                  type="number"
                  value={formData.lightVehicleCount}
                  onChange={(e) => handleChange('lightVehicleCount', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Number of light vehicles"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">₹7,500/month per vehicle</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Vehicles
                </label>
                <input
                  type="number"
                  value={(formData.heavyVehicleCount || 0) + (formData.lightVehicleCount || 0)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Presumptive Income (Section 44AE):</span>
                <span className="text-xl font-bold text-green-700">
                  ₹{formData.presumptiveIncome?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Calculation: {(formData.heavyVehicleCount || 0) + (formData.lightVehicleCount || 0)} vehicles × ₹7,500/month × 12 months
              </p>
            </div>
          </div>
        )}

        {(onPrevious || onNext) && (
          <div className="mt-6 flex justify-between">
            {onPrevious && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {onNext && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresumptiveIncomeForm;

