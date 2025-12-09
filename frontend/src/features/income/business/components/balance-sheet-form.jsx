// =====================================================
// BALANCE SHEET FORM COMPONENT (Feature-First)
// For ITR-3 forms - Balance sheet details
// =====================================================

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useBalanceSheet, useUpdateBalanceSheet } from '../hooks/use-balance-sheet';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { balanceSheetSchema } from '../schema/balance-sheet.schema';

const BalanceSheetForm = ({ filingId, selectedITR, onUpdate }) => {
  const isITR3 = selectedITR === 'ITR-3' || selectedITR === 'ITR3';
  const { data: balanceSheetData, isLoading, isError } = useBalanceSheet(filingId);
  const updateBalanceSheetMutation = useUpdateBalanceSheet(filingId);

  const { watch, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(balanceSheetSchema),
    defaultValues: balanceSheetData || {
      hasBalanceSheet: false,
      assets: {
        currentAssets: { cash: 0, bank: 0, inventory: 0, receivables: 0, other: 0, total: 0 },
        fixedAssets: { building: 0, machinery: 0, vehicles: 0, furniture: 0, other: 0, total: 0 },
        investments: 0,
        loansAdvances: 0,
        total: 0,
      },
      liabilities: {
        currentLiabilities: { creditors: 0, bankOverdraft: 0, shortTermLoans: 0, other: 0, total: 0 },
        longTermLiabilities: { longTermLoans: 0, other: 0, total: 0 },
        capital: 0,
        total: 0,
      },
    },
  });

  const balanceSheet = watch();

  // Update form when data loads
  useEffect(() => {
    if (balanceSheetData) {
      Object.keys(balanceSheetData).forEach((key) => {
        setValue(key, balanceSheetData[key]);
      });
    }
  }, [balanceSheetData, setValue]);

  // Auto-save on change with debounce
  useEffect(() => {
    if (!filingId || !balanceSheet?.hasBalanceSheet) return;

    const timeoutId = setTimeout(() => {
      if (balanceSheet.assets?.total > 0 || balanceSheet.liabilities?.total > 0) {
        handleSubmit((data) => {
          updateBalanceSheetMutation.mutate(data);
          if (onUpdate) {
            onUpdate({ balanceSheet: data });
          }
        })();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [balanceSheet, filingId, handleSubmit, updateBalanceSheetMutation, onUpdate]);

  const updateAssetsCategory = (category, field, value) => {
    const numValue = parseFloat(value) || 0;
    const categoryPath = `assets.${category}.${field}`;
    setValue(categoryPath, numValue);

    // Recalculate category total
    const categoryData = balanceSheet.assets?.[category] || {};
    const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
      if (key === 'total' || key === field) return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, numValue);
    setValue(`assets.${category}.total`, total);

    // Recalculate assets total
    const assetsTotal = (balanceSheet.assets?.currentAssets?.total || 0) +
      (balanceSheet.assets?.fixedAssets?.total || 0) +
      (balanceSheet.assets?.investments || 0) +
      (balanceSheet.assets?.loansAdvances || 0);
    if (category === 'currentAssets' || category === 'fixedAssets') {
      setValue('assets.total', assetsTotal - (categoryData.total || 0) + total);
    }
  };

  const updateLiabilitiesCategory = (category, field, value) => {
    const numValue = parseFloat(value) || 0;
    const categoryPath = `liabilities.${category}.${field}`;
    setValue(categoryPath, numValue);

    // Recalculate category total
    const categoryData = balanceSheet.liabilities?.[category] || {};
    const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
      if (key === 'total' || key === field) return sum;
      return sum + (typeof val === 'number' ? val : 0);
    }, numValue);
    setValue(`liabilities.${category}.total`, total);

    // Recalculate liabilities total
    const liabilitiesTotal = (balanceSheet.liabilities?.currentLiabilities?.total || 0) +
      (balanceSheet.liabilities?.longTermLiabilities?.total || 0) +
      (balanceSheet.liabilities?.capital || 0);
    if (category === 'currentLiabilities' || category === 'longTermLiabilities') {
      setValue('liabilities.total', liabilitiesTotal - (categoryData.total || 0) + total);
    }
  };

  const isBalanced = Math.abs((balanceSheet.assets?.total || 0) - (balanceSheet.liabilities?.total || 0)) < 0.01;
  const balanceDifference = Math.abs((balanceSheet.assets?.total || 0) - (balanceSheet.liabilities?.total || 0));

  if (!isITR3) {
    return null;
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading balance sheet...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-600">Error loading balance sheet</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Balance Sheet
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={balanceSheet.hasBalanceSheet || false}
              onChange={(e) => {
                setValue('hasBalanceSheet', e.target.checked);
                if (onUpdate) {
                  onUpdate({ balanceSheet: { ...balanceSheet, hasBalanceSheet: e.target.checked } });
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-700">Maintain Balance Sheet</span>
          </label>
        </div>
      </div>

      {balanceSheet.hasBalanceSheet && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          {/* Balance Validation Alert */}
          {!isBalanced && (balanceSheet.assets?.total || 0) > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Balance Sheet Not Balanced</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Assets (₹{(balanceSheet.assets?.total || 0).toLocaleString('en-IN')}) ≠
                  Liabilities + Capital (₹{(balanceSheet.liabilities?.total || 0).toLocaleString('en-IN')})
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Difference: ₹{balanceDifference.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {isBalanced && (balanceSheet.assets?.total || 0) > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Balance Sheet is Balanced: ₹{(balanceSheet.assets?.total || 0).toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Two Column Layout - Reuse existing UI from BalanceSheetForm.js */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg border-b pb-2">Assets</h4>

              {/* Current Assets */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Current Assets</h5>
                <div className="space-y-3">
                  {['cash', 'bank', 'inventory', 'receivables', 'other'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} (₹)
                      </label>
                      <input
                        type="number"
                        value={balanceSheet.assets?.currentAssets?.[field] || 0}
                        onChange={(e) => updateAssetsCategory('currentAssets', field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Current Assets:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.assets?.currentAssets?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Fixed Assets</h5>
                <div className="space-y-3">
                  {['building', 'machinery', 'vehicles', 'furniture', 'other'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} (₹)
                      </label>
                      <input
                        type="number"
                        value={balanceSheet.assets?.fixedAssets?.[field] || 0}
                        onChange={(e) => updateAssetsCategory('fixedAssets', field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Fixed Assets:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.assets?.fixedAssets?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investments & Loans */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investments (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets?.investments || 0}
                      onChange={(e) => setValue('assets.investments', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loans & Advances (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets?.loansAdvances || 0}
                      onChange={(e) => setValue('assets.loansAdvances', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-lg">Total Assets:</span>
                  <span className="font-bold text-blue-900 text-xl">
                    ₹{(balanceSheet.assets?.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Liabilities Column */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg border-b pb-2">Liabilities & Capital</h4>

              {/* Current Liabilities */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Current Liabilities</h5>
                <div className="space-y-3">
                  {['creditors', 'bankOverdraft', 'shortTermLoans', 'other'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} (₹)
                      </label>
                      <input
                        type="number"
                        value={balanceSheet.liabilities?.currentLiabilities?.[field] || 0}
                        onChange={(e) => updateLiabilitiesCategory('currentLiabilities', field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Current Liabilities:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.liabilities?.currentLiabilities?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Long-term Liabilities</h5>
                <div className="space-y-3">
                  {['longTermLoans', 'other'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field === 'longTermLoans' ? 'Long-term Loans' : 'Other Long-term Liabilities'} (₹)
                      </label>
                      <input
                        type="number"
                        value={balanceSheet.liabilities?.longTermLiabilities?.[field] || 0}
                        onChange={(e) => updateLiabilitiesCategory('longTermLiabilities', field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Long-term Liabilities:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.liabilities?.longTermLiabilities?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capital */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capital (₹)</label>
                  <input
                    type="number"
                    value={balanceSheet.liabilities?.capital || 0}
                    onChange={(e) => setValue('liabilities.capital', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Total Liabilities & Capital */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-lg">Total Liabilities & Capital:</span>
                  <span className="font-bold text-blue-900 text-xl">
                    ₹{(balanceSheet.liabilities?.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!balanceSheet.hasBalanceSheet && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Balance sheet is optional for ITR-3</p>
          <p className="text-xs mt-1">Enable above to enter balance sheet details</p>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetForm;

