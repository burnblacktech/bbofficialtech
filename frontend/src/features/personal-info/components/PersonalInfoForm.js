// =====================================================
// PERSONAL INFO FORM COMPONENT
// For all ITR forms - Personal information input
// Enhanced with validation, source indicators, and responsive layout
// =====================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Info, CheckCircle, AlertCircle } from 'lucide-react';
import SourceChip from '../../../components/UI/SourceChip/SourceChip';

// Indian states for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Residential status options
const RESIDENTIAL_STATUS_OPTIONS = [
  { value: 'RES', label: 'Resident' },
  { value: 'NRI', label: 'Non-Resident Indian (NRI)' },
  { value: 'RNOR', label: 'Resident but Not Ordinarily Resident (RNOR)' },
];

const PersonalInfoForm = ({ data, onUpdate, autoFilledFields = {}, sources = {}, readOnly = false }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const requiredFields = ['pan', 'name', 'email', 'dateOfBirth'];
    const optionalFields = ['phone', 'address', 'city', 'state', 'pincode', 'gender', 'fatherName'];
    const allFields = [...requiredFields, ...optionalFields];

    const filledCount = allFields.filter(field => data?.[field] && data[field].toString().trim()).length;
    return Math.round((filledCount / allFields.length) * 100);
  }, [data]);

  // Validation functions
  const validatePAN = useCallback((pan) => {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan) return 'PAN is required';
    if (!panPattern.test(pan)) return 'Invalid PAN format (e.g., ABCDE1234F)';
    return null;
  }, []);

  const validateEmail = useCallback((email) => {
    if (!email) return 'Email is required';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return 'Invalid email format';
    return null;
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return null;
    if (phone.length !== 10) return 'Phone must be 10 digits';
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Invalid Indian mobile number';
    return null;
  }, []);

  const validatePincode = useCallback((pincode) => {
    if (!pincode) return null;
    if (pincode.length !== 6) return 'Pincode must be 6 digits';
    if (!/^[1-9]\d{5}$/.test(pincode)) return 'Invalid pincode';
    return null;
  }, []);

  const validateName = useCallback((name) => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(name)) return 'Name contains invalid characters';
    return null;
  }, []);

  const validateAadhaar = useCallback((aadhaar) => {
    if (!aadhaar) return null;
    if (aadhaar.length !== 12) return 'Aadhaar must be 12 digits';
    if (!/^\d{12}$/.test(aadhaar)) return 'Aadhaar must contain only digits';
    return null;
  }, []);

  const validateDateOfBirth = useCallback((dob) => {
    if (!dob) return null;
    const date = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    if (age < 0 || age > 120) return 'Invalid date of birth';
    if (date > today) return 'Date of birth cannot be in the future';
    return null;
  }, []);

  // Field change handler with validation
  const handleChange = useCallback((field, value) => {
    let validatedValue = value;
    const newErrors = { ...errors };

    // Field-specific transformations and validation
    switch (field) {
      case 'pan': {
        validatedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        const panError = validatePAN(validatedValue);
        if (panError && touched.pan) newErrors.pan = panError;
        else delete newErrors.pan;
        break;
      }

      case 'email': {
        const emailError = validateEmail(value);
        if (emailError && touched.email) newErrors.email = emailError;
        else delete newErrors.email;
        break;
      }

      case 'phone': {
        validatedValue = value.replace(/\D/g, '').slice(0, 10);
        const phoneError = validatePhone(validatedValue);
        if (phoneError && touched.phone) newErrors.phone = phoneError;
        else delete newErrors.phone;
        break;
      }

      case 'pincode': {
        validatedValue = value.replace(/\D/g, '').slice(0, 6);
        const pincodeError = validatePincode(validatedValue);
        if (pincodeError && touched.pincode) newErrors.pincode = pincodeError;
        else delete newErrors.pincode;
        break;
      }

      case 'name':
      case 'fatherName': {
        validatedValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
        if (field === 'name') {
          const nameError = validateName(validatedValue);
          if (nameError && touched.name) newErrors.name = nameError;
          else delete newErrors.name;
        }
        break;
      }

      case 'aadhaar': {
        validatedValue = value.replace(/\D/g, '').slice(0, 12);
        const aadhaarError = validateAadhaar(validatedValue);
        if (aadhaarError && touched.aadhaar) newErrors.aadhaar = aadhaarError;
        else delete newErrors.aadhaar;
        break;
      }

      case 'dateOfBirth': {
        const dobError = validateDateOfBirth(value);
        if (dobError && touched.dateOfBirth) newErrors.dateOfBirth = dobError;
        else delete newErrors.dateOfBirth;
        break;
      }

      default:
        break;
    }

    setErrors(newErrors);
    onUpdate({ [field]: validatedValue || value });
  }, [errors, touched, onUpdate, validatePAN, validateEmail, validatePhone, validatePincode, validateName, validateAadhaar, validateDateOfBirth]);

  // Handle field blur for validation
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Trigger validation on blur
    const value = data?.[field] || '';
    const newErrors = { ...errors };

    switch (field) {
      case 'pan': {
        const panError = validatePAN(value);
        if (panError) newErrors.pan = panError;
        else delete newErrors.pan;
        break;
      }
      case 'email': {
        const emailError = validateEmail(value);
        if (emailError) newErrors.email = emailError;
        else delete newErrors.email;
        break;
      }
      case 'name': {
        const nameError = validateName(value);
        if (nameError) newErrors.name = nameError;
        else delete newErrors.name;
        break;
      }
      default:
        break;
    }

    setErrors(newErrors);
  }, [data, errors, validatePAN, validateEmail, validateName]);

  // Check if field was auto-filled
  const isAutoFilled = useCallback((field) => {
    return autoFilledFields?.personalInfo?.includes(field);
  }, [autoFilledFields]);

  // Get field source
  const getFieldSource = useCallback((field) => {
    if (isAutoFilled(field)) {
      return sources?.userProfile?.available ? 'auto-filled' : 'manual';
    }
    return null;
  }, [isAutoFilled, sources]);

  // Input field component with consistent styling
  const FormField = ({ field, label, type = 'text', required = false, placeholder, maxLength, icon: Icon, helpText, disabled = false, children }) => {
    // If form is readOnly, disable all fields
    const isDisabled = disabled || readOnly;
    const hasError = errors[field] && touched[field];
    const fieldSource = getFieldSource(field);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="flex items-center text-body-regular font-medium text-slate-700">
            {Icon && <Icon className="w-4 h-4 mr-1.5 text-slate-400" />}
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
          {fieldSource && <SourceChip source={fieldSource} size="sm" />}
        </div>
        {children || (
          <input
            type={type}
            value={data?.[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            maxLength={maxLength}
            disabled={isDisabled}
            placeholder={placeholder}
            className={`w-full px-3 py-2.5 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${hasError
              ? 'border-error-400 focus:ring-error-500 bg-error-50'
              : fieldSource
                ? 'border-info-300 focus:ring-info-500 bg-info-50/30'
                : 'border-slate-300 focus:ring-gold-500 hover:border-gray-400'
              } ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          />
        )}
        {hasError && (
          <p className="flex items-center text-body-regular text-error-600 mt-1">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            {errors[field]}
          </p>
        )}
        {helpText && !hasError && (
          <p className="text-body-small text-slate-500 mt-1">{helpText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-gradient-to-r from-gold-50 to-amber-50 rounded-xl p-4 border border-gold-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-regular font-medium text-slate-700">Profile Completion</span>
          <span className="text-body-regular font-semibold text-gold-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gold-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-gold-500 to-amber-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center">
          <User className="w-4 h-4 mr-2 text-gold-500" />
          Basic Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <FormField
                field="pan"
                label="PAN"
                required
                disabled={readOnly} // U3.6 Fix: Allow editing inline
                maxLength={10}
                placeholder="ABCDE1234F"
                icon={CreditCard}
                helpText="Permanent Account Number"
              />
            </div>
            {/* Inline Verify Button Placeholder (U3.6) */}
            {!readOnly && data?.pan && data?.pan.length === 10 && (
              <button
                className="mb-7 px-3 py-2.5 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700"
                onClick={() => alert("Verification triggered (Mock)")}
                type="button"
              >
                Verify
              </button>
            )}
          </div>

          <FormField
            field="name"
            label="Full Name"
            required
            placeholder="As per PAN card"
            icon={User}
            helpText="Name as per PAN card"
          />

          <FormField
            field="dateOfBirth"
            label="Date of Birth"
            type="date"
            icon={Calendar}
          />

          <div className="space-y-1">
            <label className="flex items-center text-body-regular font-medium text-slate-700">
              <User className="w-4 h-4 mr-1.5 text-slate-400" />
              Gender
            </label>
            <select
              value={data?.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 hover:border-gray-400 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <FormField
            field="fatherName"
            label="Father's Name"
            placeholder="Father's full name"
            icon={User}
          />

          <div className="space-y-1">
            <label className="flex items-center text-body-regular font-medium text-slate-700">
              <Info className="w-4 h-4 mr-1.5 text-slate-400" />
              Residential Status
            </label>
            <select
              value={data?.residentialStatus || 'RES'}
              onChange={(e) => handleChange('residentialStatus', e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 hover:border-gray-400 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              {RESIDENTIAL_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center">
          <Mail className="w-4 h-4 mr-2 text-gold-500" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            field="email"
            label="Email"
            type="email"
            required
            disabled={true} // Email is always read-only (from auth)
            placeholder="example@email.com"
            icon={Mail}
          />

          <FormField
            field="phone"
            label="Mobile Number"
            type="tel"
            maxLength={10}
            placeholder="9876543210"
            icon={Phone}
            helpText="10-digit Indian mobile number"
          />

          <FormField
            field="aadhaar"
            label="Aadhaar Number"
            maxLength={12}
            placeholder="XXXX XXXX XXXX"
            icon={CreditCard}
            helpText="12-digit Aadhaar number (optional)"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gold-500" />
          Address Details
        </h4>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            field="address"
            label="Address Line 1"
            placeholder="Flat/House No., Building Name, Street"
            icon={MapPin}
          />

          <FormField
            field="address2"
            label="Address Line 2"
            placeholder="Area, Locality"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            field="city"
            label="City"
            placeholder="City"
          />

          <div className="space-y-1">
            <label className="text-body-regular font-medium text-slate-700">State</label>
            <select
              value={data?.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 hover:border-gray-400 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <FormField
            field="pincode"
            label="Pincode"
            maxLength={6}
            placeholder="123456"
          />

          <FormField
            field="country"
            label="Country"
            disabled
            placeholder="India"
          >
            <input
              type="text"
              value="India"
              disabled
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-slate-100 cursor-not-allowed"
            />
          </FormField>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-error-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-error-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Please fix the following errors:</h4>
              <ul className="mt-2 text-body-regular text-error-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Legend */}
      {Object.keys(autoFilledFields).length > 0 && (
        <div className="bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-info-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-body-regular text-info-800">
              <p className="font-medium">Data Source Legend</p>
              <p className="mt-1">
                Fields highlighted in blue were auto-filled from your profile or verification data.
                You can edit these values if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoForm;

