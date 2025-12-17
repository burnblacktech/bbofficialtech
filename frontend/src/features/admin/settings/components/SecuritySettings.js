// =====================================================
// SECURITY SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const SecuritySettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    requireEmailVerification: true,
    requirePhoneVerification: false,
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enableRateLimiting: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['securitySettings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/security');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings) => {
      const response = await apiClient.put('/admin/settings/security', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['securitySettings']);
      toast.success('Security settings updated successfully');
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
            <label className="text-body-regular font-medium text-slate-700">Require Email Verification</label>
            <p className="text-body-small text-slate-500 mt-1">Users must verify their email before accessing the platform</p>
          </div>
          <input
            type="checkbox"
            checked={formData.requireEmailVerification}
            onChange={(e) => setFormData(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">Require Phone Verification</label>
            <p className="text-body-small text-slate-500 mt-1">Users must verify their phone number</p>
          </div>
          <input
            type="checkbox"
            checked={formData.requirePhoneVerification}
            onChange={(e) => setFormData(prev => ({ ...prev, requirePhoneVerification: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">Require 2FA</label>
            <p className="text-body-small text-slate-500 mt-1">Enable two-factor authentication for all users</p>
          </div>
          <input
            type="checkbox"
            checked={formData.require2FA}
            onChange={(e) => setFormData(prev => ({ ...prev, require2FA: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-body-regular font-medium text-slate-700">Enable Rate Limiting</label>
            <p className="text-body-small text-slate-500 mt-1">Protect against brute force attacks</p>
          </div>
          <input
            type="checkbox"
            checked={formData.enableRateLimiting}
            onChange={(e) => setFormData(prev => ({ ...prev, enableRateLimiting: e.target.checked }))}
            className="w-4 h-4 text-gold-600 focus:ring-gold-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={formData.sessionTimeout}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
            min="5"
            max="1440"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={formData.maxLoginAttempts}
            onChange={(e) => setFormData(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
            min="3"
            max="10"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Password Min Length
          </label>
          <input
            type="number"
            value={formData.passwordMinLength}
            onChange={(e) => setFormData(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
            min="6"
            max="32"
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
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

export default SecuritySettings;

