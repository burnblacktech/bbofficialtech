// Admin Control Panel - Platform Management
// Allows super_admin to control user limits, billing modes, service rates
// Comprehensive platform-wide settings and configuration

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Settings,
  Users,
  DollarSign,
  Shield,
  BarChart3,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const AdminControlPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('billing');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [caFirms, setCaFirms] = useState([]);
  const [userLimits, setUserLimits] = useState([]);

  // Mock data - will be replaced with API calls
  const mockSettings = {
    defaultBillingMode: 'per_filing',
    defaultItrRates: {
      itr_1: 500,
      itr_2: 800,
      itr_3: 1200,
      itr_4: 1000,
    },
    maxFilingsPerUserMonth: 10,
    maxFilingsPerUserYear: 50,
    serviceTicketAutoCreate: true,
    caAssistedFilingVisible: true,
    platformCommission: 5.0,
  };

  const mockCaFirms = [
    {
      id: '1',
      name: 'ABC & Associates',
      email: 'admin@abcassociates.com',
      status: 'active',
      billingMode: 'per_filing',
      itrRates: {
        itr_1: 600,
        itr_2: 900,
        itr_3: 1400,
        itr_4: 1200,
      },
      maxFilingsPerMonth: 100,
      maxFilingsPerYear: 1000,
      commissionPercentage: 3.0,
      createdAt: '2023-01-15',
      lastActivity: '2024-01-15',
    },
    {
      id: '2',
      name: 'XYZ Chartered Accountants',
      email: 'contact@xyzca.com',
      status: 'active',
      billingMode: 'subscription',
      monthlySubscription: 5000,
      maxFilingsPerMonth: 200,
      maxFilingsPerYear: 2000,
      commissionPercentage: 2.5,
      createdAt: '2023-03-20',
      lastActivity: '2024-01-14',
    },
  ];

  const mockUserLimits = [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Doe',
      tenantId: 'tenant-1',
      tenantName: 'ABC & Associates',
      maxFilingsPerMonth: 15,
      maxFilingsPerYear: 75,
      currentMonthFilings: 3,
      currentYearFilings: 12,
      resetDate: '2024-02-01',
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Jane Smith',
      tenantId: 'tenant-2',
      tenantName: 'XYZ Chartered Accountants',
      maxFilingsPerMonth: 10,
      maxFilingsPerYear: 50,
      currentMonthFilings: 8,
      currentYearFilings: 35,
      resetDate: '2024-02-01',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSettings(mockSettings);
      setCaFirms(mockCaFirms);
      setUserLimits(mockUserLimits);
    }, 1000);
  }, []);

  const tabs = [
    { id: 'billing', name: 'Billing & Rates', icon: DollarSign },
    { id: 'limits', name: 'User Limits', icon: Users },
    { id: 'ca-firms', name: 'CA Firms', icon: Shield },
    { id: 'platform', name: 'Platform Settings', icon: Settings },
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save settings
      console.log('Saving settings:', settings);
      // await adminService.updateSettings(settings);
      setTimeout(() => {
        setLoading(false);
        alert('Settings saved successfully!');
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setLoading(false);
    }
  };

  const handleUpdateCaFirm = (firmId, updates) => {
    setCaFirms(caFirms.map(firm =>
      firm.id === firmId ? { ...firm, ...updates } : firm,
    ));
  };

  const handleUpdateUserLimit = (limitId, updates) => {
    setUserLimits(userLimits.map(limit =>
      limit.id === limitId ? { ...limit, ...updates } : limit,
    ));
  };

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Default ITR Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ITR-1 Rate (₹)</label>
            <input
              type="number"
              value={settings.defaultItrRates?.itr_1 || 0}
              onChange={(e) => setSettings({
                ...settings,
                defaultItrRates: { ...settings.defaultItrRates, itr_1: parseInt(e.target.value) },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ITR-2 Rate (₹)</label>
            <input
              type="number"
              value={settings.defaultItrRates?.itr_2 || 0}
              onChange={(e) => setSettings({
                ...settings,
                defaultItrRates: { ...settings.defaultItrRates, itr_2: parseInt(e.target.value) },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ITR-3 Rate (₹)</label>
            <input
              type="number"
              value={settings.defaultItrRates?.itr_3 || 0}
              onChange={(e) => setSettings({
                ...settings,
                defaultItrRates: { ...settings.defaultItrRates, itr_3: parseInt(e.target.value) },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ITR-4 Rate (₹)</label>
            <input
              type="number"
              value={settings.defaultItrRates?.itr_4 || 0}
              onChange={(e) => setSettings({
                ...settings,
                defaultItrRates: { ...settings.defaultItrRates, itr_4: parseInt(e.target.value) },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Commission</h3>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission Percentage (%)</label>
          <input
            type="number"
            step="0.1"
            value={settings.platformCommission || 0}
            onChange={(e) => setSettings({ ...settings, platformCommission: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderLimitsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Default User Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Filings Per Month</label>
            <input
              type="number"
              value={settings.maxFilingsPerUserMonth || 0}
              onChange={(e) => setSettings({ ...settings, maxFilingsPerUserMonth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Filings Per Year</label>
            <input
              type="number"
              value={settings.maxFilingsPerUserYear || 0}
              onChange={(e) => setSettings({ ...settings, maxFilingsPerUserYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Individual User Limits</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA Firm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yearly Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userLimits.map((limit) => (
                <tr key={limit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{limit.userName}</div>
                    <div className="text-sm text-gray-500">ID: {limit.userId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {limit.tenantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {limit.maxFilingsPerMonth}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {limit.maxFilingsPerYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm">{limit.currentMonthFilings}/{limit.maxFilingsPerMonth} (month)</div>
                    <div className="text-sm text-gray-500">{limit.currentYearFilings}/{limit.maxFilingsPerYear} (year)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCaFirmsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CA Firms Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firm Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {caFirms.map((firm) => (
                <tr key={firm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{firm.name}</div>
                    <div className="text-sm text-gray-500">{firm.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      firm.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {firm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {firm.billingMode.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {firm.commissionPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(firm.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlatformTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-create Service Tickets</label>
              <p className="text-sm text-gray-500">Automatically create service tickets when users start filing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.serviceTicketAutoCreate || false}
                onChange={(e) => setSettings({ ...settings, serviceTicketAutoCreate: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">CA-Assisted Filing Visibility</label>
              <p className="text-sm text-gray-500">Make CA-assisted filings visible to users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.caAssistedFilingVisible || false}
                onChange={(e) => setSettings({ ...settings, caAssistedFilingVisible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return renderBillingTab();
      case 'limits':
        return renderLimitsTab();
      case 'ca-firms':
        return renderCaFirmsTab();
      case 'platform':
        return renderPlatformTab();
      default:
        return renderBillingTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage platform settings, billing, and user limits
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className={`flex items-center px-6 py-2 rounded-lg ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
