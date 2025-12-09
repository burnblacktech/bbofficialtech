// =====================================================
// SECTION EXPLAINER COMPONENT
// Explains tax sections (80C, 80D, etc.)
// =====================================================

import React from 'react';
import { FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { useSectionExplanation } from '../hooks/use-knowledge-base';

const SectionExplainer = ({ selectedSectionId, onSectionSelect }) => {
  const { data: sectionData, isLoading } = useSectionExplanation(selectedSectionId);

  const sections = [
    {
      id: 'section-80c',
      section: '80C',
      title: 'Section 80C - Tax Deductions',
      summary: 'Deduction up to ₹1.5 lakhs for investments and expenses',
    },
    {
      id: 'section-80d',
      section: '80D',
      title: 'Section 80D - Health Insurance',
      summary: 'Deduction for health insurance premiums',
    },
    {
      id: 'section-24',
      section: '24',
      title: 'Section 24 - Home Loan Interest',
      summary: 'Deduction for home loan interest',
    },
    {
      id: 'section-80g',
      section: '80G',
      title: 'Section 80G - Donations',
      summary: 'Deduction for charitable donations',
    },
  ];

  if (selectedSectionId && sectionData?.explanation) {
    const section = sectionData.explanation;
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSectionSelect(null)}
          className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
        >
          ← Back to sections
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-gold-600 text-white rounded-lg font-bold">
              Section {section.section}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{section.summary}</p>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line mb-4">{section.explanation}</p>
            {section.limit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900">Deduction Limit:</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{section.limit.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {section.eligibleItems && section.eligibleItems.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-2">Eligible Items:</p>
                <ul className="space-y-1">
                  {section.eligibleItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Tax Sections</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => onSectionSelect(section.id)}
            className="border border-gray-200 rounded-lg p-4 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-gold-600 text-white rounded text-sm font-bold">
                    {section.section}
                  </div>
                  <h4 className="font-semibold text-gray-900">{section.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{section.summary}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionExplainer;

