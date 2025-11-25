// Justification: Verification Form - Comprehensive verification method and details collection
// Collects verification method selection and related details for ITR filing
// Supports Aadhaar OTP, Digital Signature Certificate, and Net Banking verification
// Essential for ITR submission and government compliance

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Shield,
  Smartphone,
  CreditCard,
  Globe,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

// Comprehensive validation schema for verification details
const verificationSchema = yup.object({
  // Verification Method
  verification_method: yup.string()
    .required('Verification method is required')
    .oneOf(['AADHAAR_OTP', 'DSC', 'NETBANKING'], 'Please select a valid verification method'),

  // Aadhaar OTP Verification
  aadhaar_otp: yup.string().when('verification_method', {
    is: 'AADHAAR_OTP',
    then: yup.string().required('Aadhaar OTP is required').length(6, 'OTP must be 6 digits'),
    otherwise: yup.string().nullable(),
  }),

  // Digital Signature Certificate
  dsc_details: yup.object().when('verification_method', {
    is: 'DSC',
    then: yup.object({
      certificate_name: yup.string().required('Certificate name is required'),
      certificate_issuer: yup.string().required('Certificate issuer is required'),
      certificate_valid_from: yup.date().required('Certificate valid from date is required'),
      certificate_valid_to: yup.date().required('Certificate valid to date is required'),
      certificate_serial_number: yup.string().required('Certificate serial number is required'),
    }),
    otherwise: yup.object().nullable(),
  }),

  // Net Banking Verification
  netbanking_details: yup.object().when('verification_method', {
    is: 'NETBANKING',
    then: yup.object({
      bank_name: yup.string().required('Bank name is required'),
      user_id: yup.string().required('Net banking user ID is required'),
      password: yup.string().required('Net banking password is required'),
    }),
    otherwise: yup.object().nullable(),
  }),

  // Verification Status
  verification_status: yup.string()
    .oneOf(['pending', 'verified', 'failed'], 'Invalid verification status')
    .default('pending'),

  // Verification Date
  verification_date: yup.date().when('verification_status', {
    is: 'verified',
    then: yup.date().required('Verification date is required'),
    otherwise: yup.date().nullable(),
  }),

  // Additional Verification Info
  verification_notes: yup.string(),
  is_consent_given: yup.boolean()
    .oneOf([true], 'You must give consent for verification')
    .required('Consent is required'),
});

