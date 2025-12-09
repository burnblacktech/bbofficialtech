// =====================================================
// USER PREFERENCES PAGE
// Comprehensive user preferences and settings
// =====================================================

import { useState } from 'react';
import { Settings, FileText, Bell, Lock, Eye } from 'lucide-react';
import FilingPreferences from '../../components/Settings/FilingPreferences';
import NotificationPreferences from '../../components/Settings/NotificationPreferences';
import PrivacySettings from '../../components/Settings/PrivacySettings';
import AccessibilitySettings from '../../components/Settings/AccessibilitySettings';

const Preferences = () => {
  const [activeTab, setActiveTab] = useState('filing');

  const tabs = [
    { id: 'filing', label: 'Filing', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-gold-600" />
            <h1 className="text-display-md text-gray-900 font-bold">Preferences</h1>
          </div>
          <p className="text-body-lg text-gray-600">
            Customize your BurnBlack experience
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                    }}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-body-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-gold-500 text-gold-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'filing' && <FilingPreferences />}
            {activeTab === 'notifications' && <NotificationPreferences />}
            {activeTab === 'privacy' && <PrivacySettings />}
            {activeTab === 'accessibility' && <AccessibilitySettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;

