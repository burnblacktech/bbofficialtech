// =====================================================
// DETAILED STORY MODAL - FULL FINANCIAL ANALYSIS
// Expandable modal with complete charts and insights
// =====================================================

import React from 'react';
import { X, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const DetailedStoryModal = ({ isOpen, onClose, storyData, insights }) => {
    if (!isOpen || !storyData) return null;

    const { snapshots } = storyData;

    const chartData = snapshots.map(s => ({
        year: s.year,
        income: s.totalIncome / 100000,
        tax: s.totalTaxPaid / 100000,
        salary: s.salaryIncome / 100000,
        business: s.businessIncome / 100000,
        rental: s.rentalIncome / 100000,
        other: (s.capitalGains + s.otherIncome) / 100000,
    })).reverse();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-slate-900">Detailed Financial Analysis</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Income Trend */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-6 h-6 text-primary-600" />
                            <h3 className="text-xl font-bold text-slate-900">Income Trend</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="year" stroke="#64748b" />
                                <YAxis stroke="#64748b" label={{ value: '₹ Lakhs', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px',
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    name="Total Income"
                                    dot={{ fill: '#3b82f6', r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tax"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Tax Paid"
                                    dot={{ fill: '#f59e0b', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Income Composition */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <PieChartIcon className="w-6 h-6 text-primary-600" />
                            <h3 className="text-xl font-bold text-slate-900">Income Sources</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="year" stroke="#64748b" />
                                <YAxis stroke="#64748b" label={{ value: '₹ Lakhs', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="salary" stackId="a" fill="#10b981" name="Salary" />
                                <Bar dataKey="business" stackId="a" fill="#3b82f6" name="Business" />
                                <Bar dataKey="rental" stackId="a" fill="#f59e0b" name="Rental" />
                                <Bar dataKey="other" stackId="a" fill="#8b5cf6" name="Other" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Insights */}
                    {insights && insights.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">AI Insights</h3>
                            <div className="space-y-3">
                                {insights.map((insight, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100"
                                    >
                                        <p className="text-slate-800">{insight.insight_text || insight.insightText}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailedStoryModal;
