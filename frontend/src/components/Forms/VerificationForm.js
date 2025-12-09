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
  verificationMethod: yup.string()
    .required('Verification method is required')
    .oneOf(['AADHAAR_OTP', 'DSC', 'NETBANKING'], 'Please select a valid verification method'),

  // Aadhaar OTP Verification
  aadhaarOtp: yup.string().when('verificationMethod', {
    is: 'AADHAAR_OTP',
    then: yup.string().required('Aadhaar OTP is required').length(6, 'OTP must be 6 digits'),
    otherwise: yup.string().nullable(),
  }),

  // Digital Signature Certificate
  dscDetails: yup.object().when('verificationMethod', {
    is: 'DSC',
    then: yup.object({
      certificateName: yup.string().required('Certificate name is required'),
      certificateIssuer: yup.string().required('Certificate issuer is required'),
      certificateValidFrom: yup.date().required('Certificate valid from date is required'),
      certificateValidTo: yup.date().required('Certificate valid to date is required'),
      certificateSerialNumber: yup.string().required('Certificate serial number is required'),
    }),
    otherwise: yup.object().nullable(),
  }),

  // Net Banking Verification
  netbankingDetails: yup.object().when('verificationMethod', {
    is: 'NETBANKING',
    then: yup.object({
      bankName: yup.string().required('Bank name is required'),
      userId: yup.string().required('Net banking user ID is required'),
      password: yup.string().required('Net banking password is required'),
    }),
    otherwise: yup.object().nullable(),
  }),

  // Verification Status
  verificationStatus: yup.string()
    .oneOf(['pending', 'verified', 'failed'], 'Invalid verification status')
    .default('pending'),

  // Verification Date
  verificationDate: yup.date().when('verificationStatus', {
    is: 'verified',
    then: yup.date().required('Verification date is required'),
    otherwise: yup.date().nullable(),
  }),

  // Additional Verification Info
  verificationNotes: yup.string(),
  isConsentGiven: yup.boolean()
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
      verificationMethod: 'AADHAAR_OTP',
      verificationStatus: 'pending',
      isConsentGiven: false,
      ...initialData,
    },
    mode: 'onChange',
  });

  const verificationMethod = watch('verificationMethod');
  const verificationStatus = watch('verificationStatus');

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
      setValue('verificationStatus', 'verified');
      setValue('verificationDate', new Date());
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
    <div className="bg-white shadow-card rounded-xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-gold-500 mr-3" aria-hidden="true" />
          <div>
            <h2 className="text-heading-lg font-medium text-gray-900">Verification Details</h2>
            <p className="text-body-md text-gray-600 mt-1">
              Select and complete verification method for ITR submission
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
        <div className="space-y-8">

          {/* Verification Method Selection */}
          <div>
            <h3 className="text-heading-sm font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-gold-500 mr-2" aria-hidden="true" />
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
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    verificationMethod === 'AADHAAR_OTP'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-6 w-6 text-gold-500 mr-3" aria-hidden="true" />
                    <div className="flex-1">
                      <h4 className="text-body-md font-medium text-gray-900">Aadhaar OTP</h4>
                      <p className="text-body-sm text-gray-600">Quick and secure</p>
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
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    verificationMethod === 'DSC'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 text-gold-500 mr-3" aria-hidden="true" />
                    <div className="flex-1">
                      <h4 className="text-body-md font-medium text-gray-900">Digital Signature</h4>
                      <p className="text-body-sm text-gray-600">DSC certificate</p>
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
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    verificationMethod === 'NETBANKING'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <Globe className="h-6 w-6 text-gold-500 mr-3" aria-hidden="true" />
                    <div className="flex-1">
                      <h4 className="text-body-md font-medium text-gray-900">Net Banking</h4>
                      <p className="text-body-sm text-gray-600">Bank credentials</p>
                    </div>
                  </div>
                </label>
              </div>

            </div>
            {errors.verificationMethod && (
              <p className="mt-2 text-body-md text-error-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                {errors.verificationMethod.message}
              </p>
            )}
          </div>

          {/* Verification Method Details */}
          <div>
            <h3 className="text-heading-sm font-medium text-gray-900 mb-4 flex items-center">
              {getVerificationMethodIcon(verificationMethod)}
              <span className="ml-2">
                {verificationMethod === 'AADHAAR_OTP' && 'Aadhaar OTP Verification'}
                {verificationMethod === 'DSC' && 'Digital Signature Certificate'}
                {verificationMethod === 'NETBANKING' && 'Net Banking Verification'}
              </span>
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-body-md text-gray-700">
                {getVerificationMethodDescription(verificationMethod)}
              </p>
            </div>

            {/* Aadhaar OTP Verification */}
            {verificationMethod === 'AADHAAR_OTP' && (
              <div className="space-y-4">
                  <div>
                  <label htmlFor="aadhaarOtp" className="block text-label-md font-medium text-gray-700 mb-1">
                    Aadhaar OTP *
                  </label>
                  <div className="mt-1 flex rounded-lg">
                    <input
                      type="text"
                      id="aadhaarOtp"
                      {...register('aadhaarOtp')}
                      disabled={isReadOnly || !otpSent}
                      className="flex-1 block w-full border border-gray-200 rounded-l-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      aria-label="Aadhaar OTP"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={sendAadhaarOTP}
                        disabled={isVerifying || otpSent}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-200 rounded-r-lg bg-gray-50 text-body-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold-500"
                        aria-label={otpSent ? 'OTP already sent' : 'Send OTP'}
                      >
                        {isVerifying ? (
                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gold-500 rounded-full" aria-hidden="true"></div>
                        ) : otpSent ? (
                          'OTP Sent'
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    )}
                  </div>
                  {errors.aadhaarOtp && (
                    <p className="mt-1 text-body-md text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                      {errors.aadhaarOtp.message}
                    </p>
                  )}
                  {otpSent && (
                    <p className="mt-1 text-body-md text-success-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
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
                    <label htmlFor="dscDetails.certificateName" className="block text-label-md font-medium text-gray-700 mb-1">
                      Certificate Name *
                    </label>
                    <input
                      type="text"
                      id="dscDetails.certificateName"
                      {...register('dscDetails.certificateName')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter certificate name"
                      aria-label="Certificate name"
                    />
                    {errors.dscDetails?.certificateName && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.dscDetails.certificateName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dscDetails.certificateIssuer" className="block text-label-md font-medium text-gray-700 mb-1">
                      Certificate Issuer *
                    </label>
                    <input
                      type="text"
                      id="dscDetails.certificateIssuer"
                      {...register('dscDetails.certificateIssuer')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter certificate issuer"
                      aria-label="Certificate issuer"
                    />
                    {errors.dscDetails?.certificateIssuer && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.dscDetails.certificateIssuer.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dscDetails.certificateValidFrom" className="block text-label-md font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      id="dscDetails.certificateValidFrom"
                      {...register('dscDetails.certificateValidFrom')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      aria-label="Certificate valid from date"
                    />
                    {errors.dscDetails?.certificateValidFrom && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.dscDetails.certificateValidFrom.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dscDetails.certificateValidTo" className="block text-label-md font-medium text-gray-700 mb-1">
                      Valid To *
                    </label>
                    <input
                      type="date"
                      id="dscDetails.certificateValidTo"
                      {...register('dscDetails.certificateValidTo')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      aria-label="Certificate valid to date"
                    />
                    {errors.dscDetails?.certificateValidTo && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.dscDetails.certificateValidTo.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="dscDetails.certificateSerialNumber" className="block text-label-md font-medium text-gray-700 mb-1">
                      Certificate Serial Number *
                    </label>
                    <input
                      type="text"
                      id="dscDetails.certificateSerialNumber"
                      {...register('dscDetails.certificateSerialNumber')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter certificate serial number"
                      aria-label="Certificate serial number"
                    />
                    {errors.dscDetails?.certificateSerialNumber && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.dscDetails.certificateSerialNumber.message}
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
                    <label htmlFor="netbankingDetails.bankName" className="block text-label-md font-medium text-gray-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      id="netbankingDetails.bankName"
                      {...register('netbankingDetails.bankName')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter bank name"
                      aria-label="Bank name"
                    />
                    {errors.netbankingDetails?.bankName && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.netbankingDetails.bankName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="netbankingDetails.userId" className="block text-label-md font-medium text-gray-700 mb-1">
                      Net Banking User ID *
                    </label>
                    <input
                      type="text"
                      id="netbankingDetails.userId"
                      {...register('netbankingDetails.userId')}
                      disabled={isReadOnly}
                      className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter net banking user ID"
                      aria-label="Net banking user ID"
                    />
                    {errors.netbankingDetails?.userId && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.netbankingDetails.userId.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="netbankingDetails.password" className="block text-label-md font-medium text-gray-700 mb-1">
                      Net Banking Password *
                    </label>
                    <div className="mt-1 relative rounded-lg">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="netbankingDetails.password"
                        {...register('netbankingDetails.password')}
                        disabled={isReadOnly}
                        className="block w-full pr-10 border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter net banking password"
                        aria-label="Net banking password"
                      />
                      {!isReadOnly && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.netbankingDetails?.password && (
                      <p className="mt-1 text-body-md text-error-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        {errors.netbankingDetails.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-heading-sm font-medium text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-success-500 mr-2" aria-hidden="true" />
              Verification Status
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="verification_status" className="block text-label-md font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="verificationStatus"
                  {...register('verificationStatus')}
                  disabled={isReadOnly}
                  className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                  aria-label="Verification status"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                </select>
                {errors.verificationStatus && (
                  <p className="mt-1 text-body-md text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    {errors.verificationStatus.message}
                  </p>
                )}
              </div>

              {verificationStatus === 'verified' && (
                <div>
                  <label htmlFor="verificationDate" className="block text-label-md font-medium text-gray-700 mb-1">
                    Verification Date *
                  </label>
                  <input
                    type="date"
                    id="verificationDate"
                    {...register('verificationDate')}
                    disabled={isReadOnly}
                    className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
                    aria-label="Verification date"
                  />
                  {errors.verificationDate && (
                    <p className="mt-1 text-body-md text-error-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                      {errors.verificationDate.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Verification Notes */}
          <div>
            <label htmlFor="verificationNotes" className="block text-label-md font-medium text-gray-700 mb-1">
              Verification Notes
            </label>
            <textarea
              id="verificationNotes"
              {...register('verificationNotes')}
              disabled={isReadOnly}
              rows={3}
              className="mt-1 block w-full border border-gray-200 rounded-lg text-body-md focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Add any additional notes about verification"
              aria-label="Verification notes"
            />
          </div>

          {/* Consent */}
          <div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isConsentGiven"
                  type="checkbox"
                  {...register('isConsentGiven')}
                  disabled={isReadOnly}
                  className="h-4 w-4 text-gold-500 focus:ring-2 focus:ring-gold-500 border-gray-200 rounded disabled:opacity-50"
                  aria-label="Consent for verification"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isConsentGiven" className="text-body-md font-medium text-gray-900">
                  Consent for Verification *
                </label>
                <p className="text-body-sm text-gray-600 mt-1">
                  I hereby give my consent for verification of my ITR using the selected method.
                  I understand that this verification is required for ITR submission and compliance.
                </p>
                {errors.isConsentGiven && (
                  <p className="mt-1 text-body-md text-error-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    {errors.isConsentGiven.message}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Form Actions */}
        {!isReadOnly && (
          <div className="mt-8 flex justify-end gap-2">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-label-md font-medium rounded-lg shadow-sm text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" aria-hidden="true">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                  Save Verification Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Information Note */}
        <div className="mt-6 bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-info-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-body-md text-info-900">
              <p className="font-medium mb-2">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-body-sm">
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
