// =====================================================
// FILING ROUTES (S29 Hardened)
// Granular ITR Filing Flow
// =====================================================

import { lazy } from 'react';

// Common Filing Pages
const UnifiedFilingDashboard = lazy(() => import('../pages/Filing/UnifiedFilingDashboard'));
const FilingOverview = lazy(() => import('../pages/Filing/FilingOverview'));
const SalaryStoryDetailed = lazy(() => import('../pages/Filing/IncomeStory'));
const HousePropertyStory = lazy(() => import('../pages/Filing/HousePropertyStory'));
const CapitalGainsStory = lazy(() => import('../pages/Filing/CapitalGainsStory'));
const BusinessProfessionStory = lazy(() => import('../pages/Filing/PresumptiveIncomeStory'));
const TaxBreakdown = lazy(() => import('../pages/Filing/TaxBreakdown'));
const ReadinessCheck = lazy(() => import('../pages/Filing/FilingReadiness'));
const FinalSubmission = lazy(() => import('../pages/Filing/FinalSubmission'));
const TaxPaymentGate = lazy(() => import('../pages/Filing/TaxPaymentGate'));
const IncomeStory = lazy(() => import('../pages/Filing/IncomeStory'));
const SubmissionStatus = lazy(() => import('../pages/Filing/SubmissionStatus'));
const SalaryDetails = lazy(() => import('../pages/Filing/SalaryDetails'));
const AddCapitalGain = lazy(() => import('../pages/Filing/AddCapitalGain'));
const AddHouseProperty = lazy(() => import('../pages/Filing/AddHouseProperty'));
const PropertySaleDetails = lazy(() => import('../pages/Filing/PropertySaleDetails'));

// Granular Input Components (Phase 1 & 2)
const InterestIncomeDetails = lazy(() => import('../pages/Filing/InterestIncomeDetails'));
const DividendIncomeDetails = lazy(() => import('../pages/Filing/DividendIncomeDetails'));
const FamilyPensionDetails = lazy(() => import('../pages/Filing/FamilyPensionDetails'));
const DeductionsOverview = lazy(() => import('../pages/Filing/DeductionsOverview'));
const Section80CDetails = lazy(() => import('../pages/Filing/Section80CDetails'));
const Section80DDetails = lazy(() => import('../pages/Filing/Section80DDetails'));
const Section80GDetails = lazy(() => import('../pages/Filing/Section80GDetails'));
const OtherDeductionsDetails = lazy(() => import('../pages/Filing/OtherDeductionsDetails'));

// Phase 3 & 4 Components
const RegimeComparison = lazy(() => import('../pages/Filing/RegimeComparison'));
const ITRPreview = lazy(() => import('../pages/Filing/ITRPreview'));
const EVerificationSetup = lazy(() => import('../pages/Filing/EVerificationSetup'));

// ITR-3 Business Components
const ITR3BusinessProfile = lazy(() => import('../pages/Filing/ITR3BusinessProfile'));
const ITR3ProfitLoss = lazy(() => import('../pages/Filing/ITR3ProfitLoss'));
const ITR3BalanceSheet = lazy(() => import('../pages/Filing/ITR3BalanceSheet'));
const ITR3AssetsLiabilities = lazy(() => import('../pages/Filing/ITR3AssetsLiabilities'));
const ITR3DepreciationSchedule = lazy(() => import('../pages/Filing/ITR3DepreciationSchedule'));
const ITR3BookReconciliation = lazy(() => import('../pages/Filing/ITR3BookReconciliation'));
const ITR3AuditInformation = lazy(() => import('../pages/Filing/ITR3AuditInformation'));

// ITR-3/4 Specific
const PresumptiveIncomeStory = lazy(() => import('../pages/Filing/PresumptiveIncomeStory'));
const AddPresumptiveIncome = lazy(() => import('../pages/Filing/AddPresumptiveIncome'));
const GoodsCarriageDetails = lazy(() => import('../pages/Filing/GoodsCarriageDetails'));

