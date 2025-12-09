// =====================================================
// DEDUCTION UTILIZATION DASHBOARD
// Visual progress bars for each section showing claimed vs limits
// =====================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { deductionLimitsService } from '../services/deduction-limits.service';
import { DEDUCTION_LIMITS } from '../constants/deduction-limits';

const DeductionUtilizationDashboard = ({ filingId, formData, userAge = 30, totalIncome = 0 }) => {
  // Calculate utilizations
  const utilizations = deductionLimitsService.calculateAllUtilizations(
    formData?.deductions || {},
    userAge,
    totalIncome,
  );

  const remainingOpportunities = deductionLimitsService.getRemainingOpportunities(utilizations);

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage > 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gold-50 to-gold-50 rounded-lg p-6 border border-gold-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-gold-600" />
            <div className="text-body-sm font-medium text-gray-700">Total Claimed</div>
          </div>
          <div className="text-heading-xl font-bold text-gold-600">
            ₹{utilizations.totalClaimed.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <div className="text-body-sm font-medium text-gray-700">Total Available</div>
          </div>
          <div className="text-heading-xl font-bold text-blue-600">
            ₹{utilizations.totalAvailable.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="text-body-sm font-medium text-gray-700">Overall Utilization</div>
          </div>
          <div className="text-heading-xl font-bold text-green-600">
            {utilizations.overallPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Section Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {utilizations.sections.map((util) => {
          const limitConfig = DEDUCTION_LIMITS[`section${util.section}`];
          const statusColor = getStatusColor(util.percentage);
          const progressColor = getProgressColor(util.percentage);

          return (
            <div
              key={util.section}
              className={`bg-white rounded-lg border-2 p-4 ${statusColor.split(' ')[2]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-heading-sm font-semibold text-gray-900">Section {util.section}</h4>
                  <p className="text-body-xs text-gray-600 mt-1">
                    {limitConfig?.description || 'Deduction'}
                  </p>
                </div>
                {util.percentage >= 90 && (
                  <div className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-medium">
                    High
                  </div>
                )}
                {util.percentage === 0 && (
                  <div className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 font-medium">
                    Unused
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-600">Claimed</span>
                  <span className="font-semibold text-gray-900">
                    ₹{util.claimed.toLocaleString('en-IN')}
                  </span>
                </div>

                {util.limit !== Infinity && (
                  <>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-gray-600">Limit</span>
                      <span className="font-semibold text-gray-900">
                        ₹{util.limit.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${progressColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(util.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-body-xs">
                      <span className="text-gray-500">{util.percentage.toFixed(1)}% utilized</span>
                      {util.remaining > 0 && (
                        <span className="text-green-600 font-medium">
                          ₹{util.remaining.toLocaleString('en-IN')} remaining
                        </span>
                      )}
                    </div>
                  </>
                )}

                {util.limit === Infinity && util.claimed > 0 && (
                  <div className="text-body-xs text-blue-600 font-medium">No upper limit</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining Opportunities */}
      {remainingOpportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-gold-600" />
            <h3 className="text-heading-md text-gray-900">Top Deduction Opportunities</h3>
          </div>
          <div className="space-y-3">
            {remainingOpportunities.map((opp) => (
              <div
                key={opp.section}
                className="flex items-center justify-between p-3 bg-gold-50 rounded-lg border border-gold-200"
              >
                <div>
                  <div className="text-heading-sm font-semibold text-gray-900">
                    Section {opp.section}
                  </div>
                  <div className="text-body-xs text-gray-600">
                    You can still claim ₹{opp.remaining.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-heading-md font-bold text-gold-600">
                  ₹{opp.remaining.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeductionUtilizationDashboard;

