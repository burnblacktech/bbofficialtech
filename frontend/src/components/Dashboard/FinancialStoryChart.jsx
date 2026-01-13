import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const data = [
    { year: 'AY 2021-22', income: 450000, tax: 12500 },
    { year: 'AY 2022-23', income: 520000, tax: 18400 },
    { year: 'AY 2023-24', income: 780000, tax: 35000 },
    { year: 'AY 2024-25', income: 920000, tax: 42000 },
];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
                <p className="font-bold mb-1">{payload[0].payload.year}</p>
                <div className="space-y-1">
                    <p className="flex justify-between gap-4">
                        <span className="opacity-70">Gross Income:</span>
                        <span className="font-mono">₹{payload[0].value.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between gap-4">
                        <span className="opacity-70">Tax Paid:</span>
                        <span className="font-mono text-error-400">₹{payload[1].value.toLocaleString()}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const FinancialStoryChart = () => {
    return (
        <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    barGap={8}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar
                        dataKey="income"
                        fill="#0F172A"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#0F172A' : '#94A3B8'} />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="tax"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                        animationDuration={2000}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FinancialStoryChart;
