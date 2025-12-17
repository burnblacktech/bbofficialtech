// =====================================================
// FEATURE FLAGS SETTINGS COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, Loader, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/core/APIClient';
import toast from 'react-hot-toast';

const FeatureFlagsSettings = () => {
  const queryClient = useQueryClient();
  const [featureFlags, setFeatureFlags] = useState({});

  // Mock feature flags - in production, this would come from the backend
  const availableFlags = [
    { key: 'FEATURE_PAN_VERIFICATION_LIVE', label: 'PAN Verification (Live)', description: 'Enable live PAN verification via SurePass', category: 'Verification' },
    { key: 'FEATURE_AADHAAR_VERIFICATION_LIVE', label: 'Aadhaar Verification (Live)', description: 'Enable live Aadhaar verification via SurePass', category: 'Verification' },
    { key: 'FEATURE_2FA_ENABLED', label: 'Two-Factor Authentication', description: 'Enable 2FA for all users', category: 'Security' },
    { key: 'FEATURE_AUTO_SAVE', label: 'Auto Save', description: 'Enable auto-save for ITR forms', category: 'Filing' },
    { key: 'FEATURE_REAL_TIME_COMPUTATION', label: 'Real-time Tax Computation', description: 'Enable real-time tax calculation', category: 'Filing' },
    { key: 'FEATURE_CA_MARKETPLACE', label: 'CA Marketplace', description: 'Enable CA marketplace features', category: 'CA' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      // In production, this would call /admin/settings/feature-flags
      // For now, return mock data
      return { data: {} };
    },
  });

  const mutation = useMutation({
    mutationFn: async (flags) => {
      // In production, this would call /admin/settings/feature-flags
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['featureFlags']);
      toast.success('Feature flags updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update feature flags');
    },
  });

  useEffect(() => {
    if (data?.data) {
      setFeatureFlags(data.data);
    } else {
      // Initialize with default values
      const defaults = {};
      availableFlags.forEach(flag => {
        defaults[flag.key] = false;
      });
      setFeatureFlags(defaults);
    }
  }, [data]);

  const handleToggle = (key) => {
    setFeatureFlags(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(featureFlags);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gold-600" />
      </div>
    );
  }

  const flagsByCategory = availableFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.keys(flagsByCategory).map(category => (
        <div key={category} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
          <h3 className="text-heading-4 font-medium text-slate-900 mb-4">{category}</h3>
          <div className="space-y-4">
            {flagsByCategory[category].map(flag => (
              <div key={flag.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <label className="text-body-regular font-medium text-slate-700">{flag.label}</label>
                    <Info className="w-4 h-4 text-slate-400" title={flag.description} />
                  </div>
                  <p className="text-body-small text-slate-500 mt-1">{flag.description}</p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featureFlags[flag.key] || false}
                      onChange={() => handleToggle(flag.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

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
              <span>Save Feature Flags</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FeatureFlagsSettings;

