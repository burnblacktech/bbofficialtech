// =====================================================
// PREVIOUS YEAR PREVIEW COMPONENT
// Show preview of data to be copied from previous year
// =====================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, DollarSign, Receipt, CreditCard, Building2, Loader, AlertCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { usePreviousYearData } from '../hooks/use-previous-year-copy';

const PreviousYearPreview = ({ sourceFilingId, onProceed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const filingId = sourceFilingId || location.state?.sourceFilingId;

  const { data, isLoading, error } = usePreviousYearData(filingId);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderSectionPreview = (title, Icon, data, fields) => {
    if (!data) return null;

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-xl mr-3">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-heading-md text-slate-900">{title}</h3>
        </div>
        <div className="space-y-2">
          {fields.map((field) => {
            const value = data[field.key];
            if (value === undefined || value === null || value === '') return null;
            return (
              <div key={field.key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-body-sm text-slate-600">{field.label}:</span>
                <span className="text-body-sm font-medium text-slate-900">
                  {field.format ? field.format(value) : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-gold-500 mr-3" />
            <span className="text-body-md text-slate-600">Loading previous year data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-error-50 border border-error-200 rounded-xl p-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-heading-sm text-error-900 mb-1">Error Loading Data</h3>
                <p className="text-body-sm text-error-700 mb-4">
                  {error?.message || 'Failed to load previous year data'}
                </p>
                <button
                  onClick={() => navigate(-1)}
                  className="text-body-regular font-medium text-error-600 hover:text-error-800"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sections = data.sections || {};
  const previousData = data.data || {};

  const handleProceed = () => {
    if (onProceed) {
      onProceed(data);
    } else {
      navigate('/itr/previous-year-review', {
        state: {
          ...location.state,
          sourceFilingId: filingId,
          previousYearData: data,
          selectedPerson: location.state?.selectedPerson,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-heading-2xl text-slate-900 mb-2">Preview Previous Year Data</h1>
          <p className="text-body-md text-slate-600">
            Review the data that will be copied from Assessment Year {data.assessmentYear}
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-body-sm text-info-700">
                This is a preview of the data from your previous filing. You'll be able to select
                specific sections and edit values in the next step.
              </p>
            </div>
          </div>
        </div>

        {/* Sections Preview */}
        <div className="space-y-4 mb-8">
          {/* Personal Information */}
          {sections.personal_info && previousData.personal_info &&
            renderSectionPreview(
              'Personal Information',
              User,
              previousData.personal_info,
              [
                { key: 'name', label: 'Name' },
                { key: 'pan', label: 'PAN' },
                { key: 'dateOfBirth', label: 'Date of Birth' },
                { key: 'address', label: 'Address' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'pincode', label: 'Pincode' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
              ],
            )
          }

          {/* Income */}
          {sections.income && previousData.income && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-heading-md text-slate-900">Income</h3>
              </div>
              <div className="space-y-3">
                {previousData.income.salary && (
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-body-sm font-medium text-slate-700 mb-1">Salary Income</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      {formatCurrency(
                        previousData.income.salary.totalSalary ||
                        previousData.income.salary.total ||
                        previousData.income.salary,
                      )}
                    </div>
                  </div>
                )}
                {previousData.income.houseProperty && (
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-body-sm font-medium text-slate-700 mb-1">House Property</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      {formatCurrency(
                        previousData.income.houseProperty.netRentalIncome ||
                        previousData.income.houseProperty,
                      )}
                    </div>
                  </div>
                )}
                {previousData.income.capitalGains && (
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-body-sm font-medium text-slate-700 mb-1">Capital Gains</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      STCG: {formatCurrency(previousData.income.capitalGains.shortTerm || 0)} •
                      LTCG: {formatCurrency(previousData.income.capitalGains.longTerm || 0)}
                    </div>
                  </div>
                )}
                {previousData.income.otherSources && (
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-body-sm font-medium text-slate-700 mb-1">Other Sources</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      {formatCurrency(
                        previousData.income.otherSources.total ||
                        previousData.income.otherSources,
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deductions */}
          {sections.deductions && previousData.deductions && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-heading-md text-slate-900">Deductions</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(previousData.deductions).map(([key, value]) => {
                  if (!value || (typeof value === 'object' && !value.totalAmount)) return null;
                  const amount = typeof value === 'object' ? value.totalAmount : value;
                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded">
                      <div className="text-body-xs text-slate-600 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-body-md font-semibold text-slate-900">{formatCurrency(amount)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Taxes Paid */}
          {sections.taxes_paid && previousData.taxes_paid && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gold-100 rounded-xl mr-3">
                  <CreditCard className="h-5 w-5 text-gold-600" />
                </div>
                <h3 className="text-heading-md text-slate-900">Taxes Paid</h3>
              </div>
              <div className="space-y-2">
                {previousData.taxes_paid.tds && Array.isArray(previousData.taxes_paid.tds) && (
                  <div>
                    <div className="text-body-sm font-medium text-slate-700 mb-1">TDS ({previousData.taxes_paid.tds.length} entries)</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      {formatCurrency(
                        previousData.taxes_paid.tds.reduce((sum, entry) => sum + (entry.amount || 0), 0),
                      )}
                    </div>
                  </div>
                )}
                {previousData.taxes_paid.advanceTax && Array.isArray(previousData.taxes_paid.advanceTax) && (
                  <div>
                    <div className="text-body-sm font-medium text-slate-700 mb-1">Advance Tax ({previousData.taxes_paid.advanceTax.length} entries)</div>
                    <div className="text-body-md font-semibold text-slate-900">
                      {formatCurrency(
                        previousData.taxes_paid.advanceTax.reduce((sum, entry) => sum + (entry.amount || 0), 0),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank Details */}
          {sections.bank_details && previousData.bank_details &&
            renderSectionPreview(
              'Bank Details',
              Building2,
              Array.isArray(previousData.bank_details) ? previousData.bank_details[0] : previousData.bank_details,
              [
                { key: 'accountNumber', label: 'Account Number' },
                { key: 'ifsc', label: 'IFSC Code' },
                { key: 'bankName', label: 'Bank Name' },
                { key: 'accountType', label: 'Account Type' },
              ],
            )
          }
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            Back
          </button>
          <button
            onClick={handleProceed}
            className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 flex items-center justify-center"
          >
            Continue to Review
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousYearPreview;

