import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { IndianRupee } from 'lucide-react';

const DeductionBucket = ({
    title,
    subtitle,
    icon: Icon,
    maxBenefit,
    isOpen,
    onToggle,
    children,
    activeAmount, // Optional: show current filled amount
}) => {
    return (
        <div className={`
      rounded-xl border transition-all duration-200 overflow-hidden
      ${isOpen ? 'bg-white border-blue-200 ring-4 ring-blue-50' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'}
    `}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className={`text-body-medium font-semibold ${isOpen ? 'text-blue-900' : 'text-slate-900'}`}>{title}</h3>
                        <p className="text-body-small text-slate-500 mt-0.5">{subtitle}</p>
                        {activeAmount > 0 && !isOpen && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                <IndianRupee size={10} />
                                <span>{activeAmount.toLocaleString('en-IN')} claimed</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {maxBenefit && (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            Max {maxBenefit}
                        </span>
                    )}
                    <div className={`mt-2 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="border-t border-slate-100 p-4 pt-0">
                            <div className="pt-4 animate-fadeIn">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeductionBucket;
