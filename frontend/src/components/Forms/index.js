import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

// Smart Prompting Engine
class SmartPromptingEngine {
  constructor() {
    this.promptingRules = {
      'ITR-1': {
        triggers: ['business_income', 'capital_gains', 'high_income'],
        prompts: {
          business_income: {
            type: 'gentle_warning',
            message: 'We noticed you might have business income. ITR-1 is for salaried individuals only.',
            suggestion: 'Consider ITR-3 or ITR-4 for business income',
            action: 'suggest_alternative',
            tone: 'helpful',
          },
          capital_gains: {
            type: 'educational',
            message: 'Capital gains require ITR-2 or ITR-3. ITR-1 doesn\'t support capital gains.',
            suggestion: 'Switch to ITR-2 for capital gains',
            action: 'offer_switch',
            tone: 'informative',
          },
        },
      },
    };
  }

  detectIncorrectSelection(selectedITR, userProfile) {
    const rules = this.promptingRules[selectedITR];
    if (!rules) return [];

    const triggers = [];
    Object.entries(rules.triggers).forEach(([trigger, condition]) => {
      if (this.evaluateCondition(condition, userProfile)) {
        triggers.push(trigger);
      }
    });

    return triggers;
  }

  generateSmartPrompt(selectedITR, trigger, userProfile) {
    const prompt = this.promptingRules[selectedITR].prompts[trigger];
    return {
      type: prompt.type,
      message: prompt.message,
      suggestion: prompt.suggestion,
      action: prompt.action,
      tone: prompt.tone,
    };
  }

  evaluateCondition(condition, userProfile) {
    // Simplified condition evaluation
    return userProfile[condition] || false;
  }
}

// Smart Prompt Component
const SmartPrompt = ({ prompt, onAccept, onDecline, onLearnMore }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept(prompt.action);
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className={`smart-prompt ${prompt.type} ${prompt.tone}`}>
      <div className="prompt-content">
        <div className="prompt-icon">
          {prompt.type === 'gentle_warning' && <AlertCircle className="text-amber-500" />}
          {prompt.type === 'educational' && <Info className="text-blue-500" />}
          {prompt.type === 'optimization' && <TrendingUp className="text-green-500" />}
          {prompt.type === 'simplification' && <Lightbulb className="text-purple-500" />}
        </div>

        <div className="prompt-message">
          <h4 className="prompt-title">
            {prompt.type === 'gentle_warning' && 'Heads Up!'}
            {prompt.type === 'educational' && 'Did You Know?'}
            {prompt.type === 'optimization' && 'Tax Optimization'}
            {prompt.type === 'simplification' && 'Simpler Option'}
          </h4>
          <p className="prompt-text">{prompt.message}</p>
          <p className="prompt-suggestion">{prompt.suggestion}</p>
        </div>
      </div>

      <div className="prompt-actions">
        <button className="btn-secondary" onClick={handleDecline}>
          Keep Current Choice
        </button>
        <button className="btn-primary" onClick={handleAccept}>
          {prompt.action === 'suggest_alternative' && 'See Alternatives'}
          {prompt.action === 'offer_switch' && 'Switch Now'}
          {prompt.action === 'show_comparison' && 'Compare Options'}
          {prompt.action === 'show_benefits' && 'See Benefits'}
        </button>
        <button className="btn-link" onClick={() => onLearnMore(prompt)}>
          Learn More
        </button>
      </div>
    </div>
  );
};

