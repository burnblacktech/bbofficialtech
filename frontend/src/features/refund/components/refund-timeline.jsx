// =====================================================
// REFUND TIMELINE COMPONENT
// Visual timeline of refund status updates
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const RefundTimeline = ({ timeline = [] }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'credited':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'issued':
        return <CheckCircle className="h-5 w-5 text-info-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-warning-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'adjusted':
        return <AlertCircle className="h-5 w-5 text-gold-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-body-md text-slate-600">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-heading-md text-gray-800 mb-6">Refund Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {timeline.map((item, index) => (
            <div key={index} className="relative flex items-start">
              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-slate-200">
                {getStatusIcon(item.status)}
              </div>

              {/* Content */}
              <div className="ml-6 flex-1 pb-6">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-body-md font-semibold text-gray-800 capitalize">
                    {item.status}
                  </h4>
                  <span className="text-body-sm text-slate-500">{formatDate(item.date)}</span>
                </div>
                <p className="text-body-sm text-slate-600">{item.message || item.description}</p>
                {item.refundReference && (
                  <p className="text-body-sm text-slate-500 mt-1 font-mono">
                    Reference: {item.refundReference}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RefundTimeline;

