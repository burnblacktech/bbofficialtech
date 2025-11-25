// =====================================================
// DYNAMIC ITR FORM RENDERER
// Renders ITR forms based on configuration
// Single codebase for all ITR types
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useITR } from '../../../contexts';
import { validationService, form16ExtractionService, bankStatementService } from '../../../services';
import { ProgressStepper, Card, Button, Input } from '../../DesignSystem';
import ITRJsonDownload from './ITRJsonDownload';
import Form16Upload from './Form16Upload';
import BankStatementUpload from './BankStatementUpload';
import TaxSavingsRecommendations from './TaxSavingsRecommendations';

const ITRFormRenderer = ({ itrType, initialData = null, onSubmit, onSaveDraft }) => {
  const { currentFiling, updateFilingSection, validateFiling } = useITR();
  const [config, setConfig] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDownloadSection, setShowDownloadSection] = useState(false);
  const [showAutoImportSection, setShowAutoImportSection] = useState(true);

  // Load ITR configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configModule = await import(`../config/${itrType}Config.js`);
        setConfig(configModule.default);
      } catch (error) {
        console.error(`Failed to load ITR config for ${itrType}:`, error);
      }
    };

    loadConfig();
  }, [itrType]);

  // Initialize form data
  useEffect(() => {
    if (config && initialData) {
      setFormData(initialData);
    }
  }, [config, initialData]);

  // Validate current section
  const validateCurrentSection = useCallback(() => {
    if (!config) return { isValid: true };

    const section = config.sections[currentSection];
    const sectionData = formData[section.id] || {};
    const validation = validationService.validateForm(sectionData, {
      ...section.fields.reduce((acc, field) => {
        if (field.required || field.validation) {
          acc[field.id] = {
            required: field.required,
            type: field.type,
            pattern: field.validation?.pattern,
            minLength: field.validation?.minLength,
            maxLength: field.validation?.maxLength,
            min: field.validation?.min,
            max: field.validation?.max,
          };
        }
        return acc;
      }, {}),
    });

    setErrors(validation.results);
    return validation;
  }, [config, currentSection, formData]);

  // Handle field change
  const handleFieldChange = useCallback((sectionId, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldId]: value,
      },
    }));

    // Clear error for this field
    if (errors[`${sectionId}.${fieldId}`]) {
      setErrors(prev => ({
        ...prev,
        [`${sectionId}.${fieldId}`]: { isValid: true, errors: [] },
      }));
    }

    // Auto-save draft
    if (onSaveDraft) {
      const timeoutId = setTimeout(() => {
        onSaveDraft({
          ...formData,
          [sectionId]: {
            ...formData[sectionId],
            [fieldId]: value,
          },
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, errors, onSaveDraft]);

  // Check if field should be shown
  const shouldShowField = (field) => {
    if (!field.conditional) return true;

    const { field: conditionalField, value: conditionalValue } = field.conditional;
    const fieldValue = formData[field.conditional.section_id]?.[conditionalField];

    return fieldValue === conditionalValue;
  };

  // Render field based on type
  const renderField = (section, field) => {
    if (!shouldShowField(field)) return null;

    const fieldId = `${section.id}.${field.id}`;
    const value = formData[section.id]?.[field.id] || '';
    const fieldErrors = errors[fieldId];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <Input
            key={field.id}
            label={field.label}
            type={field.type}
            value={value}
            required={field.required}
            error={fieldErrors?.isValid === false ? fieldErrors.errors[0] : null}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
          />
        );

      case 'date':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="date"
            value={value}
            required={field.required}
            error={fieldErrors?.isValid === false ? fieldErrors.errors[0] : null}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              value={value}
              required={field.required}
              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            />
            {fieldErrors?.isValid === false && (
              <p className="text-sm text-red-600">{fieldErrors.errors[0]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={value}
              required={field.required}
              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            >
              <option value="">Select...</option>
              {field.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors?.isValid === false && (
              <p className="text-sm text-red-600">{fieldErrors.errors[0]}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    required={field.required}
                    onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors?.isValid === false && (
              <p className="text-sm text-red-600">{fieldErrors.errors[0]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Handle section navigation
  const handleNextSection = async () => {
    const validation = validateCurrentSection();
    if (validation.isValid) {
      // Save section data
      if (updateFilingSection) {
        await updateFilingSection(config.sections[currentSection].id, formData[config.sections[currentSection].id]);
      }

      if (currentSection < config.sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        // Submit form
        await handleSubmit();
      }
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      // Show download section after successful submission
      setShowDownloadSection(true);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Form 16 auto-population
  const handleForm16AutoPopulate = useCallback((extractedData) => {
    const populatedData = form16ExtractionService.autoPopulateITRForm(extractedData, formData);
    setFormData(populatedData);
  }, [formData]);

  // Handle bank statement auto-population
  const handleBankStatementAutoPopulate = useCallback((bankData) => {
    const populatedData = bankStatementService.autoPopulateITRForm(bankData, formData);
    setFormData(populatedData);
  }, [formData]);

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback((recommendation) => {
    // Update form data with investment information
    setFormData(prev => ({
      ...prev,
      investments: {
        ...prev.investments,
        [recommendation.name]: {
          amount: recommendation.suggestedAmount,
          section: recommendation.section,
          category: recommendation.category,
        },
      },
    }));
  }, []);

  if (!config) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentSectionConfig = config.sections[currentSection];
  const progress = ((currentSection + 1) / config.sections.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Auto-Import Section - Shows at the beginning */}
      {showAutoImportSection && currentSection === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-6"
        >
          {/* Import Options Header */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🚀 Save Time with Smart Import
              </h3>
              <p className="text-gray-600 mb-4">
                Upload your documents and let AI do the work. Fill your ITR 90% faster!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAutoImportSection(false)}
              >
                Skip to Manual Entry
              </Button>
            </div>
          </Card>

          {/* Form 16 Upload */}
          <Form16Upload
            onExtractionComplete={(result) => {
              console.log('Form 16 extracted:', result);
            }}
            onAutoPopulate={handleForm16AutoPopulate}
          />

          {/* Bank Statement Upload */}
          <BankStatementUpload
            onAnalysisComplete={(result) => {
              console.log('Bank statement analyzed:', result);
            }}
            onAutoPopulate={handleBankStatementAutoPopulate}
          />

          {/* Tax Savings Recommendations */}
          <TaxSavingsRecommendations
            userProfile={{
              age: 30,
              annualIncome: formData.income?.salaryIncome || 500000,
              riskProfile: 'moderate',
              hasHomeLoan: false,
              dependents: [],
            }}
            currentInvestments={formData.investments || {}}
            onRecommendationSelect={handleRecommendationSelect}
          />
        </motion.div>
      )}

      {/* Progress Stepper */}
      <div className="mb-8">
        <ProgressStepper
          steps={config.sections.map(section => ({
            id: section.id,
            label: section.title,
            description: section.description,
          }))}
          currentStep={currentSection}
          onStepClick={setCurrentSection}
        />
      </div>

      {/* Current Section */}
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentSectionConfig.title}
            </h2>
            <p className="text-gray-600">{currentSectionConfig.description}</p>
          </div>

          <div className="space-y-6">
            {currentSectionConfig.fields.map(field => renderField(currentSectionConfig, field))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousSection}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            <div className="space-x-4">
              {onSaveDraft && (
                <Button
                  variant="outline"
                  onClick={() => onSaveDraft(formData)}
                  disabled={isLoading}
                >
                  Save Draft
                </Button>
              )}

              <Button
                onClick={handleNextSection}
                disabled={isLoading}
                loading={isLoading}
              >
                {currentSection === config.sections.length - 1 ? 'Submit' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* JSON Download Section - Shows after form completion */}
      {showDownloadSection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ITRJsonDownload
            itrData={formData}
            itrType={itrType}
            assessmentYear="2024-25"
            onDownloadComplete={(result) => {
              console.log('JSON download completed:', result);
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ITRFormRenderer;