// ITR Selection Card Component
const ITRSelectionCard = ({ itrType, title, description, features, isRecommended, isSelected, onSelect }) => {
  return (
    <div
      className={`itr-selection-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
      onClick={() => onSelect(itrType)}
    >
      <h3 className="itr-card-title">{title}</h3>
      <p className="itr-card-description">{description}</p>
      <ul className="itr-card-features">
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
    </div>
  );
};

// ITR Selection Component
const ITRSelection = () => {
  const navigate = useNavigate();
  const [selectedITR, setSelectedITR] = useState(null);
  const [userProfile] = useState({});
  const [prompt, setPrompt] = useState(null);
  const [promptingEngine] = useState(new SmartPromptingEngine());

  const itrOptions = [
    {
      type: 'ITR-1',
      title: 'ITR-1',
      description: 'For salaried individuals with income up to ₹5 lakhs',
      features: ['Salary income', 'House property', 'Other sources', 'Simple filing'],
      isRecommended: true,
    },
    {
      type: 'ITR-2',
      title: 'ITR-2',
      description: 'For individuals with capital gains and income up to ₹10 lakhs',
      features: ['Salary income', 'Capital gains', 'House property', 'Other sources'],
      isRecommended: false,
    },
    {
      type: 'ITR-3',
      title: 'ITR-3',
      description: 'For individuals with business income',
      features: ['Business income', 'All income sources', 'Complex deductions', 'Audit support'],
      isRecommended: false,
    },
    {
      type: 'ITR-4',
      title: 'ITR-4',
      description: 'For presumptive taxation (business/profession)',
      features: ['Presumptive taxation', 'Simplified filing', 'Business income', 'Professional income'],
      isRecommended: false,
    },
  ];

  const handleITRSelection = (itrType) => {
    const validation = promptingEngine.detectIncorrectSelection(itrType, userProfile);

    if (validation.length > 0) {
      const smartPrompt = promptingEngine.generateSmartPrompt(itrType, validation[0], userProfile);
      setPrompt(smartPrompt);
    } else {
      setSelectedITR(itrType);
      // Navigate to intake form with selected ITR
      navigate('/intake', { state: { itrType } });
    }
  };

  const handlePromptAccept = (action) => {
    // Handle prompt acceptance
    console.log('Prompt accepted:', action);
    setPrompt(null);
  };

  const handlePromptDecline = () => {
    setPrompt(null);
  };

  const handleLearnMore = (prompt) => {
    // Show detailed information
    console.log('Learn more:', prompt);
  };

  return (
    <div className="itr-journey-container">
      <div className="card">
        <div className="card-header">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-link"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="card-title">Select Your ITR Form</h1>
          <p className="card-subtitle">Choose the appropriate ITR form based on your income sources</p>
        </div>

        <div className="card-content">
          <div className="itr-selection-grid">
            {itrOptions.map((option) => (
              <ITRSelectionCard
                key={option.type}
                itrType={option.type}
                title={option.title}
                description={option.description}
                features={option.features}
                isRecommended={option.isRecommended}
                isSelected={selectedITR === option.type}
                onSelect={handleITRSelection}
              />
            ))}
          </div>

          {prompt && (
            <SmartPrompt
              prompt={prompt}
              onAccept={handlePromptAccept}
              onDecline={handlePromptDecline}
              onLearnMore={handleLearnMore}
            />
          )}
        </div>

        <div className="card-footer">
          <button
            className="btn-primary"
            onClick={() => navigate('/intake', { state: { itrType: selectedITR } })}
            disabled={!selectedITR}
          >
            Continue with {selectedITR || 'ITR Selection'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step-dot ${currentStep > step.id ? 'completed' : currentStep === step.id ? 'active' : ''}`}
          title={step.title}
        />
      ))}
    </div>
  );
};

