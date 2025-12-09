import React, { useState } from 'react';
import {
  User,
  Calculator,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Clock,
  Shield,
  Smartphone,
  BarChart3,
  Calendar,
  Monitor,
  Tablet,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState({
    experience: '',
    filingFrequency: '',
    preferredDevice: '',
    mainConcern: '',
    timeAvailable: '',
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to ITR Filing',
      icon: Sparkles,
      description: 'Let\'s get you started with your tax filing journey',
      component: WelcomeStep,
    },
    {
      id: 'experience',
      title: 'Your Experience',
      icon: User,
      description: 'Tell us about your tax filing experience',
      component: ExperienceStep,
    },
    {
      id: 'assessment',
      title: 'Quick Assessment',
      icon: Target,
      description: 'Help us understand your needs',
      component: AssessmentStep,
    },
    {
      id: 'preferences',
      title: 'Your Preferences',
      icon: Smartphone,
      description: 'Set up your preferred filing experience',
      component: PreferencesStep,
    },
    {
      id: 'ready',
      title: 'You\'re All Set!',
      icon: CheckCircle,
      description: 'Ready to start your tax filing journey',
      component: ReadyStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProfileUpdate = (updates) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const handleComplete = () => {
    // Save user preferences to localStorage
    localStorage.setItem('itr_onboarding_completed', 'true');
    localStorage.setItem('itr_user_profile', JSON.stringify(userProfile));

    toast.success('Welcome! Your preferences have been saved.');
    onComplete && onComplete(userProfile);
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-gold-50 mobile-safe-area mobile-scroll-smooth">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 container-mobile">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gold-500 text-white p-3 rounded-full">
              <Calculator className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ITR Filing Platform
          </h1>
          <p className="text-lg text-gray-600">
            Your trusted partner for hassle-free tax filing
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    index <= currentStep
                      ? 'bg-gold-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 text-center ${
                    index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 mt-5 transition-colors ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden card-mobile">
          <div className="p-6 lg:p-8">
            <CurrentStepComponent
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
            />
          </div>

          {/* Navigation */}
          <div className="px-6 lg:px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between mobile-bottom-nav">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center px-4 lg:px-6 py-3 lg:py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors touch-target btn-touch ${
                currentStep === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline">
                Step {currentStep + 1} of {steps.length}
              </span>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 lg:px-6 py-3 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-target btn-touch"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center px-4 lg:px-6 py-3 lg:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-target btn-touch"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep = () => (
  <div className="text-center space-y-6">
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
      <Sparkles className="w-16 h-16 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-4">Welcome to Smart Tax Filing!</h2>
      <p className="text-lg opacity-90">
        We're excited to help you file your taxes efficiently and accurately.
        Our intelligent system will guide you through every step.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="text-center">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="font-semibold mb-2">Secure & Private</h3>
        <p className="text-sm text-gray-600">Your data is protected with bank-level security</p>
      </div>

      <div className="text-center">
        <div className="bg-green-100 text-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="font-semibold mb-2">Expert Guidance</h3>
        <p className="text-sm text-gray-600">AI-powered assistance for accurate filing</p>
      </div>

      <div className="text-center">
        <div className="bg-purple-100 text-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-semibold mb-2">Time Saving</h3>
        <p className="text-sm text-gray-600">Complete your filing in minutes, not hours</p>
      </div>
    </div>
  </div>
);

const ExperienceStep = ({ userProfile, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your experience</h2>
      <p className="text-gray-600">This helps us customize your filing experience</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How experienced are you with tax filing?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'first_time', label: 'First Time Filer', desc: 'New to tax filing' },
            { value: 'some_experience', label: 'Some Experience', desc: 'Filed taxes before but need help' },
            { value: 'experienced', label: 'Experienced', desc: 'Regular filer, know the process' },
            { value: 'expert', label: 'Tax Expert', desc: 'Professional or very experienced' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ experience: option.value })}
              className={`p-4 border rounded-lg text-left transition-colors ${
                userProfile.experience === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AssessmentStep = ({ userProfile, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Assessment</h2>
      <p className="text-gray-600">Help us understand your filing needs</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How often do you file taxes?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'first_time', label: 'First Time', icon: User },
            { value: 'annual', label: 'Every Year', icon: Calendar },
            { value: 'occasional', label: 'Occasionally', icon: Clock },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ filingFrequency: option.value })}
              className={`p-4 border rounded-lg text-center transition-colors ${
                userProfile.filingFrequency === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option.icon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What's your main concern about tax filing?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'accuracy', label: 'Getting it right', desc: 'Want to ensure accurate filing' },
            { value: 'time', label: 'Saving time', desc: 'Quick and efficient process' },
            { value: 'max_refund', label: 'Maximum refund', desc: 'Optimize tax savings' },
            { value: 'compliance', label: 'Stay compliant', desc: 'Follow all rules and regulations' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ mainConcern: option.value })}
              className={`p-4 border rounded-lg text-left transition-colors ${
                userProfile.mainConcern === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PreferencesStep = ({ userProfile, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Preferences</h2>
      <p className="text-gray-600">Customize your filing experience</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred device for filing
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'desktop', label: 'Desktop/Laptop', icon: Monitor },
            { value: 'mobile', label: 'Mobile Phone', icon: Smartphone },
            { value: 'tablet', label: 'Tablet', icon: Tablet },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ preferredDevice: option.value })}
              className={`p-4 border rounded-lg text-center transition-colors ${
                userProfile.preferredDevice === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option.icon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How much time do you have for filing?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'quick', label: 'Quick Session', desc: '< 30 minutes' },
            { value: 'moderate', label: 'Moderate Time', desc: '30-60 minutes' },
            { value: 'detailed', label: 'Take My Time', desc: 'Multiple sessions' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ timeAvailable: option.value })}
              className={`p-4 border rounded-lg text-center transition-colors ${
                userProfile.timeAvailable === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ReadyStep = ({ userProfile }) => {
  const getRecommendations = () => {
    const recommendations = [];

    if (userProfile.experience === 'first_time') {
      recommendations.push('Guided walkthrough enabled');
      recommendations.push('Simplified language mode');
      recommendations.push('Extra help tooltips');
    }

    if (userProfile.mainConcern === 'accuracy') {
      recommendations.push('Enhanced validation checks');
      recommendations.push('Expert review suggestions');
    }

    if (userProfile.mainConcern === 'time') {
      recommendations.push('Quick-fill options');
      recommendations.push('Auto-save enabled');
    }

    if (userProfile.preferredDevice === 'mobile') {
      recommendations.push('Mobile-optimized interface');
      recommendations.push('Touch-friendly controls');
    }

    return recommendations;
  };

  return (
    <div className="text-center space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-green-700">
          Based on your preferences, we've customized your filing experience.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Your Personalized Experience:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getRecommendations().map((rec, index) => (
            <div key={index} className="flex items-center text-blue-800">
              <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Ready to Start Filing?</h3>
        <p className="text-gray-600 text-sm">
          Click "Get Started" to begin your tax filing journey with your personalized experience.
        </p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
