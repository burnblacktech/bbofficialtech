// =====================================================
// EXEMPT INCOME FORM COMPONENT
// Form for declaring exempt income
// =====================================================

import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import Button from '../../../../components/common/Button';

const EXEMPT_INCOME_TYPES = [
  { id: 'agricultural', label: 'Agricultural Income (for rate purposes)', maxAmount: null },
  { id: 'partnership', label: 'Share of Income from Partnership', maxAmount: null },
  { id: 'ltcg', label: 'Long-term Capital Gains (up to ₹1 lakh)', maxAmount: 100000 },
  { id: 'dividend_old', label: 'Dividend Income (Old Regime)', maxAmount: null },
  { id: 'other', label: 'Other Exempt Income', maxAmount: null },
];

const ExemptIncomeForm = ({ data = [], onUpdate }) => {
  const [exemptIncomes, setExemptIncomes] = useState(data || []);

  const handleAdd = () => {
    const newIncome = {
      id: Date.now(),
      type: '',
      amount: 0,
      description: '',
    };
    const updated = [...exemptIncomes, newIncome];
    setExemptIncomes(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleRemove = (id) => {
    const updated = exemptIncomes.filter((item) => item.id !== id);
    setExemptIncomes(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleChange = (id, field, value) => {
    const updated = exemptIncomes.map((item) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Apply max amount limit if applicable
        const typeConfig = EXEMPT_INCOME_TYPES.find((t) => t.id === newItem.type);
        if (typeConfig?.maxAmount && field === 'amount' && parseFloat(value) > typeConfig.maxAmount) {
          newItem.amount = typeConfig.maxAmount;
        }
        return newItem;
      }
      return item;
    });
    setExemptIncomes(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalExemptIncome = exemptIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800">Exempt Income</h3>
          <p className="text-body-sm text-gray-600 mt-1">
            Declare income that is exempt from tax
          </p>
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exempt Income
        </Button>
      </div>

      {exemptIncomes.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No exempt income declared</p>
          <Button onClick={handleAdd}>Add Exempt Income</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {exemptIncomes.map((item) => {
            const typeConfig = EXEMPT_INCOME_TYPES.find((t) => t.id === item.type);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        Type of Exempt Income
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => handleChange(item.id, 'type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      >
                        <option value="">Select type</option>
                        {EXEMPT_INCOME_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                        {typeConfig?.maxAmount && (
                          <span className="text-body-xs text-gray-500 ml-2">
                            (Max: {formatCurrency(typeConfig.maxAmount)})
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleChange(item.id, 'amount', e.target.value)}
                        max={typeConfig?.maxAmount || undefined}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        placeholder="0"
                      />
                    </div>

                    {item.type && (
                      <div>
                        <label className="block text-body-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                          placeholder="Additional details..."
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="bg-info-50 rounded-xl border border-info-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-body-md font-semibold text-info-900">
                Total Exempt Income
              </span>
              <span className="text-heading-md font-semibold text-info-900">
                {formatCurrency(totalExemptIncome)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExemptIncomeForm;

