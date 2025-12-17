// Justification: Personal Information Form Component - Comprehensive personal data collection
// Provides form interface for collecting all personal information required for ITR filing
// Essential for ITR filing as personal details are required for all ITR types
// Supports gender, Aadhaar, residential status, and other personal information

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getAriaLabel, getAriaDescribedBy } from '../../utils/accessibility';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  Users,
  Globe,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { personalInfoService } from '../../services/personalInfoService';

// Comprehensive validation schema for personal information
const personalInfoSchema = yup.object({
  // Basic Information
  gender: yup.string()
    .required('Gender is required')
    .oneOf(['MALE', 'FEMALE', 'OTHER'], 'Invalid gender selection'),

  aadhaar: yup.string()
    .matches(/^\d{12}$/, 'Aadhaar number must be 12 digits')
    .nullable(),

  filing_for: yup.string()
    .required('Filing for is required')
    .oneOf(['SELF', 'SPOUSE', 'MINOR', 'HUF'], 'Invalid filing for selection'),

  residential_status: yup.string()
    .required('Residential status is required')
    .oneOf(['RESIDENT', 'NON_RESIDENT', 'RESIDENT_NOT_ORDINARILY_RESIDENT'], 'Invalid residential status'),

  country_of_residence: yup.string()
    .when('residential_status', {
      is: 'NON_RESIDENT',
      then: yup.string().required('Country of residence is required for non-residents'),
      otherwise: yup.string().nullable(),
    }),

  // Family Information
  father_name: yup.string()
    .required('Father\'s name is required')
    .min(2, 'Father\'s name must be at least 2 characters'),

  mother_name: yup.string()
    .nullable(),

  spouse_name: yup.string()
    .when('filing_for', {
      is: 'SPOUSE',
      then: yup.string().required('Spouse name is required for spouse filing'),
      otherwise: yup.string().nullable(),
    }),

  spouse_pan: yup.string()
    .when('filing_for', {
      is: 'SPOUSE',
      then: yup.string()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format')
        .nullable(),
      otherwise: yup.string().nullable(),
    }),

  spouse_aadhaar: yup.string()
    .when('filing_for', {
      is: 'SPOUSE',
      then: yup.string()
        .matches(/^\d{12}$/, 'Aadhaar number must be 12 digits')
        .nullable(),
      otherwise: yup.string().nullable(),
    }),

  // Address Information
  address: yup.object({
    line1: yup.string().required('Address line 1 is required'),
    line2: yup.string().nullable(),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    pin_code: yup.string()
      .required('PIN code is required')
      .matches(/^\d{6}$/, 'PIN code must be 6 digits'),
    country: yup.string().default('India'),
  }),
});

