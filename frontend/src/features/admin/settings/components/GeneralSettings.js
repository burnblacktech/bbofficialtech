// =====================================================
// GENERAL SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const GeneralSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    platformName: '',
    platformEmail: '',
    platformPhone: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en',
    maintenanceMode: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/general');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings) => {
      const response = await apiClient.put('/admin/settings/general', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['generalSettings']);
      toast.success('General settings updated successfully');
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Platform Name
          </label>
          <input
            type="text"
            value={formData.platformName}
            onChange={(e) => setFormData(prev => ({ ...prev, platformName: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Platform Email
          </label>
          <input
            type="email"
            value={formData.platformEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, platformEmail: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Platform Phone
          </label>
          <input
            type="tel"
            value={formData.platformPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, platformPhone: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            Language
          </label>
          <select
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="maintenanceMode"
          checked={formData.maintenanceMode}
          onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
          className="w-4 h-4 text-gold-600 focus:ring-gold-500"
        />
        <label htmlFor="maintenanceMode" className="text-body-regular font-medium text-slate-700">
          Maintenance Mode
        </label>
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

export default GeneralSettings;

