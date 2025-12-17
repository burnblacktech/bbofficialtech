// =====================================================
// NOTICE TIMELINE COMPONENT
// Visual timeline showing assessment notice history
// =====================================================

import React from 'react';
import { CheckCircle, Clock, XCircle, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const NoticeTimeline = ({ timeline = [], className = '' }) => {
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
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'responded':
        return <MessageSquare className="w-5 h-5 text-info-600" />;
      case 'acknowledged':
        return <CheckCircle className="w-5 h-5 text-info-600" />;
      case 'disputed':
        return <AlertCircle className="w-5 h-5 text-warning-600" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'border-success-500 bg-success-50';
      case 'responded':
        return 'border-info-500 bg-info-50';
      case 'acknowledged':
        return 'border-info-500 bg-info-50';
      case 'disputed':
        return 'border-warning-500 bg-warning-50';
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

export default NoticeTimeline;

