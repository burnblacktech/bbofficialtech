// =====================================================
// PRIVACY SETTINGS COMPONENT
// User privacy and data sharing preferences
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Shield, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const PrivacySettings = () => {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    dataSharing: user?.preferences?.dataSharing ?? true,
    marketingCommunications: user?.preferences?.marketingCommunications ?? false,
    analyticsOptOut: user?.preferences?.analyticsOptOut ?? false,
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
        toast.success('Privacy settings saved successfully');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-semibold text-slate-900 mb-1">Privacy Settings</h3>
        <p className="text-body-sm text-slate-600">
          Control how your data is used and shared
        </p>
      </div>

      {/* Data Sharing */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <label className="block text-body-sm font-medium text-slate-700">
                Data Sharing for Service Improvement
              </label>
              <p className="text-body-xs text-slate-500 mt-1">
                Allow anonymized data to be used for improving our services. Your personal information is never shared.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.dataSharing}
              onChange={(e) =>
                setPreferences({ ...preferences, dataSharing: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Marketing Communications */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Mail className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <label className="block text-body-sm font-medium text-slate-700">
                Marketing Communications
              </label>
              <p className="text-body-xs text-slate-500 mt-1">
                Receive emails about new features, tax tips, and special offers
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.marketingCommunications}
              onChange={(e) =>
                setPreferences({ ...preferences, marketingCommunications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Analytics Opt-out */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <label className="block text-body-sm font-medium text-slate-700">
                Analytics Opt-out
              </label>
              <p className="text-body-xs text-slate-500 mt-1">
                Opt out of usage analytics tracking
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.analyticsOptOut}
              onChange={(e) =>
                setPreferences({ ...preferences, analyticsOptOut: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-4">
        <p className="text-body-xs text-info-800">
          <strong>Note:</strong> Your tax data is always encrypted and secure. These settings only control
          how anonymized, aggregated data is used for service improvement. Your personal and financial
          information is never shared with third parties.
        </p>
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
              Save Privacy Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;

