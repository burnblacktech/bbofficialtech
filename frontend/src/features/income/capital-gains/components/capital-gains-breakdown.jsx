// =====================================================
// CAPITAL GAINS BREAKDOWN COMPONENT
// Detailed capital gains breakdown display
// =====================================================

import React from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Edit2 } from 'lucide-react';
import Button from '../../../../components/DesignSystem/components/Button';

const CapitalGainsBreakdown = ({
  stcgDetails = [],
  ltcgDetails = [],
  onAddSTCG,
  onAddLTCG,
  onEditEntry,
  onDeleteEntry,
}) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalSTCG = stcgDetails.reduce((sum, entry) => sum + (entry.gainAmount || 0), 0);
  const totalLTCG = ltcgDetails.reduce((sum, entry) => sum + (entry.gainAmount || 0), 0);
  const totalGains = totalSTCG + totalLTCG;

  const getAssetTypeLabel = (type) => {
    const labels = {
      equity_shares: 'Equity Shares',
      mutual_funds: 'Mutual Funds',
      property: 'Property',
      bonds: 'Bonds',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md text-gray-800">Capital Gains</h3>
        <div className="flex gap-2">
          {onAddSTCG && (
            <Button size="sm" onClick={onAddSTCG}>
              <Plus className="h-4 w-4 mr-2" />
              Add STCG
            </Button>
          )}
          {onAddLTCG && (
            <Button size="sm" onClick={onAddLTCG}>
              <Plus className="h-4 w-4 mr-2" />
              Add LTCG
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      {totalGains > 0 && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl border border-gold-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-body-sm text-slate-600">Total STCG</p>
              <p className="text-heading-md font-semibold text-gray-800">
                {formatCurrency(totalSTCG)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-slate-600">Total LTCG</p>
              <p className="text-heading-md font-semibold text-gray-800">
                {formatCurrency(totalLTCG)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-slate-600">Total Gains</p>
              <p className="text-heading-md font-semibold text-green-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {formatCurrency(totalGains)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Short-term Capital Gains */}
      {stcgDetails.length > 0 && (
        <div>
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Short-term Capital Gains</h4>
          <div className="space-y-3">
            {stcgDetails.map((entry, index) => (
              <div
                key={entry.id || index}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-gold-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="text-body-md font-semibold text-gray-800">
                      {getAssetTypeLabel(entry.assetType)} #{index + 1}
                    </h5>
                    <p className="text-body-sm text-slate-600 mt-1">
                      Sale: {formatCurrency(entry.saleValue)} | Purchase: {formatCurrency(entry.purchaseValue)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onEditEntry && (
                      <button
                        onClick={() => onEditEntry(entry, index, 'stcg')}
                        className="p-2 text-slate-400 hover:text-gold-600 rounded-xl hover:bg-gold-50"
                        aria-label="Edit entry"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(entry.id || index, 'stcg')}
                        className="p-2 text-slate-400 hover:text-error-600 rounded-xl hover:bg-error-50"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-body-sm text-slate-600">Gain Amount</span>
                  <span className="text-body-md font-semibold text-green-700">
                    {formatCurrency(entry.gainAmount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Long-term Capital Gains */}
      {ltcgDetails.length > 0 && (
        <div>
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">Long-term Capital Gains</h4>
          <div className="space-y-3">
            {ltcgDetails.map((entry, index) => (
              <div
                key={entry.id || index}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-gold-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="text-body-md font-semibold text-gray-800">
                      {getAssetTypeLabel(entry.assetType)} #{index + 1}
                    </h5>
                    <p className="text-body-sm text-slate-600 mt-1">
                      Sale: {formatCurrency(entry.saleValue)} | Indexed Cost: {formatCurrency(entry.indexedCost || entry.purchaseValue)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onEditEntry && (
                      <button
                        onClick={() => onEditEntry(entry, index, 'ltcg')}
                        className="p-2 text-slate-400 hover:text-gold-600 rounded-xl hover:bg-gold-50"
                        aria-label="Edit entry"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(entry.id || index, 'ltcg')}
                        className="p-2 text-slate-400 hover:text-error-600 rounded-xl hover:bg-error-50"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-body-sm text-slate-600">Gain Amount</span>
                  <span className="text-body-md font-semibold text-green-700">
                    {formatCurrency(entry.gainAmount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stcgDetails.length === 0 && ltcgDetails.length === 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-body-md text-slate-600 mb-4">No capital gains entries added yet</p>
          {onAddSTCG && (
            <div className="flex gap-2 justify-center">
              <Button onClick={onAddSTCG}>Add STCG Entry</Button>
              {onAddLTCG && <Button onClick={onAddLTCG}>Add LTCG Entry</Button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CapitalGainsBreakdown;

