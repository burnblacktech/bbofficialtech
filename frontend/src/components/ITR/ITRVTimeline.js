// =====================================================
// ITR-V TIMELINE COMPONENT
// Visual timeline showing ITR-V processing history
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, FileText, Mail, Truck, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';
import { format } from 'date-fns';

const ITRVTimeline = ({ timeline = [], className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className={cn('text-center py-8 text-slate-500', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-body-regular">No timeline events yet</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'delivered':
        return <Mail className="w-5 h-5 text-info-600" />;
      case 'processing':
        return <Truck className="w-5 h-5 text-warning-600" />;
      case 'generated':
        return <FileText className="w-5 h-5 text-info-600" />;
      case 'expired':
      case 'failed':
        return <XCircle className="w-5 h-5 text-error-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'border-success-500 bg-success-50';
      case 'delivered':
        return 'border-info-500 bg-info-50';
      case 'processing':
        return 'border-warning-500 bg-warning-50';
      case 'generated':
        return 'border-info-500 bg-info-50';
      case 'expired':
      case 'failed':
        return 'border-error-500 bg-error-50';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

      {/* Timeline Items */}
      <div className="relative space-y-6">
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1;
          const statusColor = getStatusColor(event.status);

          return (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2',
                statusColor,
              )}>
                {getStatusIcon(event.status)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 capitalize">
                    {event.status.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-body-small text-slate-500">
                    {format(new Date(event.date), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
                {event.message && (
                  <p className="text-body-regular text-slate-600">{event.message}</p>
                )}
                {event.source && (
                  <p className="text-body-small text-slate-500 mt-1">Source: {event.source}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ITRVTimeline;

