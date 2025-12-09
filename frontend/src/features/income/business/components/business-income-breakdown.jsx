// =====================================================
// BUSINESS INCOME BREAKDOWN COMPONENT
// Detailed business income breakdown display
// =====================================================

import React from 'react';
import { Building2, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import Button from '../../../components/common/Button';

const BusinessIncomeBreakdown = ({
  businesses = [],
  onAddBusiness,
  onEditBusiness,
  onDeleteBusiness,
}) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalIncome = businesses.reduce((sum, business) => {
    if (business.presumptiveTax) {
      return sum + (business.presumptiveIncome || 0);
    }
    return sum + (business.pnl?.netProfit || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md text-gray-800">Business Income</h3>
        {onAddBusiness && (
          <Button size="sm" onClick={onAddBusiness}>
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        )}
      </div>

      {totalIncome > 0 && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl border border-gold-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-gray-600">Total Business Income</p>
            <p className="text-heading-md font-semibold text-green-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No businesses added yet</p>
          {onAddBusiness && (
            <Button onClick={onAddBusiness}>Add First Business</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business, index) => (
            <div
              key={business.id || index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gold-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-body-md font-semibold text-gray-800">
                    {business.businessName || `Business ${index + 1}`}
                  </h4>
                  {business.businessNature && (
                    <p className="text-body-sm text-gray-600 mt-1">{business.businessNature}</p>
                  )}
                  {business.presumptiveTax && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      Presumptive Tax ({business.presumptiveSection || '44AD'})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {onEditBusiness && (
                    <button
                      onClick={() => onEditBusiness(business, index)}
                      className="p-2 text-gray-400 hover:text-gold-600 rounded-lg hover:bg-gold-50"
                      aria-label="Edit business"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteBusiness && (
                    <button
                      onClick={() => onDeleteBusiness(business.id || index)}
                      className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                      aria-label="Delete business"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-body-sm text-gray-600">Gross Receipts</p>
                  <p className="text-body-md font-semibold text-gray-800">
                    {formatCurrency(business.pnl?.grossReceipts || business.grossReceipts || 0)}
                  </p>
                </div>
                {business.presumptiveTax ? (
                  <div>
                    <p className="text-body-sm text-gray-600">Presumptive Income</p>
                    <p className="text-body-md font-semibold text-green-700">
                      {formatCurrency(business.presumptiveIncome || 0)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-body-sm text-gray-600">Net Profit</p>
                    <p className="text-body-md font-semibold text-green-700">
                      {formatCurrency(business.pnl?.netProfit || 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessIncomeBreakdown;

