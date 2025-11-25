import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enterpriseDebugger from '../../services/EnterpriseDebugger';
import EnterpriseErrorBoundary from '../../components/EnterpriseErrorBoundary';
import BreakdownInput from '../../components/BreakdownInput';
import {
  ArrowRight, ArrowLeft, CheckCircle, Calculator,
  TrendingUp, Building2, Home, Briefcase, Info,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
  EnterpriseInput,
} from '../../components/DesignSystem/EnterpriseComponents';

// Income Details Screen - Granular income capture using BreakdownInput
// Purpose: Capture multiple income sources with detailed breakdown

const IncomeDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get interaction mode context from navigation state
  const { selectedITR: passedITR, interactionMode, fromModeSelection } = location.state || {};
  const [selectedITR, setSelectedITR] = useState(passedITR || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [incomeData, setIncomeData] = useState({
    salary: [],
    otherSources: [],
    capitalGains: [],
    houseProperty: [],
    businessIncome: [],
  });
  const [totals, setTotals] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Get selected ITR from localStorage
  useEffect(() => {
    const itr = localStorage.getItem('selectedITR');
    if (itr) {
      setSelectedITR(itr);
    } else {
      navigate('/itr-selection');
    }
  }, [navigate]);

  // Calculate totals for each income head
  const calculateTotals = useCallback(() => {
    setIsCalculating(true);

    const newTotals = {};

    // Calculate salary total
    newTotals.salary = incomeData.salary.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate other sources total
    newTotals.otherSources = incomeData.otherSources.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate capital gains total
    newTotals.capitalGains = incomeData.capitalGains.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate house property total
    newTotals.houseProperty = incomeData.houseProperty.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate business income total
    newTotals.businessIncome = incomeData.businessIncome.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate gross total income
    newTotals.grossTotalIncome = Object.values(newTotals).reduce((sum, total) => sum + total, 0);

    setTotals(newTotals);
    setIsCalculating(false);

    enterpriseDebugger.log('INFO', 'IncomeDetails', 'Totals calculated', {
      totals: newTotals,
      selectedITR,
    });
  }, [incomeData, selectedITR]);

  // Calculate totals whenever income data changes
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Update income data for specific head
  const updateIncomeData = (head, items) => {
    setIncomeData(prev => ({
      ...prev,
      [head]: items,
    }));

    enterpriseDebugger.log('INFO', 'IncomeDetails', 'Income data updated', {
      head,
      itemCount: items.length,
      totalAmount: items.reduce((sum, item) => sum + (item.amount || 0), 0),
    });
  };

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Proceed to deductions
      localStorage.setItem('incomeData', JSON.stringify(incomeData));
      localStorage.setItem('incomeTotals', JSON.stringify(totals));
      navigate('/deductions');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/itr-selection');
    }
  };

  // Step configuration
  const steps = [
    {
      id: 'salary',
      title: 'Salary & Employment Income',
      description: 'Add your salary income from all employers',
      icon: Briefcase,
      rules: {
        minAmount: 0,
        proofRequired: true,
      },
      showProofUpload: true,
      placeholder: 'Enter salary amount',
    },
    {
      id: 'otherSources',
      title: 'Other Sources of Income',
      description: 'Interest, dividends, pension, and other income',
      icon: Building2,
      rules: {
        minAmount: 0,
        proofRequired: true,
      },
      showProofUpload: true,
      placeholder: 'Enter amount',
    },
    {
      id: 'capitalGains',
      title: 'Capital Gains',
      description: 'Gains from sale of shares, property, or other assets',
      icon: TrendingUp,
      rules: {
        minAmount: 0,
        proofRequired: true,
      },
      showProofUpload: true,
      placeholder: 'Enter gain amount',
    },
    {
      id: 'houseProperty',
      title: 'House Property Income',
      description: 'Rental income or loss from house property',
      icon: Home,
      rules: {
        minAmount: 0,
        proofRequired: true,
      },
      showProofUpload: true,
      placeholder: 'Enter rental income',
    },
    {
      id: 'businessIncome',
      title: 'Business & Professional Income',
      description: 'Income from business or profession',
      icon: Calculator,
      rules: {
        minAmount: 0,
        proofRequired: true,
      },
      showProofUpload: true,
      placeholder: 'Enter business income',
    },
  ];

  const currentStepConfig = steps[currentStep];

  return (
    <EnterpriseErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Income Details</h1>
            <p className="text-gray-600">
              Step {currentStep + 1} of {steps.length}: {currentStepConfig.title}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              {steps.map((step, index) => (
                <span key={step.id} className="max-w-20 text-center">
                  {step.title.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-2">
              <BreakdownInput
                title={currentStepConfig.title}
                description={currentStepConfig.description}
                items={incomeData[currentStepConfig.id]}
                onItemsChange={(items) => updateIncomeData(currentStepConfig.id, items)}
                rules={currentStepConfig.rules}
                icon={currentStepConfig.icon}
                placeholder={currentStepConfig.placeholder}
                showProofUpload={currentStepConfig.showProofUpload}
                showBreakdown={true}
                maxItems={20}
              />

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={isCalculating}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <span>{currentStep === steps.length - 1 ? 'Continue to Deductions' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Summary Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Income Summary
                  </h3>

                  {isCalculating ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Calculating...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Salary Income */}
                      {totals.salary > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Salary</span>
                          </div>
                          <span className="font-medium">₹{totals.salary.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Other Sources */}
                      {totals.otherSources > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Other Sources</span>
                          </div>
                          <span className="font-medium">₹{totals.otherSources.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Capital Gains */}
                      {totals.capitalGains > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Capital Gains</span>
                          </div>
                          <span className="font-medium">₹{totals.capitalGains.toLocaleString()}</span>
                        </div>
                      )}

                      {/* House Property */}
                      {totals.houseProperty > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Home className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">House Property</span>
                          </div>
                          <span className="font-medium">₹{totals.houseProperty.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Business Income */}
                      {totals.businessIncome > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Calculator className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Business Income</span>
                          </div>
                          <span className="font-medium">₹{totals.businessIncome.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Gross Total Income */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Gross Total Income</span>
                          <span className="text-lg font-bold text-blue-600">
                            ₹{totals.grossTotalIncome?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Help Text */}
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Need Help?</p>
                        <p>You can add multiple entries for each income type. Upload supporting documents for each entry.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseErrorBoundary>
  );
};

export default IncomeDetails;
