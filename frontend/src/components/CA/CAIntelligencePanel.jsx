/**
 * CAIntelligencePanel.jsx
 */
import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const CAIntelligencePanel = ({ intelligence }) => {
    const signals = intelligence?.signals || [];

    if (signals.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="text-center text-slate-400 text-sm">
                    No intelligence signals generated.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">Intelligence Signals</h3>
            </div>

            <div className="divide-y divide-slate-100">
                {signals.map((signal, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex gap-3">
                            <div className="mt-0.5">
                                {signal.severity === 'urgent' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                {signal.severity === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                                {signal.severity === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                                {signal.severity === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-800">{signal.id}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {signal.reasonCode}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CAIntelligencePanel;
