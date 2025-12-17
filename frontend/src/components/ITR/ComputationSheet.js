// =====================================================
// COMPUTATION SHEET COMPONENT
// Single comprehensive computation sheet showing balanced view
// of all ITR metrics with data source indicators
// =====================================================

import React, { useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calculator,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import ProvenanceChip from './ProvenanceChip';
import IncomeBreakdown from './IncomeBreakdown';
import DeductionBreakdown from './DeductionBreakdown';

const ComputationSheet = ({
  formData,
  taxComputation,
  autoFilledFields = {},
  sources = {},
  onRefresh,
  isRefreshing = false,
}) => {
  const getFieldSource = (section, field) => {
    if (!autoFilledFields[section]?.includes(field)) {
      return 'manual';
    }
    if (sources.ais?.available && (section === 'income' || section === 'taxesPaid')) {
      return 'ais';
    }
    if (sources.form26as?.available && (section === 'income' || section === 'taxesPaid')) {
      return 'form26as';
    }
    if (sources.eri?.available) {
      return 'eri';
    }
    if (sources.userProfile?.available && section === 'personalInfo') {
      return 'userProfile';
    }
    return 'auto-filled';
  };

  const getFieldSourceInfo = (section, field) => {
    const source = getFieldSource(section, field);
    const sourceData = sources[source] || {};

    return {
      source,
      sourceDocument: sourceData.documentName || null,
      lastSync: sourceData.lastSync || null,
      confidence: sourceData.confidence || 0.9,
      isEdited: !autoFilledFields[section]?.includes(field),
      requiresCAReview: false, // Can be enhanced based on field sensitivity
    };
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const calculateGrossTotalIncome = () => {
    const income = formData.income || {};
    return (
      (income.salary || 0) +
      (income.businessIncome || 0) +
      (income.professionalIncome || 0) +
      (income.capitalGains || 0) +
      (income.interestIncome || 0) +
      (income.dividendIncome || 0) +
      (income.otherIncome || 0)
    );
  };

  const calculateTotalDeductions = () => {
    const deductions = formData.deductions || {};
    return (
      Math.min(deductions.section80C || 0, 150000) +
      (deductions.section80D || 0) +
      (deductions.section80G || 0) +
      (deductions.section80TTA || 0) +
      (deductions.section80TTB || 0) +
      (deductions.otherDeductions || 0)
    );
  };

  const grossTotalIncome = calculateGrossTotalIncome();
  const totalDeductions = calculateTotalDeductions();
  const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-heading-3 font-bold text-slate-900">Computation Sheet</h2>
          <p className="text-body-regular text-slate-500 mt-1">FY 2024-25 - Complete Summary</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 text-body-regular text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Income Summary */}
      <div className="space-y-3">
        <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
          <IndianRupee className="w-5 h-5 mr-2 text-blue-600" />
          Income Summary
        </h3>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          {formData.income?.salary > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Salary</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.salary)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'salary')} fieldPath="income.salary" />
              </div>
            </div>
          )}
          {formData.income?.businessIncome > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Business Income</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.businessIncome)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'businessIncome')} fieldPath="income.businessIncome" />
              </div>
            </div>
          )}
          {formData.income?.professionalIncome > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Professional Income</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.professionalIncome)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'professionalIncome')} fieldPath="income.professionalIncome" />
              </div>
            </div>
          )}
          {(() => {
            // Handle capital gains - can be number or structured object (ITR-2)
            let capitalGainsAmount = 0;
            if (formData.income?.capitalGains) {
              if (typeof formData.income.capitalGains === 'object' && formData.income.capitalGains.stcgDetails) {
                const stcgTotal = (formData.income.capitalGains.stcgDetails || []).reduce(
                  (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
                  0,
                );
                const ltcgTotal = (formData.income.capitalGains.ltcgDetails || []).reduce(
                  (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
                  0,
                );
                capitalGainsAmount = stcgTotal + ltcgTotal;
              } else {
                capitalGainsAmount = parseFloat(formData.income.capitalGains) || 0;
              }
            }
            return capitalGainsAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Capital Gains</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{formatCurrency(capitalGainsAmount)}</span>
                  <ProvenanceChip {...getFieldSourceInfo('income', 'capitalGains')} fieldPath="income.capitalGains" />
                </div>
              </div>
            ) : null;
          })()}
          {(() => {
            // Handle house property - can be array or structured object (ITR-2)
            let housePropertyAmount = 0;
            if (formData.income?.houseProperty) {
              if (Array.isArray(formData.income.houseProperty)) {
                housePropertyAmount = formData.income.houseProperty.reduce(
                  (sum, prop) => sum + (parseFloat(prop.netRentalIncome) || 0),
                  0,
                );
              } else if (formData.income.houseProperty.properties) {
                housePropertyAmount = formData.income.houseProperty.properties.reduce((sum, prop) => {
                  const rentalIncome = parseFloat(prop.annualRentalIncome) || 0;
                  const municipalTaxes = parseFloat(prop.municipalTaxes) || 0;
                  const interestOnLoan = parseFloat(prop.interestOnLoan) || 0;
                  return sum + Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
                }, 0);
              }
            }
            return housePropertyAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">House Property</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{formatCurrency(housePropertyAmount)}</span>
                  <ProvenanceChip {...getFieldSourceInfo('income', 'houseProperty')} fieldPath="income.houseProperty" />
                </div>
              </div>
            ) : null;
          })()}
          {(() => {
            // Handle foreign income (ITR-2)
            let foreignIncomeAmount = 0;
            if (formData.income?.foreignIncome?.foreignIncomeDetails) {
              foreignIncomeAmount = (formData.income.foreignIncome.foreignIncomeDetails || []).reduce(
                (sum, entry) => sum + (parseFloat(entry.amountInr) || 0),
                0,
              );
            }
            return foreignIncomeAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Foreign Income</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{formatCurrency(foreignIncomeAmount)}</span>
                  <ProvenanceChip {...getFieldSourceInfo('income', 'foreignIncome')} fieldPath="income.foreignIncome" />
                </div>
              </div>
            ) : null;
          })()}
          {(() => {
            // Handle director/partner income (ITR-2)
            const directorPartnerAmount =
              (formData.income?.directorPartner?.directorIncome || 0) +
              (formData.income?.directorPartner?.partnerIncome || 0);
            return directorPartnerAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Director/Partner Income</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{formatCurrency(directorPartnerAmount)}</span>
                  <ProvenanceChip {...getFieldSourceInfo('income', 'directorPartner')} fieldPath="income.directorPartner" />
                </div>
              </div>
            ) : null;
          })()}
          {formData.income?.interestIncome > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Interest Income</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.interestIncome)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'interestIncome')} fieldPath="income.interestIncome" />
              </div>
            </div>
          )}
          {formData.income?.dividendIncome > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Dividend Income</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.dividendIncome)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'dividendIncome')} fieldPath="income.dividendIncome" />
              </div>
            </div>
          )}
          {formData.income?.otherIncome > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Other Income</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.income.otherIncome)}</span>
                <ProvenanceChip {...getFieldSourceInfo('income', 'otherIncome')} fieldPath="income.otherIncome" />
              </div>
            </div>
          )}
          <div className="border-t border-slate-300 pt-2 mt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Gross Total Income</span>
            <span className="text-heading-3 font-bold text-slate-900">{formatCurrency(grossTotalIncome)}</span>
          </div>
        </div>

        {/* Granular Income Breakdown */}
        <div className="mt-4">
          <IncomeBreakdown formData={formData} selectedITR={formData.itrType} />
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="space-y-3">
        <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
          <TrendingDown className="w-5 h-5 mr-2 text-green-600" />
          Deductions Summary
        </h3>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          {formData.deductions?.section80C > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Section 80C</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.section80C)}</span>
                <ProvenanceChip {...getFieldSourceInfo('deductions', 'section80C')} fieldPath="deductions.section80C" />
              </div>
            </div>
          )}
          {formData.deductions?.section80D > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Section 80D</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.section80D)}</span>
                <ProvenanceChip {...getFieldSourceInfo('deductions', 'section80D')} fieldPath="deductions.section80D" />
              </div>
            </div>
          )}
          {formData.deductions?.section80G > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Section 80G</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.section80G)}</span>
                <ProvenanceChip {...getFieldSourceInfo('deductions', 'section80G')} fieldPath="deductions.section80G" />
              </div>
            </div>
          )}
          {(formData.deductions?.section80TTA > 0 || formData.deductions?.section80TTB > 0) && (
            <>
              {formData.deductions?.section80TTA > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Section 80TTA</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.section80TTA)}</span>
                    <ProvenanceChip {...getFieldSourceInfo('deductions', 'section80TTA')} fieldPath="deductions.section80TTA" />
                  </div>
                </div>
              )}
              {formData.deductions?.section80TTB > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Section 80TTB</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.section80TTB)}</span>
                    <ProvenanceChip {...getFieldSourceInfo('deductions', 'section80TTB')} fieldPath="deductions.section80TTB" />
                  </div>
                </div>
              )}
            </>
          )}
          {formData.deductions?.otherDeductions > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Other Deductions</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.deductions.otherDeductions)}</span>
                <ProvenanceChip {...getFieldSourceInfo('deductions', 'otherDeductions')} fieldPath="deductions.otherDeductions" />
              </div>
            </div>
          )}
          <div className="border-t border-slate-300 pt-2 mt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total Deductions</span>
            <span className="text-heading-3 font-bold text-slate-900">{formatCurrency(totalDeductions)}</span>
          </div>
        </div>

        {/* Granular Deduction Breakdown */}
        <div className="mt-4">
          <DeductionBreakdown formData={formData} />
        </div>
      </div>

      {/* Tax Computation */}
      {taxComputation && (
        <div className="space-y-3">
          <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-purple-600" />
            Tax Computation
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Taxable Income</span>
              <span className="font-semibold text-slate-900">{formatCurrency(taxableIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Tax on Income</span>
              <span className="font-semibold text-slate-900">{formatCurrency(taxComputation.taxLiability || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Cess (4%)</span>
              <span className="font-semibold text-slate-900">{formatCurrency(taxComputation.cess || 0)}</span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Total Tax Liability</span>
              <span className="text-heading-3 font-bold text-slate-900">{formatCurrency(taxComputation.totalTaxLiability || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Taxes Paid */}
      <div className="space-y-3">
        <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
          Taxes Paid
        </h3>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          {formData.taxesPaid?.tds > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">TDS</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.taxesPaid.tds)}</span>
                <ProvenanceChip {...getFieldSourceInfo('taxesPaid', 'tds')} fieldPath="taxesPaid.tds" />
              </div>
            </div>
          )}
          {formData.taxesPaid?.advanceTax > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Advance Tax</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.taxesPaid.advanceTax)}</span>
                <ProvenanceChip {...getFieldSourceInfo('taxesPaid', 'advanceTax')} fieldPath="taxesPaid.advanceTax" />
              </div>
            </div>
          )}
          {formData.taxesPaid?.selfAssessmentTax > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Self Assessment Tax</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{formatCurrency(formData.taxesPaid.selfAssessmentTax)}</span>
                <ProvenanceChip {...getFieldSourceInfo('taxesPaid', 'selfAssessmentTax')} fieldPath="taxesPaid.selfAssessmentTax" />
              </div>
            </div>
          )}
          <div className="border-t border-slate-300 pt-2 mt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total Taxes Paid</span>
            <span className="text-heading-3 font-bold text-slate-900">
              {formatCurrency(
                (formData.taxesPaid?.tds || 0) +
                (formData.taxesPaid?.advanceTax || 0) +
                (formData.taxesPaid?.selfAssessmentTax || 0),
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Final Result */}
      {taxComputation && (
        <div className={`rounded-xl p-4 border-2 ${
          taxComputation.isRefund
            ? 'bg-green-50 border-green-200'
            : 'bg-error-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {taxComputation.isRefund ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-error-600" />
              )}
              <span className="text-body-large font-semibold text-slate-900">
                {taxComputation.isRefund ? 'Refund Due' : 'Tax Payable'}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              taxComputation.isRefund ? 'text-green-700' : 'text-error-700'
            }`}>
              {taxComputation.isRefund ? '+' : '-'}{formatCurrency(Math.abs(taxComputation.refundOrPayable || 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputationSheet;

