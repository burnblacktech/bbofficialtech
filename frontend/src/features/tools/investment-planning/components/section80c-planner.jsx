// =====================================================
// SECTION 80C PLANNER COMPONENT
// Helps users plan Section 80C investments
// =====================================================

import React, { useState } from 'react';
import { Calculator, TrendingUp, Shield, Home } from 'lucide-react';
// Note: Input component usage - adjust based on actual Input component API
// If Input uses control/name pattern, we'll need to use a different approach

const Section80CPlanner = ({ recommendations = [], remainingCapacity = 150000, availableAmount = null }) => {
  const [investments, setInvestments] = useState({
    elss: 0,
    ppf: 0,
    lifeInsurance: 0,
    homeLoanPrincipal: 0,
    taxSavingFD: 0,
  });

  const totalInvested = Object.values(investments).reduce((sum, val) => sum + val, 0);
  const remaining = Math.max(0, remainingCapacity - totalInvested);
  const excess = Math.max(0, totalInvested - remainingCapacity);

  const handleInvestmentChange = (type, value) => {
    setInvestments((prev) => ({
      ...prev,
      [type]: Math.max(0, parseFloat(value) || 0),
    }));
  };

  const investmentOptions = [
    { key: 'elss', label: 'ELSS Mutual Funds', icon: TrendingUp, max: 150000, lockIn: '3 years', returns: '12%' },
    { key: 'ppf', label: 'Public Provident Fund (PPF)', icon: Shield, max: 150000, lockIn: '15 years', returns: '7.1%' },
    { key: 'lifeInsurance', label: 'Life Insurance Premium', icon: Shield, max: 150000, lockIn: '2 years', returns: '5%' },
    { key: 'homeLoanPrincipal', label: 'Home Loan Principal', icon: Home, max: 150000, lockIn: 'None', returns: 'N/A' },
    { key: 'taxSavingFD', label: 'Tax Saving FD', icon: Calculator, max: 150000, lockIn: '5 years', returns: '6.5%' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Section 80C Limit</h3>
            <p className="text-body-regular text-blue-700">Maximum deduction: ₹1,50,000</p>
          </div>
          <div className="text-right">
            <p className="text-heading-2 font-bold text-blue-900">₹{remainingCapacity.toLocaleString('en-IN')}</p>
            <p className="text-body-small text-blue-600">Remaining capacity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investmentOptions.map((option) => {
          const Icon = option.icon;
          const value = investments[option.key];
          return (
            <div key={option.key} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-gold-600" />
                <h4 className="font-semibold text-slate-900">{option.label}</h4>
              </div>
              <div className="space-y-2">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleInvestmentChange(option.key, e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <div className="text-body-small text-slate-600 space-y-1">
                  <p>Lock-in: {option.lockIn}</p>
                  <p>Expected returns: {option.returns}</p>
                  <p>Max: ₹{option.max.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Investment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-700">Total Investment:</span>
            <span className="font-semibold">₹{totalInvested.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Remaining Capacity:</span>
            <span className={`font-semibold ${remaining > 0 ? 'text-green-600' : 'text-error-600'}`}>
              ₹{remaining.toLocaleString('en-IN')}
            </span>
          </div>
          {excess > 0 && (
            <div className="flex justify-between text-error-600">
              <span>Excess (not eligible for deduction):</span>
              <span className="font-semibold">₹{excess.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-300">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">Eligible Deduction:</span>
              <span className="font-bold text-body-large text-gold-600">
                ₹{Math.min(totalInvested, remainingCapacity).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="border border-gold-200 rounded-xl p-4 bg-gold-50">
          <h4 className="font-semibold text-gold-900 mb-2">AI Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-body-regular text-gold-800">
                • {rec.description} - Invest ₹{rec.investmentAmount?.toLocaleString('en-IN')} for ₹{rec.deductionAmount?.toLocaleString('en-IN')} deduction
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Section80CPlanner;

