// =====================================================
// ADMIN SETTINGS - SYSTEM CONFIGURATION
// Tabbed interface for all system settings
// =====================================================

import React, { useState } from 'react';
import { Settings, Shield, DollarSign, Bell, Plug, Flag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import GeneralSettings from '../../features/admin/settings/components/GeneralSettings';
import TaxSettings from '../../features/admin/settings/components/TaxSettings';
import SecuritySettings from '../../features/admin/settings/components/SecuritySettings';
import IntegrationSettings from '../../features/admin/settings/components/IntegrationSettings';
import NotificationSettings from '../../features/admin/settings/components/NotificationSettings';
import FeatureFlagsSettings from '../../features/admin/settings/components/FeatureFlagsSettings';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'tax', label: 'Tax', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'tax':
        return <TaxSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'integrations':
        return <IntegrationSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'feature-flags':
        return <FeatureFlagsSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-heading-1 font-bold text-black">System Settings</h1>
          <p className="text-slate-700 mt-2">Configure platform settings and preferences</p>
        </div>

        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                      activeTab === tab.id
                        ? 'border-gold-500 text-gold-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
