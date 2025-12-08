// =====================================================
// ADMIN CONTROL PANEL PAGE
// Platform management with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Settings,
  Users,
  IndianRupee,
  Shield,
  Save,
  RefreshCw,
  AlertCircle,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition } from '../../components/DesignSystem/Animations';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminControlPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('billing');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [caFirms, setCaFirms] = useState([]);
  const [userLimits, setUserLimits] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const [settingsData, caFirmsData, userLimitsData] = await Promise.all([
          adminService.getSettings(),
          adminService.getCAFirmsStats(),
          adminService.getUserLimits(),
        ]);

        setSettings(settingsData);
        setCaFirms(caFirmsData);
        setUserLimits(userLimitsData.limits || []);
      } catch (err) {
        console.error('Failed to load control panel data:', err);
        setError('Failed to load control panel data. Please try again.');
        toast.error('Failed to load control panel data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

  const tabs = [
    { id: 'billing', name: 'Billing & Rates', icon: IndianRupee },
    { id: 'limits', name: 'User Limits', icon: Users },
    { id: 'ca-firms', name: 'CA Firms', icon: Shield },
    { id: 'platform', name: 'Platform Settings', icon: Settings },
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBillingTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default ITR Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ITR-1 Rate (₹)</label>
              <input
                type="number"
                value={settings.defaultItrRates?.itr_1 || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  // eslint-disable-next-line camelcase
                  defaultItrRates: { ...settings.defaultItrRates, itr_1: parseInt(e.target.value) },
                })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ITR-2 Rate (₹)</label>
              <input
                type="number"
                value={settings.defaultItrRates?.itr_2 || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  // eslint-disable-next-line camelcase
                  defaultItrRates: { ...settings.defaultItrRates, itr_2: parseInt(e.target.value) },
                })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ITR-3 Rate (₹)</label>
              <input
                type="number"
                value={settings.defaultItrRates?.itr_3 || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  // eslint-disable-next-line camelcase
                  defaultItrRates: { ...settings.defaultItrRates, itr_3: parseInt(e.target.value) },
                })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">ITR-4 Rate (₹)</label>
              <input
                type="number"
                value={settings.defaultItrRates?.itr_4 || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  // eslint-disable-next-line camelcase
                  defaultItrRates: { ...settings.defaultItrRates, itr_4: parseInt(e.target.value) },
                })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Commission Percentage (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.platformCommission || 0}
              onChange={(e) => setSettings({ ...settings, platformCommission: parseFloat(e.target.value) })}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLimitsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default User Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Max Filings Per Month</label>
              <input
                type="number"
                value={settings.maxFilingsPerUserMonth || 0}
                onChange={(e) => setSettings({ ...settings, maxFilingsPerUserMonth: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Max Filings Per Year</label>
              <input
                type="number"
                value={settings.maxFilingsPerUserYear || 0}
                onChange={(e) => setSettings({ ...settings, maxFilingsPerUserYear: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual User Limits</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">CA Firm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Monthly Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Yearly Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {userLimits.map((limit) => (
                  <tr key={limit.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Body className="font-medium">{limit.userName}</Typography.Body>
                      <Typography.Small className="text-neutral-500">ID: {limit.userId}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{limit.tenantName}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{limit.maxFilingsPerMonth}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{limit.maxFilingsPerYear}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{limit.currentMonthFilings}/{limit.maxFilingsPerMonth} (month)</Typography.Small>
                      <Typography.Small className="text-neutral-500 block">{limit.currentYearFilings}/{limit.maxFilingsPerYear} (year)</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCaFirmsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CA Firms Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Firm Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Billing Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {caFirms.map((firm) => (
                  <tr key={firm.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Body className="font-medium">{firm.name}</Typography.Body>
                      <Typography.Small className="text-neutral-500">{firm.email}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        firm.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                      }`}>
                        {firm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{firm.billingMode.replace('_', ' ')}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{firm.commissionPercentage}%</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography.Small>{new Date(firm.lastActivity).toLocaleDateString()}</Typography.Small>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-error-600 hover:text-error-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlatformTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Body className="font-medium">Auto-create Service Tickets</Typography.Body>
                <Typography.Small className="text-neutral-500">Automatically create service tickets when users start filing</Typography.Small>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.serviceTicketAutoCreate || false}
                  onChange={(e) => setSettings({ ...settings, serviceTicketAutoCreate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Typography.Body className="font-medium">CA-Assisted Filing Visibility</Typography.Body>
                <Typography.Small className="text-neutral-500">Make CA-assisted filings visible to users</Typography.Small>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.caAssistedFilingVisible || false}
                  onChange={(e) => setSettings({ ...settings, caAssistedFilingVisible: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-error-600" />
          </div>
          <Typography.Body className="text-neutral-600 mb-4">{error}</Typography.Body>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Typography.H1 className="mb-2">Admin Control Panel</Typography.H1>
          <Typography.Body className="text-neutral-600">
            Manage platform settings, billing, and user limits
          </Typography.Body>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </Card>

        {/* Tab Content */}
        <div className="mb-6">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminControlPanel;
