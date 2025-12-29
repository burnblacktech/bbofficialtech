import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const ConversationalToggle = ({
    question,
    subtext,
    isYes, // true, false, or null (unanswered)
    onAnswer, // (bool) => void
    icon: Icon
}) => {
    return (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

                {/* Question Area */}
                <div className="flex gap-3">
                    {Icon && (
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                            <Icon size={20} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-body-medium font-medium text-slate-900">{question}</h3>
                        {subtext && <p className="text-body-small text-slate-500 mt-1">{subtext}</p>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={() => onAnswer(false)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
              ${isYes === false
                                ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {isYes === false && <Check size={14} />}
                        No
                    </button>

                    <button
                        onClick={() => onAnswer(true)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
              ${isYes === true
                                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {isYes === true && <Check size={14} />}
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConversationalToggle;
