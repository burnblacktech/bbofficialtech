import React from 'react';
import { motion } from 'framer-motion';

const DashboardKPI = ({ icon: Icon, label, value, subtext, trend, color = 'primary' }) => {
    const colorMap = {
        primary: 'bg-primary-50 text-primary-600 border-primary-100',
        success: 'bg-success-50 text-success-600 border-success-100',
        info: 'bg-info-50 text-info-600 border-info-100',
        ember: 'bg-ember-50 text-ember-600 border-ember-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    const scheme = colorMap[color] || colorMap.slate;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-elevation-1 hover:shadow-elevation-2 transition-all cursor-default"
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg border ${scheme.split(' ')[0]} ${scheme.split(' ')[2]} ${scheme.split(' ')[1]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-body-small font-medium text-slate-500 mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-heading-3 font-bold text-slate-900 tabular-nums">{value}</h4>
                </div>
                {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
            </div>
        </motion.div>
    );
};

export default DashboardKPI;
