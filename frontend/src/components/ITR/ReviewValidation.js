// =====================================================
// REVIEW & VALIDATION COMPONENT - COMPREHENSIVE VALIDATION
// Enterprise-grade validation with AI assistance
// =====================================================

import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  DollarSign,
  Shield,
  Home,
  TrendingUp,
  Globe,
  FileText,
} from 'lucide-react';

const ReviewValidation = ({
  filingData,
  updateFilingData,
  validationResults,
  aiSuggestions,
  onValidate,
  isValidating,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    deductions: true,
    taxes: true,
    validation: true,
  });

  const [showAITooltip, setShowAITooltip] = useState(null);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get validation summary
  const getValidationSummary = () => {
    const errors = validationResults.filter(result => result.severity === 'error');
    const warnings = validationResults.filter(result => result.severity === 'warning');
    const success = validationResults.filter(result => result.severity === 'success');

    return { errors, warnings, success };
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalIncome = 0;
    let totalDeductions = 0;

    // Income calculations
    if (filingData.income.salary) {
      const { basicSalary = 0, hra = 0, allowances = 0 } = filingData.income.salary;
      totalIncome += basicSalary + hra + allowances;
    }

    if (filingData.income.houseProperty) {
      const { annualValue = 0, municipalTaxes = 0, interestOnLoan = 0, isSelfOccupied = false } = filingData.income.houseProperty;
      const netAnnualValue = annualValue - municipalTaxes;

      if (isSelfOccupied) {
        totalIncome += Math.max(-200000, -interestOnLoan);
      } else {
        totalIncome += netAnnualValue - interestOnLoan;
      }
    }

    if (filingData.income.otherIncome) {
      const { bankInterest = 0, fdInterest = 0, dividendIncome = 0, otherSources = 0 } = filingData.income.otherIncome;
      totalIncome += bankInterest + fdInterest + dividendIncome + otherSources;
    }

    // Deduction calculations
    if (filingData.deductions.section80C) {
      const section80C = filingData.deductions.section80C;
      const total80C = (section80C.licPremium || 0) +
                       (section80C.ppfContribution || 0) +
                       (section80C.pfContribution || 0) +
                       (section80C.elssInvestment || 0) +
                       (section80C.tuitionFees || 0) +
                       (section80C.homeLoanPrincipal || 0);
      totalDeductions += Math.min(150000, total80C);
    }

    if (filingData.deductions.section80D) {
      const section80D = filingData.deductions.section80D;
      const total80D = (section80D.medicalInsurance || 0) + (section80D.preventiveHealth || 0);
      totalDeductions += Math.min(25000, total80D);
    }

    if (filingData.deductions.hra) {
      totalDeductions += filingData.deductions.hra.claimedExemption || 0;
    }

    if (filingData.deductions.section80G) {
      totalDeductions += filingData.deductions.section80G.donations || 0;
    }

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    return { totalIncome, totalDeductions, taxableIncome };
  };

  const { totalIncome, totalDeductions, taxableIncome } = calculateTotals();
  const { errors, warnings, success } = getValidationSummary();

  // Check readiness for filing
  const isReadyForFiling = errors.length === 0;

  // Render section header
  const renderSectionHeader = (title, icon, sectionKey, count) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-burnblack-gold bg-opacity-20">
          {React.createElement(icon, { className: 'h-5 w-5 text-burnblack-gold' })}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-burnblack-black">{title}</h3>
          {count && (
            <p className="text-sm text-neutral-500">{count} items</p>
          )}
        </div>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="h-5 w-5 text-neutral-400" />
      ) : (
        <ChevronDown className="h-5 w-5 text-neutral-400" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card-burnblack p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-burnblack-gold bg-opacity-20">
            <CheckCircle className="h-6 w-6 text-burnblack-gold" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-burnblack-black">Review & Validation</h2>
            <p className="text-sm text-neutral-500">
              Final review before filing your ITR-1
            </p>
          </div>
        </div>

        {/* Validation Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-success-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span className="text-sm font-medium text-success-800">Passed</span>
            </div>
            <p className="text-lg font-bold text-success-900">{success.length}</p>
          </div>

          <div className="p-3 bg-warning-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              <span className="text-sm font-medium text-warning-800">Warnings</span>
            </div>
            <p className="text-lg font-bold text-warning-900">{warnings.length}</p>
          </div>

          <div className="p-3 bg-error-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-error-600" />
              <span className="text-sm font-medium text-error-800">Errors</span>
            </div>
            <p className="text-lg font-bold text-error-900">{errors.length}</p>
          </div>
        </div>
      </div>

      {/* Income Summary */}
      <div className="dashboard-card-burnblack">
        {renderSectionHeader('Income Summary', DollarSign, 'income',
          Object.keys(filingData.income || {}).length)}

        {expandedSections.income && (
          <div className="px-4 pb-4 space-y-4">
            {/* Salary Income */}
            {filingData.income.salary && (
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600">Salary Income</span>
                  <span className="text-sm font-semibold text-burnblack-black">
                    ₹{(() => {
                      const { basicSalary = 0, hra = 0, allowances = 0 } = filingData.income.salary;
                      return (basicSalary + hra + allowances).toLocaleString();
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* House Property */}
            {filingData.income.houseProperty && (
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600">House Property</span>
                  <span className="text-sm font-semibold text-burnblack-black">
                    ₹{(() => {
                      const { annualValue = 0, municipalTaxes = 0, interestOnLoan = 0, isSelfOccupied = false } = filingData.income.houseProperty;
                      const netAnnualValue = annualValue - municipalTaxes;

                      if (isSelfOccupied) {
                        return Math.max(-200000, -interestOnLoan).toLocaleString();
                      } else {
                        return (netAnnualValue - interestOnLoan).toLocaleString();
                      }
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Other Income */}
            {filingData.income.otherIncome && (
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600">Other Income</span>
                  <span className="text-sm font-semibold text-burnblack-black">
                    ₹{(() => {
                      const { bankInterest = 0, fdInterest = 0, dividendIncome = 0, otherSources = 0 } = filingData.income.otherIncome;
                      return (bankInterest + fdInterest + dividendIncome + otherSources).toLocaleString();
                    })()}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-burnblack-black">Total Income</span>
                <span className="text-xl font-bold text-burnblack-gold">
                  ₹{totalIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deductions Summary */}
      <div className="dashboard-card-burnblack">
        {renderSectionHeader('Deductions Summary', Shield, 'deductions',
          Object.keys(filingData.deductions || {}).length)}

        {expandedSections.deductions && (
          <div className="px-4 pb-4 space-y-4">
            {Object.entries(filingData.deductions || {}).map(([key, value]) => {
              if (!value || typeof value !== 'object') return null;

              let deductionAmount = 0;
              let deductionName = '';

              switch (key) {
                case 'section80C':
                  deductionAmount = Math.min(150000,
                    (value.licPremium || 0) + (value.ppfContribution || 0) +
                    (value.pfContribution || 0) + (value.elssInvestment || 0) +
                    (value.tuitionFees || 0) + (value.homeLoanPrincipal || 0));
                  deductionName = 'Section 80C';
                  break;
                case 'section80D':
                  deductionAmount = Math.min(25000,
                    (value.medicalInsurance || 0) + (value.preventiveHealth || 0));
                  deductionName = 'Section 80D';
                  break;
                case 'hra':
                  deductionAmount = value.claimedExemption || 0;
                  deductionName = 'HRA Exemption';
                  break;
                case 'section80G':
                  deductionAmount = value.donations || 0;
                  deductionName = 'Section 80G';
                  break;
                default:
                  return null;
              }

              if (deductionAmount === 0) return null;

              return (
                <div key={key} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-600">{deductionName}</span>
                    <span className="text-sm font-semibold text-burnblack-black">
                      ₹{deductionAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-burnblack-black">Total Deductions</span>
                <span className="text-xl font-bold text-burnblack-gold">
                  ₹{totalDeductions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Computation */}
      <div className="dashboard-card-burnblack">
        {renderSectionHeader('Tax Computation', TrendingUp, 'taxes', 1)}

        {expandedSections.taxes && (
          <div className="px-4 pb-4 space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-600">Taxable Income</span>
                <span className="text-sm font-semibold text-burnblack-black">
                  ₹{taxableIncome.toLocaleString()}
                </span>
              </div>
            </div>

            {filingData.taxComputation && (
              <>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-600">Total Tax</span>
                    <span className="text-sm font-semibold text-burnblack-black">
                      ₹{(filingData.taxComputation.totalTax || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-burnblack-black">
                      {filingData.taxComputation.netRefund > 0 ? 'Refund Due' : 'Tax Payable'}
                    </span>
                    <span className={`text-xl font-bold ${
                      filingData.taxComputation.netRefund > 0 ? 'text-success-600' : 'text-error-600'
                    }`}>
                      ₹{Math.abs(filingData.taxComputation.netRefund || filingData.taxComputation.netPayable || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Validation Results */}
      <div className="dashboard-card-burnblack">
        {renderSectionHeader('Validation Results', AlertCircle, 'validation', validationResults.length)}

        {expandedSections.validation && (
          <div className="px-4 pb-4 space-y-3">
            {validationResults.length === 0 ? (
              <div className="p-3 bg-success-50 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 text-success-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-success-800">All validations passed!</p>
                <p className="text-xs text-success-600">Your ITR-1 is ready for filing</p>
              </div>
            ) : (
              validationResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  result.severity === 'error' ? 'bg-error-50' :
                  result.severity === 'warning' ? 'bg-warning-50' : 'bg-success-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    {result.severity === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-error-600 mt-0.5" />
                    ) : result.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        result.severity === 'error' ? 'text-error-800' :
                        result.severity === 'warning' ? 'text-warning-800' : 'text-success-800'
                      }`}>
                        {result.field}: {result.error}
                      </p>
                      {result.suggestion && (
                        <p className={`text-xs mt-1 ${
                          result.severity === 'error' ? 'text-error-600' :
                          result.severity === 'warning' ? 'text-warning-600' : 'text-success-600'
                        }`}>
                          {result.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="dashboard-card-burnblack p-4">
          <h3 className="text-lg font-semibold text-burnblack-black mb-4">AI Recommendations</h3>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-burnblack-gold bg-opacity-10 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-burnblack-gold mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-burnblack-black">{suggestion.message}</p>
                    {suggestion.suggestion && (
                      <p className="text-xs text-neutral-600 mt-1">{suggestion.suggestion}</p>
                    )}
                    {suggestion.action && (
                      <button className="text-xs text-burnblack-gold font-medium mt-2 hover:underline">
                        {suggestion.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filing Readiness */}
      <div className={`dashboard-card-burnblack p-4 ${
        isReadyForFiling ? 'border-success-300' : 'border-error-300'
      }`}>
        <div className="flex items-center space-x-3">
          {isReadyForFiling ? (
            <CheckCircle className="h-6 w-6 text-success-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-error-600" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              isReadyForFiling ? 'text-success-800' : 'text-error-800'
            }`}>
              {isReadyForFiling ? 'Ready for Filing' : 'Action Required'}
            </h3>
            <p className={`text-sm ${
              isReadyForFiling ? 'text-success-600' : 'text-error-600'
            }`}>
              {isReadyForFiling
                ? 'All validations passed. You can proceed to file your ITR-1.'
                : `Please fix ${errors.length} error(s) before filing.`}
            </p>
          </div>
        </div>

        {!isReadyForFiling && (
          <div className="mt-4">
            <button
              onClick={() => onValidate()}
              disabled={isValidating}
              className="px-4 py-2 bg-burnblack-gold text-white rounded-lg hover:bg-burnblack-gold-dark transition-colors disabled:opacity-50"
            >
              {isValidating ? 'Re-validating...' : 'Re-validate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewValidation;
