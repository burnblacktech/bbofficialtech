// =====================================================
// REVIEW SUMMARY COMPONENT
// Final review summary before submission
// =====================================================

import React from 'react';
import { CheckCircle, AlertCircle, FileText, DollarSign, Receipt } from 'lucide-react';

const ReviewSummary = ({ formData, taxComputation, onEditSection }) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const sections = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      icon: FileText,
      data: formData.personal_info || formData.personalInfo,
      fields: [
        { label: 'Name', key: 'name' },
        { label: 'PAN', key: 'pan' },
        { label: 'Aadhaar', key: 'aadhaar' },
      ],
    },
    {
      id: 'income',
      title: 'Income Summary',
      icon: DollarSign,
      data: {
        total: taxComputation?.grossTotalIncome || 0,
        salary: formData.income?.salary?.reduce((sum, s) => sum + (s.total || 0), 0) || 0,
        houseProperty: formData.income?.house_property?.reduce((sum, h) => sum + (h.netAnnualValue || 0), 0) || 0,
        capitalGains: formData.income?.capital_gains?.reduce((sum, c) => sum + (c.totalGain || 0), 0) || 0,
        otherSources: formData.income?.other_sources?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0,
      },
    },
    {
      id: 'deductions',
      title: 'Deductions',
      icon: Receipt,
      data: {
        total: taxComputation?.totalDeductions || 0,
        section80C: formData.deductions?.section80C?.totalAmount || 0,
        section80D: formData.deductions?.section80D?.totalAmount || 0,
      },
    },
    {
      id: 'taxes-paid',
      title: 'Taxes Paid',
      icon: Receipt,
      data: {
        total: taxComputation?.totalTaxesPaid || 0,
        tds: formData.taxes_paid?.tds?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        advanceTax: formData.taxes_paid?.advanceTax?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-lg text-gray-800 mb-2">Review Summary</h3>
        <p className="text-body-md text-slate-600">
          Please review all information before submitting your ITR
        </p>
      </div>

      {/* Tax Summary Card */}
      {taxComputation && (
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-xl border-2 border-gold-200 p-6">
          <h4 className="text-heading-md text-gray-800 mb-4">Tax Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-body-sm text-slate-600">Gross Total Income</p>
              <p className="text-heading-md font-semibold text-gray-800">
                {formatCurrency(taxComputation.grossTotalIncome)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-slate-600">Total Deductions</p>
              <p className="text-heading-md font-semibold text-gray-800">
                {formatCurrency(taxComputation.totalDeductions)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-slate-600">Taxable Income</p>
              <p className="text-heading-md font-semibold text-gray-800">
                {formatCurrency(taxComputation.taxableIncome)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-slate-600">
                {taxComputation.refundAmount > 0 ? 'Refund' : 'Tax Payable'}
              </p>
              <p
                className={`text-heading-md font-semibold ${
                  taxComputation.refundAmount > 0 ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {formatCurrency(
                  Math.abs(taxComputation.refundAmount || taxComputation.taxPayable || 0),
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sections Review */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-gold-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Icon className="h-6 w-6 text-gold-600 mr-3" />
                  <h4 className="text-heading-md text-gray-800">{section.title}</h4>
                </div>
                {onEditSection && (
                  <button
                    onClick={() => onEditSection(section.id)}
                    className="text-body-sm text-gold-600 hover:text-gold-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {section.fields ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <p className="text-body-sm text-slate-600">{field.label}</p>
                      <p className="text-body-md font-medium text-gray-800 mt-1">
                        {section.data?.[field.key] || 'Not provided'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(section.data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-body-sm text-slate-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-body-md font-medium text-gray-800 mt-1">
                        {typeof value === 'number' ? formatCurrency(value) : value || '₹0'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Declaration */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-info-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-body-md font-semibold text-info-900 mb-2">
              Declaration
            </h4>
            <p className="text-body-sm text-info-700">
              I hereby declare that the information provided in this return is true and correct
              to the best of my knowledge and belief. I understand that any false statement or
              concealment of facts may result in penalties under the Income Tax Act.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;

