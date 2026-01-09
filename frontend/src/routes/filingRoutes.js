// =====================================================
// FILING ROUTES - CENTRALIZED CONFIGURATION
// Explicitly defines all allowed routes for the filing flow.
// No implicit or auto-generated routes allowed for filing.
// =====================================================

import { lazy } from 'react';

// Lazy load components
const StartFilingGate = lazy(() => import('../pages/ITR/StartFilingGate'));
const PANVerification = lazy(() => import('../pages/ITR/PANVerification'));
const IncomeSourcesSelection = lazy(() => import('../pages/ITR/IncomeSourcesSelection'));
const ITRDetermination = lazy(() => import('../pages/ITR/ITRDetermination'));
const ITR3EntryCeremony = lazy(() => import('../pages/ITR/ITR3EntryCeremony'));

const ITR3BusinessProfile = lazy(() => import('../pages/Filing/ITR3BusinessProfile'));
const ITR3ProfitLoss = lazy(() => import('../pages/Filing/ITR3ProfitLoss'));
const ITR3BalanceSheet = lazy(() => import('../pages/Filing/ITR3BalanceSheet'));
const ITR3AssetsLiabilities = lazy(() => import('../pages/Filing/ITR3AssetsLiabilities'));

const FilingHistory = lazy(() => import('../pages/ITR/FilingHistory'));

export const FILING_ROUTES = {

    entry: [
        {
            path: '/itr/start',
            component: StartFilingGate,
            protected: true,
            title: 'Welcome',
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
            title: 'Confirm Income Sources',
        },
        {
            path: '/itr/determination',
            component: ITRDetermination,
            protected: true,
            title: 'Your ITR Type',
        },
        {
            path: '/itr/itr3-ceremony',
            component: ITR3EntryCeremony,
            protected: true,
            title: 'Professional Mode Entry',
        },
        {
            path: '/itr/filing-history',
            component: FilingHistory,
            protected: true,
            title: 'Filing History',
        },
    ],

    // Legacy routes removed - replaced by Financial Story UX
    filing: [],

    // Review & Submit (Future phases)
    review: [],

    // S28: Professional Mode (ITR-3)
    professional: [
        {
            path: '/filing/:filingId/income/business',
            component: ITR3BusinessProfile,
            protected: true,
            title: 'Business Profile',
        },
        {
            path: '/filing/:filingId/income/business/pl',
            component: ITR3ProfitLoss,
            protected: true,
            title: 'Profit & Loss',
        },
        {
            path: '/filing/:filingId/income/business/bs',
            component: ITR3BalanceSheet,
            protected: true,
            title: 'Balance Sheet',
        },
        {
            path: '/filing/:filingId/income/business/al',
            component: ITR3AssetsLiabilities,
            protected: true,
            title: 'Assets & Liabilities',
        },
    ],
};

// Helper to get all routes flattened
export const getAllFilingRoutes = () => {
    return [
        ...FILING_ROUTES.entry,
        ...FILING_ROUTES.filing,
        ...FILING_ROUTES.review,
        ...FILING_ROUTES.professional,
    ];
};
