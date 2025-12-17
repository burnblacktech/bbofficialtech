// =====================================================
// REVIEW FORM COMPONENT
// =====================================================

import React from 'react';
import Button from '../DesignSystem/components/Button';
import Card from '../common/Card';
import { enterpriseLogger } from '../../utils/logger';

const ReviewForm = ({
  data = {},
  onSave,
  onSubmit,
  onPrevious,
  taxComputation = null,
  loading = false,
}) => {

  const calculateTotalIncome = () => {
    let total = 0;

    // Salary income
    if (data.income?.salary?.totalSalary) {
      total += parseFloat(data.income.salary.totalSalary) || 0;
    }

    // House property income
    if (data.income?.houseProperty?.netRentalIncome) {
      total += parseFloat(data.income.houseProperty.netRentalIncome) || 0;
    }

    // Capital gains
    if (data.income?.capitalGains?.shortTerm) {
      total += parseFloat(data.income.capitalGains.shortTerm) || 0;
    }
    if (data.income?.capitalGains?.longTerm) {
      total += parseFloat(data.income.capitalGains.longTerm) || 0;
    }

    // Business income
    if (data.income?.businessIncome?.netProfit) {
      total += parseFloat(data.income.businessIncome.netProfit) || 0;
    }

    // Other income
    Object.values(data.income?.otherIncome || {}).forEach(amount => {
      if (amount) {
        total += parseFloat(amount) || 0;
      }
    });

    return total;
  };

  const calculateTotalDeductions = () => {
    let total = 0;

    // Section 80C (max ₹1,50,000)
    const total80C = Math.min(
      Object.values(data.deductions?.section80C || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      150000,
    );
    total += total80C;

    // Section 80D (max ₹25,000)
    const total80D = Math.min(
      Object.values(data.deductions?.section80D || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      25000,
    );
    total += total80D;

    // Other deductions
    total += parseFloat(data.deductions?.section80E?.educationLoanInterest) || 0;
    total += parseFloat(data.deductions?.section80G?.donations) || 0;
    total += Math.min(parseFloat(data.deductions?.section80TTA?.savingsInterest) || 0, 10000);
    total += Math.min(parseFloat(data.deductions?.section80TTB?.bankInterest) || 0, 50000);
    total += Math.min(parseFloat(data.deductions?.section24?.homeLoanInterest) || 0, 200000);

    // Other deductions
    total += parseFloat(data.deductions?.otherDeductions?.standardDeduction) || 0;
    total += parseFloat(data.deductions?.otherDeductions?.hra) || 0;
    total += parseFloat(data.deductions?.otherDeductions?.lta) || 0;
    total += parseFloat(data.deductions?.otherDeductions?.medicalReimbursement) || 0;

    return total;
  };

  const handleSave = async () => {
    try {
      await onSave();
      enterpriseLogger.info('Draft saved from review form');
    } catch (error) {
      enterpriseLogger.error('Failed to save draft from review form', { error: error.message });
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit();
      enterpriseLogger.info('ITR submitted from review form');
    } catch (error) {
      enterpriseLogger.error('Failed to submit ITR from review form', { error: error.message });
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="review-form">
      <Card className="form-card">
        <div className="form-header">
          <h2>Review & Submit</h2>
          <p>Please review your information before submitting your ITR</p>
        </div>

        <div className="form-content">
          {/* Personal Information Review */}
          <div className="review-section">
            <h3>Personal Information</h3>
            <div className="review-grid">
              <div className="review-item">
                <span className="label">Name:</span>
                <span className="value">
                  {data.personalInfo?.firstName} {data.personalInfo?.lastName}
                </span>
              </div>
              <div className="review-item">
                <span className="label">PAN:</span>
                <span className="value">{data.personalInfo?.panNumber}</span>
              </div>
              <div className="review-item">
                <span className="label">Date of Birth:</span>
                <span className="value">{data.personalInfo?.dateOfBirth}</span>
              </div>
              <div className="review-item">
                <span className="label">Gender:</span>
                <span className="value">{data.personalInfo?.gender}</span>
              </div>
              <div className="review-item">
                <span className="label">Marital Status:</span>
                <span className="value">{data.personalInfo?.maritalStatus}</span>
              </div>
              <div className="review-item">
                <span className="label">Phone:</span>
                <span className="value">{data.personalInfo?.contact?.phone}</span>
              </div>
              <div className="review-item">
                <span className="label">Email:</span>
                <span className="value">{data.personalInfo?.contact?.email}</span>
              </div>
            </div>
          </div>

          {/* Income Summary */}
          <div className="review-section">
            <h3>Income Summary</h3>
            <div className="review-grid">
              <div className="review-item">
                <span className="label">Salary Income:</span>
                <span className="value">
                  ₹{(parseFloat(data.income?.salary?.totalSalary) || 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">House Property Income:</span>
                <span className="value">
                  ₹{(parseFloat(data.income?.houseProperty?.netRentalIncome) || 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">Capital Gains:</span>
                <span className="value">
                  ₹{((parseFloat(data.income?.capitalGains?.shortTerm) || 0) + (parseFloat(data.income?.capitalGains?.longTerm) || 0)).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">Business Income:</span>
                <span className="value">
                  ₹{(parseFloat(data.income?.businessIncome?.netProfit) || 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">Other Income:</span>
                <span className="value">
                  ₹{Object.values(data.income?.otherIncome || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item total">
                <span className="label">Total Income:</span>
                <span className="value">₹{calculateTotalIncome().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions Summary */}
          <div className="review-section">
            <h3>Deductions Summary</h3>
            <div className="review-grid">
              <div className="review-item">
                <span className="label">Section 80C:</span>
                <span className="value">
                  ₹{Math.min(Object.values(data.deductions?.section80C || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), 150000).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">Section 80D:</span>
                <span className="value">
                  ₹{Math.min(Object.values(data.deductions?.section80D || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), 25000).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">Standard Deduction:</span>
                <span className="value">
                  ₹{(parseFloat(data.deductions?.otherDeductions?.standardDeduction) || 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item">
                <span className="label">HRA:</span>
                <span className="value">
                  ₹{(parseFloat(data.deductions?.otherDeductions?.hra) || 0).toLocaleString()}
                </span>
              </div>
              <div className="review-item total">
                <span className="label">Total Deductions:</span>
                <span className="value">₹{calculateTotalDeductions().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Tax Computation Summary */}
          {taxComputation && (
            <div className="review-section">
              <h3>Tax Computation</h3>
              <div className="review-grid">
                <div className="review-item">
                  <span className="label">Taxable Income:</span>
                  <span className="value">₹{taxComputation.taxableIncome?.toLocaleString()}</span>
                </div>
                <div className="review-item">
                  <span className="label">Income Tax:</span>
                  <span className="value">₹{taxComputation.tax?.toLocaleString()}</span>
                </div>
                <div className="review-item">
                  <span className="label">Cess (4%):</span>
                  <span className="value">₹{taxComputation.cess?.toLocaleString()}</span>
                </div>
                <div className="review-item total">
                  <span className="label">Total Tax:</span>
                  <span className="value">₹{taxComputation.totalTax?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Declaration */}
          <div className="review-section">
            <h3>Declaration</h3>
            <div className="declaration">
              <p>
                I hereby declare that the information provided in this return is true and correct
                to the best of my knowledge and belief. I understand that any false information
                provided may result in penalties under the Income Tax Act, 1961.
              </p>
              <div className="declaration-checkbox">
                <input type="checkbox" id="declaration" required />
                <label htmlFor="declaration">
                  I agree to the above declaration and confirm that all information is correct.
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={loading}
          >
            Previous
          </Button>

          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={loading}
            loading={loading}
          >
            Save Draft
          </Button>

          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading || !document.getElementById('declaration')?.checked}
            loading={loading}
          >
            Submit ITR
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReviewForm;