const PersonalInfoForm = ({ intakeId, defaultValues, onSave, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState(null);

  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
    resolver: yupResolver(personalInfoSchema),
    defaultValues: {
      gender: defaultValues?.gender || '',
      aadhaar: defaultValues?.aadhaar || '',
      filing_for: defaultValues?.filing_for || 'SELF',
      residential_status: defaultValues?.residential_status || 'RESIDENT',
      country_of_residence: defaultValues?.country_of_residence || '',
      father_name: defaultValues?.father_name || '',
      mother_name: defaultValues?.mother_name || '',
      spouse_name: defaultValues?.spouse_name || '',
      spouse_pan: defaultValues?.spouse_pan || '',
      spouse_aadhaar: defaultValues?.spouse_aadhaar || '',
      address: {
        line1: defaultValues?.address?.line1 || '',
        line2: defaultValues?.address?.line2 || '',
        city: defaultValues?.address?.city || '',
        state: defaultValues?.address?.state || '',
        pin_code: defaultValues?.address?.pin_code || '',
        country: defaultValues?.address?.country || 'India',
      },
    },
  });

  const filingFor = watch('filing_for');
  const residentialStatus = watch('residential_status');

  // Load existing data on mount
  useEffect(() => {
    if (intakeId && !defaultValues) {
      loadPersonalInfo();
    }
  }, [intakeId]);

  const loadPersonalInfo = async () => {
    try {
      setLoading(true);
      const response = await personalInfoService.getPersonalInfo(intakeId);
      if (response.success) {
        reset(response.data);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to load personal info', { error });
    } finally {
      setLoading(false);
    }
  };

  const validatePersonalInfo = async () => {
    try {
      const response = await personalInfoService.validatePersonalInfo(intakeId);
      if (response.success) {
        setValidation(response.data.validation);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to validate personal info', { error });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await personalInfoService.updatePersonalInfo(intakeId, data);

      if (response.success) {
        toast.success('Personal information saved successfully!');
        await validatePersonalInfo();
        if (onSave) onSave(response.data);
      } else {
        toast.error(response.error || 'Failed to save personal information');
      }
    } catch (error) {
      toast.error('Failed to save personal information');
      enterpriseLogger.error('Save error', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (onNext) onNext();
  };

  if (loading && !defaultValues) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-elevation-3 p-8">
        <div className="flex items-center mb-6">
          <User className="h-8 w-8 text-primary-600 mr-3" />
          <h2 className="text-heading-2 font-bold text-slate-900">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-blue-50 p-6 rounded-xl">
            <h3 className="text-heading-4 font-semibold text-blue-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  {...register('gender')}
                  aria-label={getAriaLabel('Gender', true, errors.gender?.message)}
                  aria-describedby={getAriaDescribedBy('gender', null, errors.gender?.message)}
                  aria-invalid={!!errors.gender}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && (
                  <p id="gender-error" role="alert" className="mt-1 text-body-regular text-error-600 flex items-center" aria-live="polite">
                    <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Aadhaar */}
              <div>
                <label htmlFor="aadhaar" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  id="aadhaar"
                  {...register('aadhaar')}
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                  aria-label={getAriaLabel('Aadhaar Number', false, errors.aadhaar?.message)}
                  aria-describedby={getAriaDescribedBy('aadhaar', null, errors.aadhaar?.message)}
                  aria-invalid={!!errors.aadhaar}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.aadhaar && (
                  <p id="aadhaar-error" role="alert" className="mt-1 text-body-regular text-error-600 flex items-center" aria-live="polite">
                    <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    {errors.aadhaar.message}
                  </p>
                )}
              </div>

              {/* Filing For */}
              <div>
                <label htmlFor="filing_for" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Filing For *
                </label>
                <select
                  id="filing_for"
                  {...register('filing_for')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="SELF">Self</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="MINOR">Minor</option>
                  <option value="HUF">HUF</option>
                </select>
                {errors.filing_for && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.filing_for.message}
                  </p>
                )}
              </div>

              {/* Residential Status */}
              <div>
                <label htmlFor="residential_status" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Residential Status *
                </label>
                <select
                  id="residential_status"
                  {...register('residential_status')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="RESIDENT">Resident</option>
                  <option value="NON_RESIDENT">Non-Resident</option>
                  <option value="RESIDENT_NOT_ORDINARILY_RESIDENT">Resident but Not Ordinarily Resident</option>
                </select>
                {errors.residential_status && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.residential_status.message}
                  </p>
                )}
              </div>

              {/* Country of Residence (conditional) */}
              {residentialStatus === 'NON_RESIDENT' && (
                <div className="md:col-span-2">
                  <label htmlFor="country_of_residence" className="block text-body-regular font-medium text-slate-700 mb-2">
                    Country of Residence *
                  </label>
                  <input
                    type="text"
                    id="country_of_residence"
                    {...register('country_of_residence')}
                    placeholder="Enter country name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.country_of_residence && (
                    <p className="mt-1 text-body-regular text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.country_of_residence.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Family Information Section */}
          <div className="bg-green-50 p-6 rounded-xl">
            <h3 className="text-heading-4 font-semibold text-green-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Family Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father's Name */}
              <div>
                <label htmlFor="father_name" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Father's Name *
                </label>
                <input
                  type="text"
                  id="father_name"
                  {...register('father_name')}
                  placeholder="Enter father's full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.father_name && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.father_name.message}
                  </p>
                )}
              </div>

              {/* Mother's Name */}
              <div>
                <label htmlFor="mother_name" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Mother's Name
                </label>
                <input
                  type="text"
                  id="mother_name"
                  {...register('mother_name')}
                  placeholder="Enter mother's full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.mother_name && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.mother_name.message}
                  </p>
                )}
              </div>

              {/* Spouse Information (conditional) */}
              {filingFor === 'SPOUSE' && (
                <>
                  <div>
                    <label htmlFor="spouse_name" className="block text-body-regular font-medium text-slate-700 mb-2">
                      Spouse Name *
                    </label>
                    <input
                      type="text"
                      id="spouse_name"
                      {...register('spouse_name')}
                      placeholder="Enter spouse's full name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.spouse_name && (
                      <p className="mt-1 text-body-regular text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.spouse_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="spouse_pan" className="block text-body-regular font-medium text-slate-700 mb-2">
                      Spouse PAN
                    </label>
                    <input
                      type="text"
                      id="spouse_pan"
                      {...register('spouse_pan')}
                      placeholder="ABCDE1234F"
                      maxLength="10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.spouse_pan && (
                      <p className="mt-1 text-body-regular text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.spouse_pan.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="spouse_aadhaar" className="block text-body-regular font-medium text-slate-700 mb-2">
                      Spouse Aadhaar
                    </label>
                    <input
                      type="text"
                      id="spouse_aadhaar"
                      {...register('spouse_aadhaar')}
                      placeholder="12-digit Aadhaar number"
                      maxLength="12"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.spouse_aadhaar && (
                      <p className="mt-1 text-body-regular text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.spouse_aadhaar.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-purple-50 p-6 rounded-xl">
            <h3 className="text-heading-4 font-semibold text-purple-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address Information
            </h3>

            <div className="space-y-4">
              {/* Address Line 1 */}
              <div>
                <label htmlFor="address.line1" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  id="address.line1"
                  {...register('address.line1')}
                  placeholder="House/Flat No., Building Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.address?.line1 && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address.line1.message}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label htmlFor="address.line2" className="block text-body-regular font-medium text-slate-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="address.line2"
                  {...register('address.line2')}
                  placeholder="Street, Area, Locality"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.address?.line2 && (
                  <p className="mt-1 text-body-regular text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address.line2.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div>
                  <label htmlFor="address.city" className="block text-body-regular font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    {...register('address.city')}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-body-regular text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.address.city.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="address.state" className="block text-body-regular font-medium text-slate-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    {...register('address.state')}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-body-regular text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.address.state.message}
                    </p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label htmlFor="address.pin_code" className="block text-body-regular font-medium text-slate-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="address.pin_code"
                    {...register('address.pin_code')}
                    placeholder="123456"
                    maxLength="6"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl shadow-elevation-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.address?.pin_code && (
                    <p className="mt-1 text-body-regular text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.address.pin_code.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          {validation && (
            <div className="bg-slate-50 p-4 rounded-xl">
              <h4 className="text-md font-medium text-slate-900 mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Validation Summary
              </h4>
              <div className="space-y-2">
                {validation.isComplete ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>All required information is complete</span>
                  </div>
                ) : (
                  <div className="flex items-center text-error-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Missing required fields: {validation.missingFields.join(', ')}</span>
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="text-yellow-600">
                    <p className="font-medium">Warnings:</p>
                    <ul className="list-disc list-inside ml-4">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={validatePersonalInfo}
              className="px-4 py-2 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Validate
            </button>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Information'}
              </button>

              {onNext && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
