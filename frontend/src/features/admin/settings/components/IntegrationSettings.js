// =====================================================
// INTEGRATION SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const IntegrationSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    surepassApiKey: '',
    surepassEnabled: false,
    googleOAuthClientId: '',
    googleOAuthEnabled: true,
    emailServiceProvider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['integrationSettings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/integrations');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings) => {
      const response = await apiClient.put('/admin/settings/integrations', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['integrationSettings']);
      toast.success('Integration settings updated successfully');
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
      {/* SurePass Integration */}
      <div className="border-b border-slate-200 pb-6">
        <h3 className="text-heading-4 font-medium text-slate-900 mb-4">SurePass API</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-body-regular font-medium text-slate-700">Enable SurePass</label>
            <input
              type="checkbox"
              checked={formData.surepassEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, surepassEnabled: e.target.checked }))}
              className="w-4 h-4 text-gold-600 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.surepassApiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, surepassApiKey: e.target.value }))}
                className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google OAuth */}
      <div className="border-b border-slate-200 pb-6">
        <h3 className="text-heading-4 font-medium text-slate-900 mb-4">Google OAuth</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-body-regular font-medium text-slate-700">Enable Google OAuth</label>
            <input
              type="checkbox"
              checked={formData.googleOAuthEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, googleOAuthEnabled: e.target.checked }))}
              className="w-4 h-4 text-gold-600 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={formData.googleOAuthClientId}
              onChange={(e) => setFormData(prev => ({ ...prev, googleOAuthClientId: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>
      </div>

      {/* Email Service */}
      <div>
        <h3 className="text-heading-4 font-medium text-slate-900 mb-4">Email Service</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Provider
            </label>
            <select
              value={formData.emailServiceProvider}
              onChange={(e) => setFormData(prev => ({ ...prev, emailServiceProvider: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
            >
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
              <option value="ses">AWS SES</option>
            </select>
          </div>
          {formData.emailServiceProvider === 'smtp' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    SMTP User
                  </label>
                  <input
                    type="text"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-slate-700 mb-2">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
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

export default IntegrationSettings;

