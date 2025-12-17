// =====================================================
// HEALTH INSURANCE PLANNER COMPONENT
// Helps users plan health insurance for tax savings
// =====================================================

import React, { useState } from 'react';
import { Heart, Shield, Users } from 'lucide-react';
// Note: Input component usage - adjust based on actual Input component API

const HealthInsurancePlanner = ({ recommendations = [], remainingCapacity = { self: 25000, parents: 50000 } }) => {
  const [insurance, setInsurance] = useState({
    self: 0,
    parents: 0,
    preventiveCheckup: 0,
  });

  const totalPremium = insurance.self + insurance.parents + insurance.preventiveCheckup;
  const selfDeduction = Math.min(insurance.self, remainingCapacity.self);
  const parentsDeduction = Math.min(insurance.parents, remainingCapacity.parents);
  const checkupDeduction = Math.min(insurance.preventiveCheckup, 5000);
  const totalDeduction = selfDeduction + parentsDeduction + checkupDeduction;

  const handleInsuranceChange = (type, value) => {
    setInsurance((prev) => ({
      ...prev,
      [type]: Math.max(0, parseFloat(value) || 0),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Section 80D - Health Insurance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-regular">
          <div>
            <p className="text-slate-600">Self & Family</p>
            <p className="font-semibold text-blue-900">₹{remainingCapacity.self.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-slate-600">Parents (Senior Citizen)</p>
            <p className="font-semibold text-blue-900">₹{remainingCapacity.parents.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-slate-600">Preventive Check-up</p>
            <p className="font-semibold text-blue-900">₹5,000</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-gold-600" />
            <h4 className="font-semibold text-slate-900">Self & Family</h4>
          </div>
          <input
            type="number"
            value={insurance.self}
            onChange={(e) => handleInsuranceChange('self', e.target.value)}
            placeholder="Enter premium amount"
            max={remainingCapacity.self}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-body-small text-slate-500 mt-2">
            Max deduction: ₹{remainingCapacity.self.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-gold-600" />
            <h4 className="font-semibold text-slate-900">Parents</h4>
          </div>
          <input
            type="number"
            value={insurance.parents}
            onChange={(e) => handleInsuranceChange('parents', e.target.value)}
            placeholder="Enter premium amount"
            max={remainingCapacity.parents}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-body-small text-slate-500 mt-2">
            Max deduction: ₹{remainingCapacity.parents.toLocaleString('en-IN')} (for senior citizens)
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-gold-600" />
            <h4 className="font-semibold text-slate-900">Preventive Check-up</h4>
          </div>
          <input
            type="number"
            value={insurance.preventiveCheckup}
            onChange={(e) => handleInsuranceChange('preventiveCheckup', e.target.value)}
            placeholder="Enter amount"
            max={5000}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-body-small text-slate-500 mt-2">Max deduction: ₹5,000</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Insurance Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-700">Total Premium Paid:</span>
            <span className="font-semibold">₹{totalPremium.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Self & Family Deduction:</span>
            <span className="font-semibold">₹{selfDeduction.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Parents Deduction:</span>
            <span className="font-semibold">₹{parentsDeduction.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Preventive Check-up Deduction:</span>
            <span className="font-semibold">₹{checkupDeduction.toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-2 border-t border-slate-300">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">Total Deduction (80D):</span>
              <span className="font-bold text-body-large text-gold-600">
                ₹{totalDeduction.toLocaleString('en-IN')}
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
            {recommendations.map((rec, index) => (
              <li key={index} className="text-body-regular text-gold-800">
                • {rec.description} - Premium ₹{rec.investmentAmount?.toLocaleString('en-IN')} for ₹{rec.deductionAmount?.toLocaleString('en-IN')} deduction
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HealthInsurancePlanner;

