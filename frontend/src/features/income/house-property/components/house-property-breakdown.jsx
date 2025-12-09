// =====================================================
// HOUSE PROPERTY BREAKDOWN COMPONENT
// Detailed house property breakdown display
// =====================================================

import React from 'react';
import { Home, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import Button from '../../../components/common/Button';

const HousePropertyBreakdown = ({ properties = [], onAddProperty, onEditProperty, onDeleteProperty }) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculatePropertyIncome = (property) => {
    const {
      propertyType,
      annualRentalIncome = 0,
      municipalTaxes = 0,
      interestOnLoan = 0,
      preConstructionInterest = 0,
    } = property;

    if (propertyType === 'self_occupied') {
      const interestDeduction = Math.min(interestOnLoan + preConstructionInterest, 200000);
      return -interestDeduction; // Loss
    } else {
      const netAnnualValue = annualRentalIncome - municipalTaxes;
      const standardDeduction = netAnnualValue * 0.3;
      const totalInterest = interestOnLoan + preConstructionInterest;
      return netAnnualValue - standardDeduction - totalInterest;
    }
  };

  const totalIncome = properties.reduce((sum, prop) => {
    const income = calculatePropertyIncome(prop);
    return sum + (income > 0 ? income : 0);
  }, 0);

  const totalLoss = properties.reduce((sum, prop) => {
    const income = calculatePropertyIncome(prop);
    return sum + (income < 0 ? Math.abs(income) : 0);
  }, 0);

  const getPropertyTypeLabel = (type) => {
    const labels = {
      self_occupied: 'Self Occupied',
      let_out: 'Let Out',
      deemed_let_out: 'Deemed Let Out',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md text-gray-800">House Property Income</h3>
        {onAddProperty && (
          <Button size="sm" onClick={onAddProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        )}
      </div>

      {/* Summary */}
      {(totalIncome > 0 || totalLoss > 0) && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl border border-gold-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            {totalIncome > 0 && (
              <div>
                <p className="text-body-sm text-gray-600">Total Income</p>
                <p className="text-heading-md font-semibold text-green-700 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            )}
            {totalLoss > 0 && (
              <div>
                <p className="text-body-sm text-gray-600">Total Loss</p>
                <p className="text-heading-md font-semibold text-red-700 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  {formatCurrency(totalLoss)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No properties added yet</p>
          {onAddProperty && (
            <Button onClick={onAddProperty}>Add First Property</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property, index) => {
            const income = calculatePropertyIncome(property);
            const isLoss = income < 0;

            return (
              <div
                key={property.id || index}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gold-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-body-md font-semibold text-gray-800">
                      Property #{index + 1}
                    </h4>
                    <p className="text-body-sm text-gray-600 mt-1">
                      {getPropertyTypeLabel(property.propertyType)}
                    </p>
                    {property.propertyAddress && (
                      <p className="text-body-sm text-gray-500 mt-1">{property.propertyAddress}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onEditProperty && (
                      <button
                        onClick={() => onEditProperty(property, index)}
                        className="p-2 text-gray-400 hover:text-gold-600 rounded-lg hover:bg-gold-50"
                        aria-label="Edit property"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteProperty && (
                      <button
                        onClick={() => onDeleteProperty(property.id || index)}
                        className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                        aria-label="Delete property"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-body-sm text-gray-600">Rental Income</p>
                    <p className="text-body-md font-semibold text-gray-800">
                      {formatCurrency(property.annualRentalIncome || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Municipal Taxes</p>
                    <p className="text-body-md font-semibold text-gray-800">
                      {formatCurrency(property.municipalTaxes || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Interest on Loan</p>
                    <p className="text-body-md font-semibold text-gray-800">
                      {formatCurrency(property.interestOnLoan || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Pre-construction Interest</p>
                    <p className="text-body-md font-semibold text-gray-800">
                      {formatCurrency(property.preConstructionInterest || 0)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-body-sm text-gray-600">Net Income / Loss</p>
                    <p
                      className={`text-heading-md font-semibold flex items-center gap-2 ${
                        isLoss ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {isLoss ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                      {formatCurrency(Math.abs(income))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HousePropertyBreakdown;

