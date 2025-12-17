// =====================================================
// NOTIFICATION SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnFilingComplete: true,
    notifyOnRefund: true,
    notifyOnDeadline: true,
    notifyOnSystemUpdate: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/notifications');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings) => {
      const response = await apiClient.put('/admin/settings/notifications', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationSettings']);
      toast.success('Notification settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (data?.data) {
      setFormData(prev => ({ ...prev, ...data.data }));
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gold-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">Email Notifications</label>
            <p className="text-body-small text-slate-500 mt-1">Send notifications via email</p>
          </div>
          <input
            type="checkbox"
            checked={formData.emailNotifications}
            onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">SMS Notifications</label>
            <p className="text-body-small text-slate-500 mt-1">Send notifications via SMS</p>
          </div>
          <input
            type="checkbox"
            checked={formData.smsNotifications}
            onChange={(e) => setFormData(prev => ({ ...prev, smsNotifications: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">Push Notifications</label>
            <p className="text-body-small text-slate-500 mt-1">Send browser push notifications</p>
          </div>
          <input
            type="checkbox"
            checked={formData.pushNotifications}
            onChange={(e) => setFormData(prev => ({ ...prev, pushNotifications: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-slate-900 mb-4">Notification Types</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-body-regular text-slate-700">Filing Complete</label>
              <input
                type="checkbox"
                checked={formData.notifyOnFilingComplete}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyOnFilingComplete: e.target.checked }))}
                className="w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-body-regular text-slate-700">Refund Status</label>
              <input
                type="checkbox"
                checked={formData.notifyOnRefund}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyOnRefund: e.target.checked }))}
                className="w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-body-regular text-slate-700">Deadline Reminders</label>
              <input
                type="checkbox"
                checked={formData.notifyOnDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyOnDeadline: e.target.checked }))}
                className="w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-body-regular text-slate-700">System Updates</label>
              <input
                type="checkbox"
                checked={formData.notifyOnSystemUpdate}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyOnSystemUpdate: e.target.checked }))}
                className="w-4 h-4 text-gold-600 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="px-6 py-3 bg-gold-600 text-white rounded-xl hover:bg-gold-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {mutation.isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default NotificationSettings;

