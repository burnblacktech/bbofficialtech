/**
 * RequestInfoModal.jsx
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';

const RequestInfoModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('DOCUMENT'); // DOCUMENT | CLARIFICATION | INCOME
    const [blocking, setBlocking] = useState(true);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onSubmit({ reason, category, blocking });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Request Information</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Information Needed</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                            placeholder="Describe what is missing or needs clarification..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="DOCUMENT">Missing Document</option>
                            <option value="CLARIFICATION">Clarification Needed</option>
                            <option value="INCOME">Income Correction</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="blocking"
                            checked={blocking}
                            onChange={(e) => setBlocking(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="blocking" className="text-sm text-slate-700">This issue blocks filing</label>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestInfoModal;
