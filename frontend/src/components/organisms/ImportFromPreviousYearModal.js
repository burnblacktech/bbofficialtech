import React, { useState } from 'react';
import { Download, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../atoms/Button';

const ImportFromPreviousYearModal = ({ isOpen, onClose, onImport, previousFY = '2023-24', currentFY = '2024-25' }) => {
    const [selectedSources, setSelectedSources] = useState([]);
    const [inflationRate, setInflationRate] = useState(5); // Default 5%
    const [applyInflation, setApplyInflation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock data - in real implementation, this would come from API
    const previousYearSources = [
        { id: '1', type: 'salary', description: 'Salary from Acme Corp', amount: 1200000 },
        { id: '2', type: 'business', description: 'Freelance Consulting', amount: 500000 },
        { id: '3', type: 'rental', description: 'House Property - Rent', amount: 180000 },
    ];

    const toggleSource = (sourceId) => {
        setSelectedSources(prev =>
            prev.includes(sourceId)
                ? prev.filter(id => id !== sourceId)
                : [...prev, sourceId],
        );
    };

    const selectAll = () => {
        setSelectedSources(previousYearSources.map(s => s.id));
    };

    const deselectAll = () => {
        setSelectedSources([]);
    };

    const calculateAdjustedAmount = (amount) => {
        if (!applyInflation) return amount;
        return Math.round(amount * (1 + inflationRate / 100));
    };

    const handleImport = async () => {
        if (selectedSources.length === 0) {
            toast.error('Please select at least one income source');
            return;
        }

        setIsLoading(true);
        try {
            const sourcesToImport = previousYearSources
                .filter(s => selectedSources.includes(s.id))
                .map(s => ({
                    ...s,
                    originalAmount: s.amount,
                    adjustedAmount: calculateAdjustedAmount(s.amount),
                    inflationApplied: applyInflation,
                    inflationRate: applyInflation ? inflationRate : 0,
                }));

            await onImport(sourcesToImport);
            toast.success(`Imported ${sourcesToImport.length} income sources from FY ${previousFY}`);
            onClose();
        } catch (error) {
            toast.error('Failed to import income sources');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Download size={24} className="text-blue-600" />
                                Import from FY {previousFY}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Select income sources to copy to FY {currentFY}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Selection Controls */}
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            {selectedSources.length} of {previousYearSources.length} selected
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Select All
                            </button>
                            <span className="text-gray-400">|</span>
                            <button
                                onClick={deselectAll}
                                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    {/* Income Sources List */}
                    <div className="space-y-3">
                        {previousYearSources.map((source) => (
                            <div
                                key={source.id}
                                onClick={() => toggleSource(source.id)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSources.includes(source.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${selectedSources.includes(source.id)
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300'
                                        }`}>
                                        {selectedSources.includes(source.id) && (
                                            <Check size={14} className="text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{source.description}</div>
                                        <div className="text-sm text-gray-600 capitalize">{source.type} Income</div>
                                        <div className="mt-2 flex items-center gap-4">
                                            <div className="text-sm">
                                                <span className="text-gray-600">Original: </span>
                                                <span className="font-semibold">₹{source.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                            {applyInflation && (
                                                <div className="text-sm">
                                                    <span className="text-gray-600">Adjusted: </span>
                                                    <span className="font-semibold text-green-600">
                                                        ₹{calculateAdjustedAmount(source.amount).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Inflation Adjustment */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyInflation}
                                onChange={(e) => setApplyInflation(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="font-medium text-gray-900">Apply inflation adjustment</span>
                        </label>
                        {applyInflation && (
                            <div className="mt-3 flex items-center gap-3">
                                <label className="text-sm text-gray-600">Inflation Rate:</label>
                                <input
                                    type="number"
                                    value={inflationRate}
                                    onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                                    className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                                <span className="text-sm text-gray-600">%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        disabled={isLoading || selectedSources.length === 0}
                    >
                        {isLoading ? 'Importing...' : `Import ${selectedSources.length} Source${selectedSources.length !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImportFromPreviousYearModal;
