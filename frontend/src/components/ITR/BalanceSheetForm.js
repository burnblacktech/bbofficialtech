// =====================================================
// BALANCE SHEET FORM COMPONENT
// For ITR-3 forms - Balance sheet details
// =====================================================

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';

const BalanceSheetForm = ({ data, onUpdate, selectedITR }) => {
  const isITR3 = selectedITR === 'ITR-3' || selectedITR === 'ITR3';

  const [balanceSheet, setBalanceSheet] = useState(data?.balanceSheet || {
    hasBalanceSheet: false,
    assets: {
      currentAssets: {
        cash: 0,
        bank: 0,
        inventory: 0,
        receivables: 0,
        other: 0,
        total: 0,
      },
      fixedAssets: {
        building: 0,
        machinery: 0,
        vehicles: 0,
        furniture: 0,
        other: 0,
        total: 0,
      },
      investments: 0,
      loansAdvances: 0,
      total: 0,
    },
    liabilities: {
      currentLiabilities: {
        creditors: 0,
        bankOverdraft: 0,
        shortTermLoans: 0,
        other: 0,
        total: 0,
      },
      longTermLiabilities: {
        longTermLoans: 0,
        other: 0,
        total: 0,
      },
      capital: 0,
      total: 0,
    },
  });

  const updateBalanceSheet = (field, value) => {
    const updated = { ...balanceSheet, [field]: value };
    setBalanceSheet(updated);
    onUpdate({ balanceSheet: updated });
    calculateTotals(updated);
  };

  const updateAssetsCategory = (category, field, value) => {
    const updated = { ...balanceSheet };
    updated.assets[category][field] = parseFloat(value) || 0;

    // Recalculate category total
    if (category === 'currentAssets' || category === 'fixedAssets') {
      const categoryData = updated.assets[category];
      const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
        if (key === 'total') return sum;
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
      categoryData.total = total;
    }

    calculateTotals(updated);
  };

  const updateLiabilitiesCategory = (category, field, value) => {
    const updated = { ...balanceSheet };
    updated.liabilities[category][field] = parseFloat(value) || 0;

    // Recalculate category total
    if (category === 'currentLiabilities' || category === 'longTermLiabilities') {
      const categoryData = updated.liabilities[category];
      const total = Object.entries(categoryData).reduce((sum, [key, val]) => {
        if (key === 'total') return sum;
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
      categoryData.total = total;
    }

    calculateTotals(updated);
  };

  const calculateTotals = (bs) => {
    // Calculate Assets Total
    bs.assets.total = (bs.assets.currentAssets?.total || 0) +
      (bs.assets.fixedAssets?.total || 0) +
      (bs.assets.investments || 0) +
      (bs.assets.loansAdvances || 0);

    // Calculate Liabilities Total
    bs.liabilities.total = (bs.liabilities.currentLiabilities?.total || 0) +
      (bs.liabilities.longTermLiabilities?.total || 0) +
      (bs.liabilities.capital || 0);

    setBalanceSheet(bs);
    onUpdate({ balanceSheet: bs });
  };

  const isBalanced = balanceSheet.assets.total === balanceSheet.liabilities.total;
  const balanceDifference = Math.abs(balanceSheet.assets.total - balanceSheet.liabilities.total);

  if (!isITR3) {
    return null;
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
              onChange={(e) => updateBalanceSheet('hasBalanceSheet', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-700">Maintain Balance Sheet</span>
          </label>
        </div>
      </div>

      {balanceSheet.hasBalanceSheet && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          {/* Balance Validation Alert */}
          {!isBalanced && balanceSheet.assets.total > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Balance Sheet Not Balanced</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Assets (₹{balanceSheet.assets.total.toLocaleString('en-IN')}) ≠
                  Liabilities + Capital (₹{balanceSheet.liabilities.total.toLocaleString('en-IN')})
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Difference: ₹{balanceDifference.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {isBalanced && balanceSheet.assets.total > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Balance Sheet is Balanced: ₹{balanceSheet.assets.total.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg border-b pb-2">Assets</h4>

              {/* Current Assets */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Current Assets</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cash (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.currentAssets?.cash || 0}
                      onChange={(e) => updateAssetsCategory('currentAssets', 'cash', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Balance (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.currentAssets?.bank || 0}
                      onChange={(e) => updateAssetsCategory('currentAssets', 'bank', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inventory/Stock (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.currentAssets?.inventory || 0}
                      onChange={(e) => updateAssetsCategory('currentAssets', 'inventory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receivables (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.currentAssets?.receivables || 0}
                      onChange={(e) => updateAssetsCategory('currentAssets', 'receivables', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Current Assets (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.currentAssets?.other || 0}
                      onChange={(e) => updateAssetsCategory('currentAssets', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Current Assets:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.assets.currentAssets?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Fixed Assets</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.fixedAssets?.building || 0}
                      onChange={(e) => updateAssetsCategory('fixedAssets', 'building', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machinery (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.fixedAssets?.machinery || 0}
                      onChange={(e) => updateAssetsCategory('fixedAssets', 'machinery', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicles (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.fixedAssets?.vehicles || 0}
                      onChange={(e) => updateAssetsCategory('fixedAssets', 'vehicles', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Furniture & Fixtures (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.fixedAssets?.furniture || 0}
                      onChange={(e) => updateAssetsCategory('fixedAssets', 'furniture', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Fixed Assets (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.fixedAssets?.other || 0}
                      onChange={(e) => updateAssetsCategory('fixedAssets', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Fixed Assets:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.assets.fixedAssets?.total || 0).toLocaleString('en-IN')}
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
                      value={balanceSheet.assets.investments || 0}
                      onChange={(e) => updateBalanceSheet('assets', {
                        ...balanceSheet.assets,
                        investments: parseFloat(e.target.value) || 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loans & Advances (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.assets.loansAdvances || 0}
                      onChange={(e) => updateBalanceSheet('assets', {
                        ...balanceSheet.assets,
                        loansAdvances: parseFloat(e.target.value) || 0,
                      })}
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
                    ₹{(balanceSheet.assets.total || 0).toLocaleString('en-IN')}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creditors (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.currentLiabilities?.creditors || 0}
                      onChange={(e) => updateLiabilitiesCategory('currentLiabilities', 'creditors', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Overdraft (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.currentLiabilities?.bankOverdraft || 0}
                      onChange={(e) => updateLiabilitiesCategory('currentLiabilities', 'bankOverdraft', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short-term Loans (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.currentLiabilities?.shortTermLoans || 0}
                      onChange={(e) => updateLiabilitiesCategory('currentLiabilities', 'shortTermLoans', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Current Liabilities (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.currentLiabilities?.other || 0}
                      onChange={(e) => updateLiabilitiesCategory('currentLiabilities', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Current Liabilities:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.liabilities.currentLiabilities?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-3">Long-term Liabilities</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Long-term Loans (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.longTermLiabilities?.longTermLoans || 0}
                      onChange={(e) => updateLiabilitiesCategory('longTermLiabilities', 'longTermLoans', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Long-term Liabilities (₹)</label>
                    <input
                      type="number"
                      value={balanceSheet.liabilities.longTermLiabilities?.other || 0}
                      onChange={(e) => updateLiabilitiesCategory('longTermLiabilities', 'other', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Long-term Liabilities:</span>
                      <span className="font-bold text-gray-900">
                        ₹{(balanceSheet.liabilities.longTermLiabilities?.total || 0).toLocaleString('en-IN')}
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
                    value={balanceSheet.liabilities.capital || 0}
                    onChange={(e) => updateBalanceSheet('liabilities', {
                      ...balanceSheet.liabilities,
                      capital: parseFloat(e.target.value) || 0,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Total Liabilities & Capital */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-lg">Total Liabilities & Capital:</span>
                  <span className="font-bold text-blue-900 text-xl">
                    ₹{(balanceSheet.liabilities.total || 0).toLocaleString('en-IN')}
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

