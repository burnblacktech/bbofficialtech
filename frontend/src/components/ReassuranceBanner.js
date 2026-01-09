// =====================================================
// REASSURANCE BANNER
// Micro-reassurance layer for filing journey
// Answers emotional questions explicitly
// =====================================================

import React from 'react';
import { Info, Shield, Clock } from 'lucide-react';

const ReassuranceBanner = ({ type = 'default', message, icon: CustomIcon }) => {
    const configs = {
        default: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: Info,
        },
        safety: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: Shield,
        },
        time: {
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-700',
            icon: Clock,
        },
    };

    const config = configs[type] || configs.default;
    const Icon = CustomIcon || config.icon;

    return (
        <div className={`${config.bg} border ${config.border} rounded-lg p-4 flex items-start gap-3`}>
            <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
            <p className={`text-sm ${config.text}`}>
                {message}
            </p>
        </div>
    );
};

export default ReassuranceBanner;