const VerificationForm = ({ onSubmit, initialData = {}, isReadOnly = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(verificationSchema),
    defaultValues: {
      verification_method: 'AADHAAR_OTP',
      verification_status: 'pending',
      is_consent_given: false,
      ...initialData,
    },
    mode: 'onChange',
  });

  const verificationMethod = watch('verification_method');
  const verificationStatus = watch('verification_status');

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting verification details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendAadhaarOTP = async () => {
    setIsVerifying(true);
    try {
      // In a real implementation, this would call the Aadhaar OTP API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOtpSent(true);
    } catch (error) {
      console.error('Error sending Aadhaar OTP:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyOTP = async (otp) => {
    setIsVerifying(true);
    try {
      // In a real implementation, this would verify the OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      setValue('verification_status', 'verified');
      setValue('verification_date', new Date());
      await trigger();
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationMethodIcon = (method) => {
    switch (method) {
      case 'AADHAAR_OTP':
        return <Smartphone className="h-5 w-5" />;
      case 'DSC':
        return <CreditCard className="h-5 w-5" />;
      case 'NETBANKING':
        return <Globe className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getVerificationMethodDescription = (method) => {
    switch (method) {
      case 'AADHAAR_OTP':
        return 'Verify using Aadhaar OTP sent to your registered mobile number';
      case 'DSC':
        return 'Verify using your Digital Signature Certificate';
      case 'NETBANKING':
        return 'Verify using your net banking credentials';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Verification Details</h2>
            <p className="text-sm text-gray-600">
              Select and complete verification method for ITR submission
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
        <div className="space-y-8">

          {/* Verification Method Selection */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-primary-600 mr-2" />
              Verification Method
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="relative">
                <input
                  type="radio"
                  id="aadhaar_otp"
                  value="AADHAAR_OTP"
                  {...register('verification_method')}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <label
                  htmlFor="aadhaar_otp"
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    verificationMethod === 'AADHAAR_OTP'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-6 w-6 text-primary-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Aadhaar OTP</h4>
                      <p className="text-sm text-gray-600">Quick and secure</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="dsc"
                  value="DSC"
                  {...register('verification_method')}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <label
                  htmlFor="dsc"
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    verificationMethod === 'DSC'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Digital Signature</h4>
                      <p className="text-sm text-gray-600">DSC certificate</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="netbanking"
                  value="NETBANKING"
                  {...register('verification_method')}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <label
                  htmlFor="netbanking"
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    verificationMethod === 'NETBANKING'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <Globe className="h-6 w-6 text-primary-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Net Banking</h4>
                      <p className="text-sm text-gray-600">Bank credentials</p>
                    </div>
                  </div>
                </label>
              </div>

            </div>
            {errors.verification_method && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.verification_method.message}
              </p>
            )}
          </div>

          {/* Verification Method Details */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              {getVerificationMethodIcon(verificationMethod)}
              <span className="ml-2">
                {verificationMethod === 'AADHAAR_OTP' && 'Aadhaar OTP Verification'}
                {verificationMethod === 'DSC' && 'Digital Signature Certificate'}
                {verificationMethod === 'NETBANKING' && 'Net Banking Verification'}
              </span>
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                {getVerificationMethodDescription(verificationMethod)}
              </p>
            </div>

            {/* Aadhaar OTP Verification */}
            {verificationMethod === 'AADHAAR_OTP' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="aadhaar_otp" className="block text-sm font-medium text-gray-700">
                    Aadhaar OTP *
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="aadhaar_otp"
                      {...register('aadhaar_otp')}
                      disabled={isReadOnly || !otpSent}
                      className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={sendAadhaarOTP}
                        disabled={isVerifying || otpSent}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                        ) : otpSent ? (
                          'OTP Sent'
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    )}
                  </div>
                  {errors.aadhaar_otp && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.aadhaar_otp.message}
                    </p>
                  )}
                  {otpSent && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      OTP sent to your registered mobile number
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Digital Signature Certificate */}
            {verificationMethod === 'DSC' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dsc_details.certificate_name" className="block text-sm font-medium text-gray-700">
                      Certificate Name *
                    </label>
                    <input
                      type="text"
                      id="dsc_details.certificate_name"
                      {...register('dsc_details.certificate_name')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter certificate name"
                    />
                    {errors.dsc_details?.certificate_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dsc_details.certificate_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dsc_details.certificate_issuer" className="block text-sm font-medium text-gray-700">
                      Certificate Issuer *
                    </label>
                    <input
                      type="text"
                      id="dsc_details.certificate_issuer"
                      {...register('dsc_details.certificate_issuer')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter certificate issuer"
                    />
                    {errors.dsc_details?.certificate_issuer && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dsc_details.certificate_issuer.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dsc_details.certificate_valid_from" className="block text-sm font-medium text-gray-700">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      id="dsc_details.certificate_valid_from"
                      {...register('dsc_details.certificate_valid_from')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                    />
                    {errors.dsc_details?.certificate_valid_from && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dsc_details.certificate_valid_from.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dsc_details.certificate_valid_to" className="block text-sm font-medium text-gray-700">
                      Valid To *
                    </label>
                    <input
                      type="date"
                      id="dsc_details.certificate_valid_to"
                      {...register('dsc_details.certificate_valid_to')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                    />
                    {errors.dsc_details?.certificate_valid_to && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dsc_details.certificate_valid_to.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="dsc_details.certificate_serial_number" className="block text-sm font-medium text-gray-700">
                      Certificate Serial Number *
                    </label>
                    <input
                      type="text"
                      id="dsc_details.certificate_serial_number"
                      {...register('dsc_details.certificate_serial_number')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter certificate serial number"
                    />
                    {errors.dsc_details?.certificate_serial_number && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dsc_details.certificate_serial_number.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Net Banking Verification */}
            {verificationMethod === 'NETBANKING' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="netbanking_details.bank_name" className="block text-sm font-medium text-gray-700">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      id="netbanking_details.bank_name"
                      {...register('netbanking_details.bank_name')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter bank name"
                    />
                    {errors.netbanking_details?.bank_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.netbanking_details.bank_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="netbanking_details.user_id" className="block text-sm font-medium text-gray-700">
                      Net Banking User ID *
                    </label>
                    <input
                      type="text"
                      id="netbanking_details.user_id"
                      {...register('netbanking_details.user_id')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="Enter net banking user ID"
                    />
                    {errors.netbanking_details?.user_id && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.netbanking_details.user_id.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="netbanking_details.password" className="block text-sm font-medium text-gray-700">
                      Net Banking Password *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="netbanking_details.password"
                        {...register('netbanking_details.password')}
                        disabled={isReadOnly}
                        className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                        placeholder="Enter net banking password"
                      />
                      {!isReadOnly && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.netbanking_details?.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.netbanking_details.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary-600 mr-2" />
              Verification Status
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="verification_status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="verification_status"
                  {...register('verification_status')}
                  disabled={isReadOnly}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                </select>
                {errors.verification_status && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.verification_status.message}
                  </p>
                )}
              </div>

              {verificationStatus === 'verified' && (
                <div>
                  <label htmlFor="verification_date" className="block text-sm font-medium text-gray-700">
                    Verification Date *
                  </label>
                  <input
                    type="date"
                    id="verification_date"
                    {...register('verification_date')}
                    disabled={isReadOnly}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                  />
                  {errors.verification_date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.verification_date.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Verification Notes */}
          <div>
            <label htmlFor="verification_notes" className="block text-sm font-medium text-gray-700">
              Verification Notes
            </label>
            <textarea
              id="verification_notes"
              {...register('verification_notes')}
              disabled={isReadOnly}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
              placeholder="Add any additional notes about verification"
            />
          </div>

          {/* Consent */}
          <div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_consent_given"
                  type="checkbox"
                  {...register('is_consent_given')}
                  disabled={isReadOnly}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_consent_given" className="font-medium text-gray-700">
                  Consent for Verification *
                </label>
                <p className="text-gray-600">
                  I hereby give my consent for verification of my ITR using the selected method.
                  I understand that this verification is required for ITR submission and compliance.
                </p>
                {errors.is_consent_given && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.is_consent_given.message}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Form Actions */}
        {!isReadOnly && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Save Verification Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Information Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Important:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Verification is mandatory for ITR submission to the Income Tax Department</li>
                <li>Aadhaar OTP is the quickest and most convenient method</li>
                <li>Digital Signature Certificate provides the highest level of security</li>
                <li>Net Banking verification requires your bank's net banking credentials</li>
                <li>All verification methods are secure and comply with government standards</li>
              </ul>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default VerificationForm;
