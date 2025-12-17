// =====================================================
// NPS CALCULATOR COMPONENT
// Calculates NPS benefits and retirement corpus
// =====================================================

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Shield } from 'lucide-react';
import { useNPSCalculator } from '../hooks/use-investment-planning';
// Note: Input component usage - adjust based on actual Input component API
import Button from '../../../../components/DesignSystem/components/Button';

const NPSCalculator = ({ npsRecommendation = null }) => {
  const [contribution, setContribution] = useState(npsRecommendation?.investmentAmount || 50000);
  const [years, setYears] = useState(30);
  const [expectedReturns, setExpectedReturns] = useState(9);
  const [results, setResults] = useState(null);

  const npsCalculator = useNPSCalculator();

  const handleCalculate = async () => {
    try {
      const response = await npsCalculator.mutateAsync({
        contribution,
        years,
        expectedReturns,
      });
      setResults(response.benefits);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Note: handleCalculate is called on button click, not automatically

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">NPS Additional Deduction</h3>
        </div>
        <p className="text-body-regular text-blue-700">
          Section 80CCD(1B) allows additional deduction of ₹50,000 over and above Section 80C limit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-1">
            Annual Contribution (₹)
          </label>
          <input
            type="number"
            value={contribution}
            onChange={(e) => setContribution(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="50000"
            max={50000}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-body-small text-slate-500 mt-1">Max: ₹50,000</p>
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-1">
            Years Until Retirement
          </label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 30))}
            placeholder="30"
            min={1}
            max={60}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-1">
            Expected Returns (%)
          </label>
          <input
            type="number"
            value={expectedReturns}
            onChange={(e) => setExpectedReturns(Math.max(0, parseFloat(e.target.value) || 9))}
            placeholder="9"
            step="0.1"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
      </div>

      <Button onClick={handleCalculate} className="w-full md:w-auto">
        <Calculator className="w-4 h-4 mr-2" />
        Calculate NPS Benefits
      </Button>

      {results && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            NPS Benefits Projection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-body-regular text-slate-600">Total Corpus at Retirement</p>
              <p className="text-heading-2 font-bold text-green-600">
                ₹{results.totalCorpus?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-body-regular text-slate-600">Tax-Free Withdrawal (60%)</p>
              <p className="text-heading-2 font-bold text-green-600">
                ₹{results.taxFreeWithdrawal?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-body-regular text-slate-600">Annuity Amount (40%)</p>
              <p className="text-heading-2 font-bold text-green-600">
                ₹{results.annuityAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-body-regular text-slate-600">Monthly Pension</p>
              <p className="text-heading-2 font-bold text-green-600">
                ₹{results.monthlyPension?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-body-small text-blue-800">
              <strong>Note:</strong> 60% of corpus can be withdrawn tax-free at retirement. 40% must be used to purchase an annuity for regular pension income.
            </p>
          </div>
        </div>
      )}

      {npsRecommendation && (
        <div className="border border-gold-200 rounded-xl p-4 bg-gold-50">
          <h4 className="font-semibold text-gold-900 mb-2">Recommended Investment</h4>
          <p className="text-body-regular text-gold-800">
            Based on your profile, we recommend investing ₹{npsRecommendation.investmentAmount?.toLocaleString('en-IN')} in NPS for additional tax deduction.
          </p>
        </div>
      )}
    </div>
  );
};

export default NPSCalculator;

