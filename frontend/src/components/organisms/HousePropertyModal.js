import React, { useState, useEffect } from 'react';
import { Home, Percent, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../atoms/Button';
import { tokens } from '../../styles/tokens';

const HousePropertyModal = ({ onClose, onSave, isProcessing }) => {
    const [propertyType, setPropertyType] = useState('self_occupied'); // 'self_occupied' | 'let_out'
    const [formData, setFormData] = useState({
        address: '',
        grossRent: '',
        municipalTaxes: '',
        interestPayable: '',
        preConstructionInterest: '',
    });

    const [calculation, setCalculation] = useState({
        nav: 0,
        standardDeduction: 0,
        netIncome: 0,
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Auto-Calculate on change
    useEffect(() => {
        const rent = parseFloat(formData.grossRent || 0);
        const taxes = parseFloat(formData.municipalTaxes || 0);
        const interest = parseFloat(formData.interestPayable || 0);
        const preInterest = parseFloat(formData.preConstructionInterest || 0);

        if (propertyType === 'self_occupied') {
            // Self Occupied: GAV is Nil. Net Income = - (Interest + PreInterest)
            // Deduction limited to 2L u/s 24(b) usually, but frontend normally sends actuals
            setCalculation({
                nav: 0,
                standardDeduction: 0,
                netIncome: -(interest + preInterest),
            });
        } else {
            // Let Out
            const nav = rent - taxes;
            const stdDed = nav > 0 ? nav * 0.3 : 0; // 30% of NAV
            const net = nav - stdDed - (interest + preInterest);

            setCalculation({
                nav: nav,
                standardDeduction: stdDed,
                netIncome: net,
            });
        }
    }, [formData, propertyType]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (propertyType === 'let_out' && !formData.grossRent) {
            toast.error('Please enter Gross Annual Rent');
            return;
        }

        const payload = {
            type: 'rental',
            subType: propertyType,
            data: {
                ...formData,
                amount: calculation.netIncome, // This can be negative (Loss)
                description: formData.address || (propertyType === 'self_occupied' ? 'Self-Occupied House' : 'Rented Property'),
            },
        };

        onSave(payload);
    };

    const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

    return (
        <div className="flex flex-col h-full">
            {/* Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${propertyType === 'self_occupied'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setPropertyType('self_occupied')}
                >
                    Self-Occupied
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${propertyType === 'let_out'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setPropertyType('let_out')}
                >
                    Let Out (Rented)
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 space-y-6">
                {propertyType === 'self_occupied' && (
                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
                        <Home className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <strong>Home Loan Benefit:</strong> You can claim deduction up to ₹2 Lakhs on interest paid for your own home.
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Address (Optional)</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Flat No, Building, City"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                </div>

                {propertyType === 'let_out' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gross Rent Received</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.grossRent}
                                        onChange={(e) => handleInputChange('grossRent', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Municipal Taxes Paid</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                        value={formData.municipalTaxes}
                                        onChange={(e) => handleInputChange('municipalTaxes', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Percent size={16} className="text-gray-500" /> Interest Deductions
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Payable</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                    value={formData.interestPayable}
                                    onChange={(e) => handleInputChange('interestPayable', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Interest on housing loan</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Construction Interest</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                    value={formData.preConstructionInterest}
                                    onChange={(e) => handleInputChange('preConstructionInterest', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">1/5th of total pre-const interest</p>
                        </div>
                    </div>
                </div>

                {/* Live Calculation Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2 text-sm">
                    {propertyType === 'let_out' && (
                        <>
                            <div className="flex justify-between text-gray-600">
                                <span>Net Annual Value (NAV)</span>
                                <span>{formatCurrency(calculation.nav)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Standard Deduction (30%)</span>
                                <span>- {formatCurrency(calculation.standardDeduction)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                        <span>Net Income from Property</span>
                        <span className={calculation.netIncome < 0 ? 'text-green-600' : 'text-gray-900'}>
                            {formatCurrency(calculation.netIncome)}
                            {calculation.netIncome < 0 && <span className="text-xs font-normal text-green-600 ml-1">(Loss)</span>}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : 'Save House Property'}
                </Button>
            </div>
        </div>
    );
};

export default HousePropertyModal;
