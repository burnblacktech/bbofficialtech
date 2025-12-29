// =====================================================
// FILING ROUTES - CENTRALIZED CONFIGURATION
// Explicitly defines all allowed routes for the filing flow.
// No implicit or auto-generated routes allowed for filing.
// =====================================================

import { lazy } from 'react';

// Lazy load components
const FilingPersonSelector = lazy(() => import('../components/ITR/FilingPersonSelector'));
const ITRFormRecommender = lazy(() => import('../components/ITR/ITRFormRecommender'));
const ITRComputation = lazy(() => import('../pages/ITR/ITRComputation'));
const DetermineITR = lazy(() => import('../pages/ITR/DetermineITR'));
const YearTypeSelection = lazy(() => import('../pages/ITR/YearTypeSelection'));

const FilingHistory = lazy(() => import('../pages/ITR/FilingHistory'));

export const FILING_ROUTES = {

    entry: [
        {
            path: '/itr/start',
            component: YearTypeSelection, // V1 Entry
            protected: true,
            title: 'Select Year Type',
        },
        {
            path: '/itr/filing-history',
            component: FilingHistory,
            protected: true,
            title: 'Filing History',
        },
    ],

    // Core Filing Flow (Legacy determine routes kept for safety but bypassed)
    filing: [
        {
            path: '/itr/determine',
            component: DetermineITR,
            protected: true,
            title: 'Determine ITR',
        },
        {
            path: '/itr/recommend-form',
            component: ITRFormRecommender,
            protected: true,
            title: 'Form Recommendation',
        },

        {
            path: '/itr/computation',
            component: ITRComputation,
            protected: true,
            title: 'ITR Computation',
        },
    ],

    // Review & Submit (Future phases)
    review: [],
};

// Helper to get all routes flattened
export const getAllFilingRoutes = () => {
    return [
        ...FILING_ROUTES.entry,
        ...FILING_ROUTES.filing,
        ...FILING_ROUTES.review,
    ];
};