// Legacy/Other
const OtherIncomeSourcesDetails = lazy(() => import('../pages/Filing/OtherIncomeSourcesDetails'));
const ForeignIncomeDetails = lazy(() => import('../pages/Filing/ForeignIncomeDetails'));
const FilingHistory = lazy(() => import('../pages/ITR/FilingHistory'));
const PANVerification = lazy(() => import('../pages/ITR/PANVerification'));
const IncomeSourcesSelection = lazy(() => import('../pages/ITR/IncomeSourcesSelection'));
const ITRDetermination = lazy(() => import('../pages/ITR/ITRDetermination'));
const ITR3EntryCeremony = lazy(() => import('../pages/ITR/ITR3EntryCeremony'));
const StreamlinedITRFlow = lazy(() => import('../pages/Filing/StreamlinedITR/StreamlinedITRFlow'));

export const FILING_ROUTES = {
    entry: [
        {
            path: '/filing/history',
            component: FilingHistory,
            protected: true,
            title: 'Filing History',
        },
        {
            path: '/itr/verify-identity',
            component: PANVerification,
            protected: true,
            title: 'Verify Identity',
        },
        {
            path: '/itr/confirm-sources',
            component: IncomeSourcesSelection,
            protected: true,
            title: 'Confirm Sources',
        },
        {
            path: '/itr/determination',
            component: ITRDetermination,
            protected: true,
            title: 'ITR Type',
        },
        {
            path: '/itr/itr3-ceremony',
            component: ITR3EntryCeremony,
            protected: true,
            title: 'ITR-3 Welcome',
        },
        {
            path: '/filing/streamlined',
            component: StreamlinedITRFlow,
            protected: true,
            title: 'Streamlined ITR Filing',
        },
    ],
    filing: [
        {
            path: '/filing/:filingId/unified',
            component: UnifiedFilingDashboard,
            protected: true,
            title: 'File Your Return',
        },
        {
            path: '/filing/:filingId/overview',
            component: FilingOverview,
            protected: true,
            title: 'Filing Overview',
        },
        {
            path: '/filing/:filingId/edit-sources',
            component: IncomeSourcesSelection,
            protected: true,
            title: 'Edit Income Sources',
        },
        {
            path: '/filing/:filingId/income/salary',
            component: SalaryDetails,
            protected: true,
            title: 'Salary Income',
        },
        {
            path: '/filing/:filingId/house-properties',
            component: HousePropertyStory,
            protected: true,
            title: 'House Property',
        },
        {
            path: '/filing/:filingId/capital-gains-story',
            component: CapitalGainsStory,
            protected: true,
            title: 'Capital Gains',
        },
        {
            path: '/filing/:filingId/business-profession',
            component: BusinessProfessionStory,
            protected: true,
            title: 'Business & Profession',
        },
        {
            path: '/filing/:filingId/interest-income',
            component: InterestIncomeDetails,
            protected: true,
            title: 'Interest Income',
        },
        {
            path: '/filing/:filingId/dividend-income',
            component: DividendIncomeDetails,
            protected: true,
            title: 'Dividend Income',
        },
        {
            path: '/filing/:filingId/family-pension',
            component: FamilyPensionDetails,
            protected: true,
            title: 'Family Pension',
        },
        {
            path: '/filing/:filingId/other-income-sources',
            component: OtherIncomeSourcesDetails,
            protected: true,
            title: 'Other Income',
        },
        {
            path: '/filing/:filingId/deductions',
            component: DeductionsOverview,
            protected: true,
            title: 'Deductions',
        },
        {
            path: '/filing/:filingId/deductions/80c',
            component: Section80CDetails,
            protected: true,
            title: 'Section 80C',
        },
        {
            path: '/filing/:filingId/deductions/80d',
            component: Section80DDetails,
            protected: true,
            title: 'Section 80D',
        },
        {
            path: '/filing/:filingId/deductions/80g',
            component: Section80GDetails,
            protected: true,
            title: 'Section 80G',
        },
        {
            path: '/filing/:filingId/deductions/other',
            component: OtherDeductionsDetails,
            protected: true,
            title: 'Other Deductions',
        },
        {
            path: '/filing/:filingId/tax-summary',
            component: TaxBreakdown,
            protected: true,
            title: 'Tax Calculation',
        },
        {
            path: '/filing/:filingId/tax-breakdown', // Legacy support
            component: TaxBreakdown,
            protected: true,
            title: 'Tax Breakdown',
        },
        {
            path: '/filing/:filingId/regime-comparison',
            component: RegimeComparison,
            protected: true,
            title: 'Regime Comparison',
        },
        {
            path: '/filing/:filingId/readiness',
            component: ITRPreview,
            protected: true,
            title: 'Final Review',
        },
        {
            path: '/filing/:filingId/e-verify',
            component: EVerificationSetup,
            protected: true,
            title: 'E-Verification',
        },
        {
            path: '/filing/:filingId/submit',
            component: FinalSubmission,
            protected: true,
            title: 'Final Submission',
        },
        {
            path: '/filing/:filingId/tax-payment',
            component: TaxPaymentGate,
            protected: true,
            title: 'Tax Payment',
        },
        {
            path: '/filing/:filingId/income-story',
            component: IncomeStory,
            protected: true,
            title: 'Income Story',
        },
        {
            path: '/filing/:filingId/submission-status',
            component: SubmissionStatus,
            protected: true,
            title: 'Submission Status',
        },
        {
            path: '/filing/:filingId/income/salary/details',
            component: SalaryDetails,
            protected: true,
            title: 'Salary Details',
        },
        {
            path: '/filing/:filingId/capital-gains/add',
            component: AddCapitalGain,
            protected: true,
            title: 'Add Capital Gain',
        },
        {
            path: '/filing/:filingId/house-property/add',
            component: AddHouseProperty,
            protected: true,
            title: 'Add House Property',
        },
        {
            path: '/filing/:filingId/house-property/edit/:propertyId',
            component: AddHouseProperty,
            protected: true,
            title: 'Edit House Property',
        },
        {
            path: '/filing/:filingId/capital-gains/edit/:eventId',
            component: AddCapitalGain,
            protected: true,
            title: 'Edit Capital Gain',
        },
        {
            path: '/filing/:filingId/property-sale',
            component: PropertySaleDetails,
            protected: true,
            title: 'Property Sale details',
        },
        {
            path: '/filing/:filingId/business/profile',
            component: ITR3BusinessProfile,
            protected: true,
            title: 'Business Profile',
        },
        {
            path: '/filing/:filingId/business/pl',
            component: ITR3ProfitLoss,
            protected: true,
            title: 'Profit & Loss',
        },
        {
            path: '/filing/:filingId/business/bs',
            component: ITR3BalanceSheet,
            protected: true,
            title: 'Balance Sheet',
        },
        {
            path: '/filing/:filingId/business/al',
            component: ITR3AssetsLiabilities,
            protected: true,
            title: 'Assets & Liabilities',
        },
        {
            path: '/filing/:filingId/business/depreciation',
            component: ITR3DepreciationSchedule,
            protected: true,
            title: 'Depreciation Schedule',
        },
        {
            path: '/filing/:filingId/business/reconciliation',
            component: ITR3BookReconciliation,
            protected: true,
            title: 'Book Reconciliation',
        },
        {
            path: '/filing/:filingId/business/audit',
            component: ITR3AuditInformation,
            protected: true,
            title: 'Audit Information',
        },
    ],
    itr24: [
        {
            path: '/filing/:filingId/presumptive-income',
            component: PresumptiveIncomeStory,
            protected: true,
        },
        {
            path: '/filing/:filingId/presumptive/add',
            component: AddPresumptiveIncome,
            protected: true,
        },
        {
            path: '/filing/:filingId/goods-carriage',
            component: GoodsCarriageDetails,
            protected: true,
        },
        {
            path: '/filing/:filingId/foreign-income',
            component: ForeignIncomeDetails,
            protected: true,
        },
    ],
    review: [],
    professional: [],
};

export const getAllFilingRoutes = () => {
    return [
        ...FILING_ROUTES.entry,
        ...FILING_ROUTES.filing,
        ...FILING_ROUTES.review,
        ...FILING_ROUTES.professional,
        ...FILING_ROUTES.itr24,
    ];
};
