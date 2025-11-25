// =====================================================
// TAX SUMMARY PANEL COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';
import { enterpriseLogger } from '../../utils/logger';

const TaxSummaryPanel = ({
  incomeData = {},
  deductionData = {},
  personalInfo = {},
  onCompute,
  onNext,
  onPrevious,
  computation = null,
  loading = false,
}) => {
  const [taxComputation, setTaxComputation] = useState(computation);
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (computation) {
      setTaxComputation(computation);
    }
  }, [computation]);

  const calculateGrossTotalIncome = () => {
    let total = 0;

    // Salary income
    if (incomeData.salary?.totalSalary) {
      total += parseFloat(incomeData.salary.totalSalary) || 0;
    }

    // House property income
    if (incomeData.houseProperty?.netRentalIncome) {
      total += parseFloat(incomeData.houseProperty.netRentalIncome) || 0;
    }

    // Capital gains
    if (incomeData.capitalGains?.shortTerm) {
      total += parseFloat(incomeData.capitalGains.shortTerm) || 0;
    }
    if (incomeData.capitalGains?.longTerm) {
      total += parseFloat(incomeData.capitalGains.longTerm) || 0;
    }

    // Business income
    if (incomeData.businessIncome?.netProfit) {
      total += parseFloat(incomeData.businessIncome.netProfit) || 0;
    }

    // Other income
    Object.values(incomeData.otherIncome || {}).forEach(amount => {
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
      Object.values(deductionData.section80C || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      150000,
    );
    total += total80C;

    // Section 80D (max ₹25,000)
    const total80D = Math.min(
      Object.values(deductionData.section80D || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      25000,
    );
    total += total80D;

    // Other deductions
    total += parseFloat(deductionData.section80E?.educationLoanInterest) || 0;
    total += parseFloat(deductionData.section80G?.donations) || 0;
    total += Math.min(parseFloat(deductionData.section80TTA?.savingsInterest) || 0, 10000);
    total += Math.min(parseFloat(deductionData.section80TTB?.bankInterest) || 0, 50000);
    total += Math.min(parseFloat(deductionData.section24?.homeLoanInterest) || 0, 200000);

    // Other deductions
    total += parseFloat(deductionData.otherDeductions?.standardDeduction) || 0;
    total += parseFloat(deductionData.otherDeductions?.hra) || 0;
    total += parseFloat(deductionData.otherDeductions?.lta) || 0;
    total += parseFloat(deductionData.otherDeductions?.medicalReimbursement) || 0;

    return total;
  };

  const calculateTax = (taxableIncome) => {
    let tax = 0;

    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 750000) {
      tax = 12500 + (taxableIncome - 500000) * 0.10;
    } else if (taxableIncome <= 1000000) {
      tax = 37500 + (taxableIncome - 750000) * 0.15;
    } else if (taxableIncome <= 1250000) {
      tax = 75000 + (taxableIncome - 1000000) * 0.20;
    } else if (taxableIncome <= 1500000) {
      tax = 125000 + (taxableIncome - 1250000) * 0.25;
    } else {
      tax = 187500 + (taxableIncome - 1500000) * 0.30;
    }

    return tax;
  };

  const calculateCess = (tax) => {
    return tax * 0.04; // 4% cess
  };

  const computeTax = async () => {
    try {
      setIsComputing(true);

      const grossTotalIncome = calculateGrossTotalIncome();
      const totalDeductions = calculateTotalDeductions();
      const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

      const tax = calculateTax(taxableIncome);
      const cess = calculateCess(tax);
      const totalTax = tax + cess;

      const computation = {
        grossTotalIncome,
        totalDeductions,
        taxableIncome,
        tax,
        cess,
        totalTax,
        effectiveRate: grossTotalIncome > 0 ? (totalTax / grossTotalIncome) * 100 : 0,
        taxSlabs: [
          { slab: '0 - 2,50,000', rate: '0%', amount: 0 },
          { slab: '2,50,001 - 5,00,000', rate: '5%', amount: Math.min(taxableIncome - 250000, 250000) * 0.05 },
          { slab: '5,00,001 - 7,50,000', rate: '10%', amount: Math.min(taxableIncome - 500000, 250000) * 0.10 },
          { slab: '7,50,001 - 10,00,000', rate: '15%', amount: Math.min(taxableIncome - 750000, 250000) * 0.15 },
          { slab: '10,00,001 - 12,50,000', rate: '20%', amount: Math.min(taxableIncome - 1000000, 250000) * 0.20 },
          { slab: '12,50,001 - 15,00,000', rate: '25%', amount: Math.min(taxableIncome - 1250000, 250000) * 0.25 },
          { slab: 'Above 15,00,000', rate: '30%', amount: Math.max(0, taxableIncome - 1500000) * 0.30 },
        ].filter(slab => slab.amount > 0),
      };

      setTaxComputation(computation);

      if (onCompute) {
        onCompute(computation);
      }

      enterpriseLogger.info('Tax computation completed', {
        grossTotalIncome,
        totalDeductions,
        taxableIncome,
        totalTax,
      });

    } catch (error) {
      enterpriseLogger.error('Tax computation failed', { error: error.message });
    } finally {
      setIsComputing(false);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  const renderIncomeBreakdown = () => (
    <div className="income-breakdown">
      <h3>Income Breakdown</h3>
      <div className="breakdown-item">
        <span>Salary Income:</span>
        <span>₹{(parseFloat(incomeData.salary?.totalSalary) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>House Property Income:</span>
        <span>₹{(parseFloat(incomeData.houseProperty?.netRentalIncome) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Capital Gains:</span>
        <span>₹{((parseFloat(incomeData.capitalGains?.shortTerm) || 0) + (parseFloat(incomeData.capitalGains?.longTerm) || 0)).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Business Income:</span>
        <span>₹{(parseFloat(incomeData.businessIncome?.netProfit) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Other Income:</span>
        <span>₹{Object.values(incomeData.otherIncome || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item total">
        <span>Gross Total Income:</span>
        <span>₹{calculateGrossTotalIncome().toLocaleString()}</span>
      </div>
    </div>
  );

  const renderDeductionBreakdown = () => (
    <div className="deduction-breakdown">
      <h3>Deduction Breakdown</h3>
      <div className="breakdown-item">
        <span>Section 80C:</span>
        <span>₹{Math.min(Object.values(deductionData.section80C || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), 150000).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Section 80D:</span>
        <span>₹{Math.min(Object.values(deductionData.section80D || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), 25000).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Section 80E:</span>
        <span>₹{(parseFloat(deductionData.section80E?.educationLoanInterest) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Section 80G:</span>
        <span>₹{(parseFloat(deductionData.section80G?.donations) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>Standard Deduction:</span>
        <span>₹{(parseFloat(deductionData.otherDeductions?.standardDeduction) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item">
        <span>HRA:</span>
        <span>₹{(parseFloat(deductionData.otherDeductions?.hra) || 0).toLocaleString()}</span>
      </div>
      <div className="breakdown-item total">
        <span>Total Deductions:</span>
        <span>₹{calculateTotalDeductions().toLocaleString()}</span>
      </div>
    </div>
  );

  const renderTaxComputation = () => {
    if (!taxComputation) return null;

    return (
      <div className="tax-computation">
        <h3>Tax Computation</h3>

        <div className="computation-summary">
          <div className="computation-item">
            <span>Gross Total Income:</span>
            <span>₹{taxComputation.grossTotalIncome.toLocaleString()}</span>
          </div>
          <div className="computation-item">
            <span>Total Deductions:</span>
            <span>₹{taxComputation.totalDeductions.toLocaleString()}</span>
          </div>
          <div className="computation-item">
            <span>Taxable Income:</span>
            <span>₹{taxComputation.taxableIncome.toLocaleString()}</span>
          </div>
          <div className="computation-item">
            <span>Income Tax:</span>
            <span>₹{taxComputation.tax.toLocaleString()}</span>
          </div>
          <div className="computation-item">
            <span>Cess (4%):</span>
            <span>₹{taxComputation.cess.toLocaleString()}</span>
          </div>
          <div className="computation-item total">
            <span>Total Tax:</span>
            <span>₹{taxComputation.totalTax.toLocaleString()}</span>
          </div>
          <div className="computation-item">
            <span>Effective Tax Rate:</span>
            <span>{taxComputation.effectiveRate.toFixed(2)}%</span>
          </div>
        </div>

        <div className="tax-slabs">
          <h4>Tax Slabs Applied</h4>
          {taxComputation.taxSlabs.map((slab, index) => (
            <div key={index} className="slab-item">
              <span>{slab.slab}</span>
              <span>{slab.rate}</span>
              <span>₹{slab.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="tax-summary-panel">
      <Card className="form-card">
        <div className="form-header">
          <h2>Tax Computation Summary</h2>
          <p>Review your income, deductions, and calculated tax liability</p>
        </div>

        <div className="form-content">
          <div className="summary-grid">
            <div className="summary-column">
              {renderIncomeBreakdown()}
            </div>
            <div className="summary-column">
              {renderDeductionBreakdown()}
            </div>
          </div>

          <div className="computation-section">
            <div className="computation-header">
              <h3>Tax Computation</h3>
              <Button
                variant="primary"
                onClick={computeTax}
                loading={isComputing || loading}
                disabled={isComputing || loading}
              >
                {isComputing ? 'Computing...' : 'Compute Tax'}
              </Button>
            </div>

            {taxComputation && renderTaxComputation()}
          </div>
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isComputing}
          >
            Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={isComputing || !taxComputation}
          >
            Review & Submit
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TaxSummaryPanel;
