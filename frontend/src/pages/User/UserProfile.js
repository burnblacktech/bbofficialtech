// =====================================================
// MOBILE-FIRST USER PROFILE PAGE
// Touch-friendly profile management for all devices
// =====================================================

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Camera,
  Shield,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const UserProfile = () => {
  // U3.6 Hotfix: Validation in-place, no redirect needed.
  const { user, logout, refreshProfile } = useAuth();

  /* Restoring Original Logic + U3.6 Hotfix */
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [profileData, setProfileData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    pan: '',
    aadhar: ''
  });

  // Fetch user profile data
  const { data: fetchedProfileData, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // Fetch verified PANs
  const { data: verifiedPans = [], isLoading: pansLoading } = useQuery({
    queryKey: ['verifiedPans', user?.id],
    queryFn: async () => {
      const response = await api.get('/user/verified-pans');
      return response.data.data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });


  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await api.put('/auth/profile', updatedData);
      return response.data;
    },
    onSuccess: async () => {
      // Refresh Auth Context explicitly
      if (refreshProfile) await refreshProfile();
      queryClient.invalidateQueries(['userProfile', user?.id]);
      setIsEditing(false);
      setErrors({});
      // No navigation - stay on profile or let user go back manually
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      setErrors(error.response?.data?.errors || { general: 'Failed to update profile' });
      toast.error('Failed to update profile');
    }
  });

  const handleInputChange = (field, value) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profileData?.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!profileData?.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!profileData?.phone?.trim()) newErrors.phone = 'Phone is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData?.email && !emailRegex.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (profileData?.phone && !phoneRegex.test(profileData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    updateProfileMutation.mutate(profileData);
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: '',
      address: '',
      pan: '',
      aadhar: ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Profile info card component with BurnBlack styling
  const ProfileInfoCard = ({ icon: Icon, label, value, editable = false, field = null, type = 'text' }) => (
    <div className="dashboard-card-burnblack">
      <div className="flex items-center space-x-3">
        <div className="stat-icon-burnblack">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-body-small font-medium text-neutral-500 mb-1">{label}</p>
          {editable && isEditing ? (
            <div>
              <input
                type={type}
                value={value || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`w-full p-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burnblack-gold ${errors[field] ? 'border-error-300' : 'border-neutral-300'
                  }`}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
              {errors[field] && (
                <p className="text-body-small text-error-600 mt-1">{errors[field]}</p>
              )}
            </div>
          ) : (
            <p className="text-body-regular font-medium text-burnblack-black">{value || 'Not provided'}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-burnblack-white">
      {/* Mobile Header */}
      <header className="header-burnblack sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-burnblack-black">Profile</h1>
                <p className="text-body-small text-neutral-500">Manage your account</p>
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
                >
                  <X className="h-5 w-5 text-neutral-600" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner"></div>
          <p className="ml-3 text-neutral-600">Loading profile...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4 py-6">
          <div className="dashboard-card-burnblack text-center">
            <AlertCircle className="h-12 w-12 text-error-600 mx-auto mb-3" />
            <h3 className="text-heading-4 font-semibold text-burnblack-black mb-2">Error Loading Profile</h3>
            <p className="text-neutral-600 mb-4">Unable to load your profile information.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-burnblack"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <main className="px-4 py-4 space-y-4">
          {/* Profile Picture Section */}
          <div className="dashboard-card-burnblack text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-burnblack-gold bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-10 w-10 text-burnblack-gold" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 btn-burnblack p-2 rounded-full active:scale-95 transition-transform">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <h2 className="text-heading-4 font-semibold text-burnblack-black mb-1">{profileData?.firstName} {profileData?.lastName}</h2>
            <p className="text-body-regular text-neutral-500">{profileData?.email}</p>
            <div className="flex items-center justify-center space-x-1 mt-2">
              <CheckCircle className="h-3 w-3 text-success-600" />
              <span className="text-body-small text-success-600 font-medium">Verified Account</span>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 px-1">Personal Information</h3>
            <div className="space-y-3">
              <ProfileInfoCard
                icon={User}
                label="Full Name"
                value={profileData.name}
                editable={true}
                field="name"
              />
              <ProfileInfoCard
                icon={Mail}
                label="Email"
                value={profileData.email}
                editable={true}
                field="email"
                type="email"
              />
              <ProfileInfoCard
                icon={Phone}
                label="Phone"
                value={profileData.phone}
                editable={true}
                field="phone"
                type="tel"
              />
              <ProfileInfoCard
                icon={Calendar}
                label="Date of Birth"
                value={profileData.dateOfBirth}
                editable={true}
                field="dateOfBirth"
                type="date"
              />
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 px-1">Address Information</h3>
            <div className="space-y-3">
              <ProfileInfoCard
                icon={MapPin}
                label="Address"
                value={profileData.address}
                editable={true}
                field="address"
              />
            </div>
          </div>

          {/* Document Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 px-1">Verified PANs</h3>
            {pansLoading ? (
              <div className="dashboard-card-burnblack">
                <div className="flex items-center justify-center py-4">
                  <div className="loading-spinner"></div>
                  <p className="ml-3 text-neutral-600">Loading PANs...</p>
                </div>
              </div>
            ) : verifiedPans.length > 0 ? (
              <div className="space-y-3">
                {verifiedPans.map((pan) => (
                  <div key={pan.pan} className="dashboard-card-burnblack">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="stat-icon-burnblack">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-body-small font-medium text-neutral-500">{pan.label}</p>
                          {pan.name && (
                            <p className="text-body-regular font-semibold text-burnblack-black">{pan.name}</p>
                          )}
                          <p className="text-body-small text-neutral-600 font-mono">{pan.pan}</p>
                        </div>
                      </div>
                      {pan.isDefault && (
                        <span className="text-xs px-2 py-1 bg-burnblack-gold bg-opacity-20 text-burnblack-gold rounded-lg font-medium">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-card-burnblack text-center py-6">
                <Shield className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-body-small text-neutral-500 mb-3">No verified PANs</p>
                <button
                  onClick={() => navigate('/filing/start')}
                  className="btn-burnblack text-sm"
                >
                  Add PAN
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/notifications')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="text-body-regular font-medium text-slate-900">Notifications</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span className="text-body-regular font-medium text-slate-900">Settings</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 bg-error-50 rounded-xl hover:bg-error-100 active:scale-95 transition-transform"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-4 w-4 text-error-600" />
                  <span className="text-body-regular font-medium text-error-600">Logout</span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </Card>
        </main>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-blue-600">
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small font-medium">Profile</span>
          </button>
          <button
            onClick={() => navigate('/filing/start')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-body-small">Settings</span>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <Bell className="h-5 w-5 mb-1" />
            <span className="text-body-small">Alerts</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default UserProfile;
