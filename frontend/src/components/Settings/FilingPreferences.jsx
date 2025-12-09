// =====================================================
// FILING PREFERENCES COMPONENT
// User preferences for ITR filing
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const FilingPreferences = () => {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    defaultRegime: user?.preferences?.defaultRegime || 'old',
    autoCopyFromPreviousYear: user?.preferences?.autoCopyFromPreviousYear ?? true,
    skipOnboardingTour: user?.preferences?.skipOnboardingTour ?? false,
    expertMode: user?.preferences?.expertMode ?? false,
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
        toast.success('Preferences saved successfully');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-semibold text-gray-900 mb-1">Filing Preferences</h3>
        <p className="text-body-sm text-gray-600">
          Customize your default settings for ITR filing
        </p>
      </div>

      {/* Default Tax Regime */}
      <div className="border border-gray-200 rounded-lg p-4">
        <label className="block text-body-sm font-medium text-gray-700 mb-2">
          Default Tax Regime
        </label>
        <p className="text-body-xs text-gray-500 mb-3">
          Choose your preferred tax regime. You can always change this for individual filings.
        </p>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="defaultRegime"
              value="old"
              checked={preferences.defaultRegime === 'old'}
              onChange={(e) => setPreferences({ ...preferences, defaultRegime: e.target.value })}
              className="mr-2"
            />
            <span className="text-body-sm">Old Regime</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="defaultRegime"
              value="new"
              checked={preferences.defaultRegime === 'new'}
              onChange={(e) => setPreferences({ ...preferences, defaultRegime: e.target.value })}
              className="mr-2"
            />
            <span className="text-body-sm">New Regime</span>
          </label>
        </div>
      </div>

      {/* Auto-copy from Previous Year */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
              Auto-copy from Previous Year
            </label>
            <p className="text-body-xs text-gray-500">
              Automatically suggest copying data from your previous year's filing
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.autoCopyFromPreviousYear}
              onChange={(e) =>
                setPreferences({ ...preferences, autoCopyFromPreviousYear: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Skip Onboarding Tour */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
              Skip Onboarding Tour
            </label>
            <p className="text-body-xs text-gray-500">
              Skip the guided tour when starting a new filing
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.skipOnboardingTour}
              onChange={(e) =>
                setPreferences({ ...preferences, skipOnboardingTour: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Expert Mode */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-gray-700 mb-1">
              Expert Mode
            </label>
            <p className="text-body-xs text-gray-500">
              Enable advanced features and skip simplified explanations
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.expertMode}
              onChange={(e) =>
                setPreferences({ ...preferences, expertMode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

export default FilingPreferences;