// Dynamic Form Field Component
const DynamicFormField = ({ fieldName, fieldConfig, value, error, onChange }) => {
  const fieldType = fieldConfig.type || 'text';

  const renderField = () => {
    switch (fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`form-input ${error ? 'error-shake' : ''}`}
            placeholder={fieldConfig.placeholder || `Enter ${fieldName}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`form-input ${error ? 'error-shake' : ''}`}
            placeholder={fieldConfig.placeholder || `Enter ${fieldName}`}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`form-input ${error ? 'error-shake' : ''}`}
          >
            <option value="">Select {fieldName}</option>
            {fieldConfig.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`form-input ${error ? 'error-shake' : ''}`}
            placeholder={fieldConfig.placeholder || `Enter ${fieldName}`}
          />
        );
    }
  };

  return (
    <div className="form-field">
      <label className="field-label">
        {fieldConfig.label || fieldName}
        {fieldConfig.required && <span className="required">*</span>}
      </label>
      {renderField()}
      {error && (
        <div className="field-error">
          {error.message}
        </div>
      )}
      {fieldConfig.helpText && (
        <div className="field-help">
          {fieldConfig.helpText}
        </div>
      )}
    </div>
  );
};

// Income Source Component
const IncomeSourceCard = ({ sourceType, sourceData, onUpdate, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(sourceData.hasIncome);

  const handleToggle = () => {
    const newValue = !sourceData.hasIncome;
    onToggle(sourceType, newValue);
    setIsExpanded(newValue);
  };

  const handleFieldChange = (field, value) => {
    onUpdate(sourceType, { ...sourceData, [field]: value });
  };

  return (
    <div className={`card ${sourceData.hasIncome ? 'has-income' : ''}`}>
      <div className="card-header">
        <div className="income-toggle">
          <div>
            <h3 className="card-title">{sourceType.replace('_', ' ').toUpperCase()}</h3>
            <p className="card-subtitle">Add your {sourceType} income details</p>
          </div>
          <div className="toggle-switch" onClick={handleToggle}>
            <div className={`toggle-slider ${sourceData.hasIncome ? 'active' : ''}`}></div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="card-content">
          <div className="field-group">
            <DynamicFormField
              fieldName="amount"
              fieldConfig={{
                type: 'number',
                label: 'Annual Amount',
                required: true,
                placeholder: 'Enter annual amount',
              }}
              value={sourceData.amount}
              onChange={(value) => handleFieldChange('amount', value)}
            />

            {sourceType === 'salary' && (
              <DynamicFormField
                fieldName="employer"
                fieldConfig={{
                  type: 'text',
                  label: 'Employer Name',
                  required: true,
                  placeholder: 'Enter employer name',
                }}
                value={sourceData.employer}
                onChange={(value) => handleFieldChange('employer', value)}
              />
            )}

            {sourceType === 'house_property' && (
              <DynamicFormField
                fieldName="type"
                fieldConfig={{
                  type: 'select',
                  label: 'Property Type',
                  required: true,
                  options: [
                    { value: 'self_occupied', label: 'Self Occupied' },
                    { value: 'let_out', label: 'Let Out' },
                    { value: 'deemed_let', label: 'Deemed Let Out' },
                  ],
                }}
                value={sourceData.type}
                onChange={(value) => handleFieldChange('type', value)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Tax Summary Card Component
const TaxSummaryCard = ({ taxData, isCalculating }) => {
  if (isCalculating) {
    return (
      <div className="summary-card tax-summary">
        <div className="loading-skeleton" style={{ height: '200px' }}></div>
      </div>
    );
  }

  if (!taxData) return null;

  return (
    <div className="summary-card tax-summary">
      <h3 className="summary-card-title">Tax Summary</h3>

      <div className="regime-comparison">
        <div className="regime-card new-regime">
          <h4>New Regime</h4>
          <div className="tax-amount">₹{taxData.newRegime?.taxLiability?.toLocaleString() || '0'}</div>
          <div className="effective-rate">{taxData.newRegime?.effectiveRate?.toFixed(2) || '0'}%</div>
        </div>

        <div className="regime-card old-regime">
          <h4>Old Regime</h4>
          <div className="tax-amount">₹{taxData.oldRegime?.taxLiability?.toLocaleString() || '0'}</div>
          <div className="effective-rate">{taxData.oldRegime?.effectiveRate?.toFixed(2) || '0'}%</div>
        </div>
      </div>

      <div className="savings-highlight">
        <span>You save ₹{taxData.savings?.toLocaleString() || '0'} with {taxData.recommendedRegime || 'New Regime'}</span>
      </div>
    </div>
  );
};

// Mobile Summary Dashboard
const MobileSummaryDashboard = ({ taxData, incomeData, deductions, isCalculating }) => {
  const [activeCard, setActiveCard] = useState(0);

  const cards = [
    {
      id: 'income',
      title: 'Income Summary',
      content: (
        <div>
          <div className="card-header">
            <h3>Income Summary</h3>
            <div className="total-amount">₹{incomeData?.total?.toLocaleString() || '0'}</div>
          </div>
          <div className="income-breakdown">
            <div className="income-item">
              <span>Salary</span>
              <span>₹{incomeData?.salary?.toLocaleString() || '0'}</span>
            </div>
            <div className="income-item">
              <span>Business</span>
              <span>₹{incomeData?.business?.toLocaleString() || '0'}</span>
            </div>
            <div className="income-item">
              <span>Property</span>
              <span>₹{incomeData?.property?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tax',
      title: 'Tax Summary',
      content: (
        <div>
          <div className="card-header">
            <h3>Tax Summary</h3>
            <div className="recommended-regime">{taxData?.recommendedRegime || 'New Regime'}</div>
          </div>
          <div className="tax-comparison">
            <div className="tax-item">
              <span>New Regime</span>
              <div className="tax-amount">₹{taxData?.newRegime?.taxLiability?.toLocaleString() || '0'}</div>
            </div>
            <div className="tax-item">
              <span>Old Regime</span>
              <div className="tax-amount">₹{taxData?.oldRegime?.taxLiability?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="savings-badge">
            Save ₹{taxData?.savings?.toLocaleString() || '0'}
          </div>
        </div>
      ),
    },
    {
      id: 'deductions',
      title: 'Deductions',
      content: (
        <div>
          <div className="card-header">
            <h3>Deductions</h3>
            <div className="total-deductions">₹{deductions?.total?.toLocaleString() || '0'}</div>
          </div>
          <div className="deduction-items">
            <div className="deduction-item">
              <span>80C</span>
              <div className="deduction-amount">₹{deductions?.section80C?.toLocaleString() || '0'}</div>
            </div>
            <div className="deduction-item">
              <span>80D</span>
              <div className="deduction-amount">₹{deductions?.section80D?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="optimization-tip">
            <Lightbulb className="w-4 h-4" />
            <span>Maximize 80C to save more tax</span>
          </div>
        </div>
      ),
    },
    {
      id: 'compliance',
      title: 'Compliance',
      content: (
        <div>
          <div className="card-header">
            <h3>Compliance</h3>
            <div className="compliance-status">✅ Ready</div>
          </div>
          <div className="compliance-items">
            <div className="compliance-item">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>ITR Eligible</span>
            </div>
            <div className="compliance-item">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Due: {taxData?.dueDate || 'July 31, 2024'}</span>
            </div>
          </div>
          <div className="next-action">
            <button className="btn-primary">Continue Filing</button>
          </div>
        </div>
      ),
    },
  ];

  if (isCalculating) {
    return (
      <div className="mobile-summary-dashboard">
        <div className="loading-skeleton" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className="mobile-summary-dashboard">
      <div className="mobile-summary-cards">
        <div className="card-indicator">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`indicator-dot ${activeCard === index ? 'active' : ''}`}
              onClick={() => setActiveCard(index)}
            />
          ))}
        </div>

        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`mobile-summary-card ${activeCard === index ? 'active' : ''}`}
          >
            {card.content}
          </div>
        ))}
      </div>

      <div className="swipe-navigation">
        <button
          className="swipe-btn"
          onClick={() => setActiveCard(Math.max(0, activeCard - 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="card-counter">{activeCard + 1} of {cards.length}</span>
        <button
          className="swipe-btn"
          onClick={() => setActiveCard(Math.min(cards.length - 1, activeCard + 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Mobile Navigation Component
const MobileNavigation = ({ onPrevious, onNext, isNextDisabled, nextLabel = 'Next' }) => {
  return (
    <div className="mobile-navigation">
      <div className="nav-buttons">
        <button className="nav-btn-secondary" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          className="nav-btn-primary"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export {
  ITRSelection,
  SmartPrompt,
  ITRSelectionCard,
  StepIndicator,
  DynamicFormField,
  IncomeSourceCard,
  TaxSummaryCard,
  MobileSummaryDashboard,
  MobileNavigation,
  SmartPromptingEngine,
};
