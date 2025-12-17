// =====================================================
// TAX GLOSSARY PAGE
// Tax terminology and definitions
// =====================================================

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, BookOpen, Info, ExternalLink } from 'lucide-react';
import HelpSearch from '../../components/Help/HelpSearch';

const TaxGlossary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('all');

  const glossary = [
    {
      term: 'AIS',
      definition: 'Annual Information Statement - A comprehensive statement showing all financial transactions reported to the Income Tax Department.',
      category: 'Documents',
      example: 'Your AIS includes details of salary, interest, dividends, and other income reported by banks, employers, and other entities.',
      relatedTerms: ['Form 26AS', 'TDS'],
    },
    {
      term: 'Assessment Year',
      definition: 'The year following the financial year for which you file your return. For example, for FY 2023-24, the AY is 2024-25.',
      category: 'Filing',
      example: 'If your income is for the period April 2023 to March 2024, you file your return in Assessment Year 2024-25.',
      relatedTerms: ['Financial Year', 'ITR'],
    },
    {
      term: 'Belated Return',
      definition: 'An ITR filed after the due date. Belated returns may attract interest and penalties.',
      category: 'Filing',
      example: 'If the due date is July 31, 2024, and you file on August 15, 2024, it is a belated return.',
      relatedTerms: ['ITR', 'Financial Year'],
    },
    {
      term: 'Capital Gains',
      definition: 'Profit or gain arising from the transfer of a capital asset like property, stocks, or mutual funds.',
      category: 'Income',
      example: 'If you bought shares for ₹10,000 and sold them for ₹15,000, you have a capital gain of ₹5,000.',
      relatedTerms: ['STCG', 'LTCG', 'Taxable Income'],
    },
    {
      term: 'Deduction',
      definition: 'Amount that can be subtracted from your gross total income to arrive at taxable income, like Section 80C, 80D, etc.',
      category: 'Deductions',
      example: 'If your gross income is ₹10 lakhs and you claim ₹1.5 lakhs under Section 80C, your taxable income becomes ₹8.5 lakhs.',
      relatedTerms: ['Section 80C', 'Section 80D', 'Taxable Income'],
    },
    {
      term: 'Exemption',
      definition: 'Income that is not included in your total income and hence not taxable, like agricultural income.',
      category: 'Income',
      example: 'Agricultural income up to ₹5,000 is exempt from tax. HRA exemption is also a type of exemption.',
      relatedTerms: ['HRA', 'Taxable Income'],
    },
    {
      term: 'Financial Year',
      definition: 'The 12-month period from April 1 to March 31 for which you calculate your income and file ITR.',
      category: 'Filing',
      example: 'FY 2023-24 runs from April 1, 2023 to March 31, 2024.',
      relatedTerms: ['Assessment Year', 'ITR'],
    },
    {
      term: 'Form 16',
      definition: 'Certificate issued by employer showing salary paid and TDS deducted. Has Part A (employer details) and Part B (salary breakdown).',
      category: 'Documents',
      example: 'Your employer issues Form 16 by June 15 of each year, showing your salary and TDS for the previous financial year.',
      relatedTerms: ['TDS', 'AIS', 'Form 26AS'],
    },
    {
      term: 'Form 26AS',
      definition: 'Consolidated tax statement showing all taxes paid, TDS deducted, and TCS collected during the financial year.',
      category: 'Documents',
      example: 'Form 26AS shows all TDS deducted by your employer, banks, and other payers, along with advance tax and self-assessment tax paid.',
      relatedTerms: ['TDS', 'AIS', 'Form 16'],
    },
    {
      term: 'Gross Total Income',
      definition: 'Total income from all sources before deducting any deductions under Chapter VI-A.',
      category: 'Income',
      example: 'If you have salary ₹8 lakhs, interest ₹50,000, and capital gains ₹1 lakh, your GTI is ₹9.5 lakhs.',
      relatedTerms: ['Taxable Income', 'Deduction'],
    },
    {
      term: 'HRA',
      definition: 'House Rent Allowance - A component of salary that may be partially or fully exempt from tax if you pay rent.',
      category: 'Deductions',
      example: 'If you receive ₹24,000 as HRA and pay ₹20,000 rent, you may be eligible for HRA exemption based on the minimum of three calculations.',
      relatedTerms: ['Exemption', 'Deduction'],
    },
    {
      term: 'ITR',
      definition: 'Income Tax Return - The form you file with the Income Tax Department declaring your income and taxes.',
      category: 'Filing',
      example: 'ITR-1 is for salaried individuals with income from salary, one house property, and other sources up to ₹50 lakhs.',
      relatedTerms: ['ITR-V', 'Financial Year', 'Assessment Year'],
    },
    {
      term: 'ITR-V',
      definition: 'Income Tax Return Verification - Acknowledgment document received after e-filing ITR that needs to be verified.',
      category: 'Filing',
      example: 'After e-filing your ITR, you receive ITR-V which must be verified within 120 days using Aadhaar OTP, EVC, or by sending a signed copy.',
      relatedTerms: ['ITR', 'Filing'],
    },
    {
      term: 'PAN',
      definition: 'Permanent Account Number - A 10-character alphanumeric identifier issued by the Income Tax Department.',
      category: 'Documents',
      example: 'Your PAN is like ABCDE1234F. It is mandatory for filing ITR and for most financial transactions.',
      relatedTerms: ['ITR', 'Form 16'],
    },
    {
      term: 'Refund',
      definition: 'Excess tax paid that is returned to you by the Income Tax Department.',
      category: 'Tax',
      example: 'If you paid ₹50,000 in taxes but your actual tax liability is ₹40,000, you are eligible for a refund of ₹10,000.',
      relatedTerms: ['TDS', 'Taxable Income'],
    },
    {
      term: 'Section 80C',
      definition: 'Tax deduction up to ₹1.5 lakh for investments in ELSS, PPF, life insurance, home loan principal, etc.',
      category: 'Deductions',
      example: 'If you invest ₹1.5 lakhs in ELSS mutual funds, you can claim the full ₹1.5 lakhs as deduction under Section 80C.',
      relatedTerms: ['Deduction', 'Section 80D'],
    },
    {
      term: 'Section 80D',
      definition: 'Tax deduction for health insurance premiums paid for self, family, and parents.',
      category: 'Deductions',
      example: 'If you pay ₹25,000 for health insurance for yourself and family, and ₹20,000 for parents, you can claim ₹45,000 under Section 80D.',
      relatedTerms: ['Deduction', 'Section 80C'],
    },
    {
      term: 'TDS',
      definition: 'Tax Deducted at Source - Tax deducted by the payer before making payment to you.',
      category: 'Tax',
      example: 'Your employer deducts TDS from your salary every month. Banks deduct TDS on interest if it exceeds ₹40,000.',
      relatedTerms: ['Form 16', 'Form 26AS', 'Refund'],
    },
    {
      term: 'Taxable Income',
      definition: 'Income on which you are required to pay tax, calculated as Gross Total Income minus deductions.',
      category: 'Income',
      example: 'If your GTI is ₹10 lakhs and deductions are ₹2 lakhs, your taxable income is ₹8 lakhs.',
      relatedTerms: ['Gross Total Income', 'Deduction'],
    },
    {
      term: 'Tax Regime',
      definition: 'Old regime allows deductions but has higher rates. New regime has lower rates but limited deductions.',
      category: 'Tax',
      example: 'Under old regime, you can claim deductions but pay higher tax. Under new regime, tax rates are lower but you can claim very few deductions.',
      relatedTerms: ['Deduction', 'Taxable Income'],
    },
  ];

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const filteredGlossary = glossary.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLetter = selectedLetter === 'all' ||
      item.term.charAt(0).toUpperCase() === selectedLetter;
    return matchesSearch && matchesLetter;
  });

  const groupedByCategory = filteredGlossary.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="h-8 w-8 text-gold-600" />
            <h1 className="text-heading-2xl text-slate-900">Tax Glossary</h1>
          </div>
          <p className="text-body-md text-slate-600">
            Understand tax terminology and concepts
          </p>
        </div>

        {/* Enhanced Search */}
        <div className="mb-6">
          <HelpSearch
            onResultClick={(query) => setSearchQuery(query)}
            placeholder="Search tax terms..."
          />
        </div>

        {/* Alphabet Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLetter('all')}
              className={`px-3 py-1 rounded-xl text-body-sm font-medium ${
                selectedLetter === 'all'
                  ? 'bg-gold-500 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`px-3 py-1 rounded-xl text-body-sm font-medium ${
                  selectedLetter === letter
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Glossary Terms */}
        {Object.keys(groupedByCategory).length === 0 ? (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
            <p className="text-body-md text-slate-600">No terms found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([category, terms]) => (
              <div key={category} className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
                <h2 className="text-heading-lg text-slate-900 mb-4">{category}</h2>
                <div className="space-y-6">
                  {terms.map((item) => (
                    <div key={item.term} id={`term-${item.term}`} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <h3 className="text-heading-sm text-gold-600 mb-2">{item.term}</h3>
                      <p className="text-body-md text-slate-600 mb-3">{item.definition}</p>

                      {item.example && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-body-xs font-semibold text-blue-800 mb-1">Example:</p>
                              <p className="text-body-sm text-blue-700">{item.example}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.relatedTerms && item.relatedTerms.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-body-xs font-semibold text-slate-600">Related terms:</span>
                          {item.relatedTerms.map((relatedTerm, idx) => {
                            const relatedItem = glossary.find((g) => g.term === relatedTerm);
                            if (!relatedItem) return null;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSearchQuery(relatedTerm);
                                  setSelectedLetter(relatedTerm.charAt(0).toUpperCase());
                                  // Scroll to the term
                                  setTimeout(() => {
                                    const element = document.getElementById(`term-${relatedTerm}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }, 100);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-body-xs text-gold-600 bg-gold-50 border border-gold-200 rounded hover:bg-gold-100"
                              >
                                {relatedTerm}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxGlossary;

