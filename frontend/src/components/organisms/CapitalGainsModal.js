import React, { useState } from 'react';
import { TrendingUp, Home, FileText, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../atoms/Button';
import DocumentUploadZone from '../molecules/DocumentUploadZone';
import { tokens } from '../../styles/tokens';

const CapitalGainsModal = ({ onClose, onSave, isProcessing }) => {
    const [assetType, setAssetType] = useState('equity'); // 'equity' | 'property' | 'other'

    // Equity State
    const [equityData, setEquityData] = useState({
        uploadMethod: 'upload',
        brokerFile: null,
        manualTotalGain: '',
    });

    // Property State
    const [propertyData, setPropertyData] = useState({
        propertyType: 'residential',
        saleDate: '',
        saleValue: '',
        purchaseDate: '',
        purchaseValue: '',
        transferExpenses: '',
    });

    // Other Assets State
    const [otherData, setOtherData] = useState({
        description: '',
        saleValues: '',
        purchaseValues: '',
    });

    const handlePropertyChange = (field, value) => {
        setPropertyData({ ...propertyData, [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let payload = {
            type: 'capital_gains',
            subType: assetType,
            data: {},
        };

        if (assetType === 'equity') {
            if (equityData.uploadMethod === 'upload' && !equityData.brokerFile) {
                toast.error('Please upload your broker statement or AIS');
                return;
            }
            if (equityData.uploadMethod === 'manual' && !equityData.manualTotalGain) {
                toast.error('Please enter the total gain amount');
                return;
            }

            payload.data = {
                method: equityData.uploadMethod,
                file: equityData.brokerFile,
                manualGain: equityData.manualTotalGain,
                amount: parseFloat(equityData.manualTotalGain || 0), // Placeholder amount until OCR
                description: 'Capital Gains from Equity/MF',
            };

        } else if (assetType === 'property') {
            if (!propertyData.saleValue || !propertyData.purchaseValue) {
                toast.error('Please enter Sale and Purchase values');
                return;
            }

            const gain = parseFloat(propertyData.saleValue) - parseFloat(propertyData.purchaseValue);

            payload.data = {
                ...propertyData,
                amount: Math.max(0, gain), // Rough gain calculation
                description: `Sale of ${propertyData.propertyType} Property`,
            };

        } else {
            // Other
            if (!otherData.saleValues) {
                toast.error('Please enter details');
                return;
            }
            const gain = parseFloat(otherData.saleValues) - parseFloat(otherData.purchaseValues || 0);
            payload.data = {
                ...otherData,
                amount: Math.max(0, gain),
                description: otherData.description || 'Other Capital Gains',
            };
        }

        onSave(payload);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                    className={`flex-1 min-w-[120px] pb-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${assetType === 'equity'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setAssetType('equity')}
                >
                    <TrendingUp size={18} />
                    Stocks & MF
                </button>
                <button
                    className={`flex-1 min-w-[120px] pb-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${assetType === 'property'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setAssetType('property')}
                >
                    <Home size={18} />
                    Real Estate
                </button>
                <button
                    className={`flex-1 min-w-[120px] pb-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${assetType === 'other'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setAssetType('other')}
                >
                    <Coins size={18} />
                    Crypto / Gold
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                {assetType === 'equity' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-orange-50 rounded-lg text-sm text-orange-800 flex gap-3 items-start">
                            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong>Fastest Way:</strong> Upload your <strong>AIS (Annual Information Statement)</strong> or a Consolidated Capital Gains Statement from CAMS/Karvy/Zerodha. We'll extract every trade.
                            </div>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="eq-method"
                                    checked={equityData.uploadMethod === 'upload'}
                                    onChange={() => setEquityData({ ...equityData, uploadMethod: 'upload' })}
                                />
                                <span className="text-sm font-medium">Upload Statement</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="eq-method"
                                    checked={equityData.uploadMethod === 'manual'}
                                    onChange={() => setEquityData({ ...equityData, uploadMethod: 'manual' })}
                                />
                                <span className="text-sm font-medium">Enter Total Gain</span>
                            </label>
                        </div>

                        {equityData.uploadMethod === 'upload' ? (
                            <div className="animate-fade-in">
                                <DocumentUploadZone
                                    documentType="capital_gains_stmt"
                                    title="Upload Broker Statement / AIS"
                                    description="PDF, Excel, CSV supported. Try CAMS, KFintech, Zerodha reports."
                                    onUploadComplete={(file) => setEquityData({ ...equityData, brokerFile: file })}
                                    onExtractedData={(data) => {
                                        toast.success('Statement Processed!');
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Capital Gain (Short + Long Term)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                        value={equityData.manualTotalGain}
                                        onChange={(e) => setEquityData({ ...equityData, manualTotalGain: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Note: We recommend uploading for accuracy. Manual entry might require entering individual trades later for verification.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {assetType === 'property' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={propertyData.propertyType}
                                    onChange={(e) => handlePropertyChange('propertyType', e.target.value)}
                                >
                                    <option value="residential">Residential House</option>
                                    <option value="land">Land / Plot</option>
                                    <option value="commercial">Commercial Property</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <div className="h-px bg-gray-200 my-2"></div>
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Sale Details</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={propertyData.saleDate}
                                    onChange={(e) => handlePropertyChange('saleDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Value</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                        value={propertyData.saleValue}
                                        onChange={(e) => handlePropertyChange('saleValue', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <div className="h-px bg-gray-200 my-2"></div>
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Purchase Details (Cost)</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={propertyData.purchaseDate}
                                    onChange={(e) => handlePropertyChange('purchaseDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                        value={propertyData.purchaseValue}
                                        onChange={(e) => handlePropertyChange('purchaseValue', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost of Improvements / Transfer Expenses</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg"
                                        value={propertyData.transferExpenses}
                                        onChange={(e) => handlePropertyChange('transferExpenses', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg flex gap-2">
                            <AlertCircle size={16} className="text-blue-600 mt-1" />
                            <p className="text-xs text-blue-700">We will automatically calculate indexation benefits based on the purchase year to lower your tax.</p>
                        </div>
                    </div>
                )}

                {assetType === 'other' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={otherData.description}
                                onChange={(e) => setOtherData({ ...otherData, description: e.target.value })}
                                placeholder="e.g. Sale of Gold Jewelry, Bitcoin"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Value</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={otherData.saleValues}
                                onChange={(e) => setOtherData({ ...otherData, saleValues: e.target.value })}
                                placeholder="₹ 0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={otherData.purchaseValues}
                                onChange={(e) => setOtherData({ ...otherData, purchaseValues: e.target.value })}
                                placeholder="₹ 0"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : 'Save Capital Gains'}
                </Button>
            </div>
        </div>
    );
};

export default CapitalGainsModal;
