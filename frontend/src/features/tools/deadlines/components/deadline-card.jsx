// =====================================================
// DEADLINE CARD COMPONENT
// Individual deadline card with reminder options
// =====================================================

import React, { useState } from 'react';
import { Calendar, Clock, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { useCreateReminder, useDeleteReminder } from '../hooks/use-deadlines';
import ReminderSettings from './reminder-settings';

const DeadlineCard = ({ deadline }) => {
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  const deadlineDate = new Date(deadline.deadline_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  const isPast = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
  const isUpcoming = daysUntilDeadline > 7;

  const getDeadlineTypeColor = (type) => {
    switch (type) {
      case 'itr_filing':
        return 'bg-error-100 text-red-800 border-red-200';
      case 'advance_tax':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'tds_deposit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-gray-800 border-slate-200';
    }
  };

  const getStatusBadge = () => {
    if (isPast) {
      return (
        <span className="px-2 py-1 text-body-small font-semibold rounded bg-slate-200 text-slate-700">
          Past
        </span>
      );
    }
    if (isUrgent) {
      return (
        <span className="px-2 py-1 text-body-small font-semibold rounded bg-red-200 text-error-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Urgent ({daysUntilDeadline} days)
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-body-small font-semibold rounded bg-green-200 text-green-700">
        {daysUntilDeadline} days remaining
      </span>
    );
  };

  return (
    <div className={`border rounded-xl p-4 ${getDeadlineTypeColor(deadline.deadline_type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-slate-900">{deadline.title}</h4>
            {getStatusBadge()}
          </div>
          <p className="text-body-regular text-slate-600 mb-2">{deadline.description}</p>
          <div className="flex items-center gap-4 text-body-small text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {deadlineDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {isPast
                ? `${Math.abs(daysUntilDeadline)} days ago`
                : `${daysUntilDeadline} days remaining`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deadline.reminder_enabled ? (
            <button
              onClick={() => setShowReminderSettings(!showReminderSettings)}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              title="Reminder settings"
            >
              <Bell className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                createReminder.mutate({
                  deadlineId: deadline.id,
                  reminderDays: [7, 3, 1],
                });
              }}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              title="Enable reminder"
            >
              <BellOff className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showReminderSettings && (
        <div className="mt-4 pt-4 border-t border-slate-300">
          <ReminderSettings
            deadlineId={deadline.id}
            onClose={() => setShowReminderSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DeadlineCard;

