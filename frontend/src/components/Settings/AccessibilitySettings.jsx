// =====================================================
// ACCESSIBILITY SETTINGS COMPONENT
// User accessibility preferences
// =====================================================

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Eye, Type, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const AccessibilitySettings = () => {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    highContrast: user?.preferences?.highContrast ?? false,
    reducedMotion: user?.preferences?.reducedMotion ?? false,
    fontSize: user?.preferences?.fontSize || 'normal',
    language: user?.preferences?.language || 'en',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Apply accessibility settings immediately
  useEffect(() => {
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    document.documentElement.style.fontSize = {
      small: '14px',
      normal: '16px',
      large: '18px',
      xlarge: '20px',
    }[preferences.fontSize] || '16px';
  }, [preferences]);

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
        toast.success('Accessibility settings saved successfully');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save accessibility settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-semibold text-slate-900 mb-1">Accessibility Settings</h3>
        <p className="text-body-sm text-slate-600">
          Customize the interface to suit your needs
        </p>
      </div>

      {/* High Contrast Mode */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Eye className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <label className="block text-body-sm font-medium text-slate-700">
                High Contrast Mode
              </label>
              <p className="text-body-xs text-slate-500 mt-1">
                Increase contrast for better visibility
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) =>
                setPreferences({ ...preferences, highContrast: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Reduced Motion */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Zap className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <label className="block text-body-sm font-medium text-slate-700">
                Reduced Motion
              </label>
              <p className="text-body-xs text-slate-500 mt-1">
                Minimize animations and transitions
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) =>
                setPreferences({ ...preferences, reducedMotion: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
          </label>
        </div>
      </div>

      {/* Font Size */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <Type className="h-5 w-5 text-slate-600 mt-0.5" />
          <div className="flex-1">
            <label className="block text-body-sm font-medium text-slate-700 mb-2">
              Font Size
            </label>
            <p className="text-body-xs text-slate-500 mb-3">
              Adjust the base font size for better readability
            </p>
            <div className="flex gap-2">
              {['small', 'normal', 'large', 'xlarge'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, fontSize: size })}
                  className={`px-4 py-2 border-2 rounded-xl text-body-sm font-medium transition-colors ${
                    preferences.fontSize === size
                      ? 'border-gold-500 bg-gold-50 text-gold-700'
                      : 'border-slate-300 text-slate-700 hover:border-gray-400'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language Preference */}
      <div className="border border-slate-200 rounded-xl p-4">
        <label className="block text-body-sm font-medium text-slate-700 mb-2">
          Language Preference
        </label>
        <p className="text-body-xs text-slate-500 mb-3">
          Choose your preferred language (coming soon)
        </p>
        <select
          value={preferences.language}
          onChange={(e) =>
            setPreferences({ ...preferences, language: e.target.value })
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          disabled
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
        </select>
        <p className="text-body-xs text-slate-500 mt-2">
          Multi-language support is coming soon
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
              Save Accessibility Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;

