// =====================================================
// USER SETTINGS PAGE - ACCOUNT AND PREFERENCES
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SectionCard from '../../components/common/SectionCard';
import { User, Bell, Shield, Key, Mail, Eye, EyeOff, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const UserSettings = () => {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    filingReminders: true,
    documentUploads: true,
    systemUpdates: false,
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await api.get('/users/settings');
      if (response.data.success) {
        const settings = response.data.data;
        setNotificationSettings(settings.notifications || notificationSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/auth/profile', profileData);
      if (response.data.success) {
        updateUser(response.data.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    try {
      setLoading(true);
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/settings', {
        notifications: notificationSettings,
      });
      if (response.data.success) {
        toast.success('Notification settings updated');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--s29-bg-main)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--s29-text-main)] mb-2">
            Settings
          </h1>
          <p className="text-lg text-[var(--s29-text-muted)] font-medium">
            Manage your account and profile information
          </p>
        </div>

        <SectionCard className="mb-8 overflow-hidden">
          <div className="flex border-b border-[var(--s29-border-light)] overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold capitalize whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                  ? 'border-[var(--s29-primary)] text-[var(--s29-primary)] bg-[var(--s29-primary-light)]/5'
                  : 'border-transparent text-[var(--s29-text-muted)] hover:text-[var(--s29-text-main)] hover:bg-[var(--s29-bg-alt)]'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-[var(--s29-bg-alt)] border border-[var(--s29-border-light)] rounded-xl font-medium text-[var(--s29-text-muted)] cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[var(--s29-primary)] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-6">Security Settings</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--s29-text-muted)] hover:text-[var(--s29-text-main)]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--s29-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--s29-primary)]/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[var(--s29-primary)] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-[var(--s29-bg-alt)] rounded-xl">
                      <div>
                        <p className="font-bold text-[var(--s29-text-main)] capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-[var(--s29-text-muted)]">
                          Receive updates about your {key.toLowerCase().includes('filing') ? 'ITR status' : 'account activity'}.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--s29-border-light)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--s29-primary)]"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button
                      onClick={handleNotificationUpdate}
                      disabled={loading}
                      className="bg-[var(--s29-primary)] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default UserSettings;
