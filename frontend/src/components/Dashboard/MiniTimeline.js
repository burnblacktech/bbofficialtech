// =====================================================
// MINI TIMELINE - COMPACT MULTI-YEAR VIEW
// Small chart showing financial journey
// =====================================================

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';

const MiniTimeline = ({ snapshots, milestones = [] }) => {
    if (!snapshots || snapshots.length === 0) return null;

    // Take last 3 years for compact view
    const recentSnapshots = snapshots.slice(0, 3).reverse();

    const chartData = recentSnapshots.map(s => ({
        year: s.year.split('-')[0], // Just show start year
        income: s.totalIncome / 100000, // Convert to lakhs
    }));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Your Financial Journey</h3>
                <span className="text-sm text-slate-500">{recentSnapshots.length} years</span>
            </div>

            {/* Mini Chart */}
            <div className="mb-4">
                <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={chartData}>
                        <XAxis
                            dataKey="year"
                            stroke="#94a3b8"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            style={{ fontSize: '12px' }}
                            label={{ value: '₹L', angle: 0, position: 'top' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(value) => [`₹${value.toFixed(1)}L`, 'Income']}
                        />
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Milestones */}
            {milestones.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-slate-700">Milestones:</span>
                        {milestones.slice(0, 3).map((milestone, index) => (
                            <span
                                key={index}
                                className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full"
                            >
                                {milestone.description || milestone.type}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniTimeline;
