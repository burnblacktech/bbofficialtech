// =====================================================
// ITR SELECTION CARDS - Detailed ITR Cards for "I Know My ITR"
// Matches UX.md PATH B specification
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  TrendingUp,
  Building2,
  Calculator,
  CheckCircle,
  XCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { cn } from '../../utils';
import { springs } from '../../lib/motion';

const ITR_CARDS = [
  {
    id: 'ITR-1',
    name: 'ITR-1 (SAHAJ)',
    icon: Briefcase,
    accent: 'bg-primary-500',
    eligibility: [
      'Salary / Pension up to ₹50 lakh',
      'One house property',
      'Interest income, family pension',
      'Agricultural income up to ₹5,000',
    ],
    notEligible: [
      'Capital gains',
      'Multiple properties',
      'Foreign income',
      'Business income',
      'NRIs',
      'Directors',
      'Unlisted shares',
    ],
  },
  {
    id: 'ITR-2',
    name: 'ITR-2',
    icon: TrendingUp,
    accent: 'bg-ember-500',
    eligibility: [
      'Everything in ITR-1, PLUS:',
      'Capital gains (stocks, mutual funds, property)',
      'Multiple house properties',
      'Foreign income / Foreign assets',
      'NRIs and RNORs',
      'Agricultural income above ₹5,000',
      'Unlisted equity shares, ESOP',
      'Director in a company',
    ],
    notEligible: ['Business or professional income'],
  },
  {
    id: 'ITR-3',
    name: 'ITR-3',
    icon: Building2,
    accent: 'bg-gold-500',
    eligibility: [
      'Everything in ITR-2, PLUS:',
      'Business or professional income',
      'Freelancers, consultants, traders',
      'Partners in a firm (non-salaried share)',
      'F&O trading, intraday trading',
    ],
    notEligible: [],
  },
  {
    id: 'ITR-4',
    name: 'ITR-4 (SUGAM)',
    icon: Calculator,
    accent: 'bg-emerald-500',
    eligibility: [
      'For presumptive taxation (Section 44AD/44ADA/44AE):',
      'Small business turnover up to ₹2 crore',
      'Professionals (receipts up to ₹50 lakh)',
      'Declaring 6%/8%/50% of turnover as income',
    ],
    notEligible: [
      'Losses',
      'Carry forward',
      'Capital gains',
      'Foreign assets',
    ],
  },
];

const ITRSelectionCards = ({ onSelect, selectedITR = null, onHelp = null }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
      {ITR_CARDS.map((itr) => {
        const Icon = itr.icon;
        const isSelected = selectedITR === itr.id;
        const isExpanded = expandedCard === itr.id;

        return (
          <motion.div
            key={itr.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl border-2 overflow-hidden transition-all flex flex-col min-w-0',
              isSelected
                ? 'border-primary-500 shadow-elevation-3 shadow-primary-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-elevation-2',
            )}
          >
            <div className="bg-white p-3 flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    itr.accent,
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{itr.name}</h3>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-2 flex-1 min-h-0">
                <div className="flex items-start gap-1.5 mb-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="text-body-small text-slate-700 leading-tight">
                    {itr.eligibility.map((item, idx) => (
                      <div key={idx} className={idx > 0 ? 'mt-0.5' : ''}>{item}</div>
                    ))}
                  </div>
                </div>

                {itr.notEligible.length > 0 && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <XCircle className="w-3 h-3 text-error-500 flex-shrink-0 mt-0.5" />
                    <div className="text-body-small text-slate-600 leading-tight">
                      <div className="font-medium mb-0.5">NOT for:</div>
                      {itr.notEligible.map((item, idx) => (
                        <div key={idx} className={idx > 0 ? 'mt-0.5' : ''}>{item}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onSelect(itr.id);
                }}
                className={cn(
                  'w-full py-1.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 flex-shrink-0',
                  isSelected
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selected
                  </>
                ) : (
                  <>
                    Select {itr.id}
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
      })}

      <div className="col-span-1 md:col-span-2 bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-start gap-2 flex-shrink-0">
        <Info className="w-4 h-4 text-primary-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-body-small text-primary-900">
          Not sure?{' '}
          <button
            type="button"
            onClick={() => onHelp?.()}
            className="font-semibold underline underline-offset-4"
          >
            Answer a few questions
          </button>
          .
        </p>
      </div>
    </div>
  );
};

export default ITRSelectionCards;

