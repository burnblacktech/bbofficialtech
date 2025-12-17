// =====================================================
// ITR FORM GUIDE COMPONENT
// Guides for different ITR forms
// =====================================================

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

const ITRFormGuide = ({ selectedGuideId, onGuideSelect }) => {
  const guides = [
    {
      id: 'itr-1-guide',
      itrType: 'ITR-1',
      title: 'ITR-1 (Sahaj) Guide',
      summary: 'Guide for filing ITR-1 for salaried individuals',
      content: 'ITR-1 is for individuals having income from salary, one house property, and other sources (interest, etc.). Total income should not exceed ₹50 lakhs.',
    },
    {
      id: 'itr-2-guide',
      itrType: 'ITR-2',
      title: 'ITR-2 Guide',
      summary: 'Guide for filing ITR-2 for individuals and HUFs',
      content: 'ITR-2 is for individuals and HUFs not having income from business or profession. It includes income from salary, house property, capital gains, and other sources.',
    },
    {
      id: 'itr-3-guide',
      itrType: 'ITR-3',
      title: 'ITR-3 Guide',
      summary: 'Guide for filing ITR-3 for business/profession income',
      content: 'ITR-3 is for individuals and HUFs having income from business or profession. It requires P&L statement and balance sheet.',
    },
    {
      id: 'itr-4-guide',
      itrType: 'ITR-4',
      title: 'ITR-4 (Sugam) Guide',
      summary: 'Guide for filing ITR-4 for presumptive taxation',
      content: 'ITR-4 is for individuals, HUFs, and firms (other than LLP) having income from business or profession computed under presumptive taxation scheme (Sections 44AD, 44ADA, 44AE).',
    },
  ];

  const selectedGuide = guides.find((g) => g.id === selectedGuideId);

  if (selectedGuide) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onGuideSelect(null)}
          className="text-body-regular text-gold-600 hover:text-gold-700 flex items-center gap-1"
        >
          ← Back to ITR guides
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-gold-600 text-white rounded-xl font-bold">
              {selectedGuide.itrType}
            </div>
            <h3 className="text-heading-2 font-bold text-slate-900">{selectedGuide.title}</h3>
          </div>
          <p className="text-slate-600 mb-4">{selectedGuide.summary}</p>
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-line">{selectedGuide.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">ITR Form Guides</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => onGuideSelect(guide.id)}
            className="border border-slate-200 rounded-xl p-4 hover:border-gold-300 hover:shadow-elevation-2 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-gold-600 text-white rounded text-body-regular font-bold">
                    {guide.itrType}
                  </div>
                  <h4 className="font-semibold text-slate-900">{guide.title}</h4>
                </div>
                <p className="text-body-regular text-slate-600">{guide.summary}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ITRFormGuide;

