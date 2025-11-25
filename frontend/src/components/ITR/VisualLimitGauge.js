// =====================================================
// VISUAL LIMIT GAUGE - DEDUCTION LIMIT PROGRESS BAR
// Gamified progress indicator for deduction limits
// =====================================================

import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const VisualLimitGauge = ({
  title,
  claimed,
  limit,
  unit = '₹',
  showPercentage = true,
  color = 'blue',
}) => {
  const percentage = Math.min((claimed / limit) * 100, 100);
  const remaining = Math.max(0, limit - claimed);
  const isOverLimit = claimed > limit;
  const isNearLimit = percentage >= 90;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      light: 'bg-green-50',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      light: 'bg-purple-50',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-600',
      light: 'bg-orange-50',
      border: 'border-orange-200',
    },
  };

  const colors = colorClasses[color];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`${colors.light} rounded-lg p-4 border ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="flex items-center">
          {isOverLimit ? (
            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
          ) : isNearLimit ? (
            <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            isOverLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'
          }`}>
            {showPercentage && `${Math.round(percentage)}%`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : colors.bg
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Claimed:</span>
          <div className={`font-semibold ${
            isOverLimit ? 'text-red-600' : colors.text
          }`}>
            {formatAmount(claimed)}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Limit:</span>
          <div className="font-semibold text-gray-900">
            {formatAmount(limit)}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-3 text-xs">
        {isOverLimit ? (
          <div className="text-red-600 bg-red-50 rounded px-2 py-1">
            ⚠️ Over limit by {formatAmount(claimed - limit)}
          </div>
        ) : isNearLimit ? (
          <div className="text-orange-600 bg-orange-50 rounded px-2 py-1">
            ⚡ Only {formatAmount(remaining)} remaining
          </div>
        ) : (
          <div className="text-green-600 bg-green-50 rounded px-2 py-1">
            ✅ {formatAmount(remaining)} remaining
          </div>
        )}
      </div>

      {/* Additional Info */}
      {percentage > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {claimed > 0 && (
            <div>
              You've claimed {formatAmount(claimed)} of {formatAmount(limit)} limit
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualLimitGauge;
