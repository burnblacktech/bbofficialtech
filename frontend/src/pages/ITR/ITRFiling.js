// =====================================================
// ITR FILING MAIN COMPONENT - WORLD-CLASS UX DESIGN
// Master stepper with live tax summary and guided momentum
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useITR } from '../../contexts/ITRContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { 
  User, 
  DollarSign, 
  Calculator, 
  FileText, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

// Enhanced Components
import ITRFilingStepper from '../../components/ITR/ITRFilingStepper';
import LiveTaxSummary from '../../components/ITR/LiveTaxSummary';
import AddSourcePattern from '../../components/ITR/AddSourcePattern';
import VisualLimitGauge from '../../components/ITR/VisualLimitGauge';

// Form Components
import PersonalInfoForm from '../../components/ITR/PersonalInfoForm';
import ReviewForm from '../../components/ITR/ReviewForm';

const ITRFiling = () => {
  const { itrType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const {
    currentFiling,
    updateFiling,
    updateFilingSection,
    saveDraft,
    progress,
    isLoading
  } = useITR();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Enhanced steps configuration
  const steps = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      description: 'Basic details and contact information',
      icon: User
    },
    {
      id: 'income',
      title: 'Income Details',
      description: 'Salary, business, and other income sources',
      icon: DollarSign
    },
    {
      id: 'deductions',
      title: 'Deductions',
      description: 'Tax-saving investments and expenses',
      icon: Calculator
    },
    {
      id: 'taxesPaid',
      title: 'Taxes Paid',
      description: 'TDS, advance tax, and other payments',
      icon: FileText
    },
    {
      id: 'review',
      title: 'Review & File',
      description: 'Final review and submission',
      icon: CheckCircle
    }
  ];

  // Mock data for live tax summary
  const [incomeData, setIncomeData] = useState({
    salary: 1200000,
    interest: 8500,
    other: 0
  });
  
  const [deductionData, setDeductionData] = useState({
    section80C: 120000,
    section80D: 25000,
    section80G: 10000
  });

  // Step navigation handlers
  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft();
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize filing data from navigation state
  useEffect(() => {
    if (location.state) {
      const { context, userId } = location.state;
      updateFiling({
        context: context || 'self',
        userId: userId || user?.id,
        assessmentYear: '2024-25',
        status: 'draft'
      });
    }
  }, [location.state, user?.id, updateFiling]);

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  // Render current step content
  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    switch (currentStepData.id) {
      case 'personalInfo':
        return <PersonalInfoForm />;
      case 'income':
        return (
          <div className="space-y-6">
            <AddSourcePattern
              title="Income Sources"
              subtitle="Add all your income sources for the assessment year"
              sources={[
                { id: 1, name: 'Salary from XYZ Corp', amount: 1200000, type: 'salary' },
                { id: 2, name: 'Interest Income', amount: 8500, type: 'interest' }
              ]}
              sourceTypes={[
                { id: 'salary', name: 'Salary', description: 'Income from employment' },
                { id: 'business', name: 'Business', description: 'Income from business or profession' },
                { id: 'interest', name: 'Interest', description: 'Interest from savings, FDs, etc.' },
                { id: 'other', name: 'Other Sources', description: 'Any other income sources' }
              ]}
              onAddSource={(data) => console.log('Add income source:', data)}
              onEditSource={(id, data) => console.log('Edit income source:', id, data)}
              onDeleteSource={(id) => console.log('Delete income source:', id)}
            />
          </div>
        );
      case 'deductions':
        return (
          <div className="space-y-6">
            <VisualLimitGauge
              title="Section 80C - Investments"
              currentAmount={120000}
              limitAmount={150000}
              description="Life insurance, PPF, ELSS, NSC, etc."
            />
            <VisualLimitGauge
              title="Section 80D - Health Insurance"
              currentAmount={25000}
              limitAmount={25000}
              description="Health insurance premiums for self and family"
            />
            <AddSourcePattern
              title="Other Deductions"
              subtitle="Add other eligible deductions"
              sources={[
                { id: 1, name: 'Donation to Charity', amount: 10000, type: 'donation' }
              ]}
              sourceTypes={[
                { id: 'donation', name: 'Donation', description: 'Charitable donations under 80G' },
                { id: 'education', name: 'Education', description: 'Education loan interest' },
                { id: 'home', name: 'Home Loan', description: 'Home loan interest and principal' }
              ]}
              onAddSource={(data) => console.log('Add deduction:', data)}
              onEditSource={(id, data) => console.log('Edit deduction:', id, data)}
              onDeleteSource={(id) => console.log('Delete deduction:', id)}
            />
          </div>
        );
      case 'taxesPaid':
        return <div className="text-center py-12">Taxes Paid Form - Coming Soon</div>;
      case 'review':
        return <ReviewForm />;
      default:
        return <PersonalInfoForm />;
    }
  };

  // Handle form data update
  const handleFormUpdate = (data) => {
    updateFilingSection(steps[currentStep].id, data);
  };

  // Navigation handlers
  const handlePrevious = () => {
    handlePrevStep();
  };

  const handleNext = () => {
    handleNextStep();
  };

  const handleBackToStart = () => {
    navigate('/itr/start');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToStart}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Start</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ITR Filing - {itrType || 'ITR-1'}
                </h1>
                <p className="text-sm text-gray-600">
                  Assessment Year: {currentFiling?.assessmentYear || '2024-25'}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Master Stepper */}
        <ITRFilingStepper
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
          progress={progressPercentage}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                {renderStepContent()}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === steps.length - 1}
                    className="flex items-center"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Live Tax Summary */}
          <div className="lg:col-span-1">
            <LiveTaxSummary
              incomeData={incomeData}
              deductionData={deductionData}
              onSaveDraft={handleSaveDraft}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITRFiling;