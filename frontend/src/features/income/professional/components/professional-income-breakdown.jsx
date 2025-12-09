// =====================================================
// PROFESSIONAL INCOME BREAKDOWN COMPONENT
// Detailed professional income breakdown display
// =====================================================

import React from 'react';
import { Briefcase, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import Button from '../../../components/common/Button';

const ProfessionalIncomeBreakdown = ({
  activities = [],
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalIncome = activities.reduce((sum, activity) => sum + (activity.netIncome || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md text-gray-800">Professional Income</h3>
        {onAddActivity && (
          <Button size="sm" onClick={onAddActivity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        )}
      </div>

      {totalIncome > 0 && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl border border-gold-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-gray-600">Total Professional Income</p>
            <p className="text-heading-md font-semibold text-green-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-body-md text-gray-600 mb-4">No professional activities added yet</p>
          {onAddActivity && (
            <Button onClick={onAddActivity}>Add First Activity</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id || index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gold-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-body-md font-semibold text-gray-800">
                    {activity.activityName || `Activity ${index + 1}`}
                  </h4>
                  {activity.activityType && (
                    <p className="text-body-sm text-gray-600 mt-1">{activity.activityType}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {onEditActivity && (
                    <button
                      onClick={() => onEditActivity(activity, index)}
                      className="p-2 text-gray-400 hover:text-gold-600 rounded-lg hover:bg-gold-50"
                      aria-label="Edit activity"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteActivity && (
                    <button
                      onClick={() => onDeleteActivity(activity.id || index)}
                      className="p-2 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50"
                      aria-label="Delete activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-body-sm text-gray-600">Gross Receipts</p>
                  <p className="text-body-md font-semibold text-gray-800">
                    {formatCurrency(activity.grossReceipts || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-gray-600">Total Expenses</p>
                  <p className="text-body-md font-semibold text-red-700">
                    {formatCurrency(
                      Object.values(activity.expenses || {}).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) +
                      (activity.depreciation || 0) +
                      (activity.otherExpenses || 0),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-gray-600">Net Income</p>
                  <p className="text-body-md font-semibold text-green-700">
                    {formatCurrency(activity.netIncome || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalIncomeBreakdown;

