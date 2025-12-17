// =====================================================
// EDUCATION RAIL COMPONENT
// Contextual help for tax terms
// CA-grade teachability on demand
// =====================================================

import { useState } from 'react';
import { HelpCircle, BookOpen, ExternalLink, X } from 'lucide-react';

const EducationRail = ({ term, fieldPath }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Tax term definitions
  const termDefinitions = {
    hra: {
      title: 'House Rent Allowance (HRA)',
      short: 'Tax exemption on house rent allowance',
      full: 'HRA is a component of salary that provides tax exemption on rent paid for accommodation. The exemption is calculated as the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of salary, or (3) 50% of salary (metro) or 40% (non-metro).',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/house-rent-allowance',
    },
    '80c': {
      title: 'Section 80C Deduction',
      short: 'Deduction up to ₹1.5 lakh for investments',
      full: 'Section 80C allows deduction up to ₹1.5 lakh for investments in ELSS, PPF, NSC, life insurance premiums, principal repayment of home loan, and other specified instruments.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/section-80c',
    },
    '80d': {
      title: 'Section 80D - Health Insurance',
      short: 'Deduction for health insurance premiums',
      full: 'Section 80D provides deduction for health insurance premiums paid for self, spouse, children, and parents. Maximum deduction is ₹25,000 (₹50,000 for senior citizens).',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/section-80d',
    },
    '87a': {
      title: 'Section 87A - Rebate',
      short: 'Tax rebate for income up to ₹5 lakh',
      full: 'Section 87A provides a rebate of up to ₹12,500 for individuals with total income up to ₹5 lakh. This rebate reduces the tax liability.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/section-87a',
    },
    '44ad': {
      title: 'Section 44AD - Presumptive Taxation',
      short: 'Presumptive taxation for businesses',
      full: 'Section 44AD allows businesses with turnover up to ₹2 crore to declare income at 8% (6% for digital receipts) without maintaining detailed books of accounts.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/presumptive-taxation',
    },
    '44ada': {
      title: 'Section 44ADA - Professional Presumptive',
      short: 'Presumptive taxation for professionals',
      full: 'Section 44ADA allows professionals with gross receipts up to ₹50 lakh to declare income at 50% without maintaining detailed books.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/presumptive-taxation',
    },
    capitalGains: {
      title: 'Capital Gains',
      short: 'Profit from sale of capital assets',
      full: 'Capital gains arise when you sell capital assets like property, stocks, mutual funds, etc. Short-term capital gains (held < 24 months for property, < 1 year for stocks) are taxed at applicable rates, while long-term gains have special tax rates.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/capital-gains',
    },
    tds: {
      title: 'Tax Deducted at Source (TDS)',
      short: 'Tax deducted by payer before payment',
      full: 'TDS is tax deducted by the payer (employer, bank, etc.) before making payment. This tax is credited to your account and shown in Form 26AS. You can claim credit for TDS while filing your return.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/tds',
    },
    form26as: {
      title: 'Form 26AS',
      short: 'Consolidated tax statement',
      full: 'Form 26AS is a consolidated tax statement showing TDS, TCS, advance tax, and self-assessment tax paid. It is available on the Income Tax e-filing portal.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/form-26as',
    },
    ais: {
      title: 'Annual Information Statement (AIS)',
      short: 'Comprehensive tax information',
      full: 'AIS contains information about your income, taxes paid, and financial transactions reported by various entities. It helps in accurate return filing.',
      link: 'https://www.incometax.gov.in/iec/foportal/help/assessee/return-preparation/ais',
    },
  };

  // Extract term from fieldPath or use provided term
  const termKey = term || (fieldPath ? fieldPath.toLowerCase().replace(/[^a-z0-9]/g, '') : null);
  const definition = termKey ? termDefinitions[termKey] : null;

  if (!definition) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        onMouseEnter={() => setShowExplanation(true)}
        onMouseLeave={() => setShowExplanation(false)}
        onClick={() => setShowExplanation(!showExplanation)}
      >
        <HelpCircle className="w-4 h-4 mr-1" />
        <span className="text-body-small font-medium">{definition.title}</span>
      </button>

      {/* Explanation Tooltip/Modal */}
      {showExplanation && (
        <div className="absolute bottom-full left-0 mb-2 w-80 p-4 bg-white border border-slate-200 rounded-xl shadow-elevation-4 z-50">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-900">{definition.title}</h4>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-body-small text-slate-700 mb-3">{definition.full}</p>

          {definition.link && (
            <a
              href={definition.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-body-small text-blue-600 hover:text-blue-700"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              <span>Learn More</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}

          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  );
};

// Inline education component for use within forms
export const InlineEducation = ({ term, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const termKey = term?.toLowerCase().replace(/[^a-z0-9]/g, '');

  const definitions = {
    hra: 'House Rent Allowance - Tax exemption on rent paid',
    '80c': 'Section 80C - Deduction up to ₹1.5 lakh for investments',
    '80d': 'Section 80D - Deduction for health insurance premiums',
    '87a': 'Section 87A - Tax rebate for income up to ₹5 lakh',
    capitalGains: 'Profit from sale of capital assets like property or stocks',
    tds: 'Tax Deducted at Source - Tax deducted before payment',
  };

  const definition = termKey ? definitions[termKey] : null;

  if (!definition) {
    return children;
  }

  return (
    <span className="inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1 text-blue-600 hover:text-blue-700"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {showTooltip && (
        <span className="absolute ml-2 mt-6 px-2 py-1 bg-gray-900 text-white text-body-small rounded shadow-elevation-3 z-50">
          {definition}
        </span>
      )}
    </span>
  );
};

export default EducationRail;

