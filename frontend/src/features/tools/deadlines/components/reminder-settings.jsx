// =====================================================
// REMINDER SETTINGS COMPONENT
// Configure reminder preferences for a deadline
// =====================================================

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useCreateReminder, useUpdateReminder, useDeleteReminder } from '../hooks/use-deadlines';
import Button from '../../../../components/DesignSystem/components/Button';

const ReminderSettings = ({ deadlineId, onClose }) => {
  const [reminderDays, setReminderDays] = useState([7, 3, 1]);
  const [enabled, setEnabled] = useState(true);

  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const handleSave = () => {
    if (enabled) {
      createReminder.mutate(
        { deadlineId, reminderDays },
        {
          onSuccess: () => {
                onClose();
              },
        },
      );
    } else {
      // Disable reminder (would need reminder ID to delete)
      // For now, just close
      onClose();
    }
  };

  const toggleDay = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const presetOptions = [
    { label: '7 days before', value: 7 },
    { label: '3 days before', value: 3 },
    { label: '1 day before', value: 1 },
    { label: 'On deadline', value: 0 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold-600" />
          <h4 className="font-semibold text-slate-900">Reminder Settings</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
            />
            <span className="text-body-regular font-medium text-slate-700">Enable reminders</span>
          </label>
        </div>

        {enabled && (
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Remind me (days before deadline):
            </label>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleDay(option.value)}
                  className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                    reminderDays.includes(option.value)
                      ? 'bg-gold-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {reminderDays.length === 0 && (
              <p className="text-body-small text-error-600 mt-1">Select at least one reminder day</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={enabled && reminderDays.length === 0}>
            Save Reminder
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;

