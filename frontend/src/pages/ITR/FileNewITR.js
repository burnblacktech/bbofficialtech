// File New ITR Page - Complete ITR Filing Journey
// Implements progressive disclosure and adaptive intake flow based on ITR type
// Follows the verified ITR blueprint with proper user personas

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Calculator,
  Upload,
  User,
  Building,
  DollarSign,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const FileNewITR = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [itrType, setItrType] = useState('');
  const [filingData, setFilingData] = useState({
    personalInfo: {},
    incomeSources: {},
    deductions: {},
    attachments: [],
    summary: {},
  });

  const steps = [
    { id: 1, title: 'Select ITR Type', icon: FileText, description: 'Choose the appropriate ITR form' },
    { id: 2, title: 'Personal Information', icon: User, description: 'Basic details and PAN verification' },
    { id: 3, title: 'Income Sources', icon: DollarSign, description: 'Salary, business, capital gains' },
    { id: 4, title: 'Deductions', icon: Calculator, description: '80C, 80D, 80G and other deductions' },
    { id: 5, title: 'Attachments', icon: Upload, description: 'Upload supporting documents' },
    { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Final review and submission' },
  ];

  const itrTypes = [
    {
      id: 'ITR-1',
      name: 'ITR-1 (Sahaj)',
      description: 'For salaried individuals with income from salary, one house property, and other sources',
      applicable: 'Salary + One house property + Other sources (interest, etc.)',
      icon: User,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      id: 'ITR-2',
      name: 'ITR-2',
      description: 'For individuals and HUFs not having income from business or profession',
      applicable: 'Salary + Multiple house properties + Capital gains + Other sources',
      icon: Building,
      color: 'bg-green-50 border-green-200 text-green-800',
    },
    {
      id: 'ITR-3',
      name: 'ITR-3',
      description: 'For individuals and HUFs having income from business or profession',
      applicable: 'Business/Professional income + All other sources',
      icon: Calculator,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    {
      id: 'ITR-4',
      name: 'ITR-4 (Sugam)',
      description: 'For individuals, HUFs and firms having presumptive income from business',
      applicable: 'Presumptive business income (up to ₹2 crores)',
      icon: DollarSign,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
    },
  ];

  const handleITRTypeSelect = (type) => {
    setItrType(type);
    setFilingData(prev => ({ ...prev, itrType: type }));
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // TODO: Implement draft saving
      console.log('Saving draft:', filingData);
      // await draftService.saveDraft(filingData);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select ITR Type</h2>
              <p className="text-gray-600">Choose the appropriate ITR form based on your income sources</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itrTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    onClick={() => handleITRTypeSelect(type.id)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${type.color}`}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className="h-8 w-8 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
                        <p className="text-sm mb-3">{type.description}</p>
                        <div className="text-xs font-medium">
                          <span className="font-semibold">Applicable for:</span> {type.applicable}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Need Help Choosing?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    If you're unsure about which ITR form to use, our system will guide you through
                    questions to determine the most appropriate form for your situation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Provide your basic details and PAN information</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Coming Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Personal information form will be implemented next. This will include PAN verification,
                    address details, and bank account information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Income Sources</h2>
              <p className="text-gray-600">Enter your income from various sources</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Coming Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Income sources form will include salary details, business income, capital gains,
                    rental income, and other sources based on the selected ITR type.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deductions</h2>
              <p className="text-gray-600">Claim eligible deductions to reduce your tax liability</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Coming Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Deductions form will include 80C, 80D, 80G, and other eligible deductions
                    with proper validation and breakdown components.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Attachments</h2>
              <p className="text-gray-600">Upload supporting documents for your ITR filing</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Coming Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Document upload will support Form-16, bank statements, investment proofs,
                    and other required documents with proper validation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-600">Review your ITR details before final submission</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Coming Soon</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Review page will show a comprehensive summary of all entered information
                    with tax computation and final submission to ITD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File New ITR</h1>
              <p className="text-gray-600 mt-1">
                Complete your income tax return filing for Assessment Year 2024-25
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Assessment Year</div>
              <div className="font-semibold text-gray-900">2024-25</div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                {steps[currentStep - 1]?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {steps[currentStep - 1]?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              currentStep === 1
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Save Draft
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length}
              className={`flex items-center px-6 py-2 rounded-lg ${
                currentStep === steps.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentStep === steps.length ? 'Complete' : 'Next'}
              {currentStep < steps.length && <ArrowRight className="h-4 w-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileNewITR;
