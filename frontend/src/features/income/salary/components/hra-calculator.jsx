// =====================================================
// HRA CALCULATOR COMPONENT
// Calculate HRA exemption
// =====================================================

import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { useHRACalculation } from '../hooks/use-salary';
import Button from '../../../components/DesignSystem/components/Button';

const HRACalculator = ({ onCalculate }) => {
  const [hraData, setHraData] = useState({
    hraReceived: '',
    rentPaid: '',
    cityType: 'non-metro',
    basicSalary: '',
  });
  const [result, setResult] = useState(null);

  const { mutate: calculateHRA, isPending } = useHRACalculation();

  const handleCalculate = () => {
    const data = {
      hraReceived: parseFloat(hraData.hraReceived) || 0,
      rentPaid: parseFloat(hraData.rentPaid) || 0,
      cityType: hraData.cityType,
      basicSalary: parseFloat(hraData.basicSalary) || 0,
    };

    calculateHRA(data, {
      onSuccess: (result) => {
        setResult(result);
        if (onCalculate) {
          onCalculate(result);
        }
      },
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center mb-4">
        <Calculator className="h-5 w-5 text-gold-600 mr-2" />
        <h3 className="text-heading-md text-gray-800">HRA Exemption Calculator</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Basic Salary (₹)
          </label>
          <input
            type="number"
            value={hraData.basicSalary}
            onChange={(e) => setHraData({ ...hraData, basicSalary: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            HRA Received (₹)
          </label>
          <input
            type="number"
            value={hraData.hraReceived}
            onChange={(e) => setHraData({ ...hraData, hraReceived: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            Rent Paid (₹)
          </label>
          <input
            type="number"
            value={hraData.rentPaid}
            onChange={(e) => setHraData({ ...hraData, rentPaid: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-slate-700 mb-2">
            City Type
          </label>
          <select
            value={hraData.cityType}
            onChange={(e) => setHraData({ ...hraData, cityType: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="non-metro">Non-Metro (40% of Basic)</option>
            <option value="metro">Metro (50% of Basic)</option>
          </select>
        </div>

        <Button onClick={handleCalculate} loading={isPending} className="w-full">
          Calculate HRA Exemption
        </Button>

        {result && (
          <div className="mt-6 bg-success-50 border border-success-200 rounded-xl p-4">
            <h4 className="text-body-md font-semibold text-success-900 mb-3">
              Calculation Result
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-sm text-success-700">HRA Exemption</span>
                <span className="text-body-md font-semibold text-success-900">
                  {formatCurrency(result.exemption)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm text-success-700">Taxable HRA</span>
                <span className="text-body-md font-semibold text-success-900">
                  {formatCurrency(result.taxableHRA)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-success-200">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-success-600 mt-0.5 mr-2" />
                <div className="text-body-sm text-success-700">
                  <p className="font-semibold mb-1">Calculation Method:</p>
                  <p>
                    Minimum of: (1) HRA Received, (2) Rent Paid - 10% of Basic, (3){' '}
                    {hraData.cityType === 'metro' ? '50%' : '40%'} of Basic
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRACalculator;

