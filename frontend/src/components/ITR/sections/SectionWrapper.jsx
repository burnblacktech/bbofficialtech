
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils';
import { springs } from '../../../lib/motion';

export const SectionWrapper = ({
    title,
    description,
    icon: Icon,
    isExpanded,
    onToggle,
    isComplete = false,
    children,
    className = '',
}) => {
    return (
        <div className={cn(
            'bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-elevation-1 hover:shadow-elevation-2 transition-shadow',
            className,
        )}>
            {/* Section Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center">
                        {Icon && <Icon className="w-6 h-6 text-primary-600" />}
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-900">{title}</h3>
                        <p className="text-body-regular text-slate-500">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.div
                        initial={false}
                        animate={isComplete ? { scale: [0, 1.2, 1] } : {}}
                        transition={springs.bouncy}
                    >
                        {isComplete ? (
                            <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-success-600" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                        )}
                    </motion.div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={springs.snappy}
                    >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                </div>
            </button>

            {/* Section Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springs.gentle}
                    >
                        <div className="border-t border-slate-100 p-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const SubSection = ({ title, icon: Icon, children, defaultOpen = true, className = '' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn(
            'rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden',
            'transition-all duration-200',
            'hover:border-slate-300',
            className,
        )}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-transparent hover:from-slate-100/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                    )}
                    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={springs.snappy}
                >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springs.gentle}
                    >
                        <div className="p-4 border-t border-slate-100">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
