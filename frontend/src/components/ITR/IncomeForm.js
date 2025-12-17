// =====================================================
// INCOME FORM COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../DesignSystem/components/Button';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';
import { enterpriseLogger } from '../../utils/logger';

const IncomeForm = ({ data = {}, onChange, onNext, onPrevious, itrType = 'ITR1' }) => {
  const [formData, setFormData] = useState({
    salary: {
      basicSalary: data.salary?.basicSalary || '',
      allowances: data.salary?.allowances || '',
      perquisites: data.salary?.perquisites || '',
      totalSalary: data.salary?.totalSalary || '',
    },
    houseProperty: {
      rentalIncome: data.houseProperty?.rentalIncome || '',
      municipalTaxes: data.houseProperty?.municipalTaxes || '',
      interestOnLoan: data.houseProperty?.interestOnLoan || '',
      netRentalIncome: data.houseProperty?.netRentalIncome || '',
    },
    capitalGains: {
      shortTerm: data.capitalGains?.shortTerm || '',
      longTerm: data.capitalGains?.longTerm || '',
      exemptLongTerm: data.capitalGains?.exemptLongTerm || '',
    },
    businessIncome: {
      grossReceipts: data.businessIncome?.grossReceipts || '',
      expenses: data.businessIncome?.expenses || '',
      netProfit: data.businessIncome?.netProfit || '',
    },
    otherIncome: {
      interest: data.otherIncome?.interest || '',
      dividend: data.otherIncome?.dividend || '',
      winnings: data.otherIncome?.winnings || '',
      other: data.otherIncome?.other || '',
    },
  });

  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const calculateTotalIncome = () => {
    let total = 0;

    // Salary income
    if (formData.salary.totalSalary) {
      total += parseFloat(formData.salary.totalSalary) || 0;
    }

    // House property income
    if (formData.houseProperty.netRentalIncome) {
      total += parseFloat(formData.houseProperty.netRentalIncome) || 0;
    }

    // Capital gains
    if (formData.capitalGains.shortTerm) {
      total += parseFloat(formData.capitalGains.shortTerm) || 0;
    }
    if (formData.capitalGains.longTerm) {
      total += parseFloat(formData.capitalGains.longTerm) || 0;
    }

    // Business income
    if (formData.businessIncome.netProfit) {
      total += parseFloat(formData.businessIncome.netProfit) || 0;
    }

    // Other income
    Object.values(formData.otherIncome).forEach(amount => {
      if (amount) {
        total += parseFloat(amount) || 0;
      }
    });

    return total;
  };

  const validateForm = () => {
    const newErrors = {};
    const totalIncome = calculateTotalIncome();

    // ITR-specific validations
    if (itrType === 'ITR1' || itrType === 'ITR-1') {
      // ITR1: Only salary and house property allowed
      if (formData.capitalGains.shortTerm || formData.capitalGains.longTerm) {
        newErrors.capitalGains = 'Capital gains not allowed in ITR-1. Please use ITR-2.';
      }
      if (formData.businessIncome.grossReceipts || formData.businessIncome.expenses || formData.businessIncome.netProfit) {
        newErrors.businessIncome = 'Business income not allowed in ITR-1. Please use ITR-3.';
      }

      // ITR-1 income limit: Max ₹50 lakhs
      if (totalIncome > 5000000) {
        newErrors.incomeLimit = `Total income (₹${totalIncome.toLocaleString('en-IN')}) exceeds ITR-1 limit of ₹50 lakhs. Please use ITR-2.`;
      }
    }

    if (itrType === 'ITR4') {
      // ITR4: Presumptive taxation - no detailed business income
      if (formData.businessIncome.grossReceipts || formData.businessIncome.expenses) {
        newErrors.businessIncome = 'Detailed business income not required for ITR-4. Use presumptive income section.';
      }
    }

    // ITR-2 specific validations
    if (itrType === 'ITR2' || itrType === 'ITR-2') {
      // ITR-2: Capital gains should have details if hasCapitalGains is true
      if (formData.capitalGains?.hasCapitalGains &&
          (!formData.capitalGains.stcgDetails || formData.capitalGains.stcgDetails.length === 0) &&
          (!formData.capitalGains.ltcgDetails || formData.capitalGains.ltcgDetails.length === 0)) {
        newErrors.capitalGains = 'Please add capital gains details if you have capital gains.';
      }

      // ITR-2: Multiple house properties validation (max 2 self-occupied)
      if (formData.houseProperty?.properties) {
        const selfOccupiedCount = formData.houseProperty.properties.filter(
          prop => prop.propertyType === 'self_occupied',
        ).length;
        if (selfOccupiedCount > 2) {
          newErrors.houseProperty = 'Maximum 2 self-occupied properties allowed.';
        }
      }

      // ITR-2: Foreign income validation - currency conversion required
      if (formData.foreignIncome?.hasForeignIncome && formData.foreignIncome.foreignIncomeDetails) {
        formData.foreignIncome.foreignIncomeDetails.forEach((entry, index) => {
          if (entry.amount > 0 && (!entry.exchangeRate || entry.exchangeRate <= 0)) {
            newErrors[`foreignIncome_${index}`] = 'Exchange rate is required for foreign income.';
          }
          if (entry.amount > 0 && entry.dtaaApplicable && !entry.taxPaidAbroad) {
            newErrors[`foreignIncome_tax_${index}`] = 'Tax paid abroad is required if DTAA is applicable.';
          }
        });
      }

      // ITR-2: Director/Partner income validation
      if (formData.directorPartner?.isDirector && (!formData.directorPartner.directorIncome || formData.directorPartner.directorIncome <= 0)) {
        newErrors.directorPartner = 'Director income amount is required if you are a director.';
      }
      if (formData.directorPartner?.isPartner && (!formData.directorPartner.partnerIncome || formData.directorPartner.partnerIncome <= 0)) {
        newErrors.directorPartner = 'Partner income amount is required if you are a partner.';
      }
    }

    // Required field validations based on ITR type
    if ((itrType === 'ITR1' || itrType === 'ITR-1') && !formData.salary.totalSalary && !formData.houseProperty.netRentalIncome) {
      newErrors.general = 'Please provide at least salary or house property income for ITR-1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation on input change
  useEffect(() => {
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateForm();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, itrType]);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleNext = async () => {
    setIsValidating(true);
    const isValid = validateForm();

    if (isValid) {
      enterpriseLogger.info('Income form validated successfully', { itrType, totalIncome: calculateTotalIncome() });
      onNext && onNext();
    } else {
      enterpriseLogger.warn('Income form validation failed', { errors });
    }
    setIsValidating(false);
  };

  const handlePrevious = () => {
    onPrevious && onPrevious();
  };

  const renderSalarySection = () => (
    <div className="form-section">
      <h3>Salary Income</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="basicSalary">
            Basic Salary
            <Tooltip content="Basic salary as per Form 16">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="basicSalary"
            type="number"
            value={formData.salary.basicSalary}
            onChange={(e) => handleInputChange('salary', 'basicSalary', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="allowances">
            Allowances
            <Tooltip content="House rent allowance, transport allowance, etc.">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="allowances"
            type="number"
            value={formData.salary.allowances}
            onChange={(e) => handleInputChange('salary', 'allowances', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="perquisites">
          Perquisites
          <Tooltip content="Company car, accommodation, etc.">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="perquisites"
          type="number"
          value={formData.salary.perquisites}
          onChange={(e) => handleInputChange('salary', 'perquisites', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="totalSalary">
          Total Salary Income *
          <Tooltip content="Total salary income from Form 16">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="totalSalary"
          type="number"
          value={formData.salary.totalSalary}
          onChange={(e) => handleInputChange('salary', 'totalSalary', e.target.value)}
          placeholder="0"
          required
        />
      </div>
    </div>
  );

  const renderHousePropertySection = () => (
    <div className="form-section">
      <h3>House Property Income</h3>

      <div className="form-group">
        <label htmlFor="rentalIncome">
          Rental Income
          <Tooltip content="Gross rental income received">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="rentalIncome"
          type="number"
          value={formData.houseProperty.rentalIncome}
          onChange={(e) => handleInputChange('houseProperty', 'rentalIncome', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="municipalTaxes">
            Municipal Taxes
            <Tooltip content="Municipal taxes paid">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="municipalTaxes"
            type="number"
            value={formData.houseProperty.municipalTaxes}
            onChange={(e) => handleInputChange('houseProperty', 'municipalTaxes', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="interestOnLoan">
            Interest on Home Loan
            <Tooltip content="Interest paid on home loan">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="interestOnLoan"
            type="number"
            value={formData.houseProperty.interestOnLoan}
            onChange={(e) => handleInputChange('houseProperty', 'interestOnLoan', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="netRentalIncome">
          Net Rental Income
          <Tooltip content="Rental income after deductions">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="netRentalIncome"
          type="number"
          value={formData.houseProperty.netRentalIncome}
          onChange={(e) => handleInputChange('houseProperty', 'netRentalIncome', e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderCapitalGainsSection = () => (
    <div className="form-section">
      <h3>Capital Gains</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="shortTermCapitalGains">
            Short-term Capital Gains
            <Tooltip content="Capital gains from assets held for less than 1 year">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="shortTermCapitalGains"
            type="number"
            value={formData.capitalGains.shortTerm}
            onChange={(e) => handleInputChange('capitalGains', 'shortTerm', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="longTermCapitalGains">
            Long-term Capital Gains
            <Tooltip content="Capital gains from assets held for more than 1 year">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="longTermCapitalGains"
            type="number"
            value={formData.capitalGains.longTerm}
            onChange={(e) => handleInputChange('capitalGains', 'longTerm', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="exemptLongTerm">
          Exempt Long-term Capital Gains
          <Tooltip content="Long-term capital gains exempt under Section 54, 54B, etc.">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="exemptLongTerm"
          type="number"
          value={formData.capitalGains.exemptLongTerm}
          onChange={(e) => handleInputChange('capitalGains', 'exemptLongTerm', e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderBusinessIncomeSection = () => (
    <div className="form-section">
      <h3>Business Income</h3>

      <div className="form-group">
        <label htmlFor="grossReceipts">
          Gross Receipts
          <Tooltip content="Total business receipts">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="grossReceipts"
          type="number"
          value={formData.businessIncome.grossReceipts}
          onChange={(e) => handleInputChange('businessIncome', 'grossReceipts', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="expenses">
          Business Expenses
          <Tooltip content="Total business expenses">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="expenses"
          type="number"
          value={formData.businessIncome.expenses}
          onChange={(e) => handleInputChange('businessIncome', 'expenses', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="netProfit">
          Net Profit
          <Tooltip content="Net profit from business">
            <span className="help-icon">?</span>
          </Tooltip>
        </label>
        <input
          id="netProfit"
          type="number"
          value={formData.businessIncome.netProfit}
          onChange={(e) => handleInputChange('businessIncome', 'netProfit', e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderOtherIncomeSection = () => (
    <div className="form-section">
      <h3>Other Income</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="interestIncome">
            Interest Income
            <Tooltip content="Interest from savings, FD, etc.">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="interestIncome"
            type="number"
            value={formData.otherIncome.interest}
            onChange={(e) => handleInputChange('otherIncome', 'interest', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dividendIncome">
            Dividend Income
            <Tooltip content="Dividend from shares, mutual funds">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="dividendIncome"
            type="number"
            value={formData.otherIncome.dividend}
            onChange={(e) => handleInputChange('otherIncome', 'dividend', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="winnings">
            Winnings
            <Tooltip content="Lottery, gambling winnings">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="winnings"
            type="number"
            value={formData.otherIncome.winnings}
            onChange={(e) => handleInputChange('otherIncome', 'winnings', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="otherIncome">
            Other Income
            <Tooltip content="Any other income not covered above">
              <span className="help-icon">?</span>
            </Tooltip>
          </label>
          <input
            id="otherIncome"
            type="number"
            value={formData.otherIncome.other}
            onChange={(e) => handleInputChange('otherIncome', 'other', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="income-form">
      <Card className="form-card">
        <div className="form-header">
          <h2>Income Details - {itrType}</h2>
          <p>Enter your income details for the assessment year</p>
        </div>

        <div className="form-content">
          {renderSalarySection()}
          {renderHousePropertySection()}

          {/* Capital Gains - Only for ITR-2 and ITR-3, NOT for ITR-1 */}
          {(itrType === 'ITR-2' || itrType === 'ITR2' || itrType === 'ITR-3' || itrType === 'ITR3') && renderCapitalGainsSection()}

          {/* Business Income - Only for ITR-3, NOT for ITR-1 */}
          {(itrType === 'ITR-3' || itrType === 'ITR3') && renderBusinessIncomeSection()}

          {renderOtherIncomeSection()}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="validation-errors bg-error-50 border border-red-200 rounded-xl p-4 mt-4">
            <h4 className="font-semibold text-red-800 mb-2">Validation Errors:</h4>
            {Object.entries(errors).map(([key, error]) => (
              <div key={key} className="error-message text-error-700 text-body-regular mb-1 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        <div className="income-summary">
          <h3>Total Income: ₹{calculateTotalIncome().toLocaleString()}</h3>
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isValidating}
          >
            Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={isValidating}
            loading={isValidating}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default IncomeForm;
