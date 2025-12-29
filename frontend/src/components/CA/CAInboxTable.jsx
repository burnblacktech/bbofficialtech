/**
 * CAInboxTable.jsx
 * V3.1 CA Workspace Table
 */

import React from 'react';
import { format } from 'date-fns';

const TrustBadge = ({ score, band }) => {
    let colorClass = 'bg-slate-100 text-slate-800';
    if (band === 'HIGH') colorClass = 'bg-green-100 text-green-800';
    if (band === 'MEDIUM') colorClass = 'bg-amber-100 text-amber-800';
    if (band === 'LOW') colorClass = 'bg-red-100 text-red-800';

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {score} • {band}
        </span>
    );
};

const CAInboxTable = ({ items, onRowClick }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ITR Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trust Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Signals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Update</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {items.map((item) => (
                        <tr
                            key={item.filingId}
                            onClick={() => onRowClick && onRowClick(item.filingId)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">{item.clientName}</span>
                                    <span className="text-xs text-slate-500">{item.pan}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-slate-700">{item.itrType || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <TrustBadge score={item.trustScore} band={item.confidenceBand} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${item.riskSignalCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {item.riskSignalCount} Signals
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {item.updatedAt ? format(new Date(item.updatedAt), 'MMM d, HH:mm') : '-'}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-sm">
                                No filings found in inbox.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CAInboxTable;
