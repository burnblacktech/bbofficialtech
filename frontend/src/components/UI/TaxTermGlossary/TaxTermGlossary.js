// =====================================================
// TAX TERM GLOSSARY COMPONENT
// Clickable tax terms with definitions
// Per UI.md specifications (lines 7928-7946)
// =====================================================

import React, { useState } from 'react';
import { RichTooltip } from '../Tooltip';
import { cn } from '../../../utils';

/**
 * TaxTerm Component
 * Wraps a term in text with a clickable definition tooltip
 */
export const TaxTerm = ({
  term,
  definition,
  formula,
  children,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <RichTooltip
      title={term}
      description={
        <div className="space-y-2">
          <p>{definition}</p>
          {formula && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-body-sm font-medium mb-1" style={{ fontSize: '13px', fontWeight: 500 }}>
                Formula:
              </p>
              <p className="text-body-sm font-mono" style={{ fontSize: '13px' }}>
                {formula}
              </p>
            </div>
          )}
        </div>
      }
      variant="dark"
      side="top"
    >
      <span
        className={cn(
          'underline decoration-dotted decoration-gray-400 underline-offset-2',
          'cursor-help hover:decoration-gray-600 transition-colors',
          className,
        )}
        {...props}
      >
        {children || term}
      </span>
    </RichTooltip>
  );
};

/**
 * TaxTermGlossary Component
 * Processes text and wraps tax terms with definitions
 */
export const TaxTermGlossary = ({
  text,
  terms = {},
  className = '',
  ...props
}) => {
  // Default tax terms
  const defaultTerms = {
    'Taxable Income': {
      definition: 'The portion of your total income on which tax is calculated after all deductions and exemptions are applied.',
      formula: 'Gross Income - Deductions = Taxable Income',
    },
    'Gross Income': {
      definition: 'Your total income from all sources before any deductions or exemptions.',
    },
    'Deductions': {
      definition: 'Amounts that can be subtracted from your gross income to reduce your taxable income, such as Section 80C investments.',
    },
    'TDS': {
      definition: 'Tax Deducted at Source - Tax already deducted by your employer or other payers before you receive the income.',
    },
    'Advance Tax': {
      definition: 'Tax paid in advance during the financial year, typically in installments.',
    },
    'Refund': {
      definition: 'Amount returned to you when the tax you paid (TDS + Advance Tax) exceeds your actual tax liability.',
    },
    'HRA': {
      definition: 'House Rent Allowance - A component of salary given to employees to meet rental expenses. Part of it may be exempt from tax.',
    },
    'Section 80C': {
      definition: 'A tax deduction section that allows deductions up to ₹1,50,000 for investments in PPF, ELSS, NSC, life insurance, etc.',
    },
  };

  const allTerms = { ...defaultTerms, ...terms };

  // Simple text processing - wrap terms with TaxTerm component
  const processText = (text) => {
    if (!text) return text;

    let processedText = text;
    const termKeys = Object.keys(allTerms).sort((a, b) => b.length - a.length); // Sort by length to match longer terms first

    termKeys.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = processedText.match(regex);
      if (matches) {
        // For now, return the text with terms marked
        // In a real implementation, you'd use a more sophisticated text processing library
        // or render the text as JSX with components
      }
    });

    return processedText;
  };

  // For now, return a simple wrapper
  // In production, you'd want to use a proper text processing solution
  return (
    <span className={className} {...props}>
      {text}
    </span>
  );
};

/**
 * useTaxTerm Hook
 * Hook to get term definition
 */
export const useTaxTerm = (term) => {
  const defaultTerms = {
    'Taxable Income': {
      definition: 'The portion of your total income on which tax is calculated after all deductions and exemptions are applied.',
      formula: 'Gross Income - Deductions = Taxable Income',
    },
    'Gross Income': {
      definition: 'Your total income from all sources before any deductions or exemptions.',
    },
    'Deductions': {
      definition: 'Amounts that can be subtracted from your gross income to reduce your taxable income, such as Section 80C investments.',
    },
    'TDS': {
      definition: 'Tax Deducted at Source - Tax already deducted by your employer or other payers before you receive the income.',
    },
    'Advance Tax': {
      definition: 'Tax paid in advance during the financial year, typically in installments.',
    },
    'Refund': {
      definition: 'Amount returned to you when the tax you paid (TDS + Advance Tax) exceeds your actual tax liability.',
    },
    'HRA': {
      definition: 'House Rent Allowance - A component of salary given to employees to meet rental expenses. Part of it may be exempt from tax.',
    },
    'Section 80C': {
      definition: 'A tax deduction section that allows deductions up to ₹1,50,000 for investments in PPF, ELSS, NSC, life insurance, etc.',
    },
  };

  return defaultTerms[term] || null;
};

export default TaxTerm;

