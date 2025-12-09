// =====================================================
// TAX TIPS COMPONENT
// Displays tax saving tips and best practices
// =====================================================

import React from 'react';
import { Lightbulb, TrendingUp, Calendar, FileText } from 'lucide-react';

const TaxTips = () => {
  const tips = [
    {
      id: 'tip-1',
      title: 'Invest Early in the Financial Year',
      category: 'planning',
      summary: 'Start investing at the beginning of the financial year',
      content: 'Investing early in the financial year (April) gives you more time for your investments to grow and helps in better tax planning throughout the year.',
      icon: Calendar,
    },
    {
      id: 'tip-2',
      title: 'Maximize Section 80C Benefits',
      category: 'deductions',
      summary: 'Utilize the full ₹1.5 lakh limit under Section 80C',
      content: 'Plan your investments to fully utilize the ₹1.5 lakh deduction limit under Section 80C. Consider a mix of ELSS, PPF, and life insurance based on your risk profile.',
      icon: TrendingUp,
    },
    {
      id: 'tip-3',
      title: 'Keep All Documents Ready',
      category: 'filing',
      summary: 'Maintain organized records of all tax-related documents',
      content: 'Keep all documents like Form 16, investment proofs, rent receipts, and bank statements organized throughout the year for easy ITR filing.',
      icon: FileText,
    },
    {
      id: 'tip-4',
      title: 'Claim HRA Properly',
      category: 'deductions',
      summary: 'Ensure you claim HRA deduction correctly',
      content: 'If you live in a rented house, ensure you have rent receipts and rental agreement. HRA exemption is the minimum of: actual HRA received, actual rent paid, or 50% of salary (metro) / 40% (non-metro).',
      icon: TrendingUp,
    },
    {
      id: 'tip-5',
      title: 'File ITR Before Due Date',
      category: 'filing',
      summary: 'Avoid late fees and penalties by filing on time',
      content: 'File your ITR before July 31st (or extended deadline) to avoid late fees of up to ₹5,000 and interest charges. Early filing also helps in faster refund processing.',
      icon: Calendar,
    },
  ];

  const getCategoryColor = (category) => {
    switch (category) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'deductions':
        return 'bg-green-100 text-green-800';
      case 'filing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-gold-600" />
        Tax Saving Tips
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gold-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gold-100 rounded-lg">
                  <Icon className="w-5 h-5 text-gold-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(tip.category)}`}>
                      {tip.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{tip.summary}</p>
                  <p className="text-sm text-gray-700">{tip.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaxTips;

