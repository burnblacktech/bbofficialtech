// =====================================================
// DIRECTOR/PARTNER INCOME FORM COMPONENT
// For ITR-2 and ITR-3 forms
// =====================================================

import React, { useState } from 'react';
import { Briefcase, Users } from 'lucide-react';

const DirectorPartnerIncomeForm = ({ data, onUpdate, selectedITR }) => {
  const [isDirector, setIsDirector] = useState(data?.isDirector || false);
  const [directorIncome, setDirectorIncome] = useState(data?.directorIncome || 0);
  const [isPartner, setIsPartner] = useState(data?.isPartner || false);
  const [partnerIncome, setPartnerIncome] = useState(data?.partnerIncome || 0);

  const handleDirectorChange = (value) => {
    setIsDirector(value);
    if (!value) {
      setDirectorIncome(0);
    }
    onUpdate({
      isDirector: value,
      directorIncome: value ? directorIncome : 0,
    });
  };

  const handleDirectorIncomeChange = (value) => {
    const income = parseFloat(value) || 0;
    setDirectorIncome(income);
    onUpdate({ directorIncome: income });
  };

  const handlePartnerChange = (value) => {
    setIsPartner(value);
    if (!value) {
      setPartnerIncome(0);
    }
    onUpdate({
      isPartner: value,
      partnerIncome: value ? partnerIncome : 0,
    });
  };

  const handlePartnerIncomeChange = (value) => {
    const income = parseFloat(value) || 0;
    setPartnerIncome(income);
    onUpdate({ partnerIncome: income });
  };

  return (
    <div className="space-y-6">
      {/* Director Income Section */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-900">Director Income</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDirector}
                onChange={(e) => handleDirectorChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-gold-500"
              />
              <span className="ml-2 text-body-regular font-medium text-slate-700">Are you a director of any company?</span>
            </label>
          </div>

          {isDirector && (
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">Director Income (₹)</label>
              <input
                type="number"
                value={directorIncome}
                onChange={(e) => handleDirectorIncomeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="0"
              />
              <p className="text-body-small text-slate-500 mt-1">
                Income received as director of a company (excluding salary if already included)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Partner Income Section */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-900">Partner Income</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPartner}
                onChange={(e) => handlePartnerChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-gold-500"
              />
              <span className="ml-2 text-body-regular font-medium text-slate-700">Are you a partner in any firm?</span>
            </label>
          </div>

          {isPartner && (
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">Partner Income (₹)</label>
              <input
                type="number"
                value={partnerIncome}
                onChange={(e) => handlePartnerIncomeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="0"
              />
              <p className="text-body-small text-slate-500 mt-1">
                Share of profit from partnership firm (excluding business income if already included)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(isDirector || isPartner) && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total Director/Partner Income:</span>
            <span className="text-heading-3 font-bold text-slate-900">
              ₹{(directorIncome + partnerIncome).toLocaleString('en-IN')}
            </span>
          </div>
          {(directorIncome > 0 || partnerIncome > 0) && (
            <div className="mt-2 text-body-regular text-slate-600">
              {directorIncome > 0 && `Director: ₹${directorIncome.toLocaleString('en-IN')}`}
              {directorIncome > 0 && partnerIncome > 0 && ' | '}
              {partnerIncome > 0 && `Partner: ₹${partnerIncome.toLocaleString('en-IN')}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectorPartnerIncomeForm;

