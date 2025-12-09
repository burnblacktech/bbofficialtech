// =====================================================
// SALARY BREAKDOWN COMPONENT
// Detailed salary breakdown display
// =====================================================

import React from 'react';
import { Building2, Plus, Trash2, Edit2 } from 'lucide-react';
import Button from '../../../components/common/Button';

const SalaryBreakdown = ({ employers = [], onAddEmployer, onEditEmployer, onDeleteEmployer }) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateTotal = (employer) => {
    return (
      (employer.basicSalary || 0) +
      (employer.dearnessAllowance || 0) +
      (employer.hraReceived || 0) +
      (employer.specialAllowance || 0) +
      (employer.otherAllowances || 0) +
      (employer.perquisites || 0) +
      (employer.profitsInLieuOfSalary || 0) -
      (employer.standardDeduction || 0)
    );
  };

  const totalSalary = employers.reduce((sum, emp) => sum + calculateTotal(emp), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md text-gray-800">Salary Income</h3>
        {onAddEmployer && (
          <Button size="sm" onClick={onAddEmployer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employer
          </Button>
        )}
      </div>

      {employers.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No employers added yet</p>
          {onAddEmployer && (
            <Button onClick={onAddEmployer}>Add First Employer</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {employers.map((employer, index) => (
            <div
              key={employer.id || index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gold-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-body-md font-semibold text-gray-800">
                    {employer.employerName || `Employer ${index + 1}`}
                  </h4>
                  {employer.employerTAN && (
                    <p className="text-body-sm text-gray-600 mt-1">TAN: {employer.employerTAN}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {onEditEmployer && (
                    <button
                      onClick={() => onEditEmployer(employer)}
                      className="p-2 text-gray-400 hover:text-gold-600 rounded-lg hover:bg-gold-50"
                      aria-label="Edit employer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteEmployer && (
                    <button
                      onClick={() => onDeleteEmployer(employer.id || index)}
                      className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                      aria-label="Delete employer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-body-sm text-gray-600">Basic + DA</p>
                  <p className="text-body-md font-semibold text-gray-800">
                    {formatCurrency(
                      (employer.basicSalary || 0) + (employer.dearnessAllowance || 0),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-gray-600">HRA</p>
                  <p className="text-body-md font-semibold text-gray-800">
                    {formatCurrency(employer.hraReceived || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-gray-600">Allowances</p>
                  <p className="text-body-md font-semibold text-gray-800">
                    {formatCurrency(
                      (employer.specialAllowance || 0) + (employer.otherAllowances || 0),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-gray-600">Total</p>
                  <p className="text-body-md font-semibold text-gold-600">
                    {formatCurrency(calculateTotal(employer))}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gold-50 rounded-xl border border-gold-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-body-md font-semibold text-gray-800">Total Salary Income</span>
              <span className="text-heading-md font-semibold text-gold-600">
                {formatCurrency(totalSalary)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryBreakdown;

