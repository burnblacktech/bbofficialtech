// =====================================================
// E-VERIFY OPTIONS COMPONENT
// Component for selecting and completing E-verification methods
// Supports: Aadhaar OTP, Net Banking, Demat Account, Bank Account EVC, DSC
// =====================================================

import React, { useState } from 'react';
import {
  Shield,
  Smartphone,
  CreditCard,
  Globe,
  Building2,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Info,
} from 'lucide-react';
import { useEVerification } from '../hooks/use-e-verification';
import Button from '../../../components/DesignSystem/components/Button';
import toast from 'react-hot-toast';

const VERIFICATION_METHODS = [
  {
    id: 'AADHAAR_OTP',
    name: 'Aadhaar OTP',
    description: 'Verify using OTP sent to your registered mobile number',
    icon: Smartphone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'NETBANKING',
    name: 'Net Banking',
    description: 'Verify using your net banking credentials',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'DEMAT',
    name: 'Demat Account',
    description: 'Verify using your Demat account credentials',
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'BANK_EVC',
    name: 'Bank Account EVC',
    description: 'Verify using EVC sent to your registered bank account',
    icon: CreditCard,
    color: 'text-gold-600',
    bgColor: 'bg-gold-50',
    borderColor: 'border-gold-200',
  },
  {
    id: 'DSC',
    name: 'Digital Signature Certificate',
    description: 'Upload and verify using your DSC certificate',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
];

const EVerifyOptions = ({
  filingId,
  draftId,
  formData,
  onVerificationComplete,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [dematCredentials, setDematCredentials] = useState({
    dpId: '',
    clientId: '',
  });
  const [bankEvcDetails, setBankEvcDetails] = useState({
    accountNumber: '',
    ifsc: '',
  });
  const [dscFile, setDscFile] = useState(null);

  const {
    sendAadhaarOTP,
    verifyAadhaarOTP,
    verifyNetBanking,
    verifyDemat,
    sendBankEVC,
    verifyBankEVC,
    verifyDSC,
    isProcessing,
  } = useEVerification(draftId || filingId);

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setOtpSent(false);
    setOtpValue('');
  };

  const handleAadhaarOTP = async () => {
    try {
      if (!otpSent) {
        const aadhaar =
          formData?.personal_info?.aadhaar ||
          formData?.personalInfo?.aadhaar ||
          '';
        if (!aadhaar) {
          toast.error('Aadhaar number not found in filing data');
          return;
        }
        const result = await sendAadhaarOTP(aadhaar);
        if (result.success) {
          setOtpSent(true);
          toast.success('OTP sent successfully to your registered mobile number');
        }
      } else {
        if (!otpValue || otpValue.length !== 6) {
          toast.error('Please enter a valid 6-digit OTP');
          return;
        }
        const aadhaar =
          formData?.personal_info?.aadhaar ||
          formData?.personalInfo?.aadhaar ||
          '';
        const result = await verifyAadhaarOTP(aadhaar, otpValue);
        if (result.success) {
          handleVerificationSuccess('AADHAAR_OTP', result);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    }
  };

  const handleNetBanking = async () => {
    try {
      // In real implementation, this would open a bank login flow
      // For now, we'll use a simplified approach
      toast.info('Net banking verification will redirect to your bank');
      const result = await verifyNetBanking({
        bankName: formData?.bank_details?.[0]?.bankName || '',
      });
      if (result.success) {
        handleVerificationSuccess('NETBANKING', result);
      }
    } catch (error) {
      toast.error(error.message || 'Net banking verification failed');
    }
  };

  const handleDemat = async () => {
    try {
      if (!dematCredentials.dpId || !dematCredentials.clientId) {
        toast.error('Please enter Demat account details');
        return;
      }
      const result = await verifyDemat(dematCredentials);
      if (result.success) {
        handleVerificationSuccess('DEMAT', result);
      }
    } catch (error) {
      toast.error(error.message || 'Demat verification failed');
    }
  };

  const handleBankEVC = async () => {
    try {
      if (!otpSent) {
        if (!bankEvcDetails.accountNumber || !bankEvcDetails.ifsc) {
          toast.error('Please enter bank account details');
          return;
        }
        const result = await sendBankEVC(bankEvcDetails);
        if (result.success) {
          setOtpSent(true);
          toast.success('EVC sent successfully to your registered mobile/email');
        }
      } else {
        if (!otpValue || otpValue.length !== 6) {
          toast.error('Please enter a valid 6-digit EVC');
          return;
        }
        const result = await verifyBankEVC(bankEvcDetails, otpValue);
        if (result.success) {
          handleVerificationSuccess('BANK_EVC', result);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Bank EVC verification failed');
    }
  };

  const handleDSC = async () => {
    try {
      if (!dscFile) {
        toast.error('Please upload your DSC certificate');
        return;
      }
      const result = await verifyDSC(dscFile);
      if (result.success) {
        handleVerificationSuccess('DSC', result);
      }
    } catch (error) {
      toast.error(error.message || 'DSC verification failed');
    }
  };

  const handleVerificationSuccess = (method, result) => {
    toast.success('E-verification completed successfully');
    if (onVerificationComplete) {
      onVerificationComplete({
        method,
        verified: true,
        verificationToken: result.verificationToken,
        verifiedAt: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = async () => {
    switch (selectedMethod) {
      case 'AADHAAR_OTP':
        await handleAadhaarOTP();
        break;
      case 'NETBANKING':
        await handleNetBanking();
        break;
      case 'DEMAT':
        await handleDemat();
        break;
      case 'BANK_EVC':
        await handleBankEVC();
        break;
      case 'DSC':
        await handleDSC();
        break;
      default:
        toast.error('Please select a verification method');
    }
  };

  const renderMethodForm = () => {
    if (!selectedMethod) return null;

    const method = VERIFICATION_METHODS.find((m) => m.id === selectedMethod);

    switch (selectedMethod) {
      case 'AADHAAR_OTP':
        return (
          <div className="space-y-4">
            {otpSent ? (
              <>
                <div className="rounded-xl bg-info-50 border border-info-200 p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-body-md font-medium text-info-900">
                        OTP sent successfully
                      </p>
                      <p className="text-body-sm text-info-700 mt-1">
                        Please enter the 6-digit OTP sent to your registered mobile number
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-body-md font-medium text-slate-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="000000"
                  />
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue('');
                    }}
                    className="mt-2 text-body-sm text-gold-600 hover:text-gold-700"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-body-md text-blue-900">
                  Click "Verify" to send OTP to your registered mobile number linked with Aadhaar
                </p>
              </div>
            )}
          </div>
        );

      case 'NETBANKING':
        return (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-body-md text-green-900">
              You will be redirected to your bank's net banking portal for verification.
              Please ensure you have your net banking credentials ready.
            </p>
          </div>
        );

      case 'DEMAT':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-body-md font-medium text-slate-700 mb-2">
                DP ID
              </label>
              <input
                type="text"
                value={dematCredentials.dpId}
                onChange={(e) =>
                  setDematCredentials({ ...dematCredentials, dpId: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                placeholder="Enter DP ID"
              />
            </div>
            <div>
              <label className="block text-body-md font-medium text-slate-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={dematCredentials.clientId}
                onChange={(e) =>
                  setDematCredentials({ ...dematCredentials, clientId: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                placeholder="Enter Client ID"
              />
            </div>
          </div>
        );

      case 'BANK_EVC':
        return (
          <div className="space-y-4">
            {otpSent ? (
              <>
                <div className="rounded-xl bg-info-50 border border-info-200 p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-body-md font-medium text-info-900">
                        EVC sent successfully
                      </p>
                      <p className="text-body-sm text-info-700 mt-1">
                        Please enter the 6-digit EVC sent to your registered mobile/email
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-body-md font-medium text-slate-700 mb-2">
                    Enter EVC
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="000000"
                  />
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue('');
                    }}
                    className="mt-2 text-body-sm text-gold-600 hover:text-gold-700"
                  >
                    Resend EVC
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-body-md font-medium text-slate-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankEvcDetails.accountNumber}
                    onChange={(e) =>
                      setBankEvcDetails({ ...bankEvcDetails, accountNumber: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-body-md font-medium text-slate-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankEvcDetails.ifsc}
                    onChange={(e) =>
                      setBankEvcDetails({ ...bankEvcDetails, ifsc: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Enter IFSC code"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'DSC':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-body-md font-medium text-slate-700 mb-2">
                Upload Digital Signature Certificate
              </label>
              <input
                type="file"
                accept=".p12,.pfx"
                onChange={(e) => setDscFile(e.target.files[0])}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
              <p className="mt-2 text-body-sm text-slate-500">
                Supported formats: .p12, .pfx
              </p>
            </div>
            {dscFile && (
              <div className="rounded-xl bg-success-50 border border-success-200 p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                  <span className="text-body-md text-success-900">
                    {dscFile.name} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md text-gray-800 mb-2">
          Choose Verification Method
        </h3>
        <p className="text-body-md text-slate-600">
          Select your preferred method to complete E-verification for ITR submission
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VERIFICATION_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              disabled={isProcessing}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${isSelected ? `${method.borderColor} ${method.bgColor}` : 'border-slate-200 hover:border-slate-300'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start">
                <Icon className={`h-6 w-6 ${method.color} mr-3 mt-0.5`} />
                <div className="flex-1">
                  <h4 className="text-body-md font-semibold text-gray-800 mb-1">
                    {method.name}
                  </h4>
                  <p className="text-body-sm text-slate-600">{method.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle className={`h-5 w-5 ${method.color}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedMethod && (
        <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-body-md font-semibold text-gray-800 mb-4">
            {VERIFICATION_METHODS.find((m) => m.id === selectedMethod)?.name} Details
          </h4>
          {renderMethodForm()}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        {onClose && (
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!selectedMethod || isProcessing}
          loading={isProcessing}
        >
          {selectedMethod === 'AADHAAR_OTP' || selectedMethod === 'BANK_EVC'
            ? otpSent
              ? 'Verify'
              : 'Send OTP/EVC'
            : 'Verify'}
        </Button>
      </div>
    </div>
  );
};

export default EVerifyOptions;

