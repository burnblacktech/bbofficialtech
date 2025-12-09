// =====================================================
// BELATED RETURN INDICATOR COMPONENT
// Shows belated return status and late fee information
// =====================================================

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const BelatedReturnIndicator = ({ fy, dueDate, lateFee }) => {
  if (!fy || !dueDate) return null;

  const isBelated = new Date() > new Date(dueDate);

  if (!isBelated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">Return is on time</p>
          <p className="text-xs text-green-700 mt-1">
            Due date: {new Date(dueDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gold-900 mb-2">Belated Return</h4>
          <div className="space-y-2 text-sm text-gold-800">
            <p>
              This return is being filed after the due date. Late fees may apply.
            </p>
            {lateFee > 0 && (
              <div className="bg-gold-100 rounded p-2">
                <p className="font-medium">Estimated Late Fee: ₹{lateFee.toLocaleString('en-IN')}</p>
                <p className="text-xs mt-1 opacity-80">
                  ₹5,000 if filed before December 31, ₹10,000 if filed after
                </p>
              </div>
            )}
            <div className="flex items-start space-x-2 mt-3 pt-3 border-t border-gold-200">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">
                Belated returns can be filed up to 3 years from the end of the assessment year.
                Interest under Section 234A may also apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BelatedReturnIndicator;

