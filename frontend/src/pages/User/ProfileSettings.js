// =====================================================
// PROFILE SETTINGS - TABBED USER PROFILE MANAGEMENT
// Clean, secure, and easy-to-navigate profile page
// =====================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, CreditCard, FileText, Settings, Save, ExternalLink, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Loader2, X, RotateCcw, Filter, ArrowUpDown, Download, Eye, ChevronRight, RefreshCw, Search, Clock, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/api/authService';
import toast from 'react-hot-toast';
import PANVerificationInline from '../../components/ITR/PANVerificationInline';
import AadhaarLinking from '../../components/ITR/AadhaarLinking';
import apiClient from '../../services/core/APIClient';
import bankAccountService from '../../services/api/bankAccountService';
import itrService from '../../services/api/itrService';
import { FilingCardSkeleton, ActivityFeedSkeleton } from '../../components/UI/Skeletons';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import { validateIFSC } from '../../lib/validation-patterns';
import { bankDetailsService } from '../../features/bank-details/services/bank-details.service';
import useAutoSave from '../../hooks/useAutoSave';
import formDataService from '../../services/FormDataService';
import fieldLockService, { VERIFICATION_STATUS } from '../../services/FieldLockService';

const ProfileSettings = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'bank-accounts', label: 'Bank Accounts', icon: CreditCard },
    { id: 'filings', label: 'My Filings', icon: FileText },
  ];

  const handleSave = async (tabId, data, onSuccess) => {
    setIsLoading(true);
    try {
      if (tabId === 'security') {
        // Handle password set/change
        const hasPassword = user?.hasPassword || user?.passwordHash;
        if (hasPassword) {
          // User has password - change password
          await authService.changePassword(data.currentPassword, data.newPassword);
          toast.success('Password changed successfully');
          if (onSuccess) onSuccess();
        } else {
          // OAuth user without password - set password
          await authService.setPassword(data.newPassword);
          toast.success('Password set successfully');
          if (onSuccess) onSuccess();
          // Reload user profile to get updated hasPassword status
          try {
            const profileData = await authService.getProfile();
            if (profileData?.data?.user) {
              // Update localStorage user object
              const updatedUser = { ...user, ...profileData.data.user, hasPassword: true };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.warn('Failed to reload user profile after setting password:', error);
          }
        }
      } else if (tabId === 'profile') {
        // If PAN changed, update it separately (backend will verify via SurePass)
        if (data.panNumber && data.panNumber !== user?.panNumber && data.panNumber.length === 10) {
          try {
            await apiClient.patch('/users/pan', { panNumber: data.panNumber });
          } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update PAN');
          }
        }
        // Update other profile fields including address
        const updateData = {
          fullName: data.fullName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        };
        // Only update if there are changes
        if (updateData.fullName || updateData.phone || updateData.dateOfBirth !== undefined ||
            updateData.addressLine1 !== undefined || updateData.addressLine2 !== undefined ||
            updateData.city !== undefined || updateData.state !== undefined || updateData.pincode !== undefined) {
          const response = await apiClient.put('/users/profile', updateData);
          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to update profile');
          }
        }
        toast.success('Profile updated successfully');

        // Refresh user data to show updated PAN status
        try {
          const profileData = await authService.getProfile();
          // Handle both response structures: { user: {...} } or { data: { user: {...} } }
          if (profileData?.user) {
            await updateProfile({ user: profileData.user });
          } else if (profileData?.data?.user) {
            await updateProfile(profileData.data);
          }
        } catch (error) {
          console.warn('Failed to refresh user profile after save:', error);
        }

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error saving:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save changes';

      toast.error(errorMessage);

      // Show retry option for network errors
      if (!error.response && (error.message.includes('Network') || error.message.includes('fetch'))) {
        toast.error('Network error. Please check your connection.', {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab user={user} onSave={handleSave} isLoading={isLoading} />;
      case 'security':
        return <SecurityTab user={user} onSave={handleSave} isLoading={isLoading} />;
      case 'bank-accounts':
        return <BankAccountsTab onSave={handleSave} isLoading={isLoading} />;
      case 'filings':
        return <FilingsTab />;
      default:
        return null;
    }
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-2 sm:text-heading-1 font-bold text-slate-900">Profile Settings</h1>
              <p className="text-body-regular sm:text-body-large text-slate-600 mt-2">Manage your account information and preferences</p>
            </div>
            <button
              onClick={() => navigate('/preferences')}
              className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 text-body-sm font-medium"
            >
              <Settings className="h-4 w-4" />
              Preferences
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
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
  );
};

// Profile Tab Component
const ProfileTab = ({ user, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    panNumber: user?.panNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    addressLine1: user?.address?.addressLine1 || '',
    addressLine2: user?.address?.addressLine2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });
  const [originalFormData, setOriginalFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    panNumber: user?.panNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    addressLine1: user?.address?.addressLine1 || '',
    addressLine2: user?.address?.addressLine2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });
  const [showPANVerification, setShowPANVerification] = useState(false);
  const [panVerified, setPanVerified] = useState(user?.panVerified || false);
  const [originalPAN, setOriginalPAN] = useState(user?.panNumber || '');
  const [isDataLoading, setIsDataLoading] = useState(!user);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldValidations, setFieldValidations] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [formError, setFormError] = useState('');
  const hasUnsavedChanges = useRef(false);
  const formRef = useRef(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        try {
          const profileData = await formDataService.loadProfileData();
          if (profileData && Object.keys(profileData).length > 0) {
            const newFormData = {
              fullName: profileData.fullName || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              panNumber: profileData.panNumber || '',
              dateOfBirth: profileData.dateOfBirth || '',
              addressLine1: profileData.address?.addressLine1 || profileData.addressLine1 || '',
              addressLine2: profileData.address?.addressLine2 || profileData.addressLine2 || '',
              city: profileData.address?.city || profileData.city || '',
              state: profileData.address?.state || profileData.state || '',
              pincode: profileData.address?.pincode || profileData.pincode || '',
            };
            setFormData(newFormData);
            setOriginalFormData(newFormData);
            setPanVerified(profileData.panVerified || false);
            setOriginalPAN(profileData.panNumber || '');
            setIsDataLoading(false);
          }
        } catch (error) {
          console.warn('Failed to load profile data:', error);
        }
      }
    };
    loadProfileData();
  }, []);

  // Auto-save function
  const saveProfileData = useCallback(async (dataToSave) => {
    try {
      // Extract only the fields we want to save (exclude email, panNumber which are handled separately)
      const updateData = {
        fullName: dataToSave.fullName,
        phone: dataToSave.phone,
        dateOfBirth: dataToSave.dateOfBirth,
        addressLine1: dataToSave.addressLine1,
        addressLine2: dataToSave.addressLine2,
        city: dataToSave.city,
        state: dataToSave.state,
        pincode: dataToSave.pincode,
      };

      // Only save if there are actual changes from original
      const hasChanges = Object.keys(updateData).some(key => {
        const newValue = updateData[key];
        const oldValue = originalFormData[key];
        return newValue !== oldValue;
      });

      if (!hasChanges) return;

      await formDataService.saveProfileData(updateData);
      setOriginalFormData({ ...dataToSave });
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [originalFormData]);

  // Auto-save hook
  const { saveStatus, handleFieldBlur } = useAutoSave({
    saveFn: saveProfileData,
    data: formData,
    debounceMs: 2000,
    localStorageKey: 'profile_autosave',
    enabled: true,
    onSaveSuccess: () => {
      // Silent success - no toast for auto-save
    },
    onSaveError: (error) => {
      console.warn('Auto-save error (non-blocking):', error);
    },
  });

  // Validation functions
  const validateFullName = (name) => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Full name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Full name must be at least 2 characters' };
    }
    return { isValid: true };
  };

  const validatePhone = (phone) => {
    if (!phone) return { isValid: true }; // Optional field
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }
    if (phoneDigits.length === 10 && !/^[6-9]/.test(phoneDigits)) {
      return { isValid: false, error: 'Phone number must start with 6, 7, 8, or 9' };
    }
    if (phoneDigits.length === 10) {
      return { isValid: true };
    }
    return { isValid: true }; // Incomplete but valid so far
  };

  const validatePincode = (pincode) => {
    if (!pincode) return { isValid: false, error: 'Pincode is required' };
    const pincodeDigits = pincode.replace(/\D/g, '');
    if (pincodeDigits.length < 6) {
      return { isValid: false, error: 'Pincode must be 6 digits' };
    }
    return { isValid: true };
  };

  const validateAddressLine1 = (address) => {
    if (!address || address.trim().length === 0) {
      return { isValid: false, error: 'Address line 1 is required' };
    }
    return { isValid: true };
  };

  const validateCity = (city) => {
    if (!city || city.trim().length === 0) {
      return { isValid: false, error: 'City is required' };
    }
    return { isValid: true };
  };

  const validateState = (state) => {
    if (!state || state.trim().length === 0) {
      return { isValid: false, error: 'State is required' };
    }
    return { isValid: true };
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return { isValid: true }; // Optional field
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return { isValid: false, error: 'Please enter a valid date of birth' };
    }
    if (dobDate > new Date()) {
      return { isValid: false, error: 'Date of birth cannot be in the future' };
    }
    return { isValid: true };
  };

  // Real-time validation handler
  const validateField = (fieldName, value) => {
    let validation = { isValid: true };
    switch (fieldName) {
      case 'fullName':
        validation = validateFullName(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'pincode':
        validation = validatePincode(value);
        break;
      case 'addressLine1':
        validation = validateAddressLine1(value);
        break;
      case 'city':
        validation = validateCity(value);
        break;
      case 'state':
        validation = validateState(value);
        break;
      case 'dateOfBirth':
        validation = validateDateOfBirth(value);
        break;
      default:
        validation = { isValid: true };
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error,
    }));

    setFieldValidations(prev => ({
      ...prev,
      [fieldName]: validation.isValid,
    }));

    return validation.isValid;
  };

  // Sync formData when user prop changes (e.g., after page refresh or profile update)
  useEffect(() => {
    if (user) {
      const newFormData = {
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        panNumber: user.panNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        addressLine1: user.address?.addressLine1 || '',
        addressLine2: user.address?.addressLine2 || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || '',
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
      setPanVerified(user.panVerified || false);
      setOriginalPAN(user.panNumber || '');
      setIsDataLoading(false);
      hasUnsavedChanges.current = false;
    } else {
      setIsDataLoading(true);
    }
  }, [user?.panNumber, user?.dateOfBirth, user?.fullName, user?.phone, user?.email, user?.panVerified, user?.address]);

  // Track form changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    hasUnsavedChanges.current = hasChanges;
  }, [formData, originalFormData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handlePANChange = (e) => {
    const newPAN = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, panNumber: newPAN }));

    // Handle PAN state changes
    if (newPAN.length === 0) {
      // PAN cleared - reset verification state
      setPanVerified(false);
      setShowPANVerification(false);
    } else if (newPAN.length === 10) {
      if (newPAN === originalPAN) {
        // PAN reverted to original - restore verified state
        setPanVerified(user?.panVerified || false);
        setShowPANVerification(false);
      } else {
        // PAN changed - require verification
        setPanVerified(false);
        setShowPANVerification(true);
      }
    } else {
      // PAN incomplete - hide verification
      setPanVerified(false);
      setShowPANVerification(false);
    }
  };

  const handlePANVerified = (verificationResult) => {
    setPanVerified(true);
    setShowPANVerification(false);
    setOriginalPAN(formData.panNumber);

    // Auto-populate DOB if available and current DOB is empty
    if (verificationResult.dateOfBirth && !formData.dateOfBirth) {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: verificationResult.dateOfBirth,
      }));
      toast.success('PAN verified successfully! Date of Birth auto-populated.');
    } else {
      toast.success('PAN verified successfully!');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validate all required fields
    const validations = {
      fullName: validateField('fullName', formData.fullName),
      addressLine1: validateField('addressLine1', formData.addressLine1),
      city: validateField('city', formData.city),
      state: validateField('state', formData.state),
      pincode: validateField('pincode', formData.pincode),
    };

    // Validate optional fields if provided
    if (formData.phone) {
      validations.phone = validateField('phone', formData.phone);
    }
    if (formData.dateOfBirth) {
      validations.dateOfBirth = validateField('dateOfBirth', formData.dateOfBirth);
    }

    // Check if any validation failed
    const hasErrors = Object.values(validations).some(v => !v);
    if (hasErrors) {
      setFormError('Please fix the errors before saving');
      toast.error('Please fix the errors in the form');
      return;
    }

    // Validate PAN verification requirement
    if (formData.panNumber && formData.panNumber.length === 10) {
      if (formData.panNumber !== originalPAN && !panVerified) {
        toast.error('Please verify your PAN number before saving');
        setShowPANVerification(true);
        return;
      }
    }

    onSave('profile', formData, () => {
      // Callback after successful save - update local state
      setOriginalPAN(formData.panNumber);
      setPanVerified(true);
      setOriginalFormData({ ...formData });
      hasUnsavedChanges.current = false;
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
    });
  };

  const handleReset = () => {
    if (hasUnsavedChanges.current) {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Are you sure you want to discard your changes?')) {
        return;
      }
    }
    setFormData({ ...originalFormData });
    setFieldErrors({});
    setFieldValidations({});
    setFormError('');
    hasUnsavedChanges.current = false;
    toast.success('Form reset to original values');
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'pincode'];
    const optionalFields = ['phone', 'panNumber', 'dateOfBirth', 'addressLine2'];
    const requiredCompleted = requiredFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    }).length;

    const optionalCompleted = optionalFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim().length > 0;
    }).length;

    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    const totalFields = totalRequired + totalOptional;

    // Required fields are weighted 70%, optional 30%
    const completion = Math.round(
      (requiredCompleted / totalRequired) * 70 +
      (optionalCompleted / totalOptional) * 30,
    );

    return Math.min(100, completion);
  };

  const completionPercentage = calculateCompletion();

  // Check if save should be disabled
  const isSaveDisabled = isLoading || isDataLoading ||
    (formData.panNumber && formData.panNumber.length === 10 &&
     formData.panNumber !== originalPAN && !panVerified);

  // Show loading state while user data is being fetched
  if (isDataLoading) {
    return (
      <div>
        <h2 className="text-heading-3 font-semibold text-black mb-6">Personal Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                <div className="h-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-3 font-semibold text-black">Personal Information</h2>
        {/* Profile Completion Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-body-regular font-medium text-slate-700">Profile Completion</div>
            <div className="text-body-small text-slate-500">{completionPercentage}%</div>
          </div>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completionPercentage === 100 ? 'bg-success-500' :
                completionPercentage >= 70 ? 'bg-gold-500' : 'bg-warning-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-body-regular font-medium text-error-800">{formError}</p>
          </div>
          <button
            onClick={() => setFormError('')}
            className="text-error-600 hover:text-error-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5 text-success-600" />
          <p className="text-body-regular font-medium text-success-800">Profile updated successfully!</p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, fullName: value }));
                  validateField('fullName', value);
                }}
                onBlur={(e) => {
                  validateField('fullName', formData.fullName);
                  // Auto-save is handled by useAutoSave hook via formData changes
                }}
                disabled={isLoading || isDataLoading || (user?.emailVerified && fieldLockService.shouldLockField('personalInfo', 'name', VERIFICATION_STATUS.VERIFIED).locked)}
                className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldErrors.fullName ? 'border-error-300 focus:border-error-500' :
                  fieldValidations.fullName && formData.fullName ? 'border-success-300' : 'border-slate-300'
                }`}
                required
                placeholder="Enter your full name"
              />
              {fieldValidations.fullName && formData.fullName && !fieldErrors.fullName && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
              )}
              {fieldErrors.fullName && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
              )}
            </div>
            {fieldErrors.fullName && (
              <p className="mt-1 text-body-small text-error-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldErrors.fullName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500"
            />
            <p className="text-body-small text-slate-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Phone Number
              <span className="text-body-small text-slate-500 ml-1">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  // Normalize phone input (digits only)
                  const phoneDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData(prev => ({ ...prev, phone: phoneDigits }));
                  validateField('phone', phoneDigits);
                }}
                onBlur={(e) => {
                  if (formData.phone) {
                    validateField('phone', formData.phone);
                  }
                  // Auto-save is handled by useAutoSave hook via formData changes
                }}
                disabled={isLoading || isDataLoading}
                className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldErrors.phone ? 'border-error-300 focus:border-error-500' :
                  fieldValidations.phone && formData.phone && formData.phone.length === 10 ? 'border-success-300' : 'border-slate-300'
                }`}
                placeholder="10 digit phone number"
              />
              {fieldValidations.phone && formData.phone && formData.phone.length === 10 && !fieldErrors.phone && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
              )}
              {fieldErrors.phone && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
              )}
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-body-small text-error-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldErrors.phone}
              </p>
            )}
            {formData.phone && !fieldErrors.phone && formData.phone.length === 10 && (
              <p className="mt-1 text-body-small text-success-600 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid phone number
              </p>
            )}
            {!formData.phone && (
              <p className="mt-1 text-body-small text-slate-500">Phone number is optional but recommended</p>
            )}
          </div>
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              PAN Number
              <span className="text-body-small text-slate-500 ml-1">(Optional)</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={handlePANChange}
                  maxLength={10}
                  disabled={isLoading || isDataLoading}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 font-mono uppercase disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    panVerified && formData.panNumber ? 'border-success-300' : 'border-slate-300'
                  }`}
                  placeholder="ABCDE1234F"
                />
                {panVerified && formData.panNumber && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
                )}
              </div>
              <p className="text-body-small text-slate-500">Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)</p>
              {panVerified && formData.panNumber && (
                <p className="text-body-small text-success-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  PAN Verified
                </p>
              )}
              {formData.panNumber && formData.panNumber.length === 10 && formData.panNumber !== originalPAN && !panVerified && (
                <p className="text-body-small text-warning-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Please verify your PAN number before saving
                </p>
              )}
            </div>
          </div>
          {/* PAN Verification Inline */}
          {showPANVerification && formData.panNumber && formData.panNumber.length === 10 && (
            <div className="md:col-span-2 mt-4 p-4 bg-gold-50 border border-gold-200 rounded-xl">
              <PANVerificationInline
                panNumber={formData.panNumber}
                onVerified={handlePANVerified}
                onCancel={() => setShowPANVerification(false)}
                memberType="self"
                compact={true}
              />
            </div>
          )}
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Date of Birth
              <span className="text-body-small text-slate-500 ml-1">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }));
                  validateField('dateOfBirth', e.target.value);
                }}
                onBlur={(e) => {
                  validateField('dateOfBirth', formData.dateOfBirth);
                  // Auto-save is handled by useAutoSave hook via formData changes
                }}
                disabled={isLoading || isDataLoading}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldErrors.dateOfBirth ? 'border-error-300 focus:border-error-500' :
                  fieldValidations.dateOfBirth && formData.dateOfBirth ? 'border-success-300' : 'border-slate-300'
                }`}
              />
              {fieldValidations.dateOfBirth && formData.dateOfBirth && !fieldErrors.dateOfBirth && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
              )}
              {fieldErrors.dateOfBirth && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
              )}
            </div>
            {fieldErrors.dateOfBirth && (
              <p className="mt-1 text-body-small text-error-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldErrors.dateOfBirth}
              </p>
            )}
            {formData.dateOfBirth && !fieldErrors.dateOfBirth && (
              <p className="mt-1 text-body-small text-slate-500">
                {Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} years old
              </p>
            )}
          </div>
        </div>

        {/* Aadhaar Linking Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-heading-4 font-semibold text-black mb-4">Aadhaar Linking</h3>
          <AadhaarLinking
            userId={user?.id || user?.userId}
            onLinked={() => {
              // Refresh user profile after linking
              if (onSave) {
                // Trigger a profile refresh
                window.location.reload();
              }
            }}
            onUnlinked={() => {
              // Refresh user profile after unlinking
              if (onSave) {
                // Trigger a profile refresh
                window.location.reload();
              }
            }}
          />
        </div>

        {/* Address Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-heading-4 font-semibold text-black mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-body-regular font-medium text-slate-700 mb-2">
                Address Line 1 *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, addressLine1: e.target.value }));
                    validateField('addressLine1', e.target.value);
                  }}
                  onBlur={(e) => {
                    validateField('addressLine1', formData.addressLine1);
                    // Auto-save is handled by useAutoSave hook via formData changes
                  }}
                  disabled={isLoading || isDataLoading}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.addressLine1 ? 'border-error-300 focus:border-error-500' :
                    fieldValidations.addressLine1 && formData.addressLine1 ? 'border-success-300' : 'border-slate-300'
                  }`}
                  required
                  placeholder="Street address, P.O. box"
                />
                {fieldValidations.addressLine1 && formData.addressLine1 && !fieldErrors.addressLine1 && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
                )}
                {fieldErrors.addressLine1 && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
                )}
              </div>
              {fieldErrors.addressLine1 && (
                <p className="mt-1 text-body-small text-error-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.addressLine1}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-body-regular font-medium text-slate-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                disabled={isLoading || isDataLoading}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-2">
                City *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, city: e.target.value }));
                    validateField('city', e.target.value);
                  }}
                  onBlur={(e) => {
                    validateField('city', formData.city);
                    // Auto-save is handled by useAutoSave hook via formData changes
                  }}
                  disabled={isLoading || isDataLoading}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.city ? 'border-error-300 focus:border-error-500' :
                    fieldValidations.city && formData.city ? 'border-success-300' : 'border-slate-300'
                  }`}
                  required
                  placeholder="City"
                />
                {fieldValidations.city && formData.city && !fieldErrors.city && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
                )}
                {fieldErrors.city && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
                )}
              </div>
              {fieldErrors.city && (
                <p className="mt-1 text-body-small text-error-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.city}
                </p>
              )}
            </div>
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-2">
                State *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, state: e.target.value }));
                    validateField('state', e.target.value);
                  }}
                  onBlur={(e) => {
                    validateField('state', formData.state);
                    // Auto-save is handled by useAutoSave hook via formData changes
                  }}
                  disabled={isLoading || isDataLoading}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.state ? 'border-error-300 focus:border-error-500' :
                    fieldValidations.state && formData.state ? 'border-success-300' : 'border-slate-300'
                  }`}
                  required
                  placeholder="State"
                />
                {fieldValidations.state && formData.state && !fieldErrors.state && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
                )}
                {fieldErrors.state && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
                )}
              </div>
              {fieldErrors.state && (
                <p className="mt-1 text-body-small text-error-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.state}
                </p>
              )}
            </div>
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-2">
                Pincode *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.pincode}
                  onChange={(e) => {
                    // Normalize pincode input (digits only, max 6)
                    const pincodeDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, pincode: pincodeDigits }));
                    validateField('pincode', pincodeDigits);
                  }}
                  onBlur={(e) => {
                    validateField('pincode', formData.pincode);
                    // Auto-save is handled by useAutoSave hook via formData changes
                  }}
                  disabled={isLoading || isDataLoading}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.pincode ? 'border-error-300 focus:border-error-500' :
                    fieldValidations.pincode && formData.pincode && formData.pincode.length === 6 ? 'border-success-300' : 'border-slate-300'
                  }`}
                  required
                  placeholder="6 digit pincode (e.g., 400001)"
                  maxLength={6}
                />
                {fieldValidations.pincode && formData.pincode && formData.pincode.length === 6 && !fieldErrors.pincode && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success-600" />
                )}
                {fieldErrors.pincode && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-error-600" />
                )}
              </div>
              {fieldErrors.pincode && (
                <p className="mt-1 text-body-small text-error-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.pincode}
                </p>
              )}
              {formData.pincode && !fieldErrors.pincode && formData.pincode.length === 6 && (
                <p className="mt-1 text-body-small text-success-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valid pincode
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || !hasUnsavedChanges.current}
            className="inline-flex items-center px-4 py-2 text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges.current && (
              <span className="text-body-small text-slate-500">You have unsaved changes</span>
            )}
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-elevation-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Security Tab Component
const SecurityTab = ({ user, onSave, isLoading }) => {
  const hasPassword = user?.hasPassword || user?.passwordHash;
  const isOAuthUser = user?.authProvider === 'GOOGLE' || user?.authProvider === 'OTHER';
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: [] };

    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Mix of uppercase and lowercase');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one special character');
    }

    return { score, feedback };
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-slate-200';
    if (passwordStrength.score === 1) return 'bg-error-500';
    if (passwordStrength.score === 2) return 'bg-warning-500';
    if (passwordStrength.score === 3) return 'bg-info-500';
    return 'bg-success-500';
  };

  // Get password strength label
  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score === 0) return 'No password';
    if (passwordStrength.score === 1) return 'Weak';
    if (passwordStrength.score === 2) return 'Fair';
    if (passwordStrength.score === 3) return 'Good';
    return 'Strong';
  };

  // Handle password change
  const handlePasswordChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');

    // Clear field error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Calculate password strength for new password
    if (field === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Real-time password match validation
    if (field === 'confirmPassword' && formData.newPassword) {
      if (value !== formData.newPassword) {
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }

    // Real-time password match validation when new password changes
    if (field === 'newPassword' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validate current password
    if (hasPassword && !formData.currentPassword) {
      setFormError('Current password is required');
      setValidationErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }));
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 2) {
      setFormError('Password is too weak. Please use a stronger password.');
      setValidationErrors(prev => ({ ...prev, newPassword: 'Password is too weak' }));
      return;
    }

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    // Clear form and show success after save
    onSave('security', formData, () => {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength({ score: 0, feedback: [] });
      setValidationErrors({});
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div>
      <h2 className="text-heading-3 font-semibold text-black mb-6">Security Settings</h2>

      {showSuccessBanner && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <p className="text-success-800 font-medium">Password updated successfully!</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-error-800">{formError}</p>
          </div>
        </div>
      )}

      {!hasPassword && isOAuthUser && (
        <div className="mb-6 p-4 bg-info-50 border border-info-200 rounded-xl">
          <p className="text-body-regular text-info-800">
            You signed up with Google OAuth. Set a password to enable email/password login.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {hasPassword && (
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                  validationErrors.currentPassword
                    ? 'border-error-300'
                    : 'border-slate-300'
                }`}
                required={hasPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                title={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.currentPassword && (
              <p className="mt-1 text-body-small text-error-600">{validationErrors.currentPassword}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            {hasPassword ? 'New Password *' : 'Password *'}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                validationErrors.newPassword
                  ? 'border-error-300'
                  : formData.newPassword && passwordStrength.score >= 2
                  ? 'border-success-300'
                  : 'border-slate-300'
              }`}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
              title={showPasswords.new ? 'Hide password' : 'Show password'}
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-small font-medium text-slate-700">
                  Password Strength: <span className={getPasswordStrengthColor().replace('bg-', 'text-')}>{getPasswordStrengthLabel()}</span>
                </span>
                <span className="text-body-small text-slate-500">{passwordStrength.score}/4</span>
              </div>
              <div className="flex space-x-1 mb-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      i < passwordStrength.score
                        ? getPasswordStrengthColor()
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.feedback.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-body-small font-medium text-slate-700">Requirements:</p>
                  <ul className="text-body-small text-slate-600 space-y-1">
                    {passwordStrength.feedback.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <X className="w-3 h-3 text-error-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {passwordStrength.score >= 2 && (
                <div className="mt-2 flex items-center gap-2 text-body-small text-success-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Password meets minimum requirements</span>
                </div>
              )}
            </div>
          )}
          {validationErrors.newPassword && (
            <p className="mt-1 text-body-small text-error-600">{validationErrors.newPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-body-regular font-medium text-slate-700 mb-2">
            {hasPassword ? 'Confirm New Password *' : 'Confirm Password *'}
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${
                validationErrors.confirmPassword
                  ? 'border-error-300'
                  : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                  ? 'border-success-300'
                  : 'border-slate-300'
              }`}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
              title={showPasswords.confirm ? 'Hide password' : 'Show password'}
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {validationErrors.confirmPassword ? (
            <p className="mt-1 text-body-small text-error-600">{validationErrors.confirmPassword}</p>
          ) : formData.confirmPassword && formData.newPassword === formData.confirmPassword ? (
            <p className="mt-1 text-body-small text-success-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Passwords match
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || passwordStrength.score < 2 || Object.keys(validationErrors).length > 0}
            className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {hasPassword ? 'Updating...' : 'Setting...'}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {hasPassword ? 'Update Password' : 'Set Password'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Bank Accounts Tab Component
const BankAccountsTab = ({ onSave, isLoading }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountHolderName: '',
    accountType: 'savings',
    isPrimary: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isIFSCLookupLoading, setIsIFSCLookupLoading] = useState(false);
  const [showAccountNumbers, setShowAccountNumbers] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPrimaryConfirm, setShowPrimaryConfirm] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const originalFormData = useRef(null);

  // Fetch bank accounts using React Query
  const { data: bankAccountsData, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const response = await bankAccountService.getBankAccounts();
      return response.data || [];
    },
    refetchOnWindowFocus: false,
  });

  const bankAccounts = bankAccountsData || [];

  // Validation functions
  const validateAccountNumber = (accountNumber) => {
    if (!accountNumber) {
      return 'Account number is required';
    }
    if (accountNumber.length < 9) {
      return 'Account number must be at least 9 digits';
    }
    if (accountNumber.length > 18) {
      return 'Account number must not exceed 18 digits';
    }
    if (!/^\d+$/.test(accountNumber)) {
      return 'Account number must contain only digits';
    }
    return null;
  };

  const validateAccountHolderName = (name) => {
    if (!name) {
      return 'Account holder name is required';
    }
    if (name.trim().length < 2) {
      return 'Account holder name must be at least 2 characters';
    }
    if (name.trim().length > 100) {
      return 'Account holder name must not exceed 100 characters';
    }
    // Allow letters, spaces, dots, and common name characters
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      return 'Account holder name contains invalid characters';
    }
    return null;
  };

  const validateBankName = (bankName) => {
    if (!bankName) {
      return 'Bank name is required';
    }
    if (bankName.trim().length < 2) {
      return 'Bank name must be at least 2 characters';
    }
    return null;
  };

  // Handle IFSC change with validation and lookup
  const handleIFSCChange = async (ifsc) => {
    const normalizedIFSC = ifsc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

    setFormData(prev => ({ ...prev, ifsc: normalizedIFSC }));

    // Validate IFSC format
    if (normalizedIFSC.length > 0) {
      const validation = validateIFSC(normalizedIFSC);
      if (!validation.isValid) {
        setValidationErrors(prev => ({ ...prev, ifsc: validation.error }));
        return;
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.ifsc;
          return newErrors;
        });
      }
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ifsc;
        return newErrors;
      });
    }

    // Auto-lookup when IFSC is complete (11 characters)
    if (normalizedIFSC.length === 11) {
      setIsIFSCLookupLoading(true);
      try {
        const result = await bankDetailsService.preValidateBankAccount(normalizedIFSC);
        if (result.success && result.bankName) {
          setFormData(prev => ({ ...prev, bankName: result.bankName }));
          toast.success(`Bank name auto-filled: ${result.bankName}`);
        }
      } catch (error) {
        console.error('IFSC lookup failed:', error);
        // Don't show error toast - allow manual entry
      } finally {
        setIsIFSCLookupLoading(false);
      }
    }
  };

  // Handle field changes with validation
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation
    let error = null;
    switch (field) {
      case 'accountNumber':
        error = validateAccountNumber(value);
        break;
      case 'accountHolderName':
        error = validateAccountHolderName(value);
        break;
      case 'bankName':
        error = validateBankName(value);
        break;
      default:
        break;
    }

    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Mask account number
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  // Add bank account mutation
  const addAccountMutation = useMutation({
    mutationFn: async (data) => {
      const response = await bankAccountService.addBankAccount(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bankAccounts']);
      setShowAddForm(false);
      setFormData({
        bankName: '',
        accountNumber: '',
        ifsc: '',
        accountHolderName: '',
        accountType: 'savings',
        isPrimary: false,
      });
      setValidationErrors({});
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 3000);
      toast.success('Bank account added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add bank account');
    },
  });

  // Update bank account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await bankAccountService.updateBankAccount(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bankAccounts']);
      setEditingAccount(null);
      setShowAddForm(false);
      setFormData({
        bankName: '',
        accountNumber: '',
        ifsc: '',
        accountHolderName: '',
        accountType: 'savings',
        isPrimary: false,
      });
      setValidationErrors({});
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 3000);
      toast.success('Bank account updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update bank account');
    },
  });

  // Delete bank account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id) => {
      const response = await bankAccountService.deleteBankAccount(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bankAccounts']);
      toast.success('Bank account deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete bank account');
    },
  });

  // Set primary account mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await bankAccountService.setPrimaryAccount(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bankAccounts']);
      toast.success('Primary account updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to set primary account');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    const ifscValidation = validateIFSC(formData.ifsc);
    if (!ifscValidation.isValid) {
      errors.ifsc = ifscValidation.error;
    }
    const accountNumberError = validateAccountNumber(formData.accountNumber);
    if (accountNumberError) {
      errors.accountNumber = accountNumberError;
    }
    const accountHolderError = validateAccountHolderName(formData.accountHolderName);
    if (accountHolderError) {
      errors.accountHolderName = accountHolderError;
    }
    const bankNameError = validateBankName(formData.bankName);
    if (bankNameError) {
      errors.bankName = bankNameError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Normalize IFSC before submitting
    const submitData = {
      ...formData,
      ifsc: validateIFSC(formData.ifsc).normalized,
    };

    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data: submitData });
    } else {
      addAccountMutation.mutate(submitData);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    const editData = {
      bankName: account.bankName,
      accountNumber: account.fullAccountNumber || account.accountNumber,
      ifsc: account.ifsc,
      accountHolderName: account.accountHolderName,
      accountType: account.accountType,
      isPrimary: account.isPrimary,
    };
    setFormData(editData);
    originalFormData.current = { ...editData };
    setValidationErrors({});
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountNumber: '',
      ifsc: '',
      accountHolderName: '',
      accountType: 'savings',
      isPrimary: false,
    });
    setValidationErrors({});
    originalFormData.current = null;
  };

  const handleReset = () => {
    if (editingAccount && originalFormData.current) {
      setFormData({ ...originalFormData.current });
      setValidationErrors({});
    } else {
      setFormData({
        bankName: '',
        accountNumber: '',
        ifsc: '',
        accountHolderName: '',
        accountType: 'savings',
        isPrimary: false,
      });
      setValidationErrors({});
    }
  };

  const handleDelete = (accountId) => {
    setShowDeleteConfirm(accountId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteAccountMutation.mutate(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleSetPrimary = (accountId) => {
    setShowPrimaryConfirm(accountId);
  };

  const confirmSetPrimary = () => {
    if (showPrimaryConfirm) {
      setPrimaryMutation.mutate(showPrimaryConfirm);
      setShowPrimaryConfirm(null);
    }
  };

  const toggleAccountNumberVisibility = (accountId) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  if (accountsLoading) {
    return (
      <div>
        <h2 className="text-heading-3 font-semibold text-black mb-6">Bank Accounts</h2>
        <div className="space-y-4">
          <FilingCardSkeleton />
          <FilingCardSkeleton />
        </div>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div>
        <h2 className="text-heading-3 font-semibold text-black mb-6">Bank Accounts</h2>
        <div className="p-6 bg-error-50 border border-error-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-error-800 font-medium mb-2">Failed to load bank accounts</p>
              <p className="text-error-700 text-body-regular mb-4">
                {accountsError.message || 'Unable to fetch your bank accounts. Please check your connection and try again.'}
              </p>
              <button
                onClick={() => queryClient.invalidateQueries(['bankAccounts'])}
                className="inline-flex items-center px-4 py-2 bg-error-600 text-white rounded-xl hover:bg-error-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-3 font-semibold text-black">Bank Accounts</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </button>
        )}
      </div>

      {showSuccessBanner && (
        <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <p className="text-success-800 font-medium">Bank account saved successfully!</p>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading-4 font-semibold text-black">
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </h3>
            {editingAccount && (
              <button
                type="button"
                onClick={handleReset}
                className="text-body-regular text-slate-600 hover:text-gray-800 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>

          <div className="mb-4 p-3 bg-info-50 border border-info-200 rounded-xl">
            <p className="text-body-regular text-info-800">
              <strong>Note:</strong> Bank account details are required for receiving tax refunds. Ensure all information is accurate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IFSC Code Field */}
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                IFSC Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ifsc}
                  onChange={(e) => handleIFSCChange(e.target.value)}
                  onBlur={() => {
                    if (formData.ifsc) {
                      const validation = validateIFSC(formData.ifsc);
                      if (!validation.isValid) {
                        setValidationErrors(prev => ({ ...prev, ifsc: validation.error }));
                      }
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-xl font-mono ${
                    validationErrors.ifsc
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : formData.ifsc && !validationErrors.ifsc && formData.ifsc.length === 11
                      ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
                      : 'border-slate-300 focus:ring-gold-500 focus:border-gold-500'
                  }`}
                  placeholder="HDFC0001234"
                  maxLength={11}
                />
                {isIFSCLookupLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
                {formData.ifsc && !isIFSCLookupLoading && formData.ifsc.length === 11 && !validationErrors.ifsc && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  </div>
                )}
              </div>
              {validationErrors.ifsc ? (
                <p className="mt-1 text-body-small text-error-600">{validationErrors.ifsc}</p>
              ) : (
                <p className="mt-1 text-body-small text-slate-500">Format: AAAA0XXXXXX (4 letters, 0, 6 alphanumeric)</p>
              )}
            </div>

            {/* Bank Name Field */}
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Bank Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  onBlur={() => {
                    const error = validateBankName(formData.bankName);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, bankName: error }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-xl ${
                    validationErrors.bankName
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : formData.bankName && !validationErrors.bankName
                      ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
                      : 'border-slate-300 focus:ring-gold-500 focus:border-gold-500'
                  }`}
                  placeholder="Enter bank name"
                />
                {formData.bankName && !validationErrors.bankName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  </div>
                )}
              </div>
              {validationErrors.bankName && (
                <p className="mt-1 text-body-small text-error-600">{validationErrors.bankName}</p>
              )}
            </div>

            {/* Account Number Field */}
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Account Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.accountNumber}
                  onChange={(e) => handleFieldChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => {
                    const error = validateAccountNumber(formData.accountNumber);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, accountNumber: error }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-xl ${
                    validationErrors.accountNumber
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : formData.accountNumber && !validationErrors.accountNumber
                      ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
                      : 'border-slate-300 focus:ring-gold-500 focus:border-gold-500'
                  }`}
                  placeholder="Enter account number"
                  minLength={9}
                  maxLength={18}
                />
                {formData.accountNumber && !validationErrors.accountNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  </div>
                )}
              </div>
              {validationErrors.accountNumber ? (
                <p className="mt-1 text-body-small text-error-600">{validationErrors.accountNumber}</p>
              ) : (
                <p className="mt-1 text-body-small text-slate-500">9-18 digits</p>
              )}
            </div>

            {/* Account Holder Name Field */}
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Account Holder Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => handleFieldChange('accountHolderName', e.target.value)}
                  onBlur={() => {
                    const error = validateAccountHolderName(formData.accountHolderName);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, accountHolderName: error }));
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-xl ${
                    validationErrors.accountHolderName
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : formData.accountHolderName && !validationErrors.accountHolderName
                      ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
                      : 'border-slate-300 focus:ring-gold-500 focus:border-gold-500'
                  }`}
                  placeholder="Enter account holder name"
                />
                {formData.accountHolderName && !validationErrors.accountHolderName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  </div>
                )}
              </div>
              {validationErrors.accountHolderName && (
                <p className="mt-1 text-body-small text-error-600">{validationErrors.accountHolderName}</p>
              )}
            </div>

            {/* Account Type Field */}
            <div>
              <label className="block text-body-regular font-medium text-slate-700 mb-1">
                Account Type *
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>

            {/* Primary Account Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="h-4 w-4 text-gold-500 focus:ring-gold-500"
              />
              <label htmlFor="isPrimary" className="ml-2 text-body-regular text-slate-700">
                Set as primary account
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addAccountMutation.isLoading || updateAccountMutation.isLoading || Object.keys(validationErrors).length > 0}
              className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addAccountMutation.isLoading || updateAccountMutation.isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {bankAccounts.length === 0 && !showAddForm ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">No bank accounts added yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Add your bank account details to receive tax refunds directly to your account. Your information is secure and encrypted.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Bank Account
            </button>
          </div>
        ) : (
          bankAccounts.map((account) => {
            const accountNumber = account.fullAccountNumber || account.accountNumber || '';
            const isVisible = showAccountNumbers[account.id];
            const displayNumber = isVisible ? accountNumber : maskAccountNumber(accountNumber);

            return (
              <div key={account.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-elevation-2 transition-shadow bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-heading-4 font-semibold text-slate-900">{account.bankName}</h3>
                      {account.isPrimary && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-body-small font-medium bg-success-100 text-success-800">
                          Primary
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-body-small font-medium bg-slate-100 text-slate-700 capitalize">
                        {account.accountType}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-body-regular font-medium text-slate-700">Account:</span>
                        <span className="text-body-regular text-slate-900 font-mono">{displayNumber}</span>
                        {accountNumber && (
                          <button
                            onClick={() => toggleAccountNumberVisibility(account.id)}
                            className="text-body-small text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            title={isVisible ? 'Hide account number' : 'Show account number'}
                          >
                            {isVisible ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                Show
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-body-regular font-medium text-slate-700">IFSC:</span>
                        <span className="text-body-regular text-slate-900 font-mono">{account.ifsc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-body-regular font-medium text-slate-700">Holder:</span>
                        <span className="text-body-regular text-slate-900">{account.accountHolderName}</span>
                      </div>
                      {account.updatedAt && (
                        <p className="text-body-small text-slate-500 mt-2">
                          Last updated: {new Date(account.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!account.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(account.id)}
                        disabled={setPrimaryMutation.isLoading}
                        className="p-2 text-success-600 hover:bg-success-50 rounded-xl transition-colors"
                        title="Set as primary"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteAccountMutation.isLoading}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">Delete Bank Account</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this bank account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-error-600 text-white rounded-xl hover:bg-error-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Primary Confirmation Dialog */}
      {showPrimaryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">Set Primary Account</h3>
            <p className="text-slate-600 mb-6">
              This account will be set as your primary account for tax refunds. Do you want to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPrimaryConfirm(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSetPrimary}
                className="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors"
              >
                Set Primary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Filings Tab Component
const FilingsTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch filings using React Query
  const { data: filingsData, isLoading, error, refetch } = useQuery({
    queryKey: ['userFilings'],
    queryFn: async () => {
      const response = await itrService.getUserITRs();
      return response.data || response;
    },
    refetchOnWindowFocus: false,
  });

  // Transform API data to match display format
  const allFilings = filingsData?.filings?.map(filing => ({
    id: filing.id,
    year: filing.assessmentYear,
    status: filing.status?.toLowerCase() || 'draft',
    refund: filing.refundAmount || 0,
    date: filing.filingDate || filing.createdAt,
    updatedAt: filing.updatedAt || filing.createdAt,
    itrType: filing.itrType,
    acknowledgementNumber: filing.acknowledgementNumber,
    filing: filing, // Keep full filing object for FilingStatusBadge
  })) || [];

  // Filter filings
  const filteredFilings = allFilings.filter(filing => {
    // Status filter
    if (statusFilter !== 'all' && filing.status !== statusFilter) {
      return false;
    }

    // Year filter
    if (yearFilter !== 'all' && filing.year !== yearFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        filing.itrType?.toLowerCase().includes(searchLower) ||
        filing.year?.toString().includes(searchTerm) ||
        filing.acknowledgementNumber?.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  // Sort filings
  const sortedFilings = [...filteredFilings].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'year-desc':
        return (b.year || '').localeCompare(a.year || '');
      case 'year-asc':
        return (a.year || '').localeCompare(b.year || '');
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Get unique years for filter
  const availableYears = [...new Set(allFilings.map(f => f.year).filter(Boolean))].sort().reverse();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date with relative time
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status badge config for inline display
  const getStatusBadgeConfig = (status) => {
    const statusMap = {
      draft: {
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: FileText,
        label: 'Draft',
      },
      paused: {
        color: 'bg-warning-50 text-warning-600 border-warning-100',
        icon: Loader2,
        label: 'Paused',
      },
      submitted: {
        color: 'bg-info-50 text-info-600 border-info-100',
        icon: Clock,
        label: 'Submitted',
      },
      acknowledged: {
        color: 'bg-gold-50 text-gold-600 border-gold-100',
        icon: CheckCircle,
        label: 'Acknowledged',
      },
      processed: {
        color: 'bg-success-50 text-success-600 border-success-100',
        icon: CheckCircle,
        label: 'Processed',
      },
      rejected: {
        color: 'bg-error-50 text-error-600 border-error-100',
        icon: AlertCircle,
        label: 'Rejected',
      },
    };
    return statusMap[status?.toLowerCase()] || statusMap.draft;
  };

  // Handle filing click/navigation
  const handleFilingClick = (filing) => {
    const filingObj = filing.filing || filing;
    if (filing.status === 'draft' || filing.status === 'paused') {
      // Navigate to computation page to continue editing
      navigate(`/itr/computation?filingId=${filing.id}`, {
        state: { filing: filingObj },
      });
    } else {
      // Navigate to filing history/details
      navigate('/filing-history', {
        state: { filingId: filing.id, filing: filingObj },
      });
    }
  };

  // Handle download acknowledgment
  const handleDownloadAcknowledgment = async (e, filing) => {
    e.stopPropagation();
    try {
      // TODO: Implement download acknowledgment functionality
      toast.success('Downloading acknowledgment...');
    } catch (error) {
      toast.error('Failed to download acknowledgment');
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-heading-3 font-semibold text-black mb-6">My Filings</h2>
        <div className="space-y-4">
          <FilingCardSkeleton />
          <FilingCardSkeleton />
          <FilingCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-heading-3 font-semibold text-black mb-6">My Filings</h2>
        <div className="p-6 bg-error-50 border border-error-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-error-800 font-medium mb-2">Failed to load filings</p>
              <p className="text-error-700 text-body-regular mb-4">
                {error.message || 'Unable to fetch your filings. Please check your connection and try again.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 bg-error-600 text-white rounded-xl hover:bg-error-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-heading-3 font-semibold text-black">My Filings</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/itr/select-person')}
            className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors text-body-regular font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Filing
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      {allFilings.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ITR type, year, or acknowledgment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-body-regular font-medium text-slate-700">Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="processed">Processed</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Year Filter */}
            {availableYears.length > 0 && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-body-regular"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Active Filters Count */}
          {(statusFilter !== 'all' || yearFilter !== 'all' || searchTerm) && (
            <div className="flex items-center gap-2 text-body-regular text-slate-600">
              <span>Showing {sortedFilings.length} of {allFilings.length} filings</span>
              {(statusFilter !== 'all' || yearFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setYearFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-gold-600 hover:text-gold-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filings List */}
      {sortedFilings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">
            {allFilings.length === 0 ? 'No filings yet' : 'No filings match your filters'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {allFilings.length === 0
              ? 'Start filing your income tax returns to see them here. Your filing history will appear once you create your first return.'
              : 'Try adjusting your filters or search terms to find what you\'re looking for.'}
          </p>
          {allFilings.length === 0 ? (
            <button
              onClick={() => navigate('/itr/select-person')}
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start Your First Filing
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusFilter('all');
                setYearFilter('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFilings.map((filing) => (
            <div
              key={filing.id}
              className="border border-slate-200 rounded-xl p-5 hover:shadow-elevation-3 transition-all cursor-pointer bg-white"
              onClick={() => handleFilingClick(filing)}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">
                        {filing.itrType || 'ITR'} - Assessment Year {filing.year}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        {(() => {
                          const statusConfig = getStatusBadgeConfig(filing.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium ${statusConfig.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{statusConfig.label}</span>
                            </div>
                          );
                        })()}
                        <span className="text-body-regular text-slate-500">
                          Filed {formatDate(filing.date)}
                        </span>
                      </div>
                    </div>
                    {filing.refund > 0 && (
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-success-600" />
                          <div>
                            <p className="text-body-small text-success-700 font-medium">Refund</p>
                            <p className="text-body-large font-bold text-success-800">
                              {formatCurrency(filing.refund)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {filing.acknowledgementNumber && (
                      <div className="flex items-center gap-2 text-body-regular">
                        <span className="text-slate-600 font-medium">Acknowledgment:</span>
                        <span className="text-slate-900 font-mono">{filing.acknowledgementNumber}</span>
                      </div>
                    )}
                    {filing.updatedAt && filing.updatedAt !== filing.date && (
                      <p className="text-body-small text-slate-500">
                        Last updated: {formatDate(filing.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {filing.status === 'draft' || filing.status === 'paused' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilingClick(filing);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors text-body-regular font-medium"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilingClick(filing);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-body-regular"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {filing.acknowledgementNumber && (
                        <button
                          onClick={(e) => handleDownloadAcknowledgment(e, filing)}
                          className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-body-regular"
                          title="Download Acknowledgment"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
