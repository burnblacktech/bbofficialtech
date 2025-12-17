// =====================================================
// NOTIFICATION PREFERENCES COMPONENT
// User preferences for notifications
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Mail, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const NotificationPreferences = () => {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? false,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    reminderFrequency: user?.preferences?.reminderFrequency || 'weekly',
    filingUpdates: user?.preferences?.filingUpdates ?? true,
    documentRequests: user?.preferences?.documentRequests ?? true,
    deadlineReminders: user?.preferences?.deadlineReminders ?? true,
    refundUpdates: user?.preferences?.refundUpdates ?? true,
    systemAnnouncements: user?.preferences?.systemAnnouncements ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.put('/users/preferences', {
        preferences: {
          ...preferences,
        },
      });

      if (response.data.success) {
        updateUser({ ...user, preferences: preferences });
        setIsSaved(true);
        toast.success('Notification preferences saved successfully');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    { key: 'filingUpdates', label: 'Filing Updates', description: 'Get notified about your ITR filing status' },
    { key: 'documentRequests', label: 'Document Requests', description: 'Notifications when documents are requested' },
    { key: 'deadlineReminders', label: 'Deadline Reminders', description: 'Reminders for important tax deadlines' },
    { key: 'refundUpdates', label: 'Refund Updates', description: 'Updates on your tax refund status' },
    { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important platform updates and announcements' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-semibold text-slate-900 mb-1">Notification Preferences</h3>
        <p className="text-body-sm text-slate-600">
          Choose how you want to receive notifications
        </p>
      </div>

      {/* Notification Channels */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Notification Channels</h4>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Mail className="h-5 w-5 text-slate-600 mt-0.5" />
              <div>
                <label className="block text-body-sm font-medium text-slate-700">Email Notifications</label>
                <p className="text-body-xs text-slate-500">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailNotifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MessageSquare className="h-5 w-5 text-slate-600 mt-0.5" />
              <div>
                <label className="block text-body-sm font-medium text-slate-700">SMS Notifications</label>
                <p className="text-body-xs text-slate-500">Receive notifications via SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, smsNotifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="h-5 w-5 text-slate-600 mt-0.5" />
              <div>
                <label className="block text-body-sm font-medium text-slate-700">Push Notifications</label>
                <p className="text-body-xs text-slate-500">Receive push notifications in browser</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, pushNotifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Reminder Frequency */}
      <div className="border border-slate-200 rounded-xl p-4">
        <label className="block text-body-sm font-medium text-slate-700 mb-2">
          Reminder Frequency
        </label>
        <p className="text-body-xs text-slate-500 mb-3">
          How often you want to receive reminder notifications
        </p>
        <select
          value={preferences.reminderFrequency}
          onChange={(e) =>
            setPreferences({ ...preferences, reminderFrequency: e.target.value })
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="never">Never</option>
        </select>
      </div>

      {/* Notification Types */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="text-heading-sm font-medium text-slate-900 mb-4">Notification Types</h4>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-start justify-between">
              <div className="flex-1">
                <label className="block text-body-sm font-medium text-slate-700">
                  {type.label}
                </label>
                <p className="text-body-xs text-slate-500">{type.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={preferences[type.key]}
                  onChange={(e) =>
                    setPreferences({ ...preferences, [type.key]: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;

