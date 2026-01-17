import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Building, Home, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageContent } from '../../components/Layout/PageContent';
import Button from '../../components/atoms/Button';
import IncomeSourceCard from '../../components/molecules/IncomeSourceCard';
import FinancialYearSelector from '../../components/molecules/FinancialYearSelector';
import TaxImpactSidebar from '../../components/organisms/TaxImpactSidebar';
import Modal, { ModalHeader, ModalBody, ModalTitle } from '../../components/common/Modal';
import DocumentUploadZone from '../../components/molecules/DocumentUploadZone';

import BusinessIncomeModal from '../../components/organisms/BusinessIncomeModal';
import CapitalGainsModal from '../../components/organisms/CapitalGainsModal';
import HousePropertyModal from '../../components/organisms/HousePropertyModal';
import SalaryIncomeModal from '../../components/organisms/SalaryIncomeModal';
import ImportFromPreviousYearModal from '../../components/organisms/ImportFromPreviousYearModal';
import incomeService from '../../services/incomeService';
import { tokens } from '../../styles/tokens';

const UnifiedIncomePage = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedIncomeType, setSelectedIncomeType] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedFY, setSelectedFY] = useState('2024-25'); // Default to current FY
    const [showImportModal, setShowImportModal] = useState(false);

    // Initial load - Check URL param
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam) {
            const matchedType = incomeTypes.find(t => t.id === typeParam);
            if (matchedType) {
                setSelectedIncomeType(matchedType);
            }
        }
    }, [searchParams]);

    // Define income types first so useEffect can use it
    const incomeTypes = [
        {
            id: 'salary',
            label: 'Salary',
            icon: Briefcase,
            color: tokens.colors.primary[600],
            description: 'Income from your employer(s)',
        },
        {
            id: 'business',
            label: 'Business & Profession',
            icon: Building,
            color: tokens.colors.accent[600],
            description: 'Income from business, freelancing, or profession (44AD/ADA)',
        },
        {
            id: 'rental',
            label: 'House Property',
            icon: Home,
            color: tokens.colors.success[600],
            description: 'Rent from property or home loan interest',
        },
        {
            id: 'capital_gains',
            label: 'Capital Gains',
            icon: TrendingUp,
            color: tokens.colors.warning[600],
            description: 'Profit from sale of stocks, mutual funds, or property',
        },
        {
            id: 'other',
            label: 'Other Sources',
            icon: Wallet,
            color: tokens.colors.info[600],
            description: 'Interest, dividends, gifts, or winnings',
        },
    ];

    // Specific fields
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        source: '',
        employerName: '',
        grossSalary: '',
        details: {},
    });

    // Fetch income sources for selected FY
    const { data: incomeSources, isLoading } = useQuery({
        queryKey: ['income', 'summary', selectedFY],
        queryFn: () => incomeService.getIncomeSummary(selectedFY),
    });

    // Add income mutation
    const addIncomeMutation = useMutation({
        mutationFn: (data) => incomeService.createIncome(data),
        onSuccess: () => {
            toast.success('Income update saved!');
            queryClient.invalidateQueries(['income']);
            handleCloseModal();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to save income');
        },
    });

    const handleCloseModal = () => {
        setSelectedIncomeType(null);
        setShowUpload(false);
        setFormData({ amount: '', description: '', source: '', employerName: '', grossSalary: '', details: {} });
    };

    const handleCardClick = (type) => {
        setSelectedIncomeType(type);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Basic payload construction - will be refined for specific types
        const payload = {
            sourceType: selectedIncomeType.id,
            amount: parseFloat(formData.amount || formData.grossSalary || 0),
            financialYear: '2024-25',
            sourceData: {
                source: formData.source || selectedIncomeType.label,
                description: formData.description,
                ...formData,
                details: formData.details,
            },
        };

        addIncomeMutation.mutate(payload);
    };

    // Income Types Config (Removed from here as it's moved up)
    // const incomeTypes = [...];

    // Helper to get total amount for a type
    const getAmountForType = (typeId) => {
        // Handle response structure ( { data: [...] } or just [...] )
        const sources = Array.isArray(incomeSources) ? incomeSources : (incomeSources?.data || []);
        if (!Array.isArray(sources)) return 0;

        const source = sources.find(s => s.sourceType === typeId);
        return source ? source.totalAmount : 0;
    };

    const getCountForType = (typeId) => {
        const sources = Array.isArray(incomeSources) ? incomeSources : (incomeSources?.data || []);
        if (!Array.isArray(sources)) return 0;

        const source = sources.find(s => s.sourceType === typeId);
        return source ? source.count : 0;
    };

    // Calculate total income for tax calculator
    const totalIncome = useMemo(() => {
        const sources = Array.isArray(incomeSources) ? incomeSources : (incomeSources?.data || []);
        if (!Array.isArray(sources)) return 0;
        return sources.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    }, [incomeSources]);

    return (
        <PageContent
            title="Your Financial Story"
            subtitle="Let's build your financial profile for FY 2024-25. Add all your income sources below."
        >
            {/* Financial Year Selector */}
            <FinancialYearSelector
                selectedFY={selectedFY}
                onFYChange={(fy) => {
                    setSelectedFY(fy);
                    toast.success(`Switched to FY ${fy}`);
                }}
                showCopyOption={true}
                onCopyFromPrevious={(prevFY) => {
                    setShowImportModal(true);
                }}
            />

            {/* Financial Summary Banner */}
            <div
                className="mb-8 p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeSlideIn"
                style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Total Income Reported</h2>
                        <div className="text-4xl sm:text-5xl font-bold text-emerald-400 mb-3 transition-all duration-200">
                            {/* Calculate total client-side if not provided in summary object */}
                            ₹{(() => {
                                const sources = Array.isArray(incomeSources) ? incomeSources : (incomeSources?.data || []);
                                const total = Array.isArray(sources)
                                    ? sources.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                                    : 0;
                                return total.toLocaleString('en-IN');
                            })()}
                        </div>
                        <p className="text-slate-300 text-sm sm:text-base flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span>
                            Across {(() => {
                                const sources = Array.isArray(incomeSources) ? incomeSources : (incomeSources?.data || []);
                                return Array.isArray(sources) ? sources.length : 0;
                            })()} active sources
                        </p>
                    </div>
                    {/* Placeholder for Mini Chart */}
                    <div className="hidden md:flex h-20 w-40 bg-white/10 rounded-xl backdrop-blur-sm items-center justify-center">
                        <div className="text-center">
                            <div className="text-xs text-white/60 mb-1">FY {selectedFY}</div>
                            <div className="text-sm text-white/80 font-semibold">Growth Chart</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Grid with Tax Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
                {/* Main Content - Income Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {incomeTypes.map((type, index) => (
                            <div
                                key={type.id}
                                className="animate-fadeSlideIn"
                                style={{
                                    animationDelay: `${0.2 + index * 0.1}s`,
                                    animationFillMode: 'both',
                                }}
                            >
                                <IncomeSourceCard
                                    title={type.label}
                                    icon={type.icon}
                                    color={type.color}
                                    amount={getAmountForType(type.id)}
                                    count={getCountForType(type.id)}
                                    onClick={() => handleCardClick(type)}
                                    isCompleted={getAmountForType(type.id) > 0}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Tax Calculator */}
                <div
                    className="lg:col-span-1 animate-fadeSlideIn"
                    style={{
                        animationDelay: '0.4s',
                        animationFillMode: 'both',
                    }}
                >
                    <TaxImpactSidebar
                        totalIncome={totalIncome}
                        deductions={0} // Will be updated when deductions are added
                        isVisible={totalIncome > 0}
                    />
                </div>
            </div>

            {/* Navigation Footer */}
            <div
                className="flex justify-between items-center pt-8 border-t-2 border-slate-200 animate-fadeSlideIn"
                style={{
                    animationDelay: '0.6s',
                    animationFillMode: 'both',
                }}
            >
                <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Next:</span> Add deductions to optimize your tax
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    className="flex items-center gap-2 min-h-[44px] transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                    Continue to Deductions <ArrowRight size={20} />
                </Button>
            </div>

            <style jsx>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeSlideIn {
                    animation: fadeSlideIn 0.3s ease-out;
                }
            `}</style>

            {/* Unified Input Modal */}
            <Modal
                isOpen={!!selectedIncomeType}
                onClose={handleCloseModal}
                size="large"
                title={`Add ${selectedIncomeType?.label}`}
            >
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        {selectedIncomeType && React.createElement(selectedIncomeType.icon, {
                            size: 24,
                            color: selectedIncomeType.color,
                        })}
                        Add {selectedIncomeType?.label}
                    </ModalTitle>
                    <p className="text-slate-500 mt-1">{selectedIncomeType?.description}</p>
                </ModalHeader>

                <ModalBody>
                    {/* Dynamic Form Content */}
                    <form id="income-form" onSubmit={handleFormSubmit} className="space-y-6">

                        {/* Salary Specific Modal */}
                        {selectedIncomeType?.id === 'salary' && (
                            <SalaryIncomeModal
                                onClose={handleCloseModal}
                                onSave={(payload) => {
                                    const mutationPayload = {
                                        sourceType: 'salary',
                                        amount: payload.data.amount,
                                        financialYear: '2024-25',
                                        sourceData: payload.data,
                                    };
                                    addIncomeMutation.mutate(mutationPayload);
                                }}
                                isProcessing={addIncomeMutation.isPending}
                            />
                        )}

                        {/* Business Specific Modal (NEW) */}
                        {selectedIncomeType?.id === 'business' && (
                            <BusinessIncomeModal
                                onClose={handleCloseModal}
                                onSave={(payload) => {
                                    // Adapt specific payload to generic mutation payload
                                    const mutationPayload = {
                                        sourceType: 'business',
                                        amount: payload.data.amount,
                                        financialYear: '2024-25',
                                        sourceData: payload.data,
                                    };
                                    addIncomeMutation.mutate(mutationPayload);
                                }}
                                isProcessing={addIncomeMutation.isPending}
                            />
                        )}

                        {/* Capital Gains Modal (NEW) */}
                        {selectedIncomeType?.id === 'capital_gains' && (
                            <CapitalGainsModal
                                onClose={handleCloseModal}
                                onSave={(payload) => {
                                    const mutationPayload = {
                                        sourceType: 'capital_gains',
                                        amount: payload.data.amount,
                                        financialYear: '2024-25',
                                        sourceData: payload.data,
                                    };
                                    addIncomeMutation.mutate(mutationPayload);
                                }}
                                isProcessing={addIncomeMutation.isPending}
                            />
                        )}

                        {/* House Property Modal (NEW) */}
                        {selectedIncomeType?.id === 'rental' && (
                            <HousePropertyModal
                                onClose={handleCloseModal}
                                onSave={(payload) => {
                                    const mutationPayload = {
                                        sourceType: 'rental',
                                        amount: payload.data.amount,
                                        financialYear: '2024-25',
                                        sourceData: payload.data,
                                    };
                                    addIncomeMutation.mutate(mutationPayload);
                                }}
                                isProcessing={addIncomeMutation.isPending}
                            />
                        )}

                        {/* Generic Fields for Other Types (Phase 4 Step 2) */}
                        {selectedIncomeType?.id !== 'salary' && selectedIncomeType?.id !== 'business' && selectedIncomeType?.id !== 'capital_gains' && selectedIncomeType?.id !== 'rental' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Source / Description</label>
                                    <input
                                        type="text"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={selectedIncomeType?.id === 'business' ? 'Business Name' : 'Description'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-500">₹</span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                                    🚀 Detailed form for {selectedIncomeType?.label} coming soon in Step 2!
                                    This generic form saves to the {selectedIncomeType?.label} head.
                                </div>
                                <div className="modal-footer flex justify-end gap-3 p-6 border-t border-slate-100">
                                    <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                    <Button variant="primary" onClick={handleFormSubmit} disabled={addIncomeMutation.isPending}>
                                        {addIncomeMutation.isPending ? 'Saving...' : 'Add Income'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </ModalBody>

                <div className="modal-footer flex justify-end gap-3 p-6 border-t border-slate-100">
                    <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                    <Button variant="primary" onClick={handleFormSubmit} disabled={addIncomeMutation.isPending}>
                        {addIncomeMutation.isPending ? 'Saving...' : 'Add Income'}
                    </Button>
                </div>
            </Modal>

            {/* Import from Previous Year Modal */}
            <ImportFromPreviousYearModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                previousFY="2023-24"
                currentFY={selectedFY}
                onImport={async (sources) => {
                    // Import sources to current FY
                    for (const source of sources) {
                        const payload = {
                            sourceType: source.type,
                            amount: source.adjustedAmount,
                            financialYear: selectedFY,
                            sourceData: {
                                ...source,
                                importedFrom: '2023-24',
                                inflationApplied: source.inflationApplied,
                            },
                        };
                        await incomeService.createIncome(payload);
                    }
                    queryClient.invalidateQueries(['income']);
                }}
            />
        </PageContent>
    );
};

export default UnifiedIncomePage;
