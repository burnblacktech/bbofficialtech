// =====================================================
// FINANCIAL STORY UX ROUTES
// Pure projection screens - read-only truth display
// =====================================================

import { lazy } from 'react';

// Financial Story screens
export const FilingOverview = lazy(() => import('../pages/Filing/FilingOverview'));
export const IncomeStory = lazy(() => import('../pages/Filing/IncomeStory'));
export const TaxBreakdown = lazy(() => import('../pages/Filing/TaxBreakdown'));
export const FilingReadiness = lazy(() => import('../pages/Filing/FilingReadiness'));
export const UserDashboardV2 = lazy(() => import('../pages/Dashboard/UserDashboardV2'));

// Income entry screens
export const SalaryDetails = lazy(() => import('../pages/Filing/SalaryDetails'));
export const CapitalGainsStory = lazy(() => import('../pages/Filing/CapitalGainsStory'));
export const AddCapitalGain = lazy(() => import('../pages/Filing/AddCapitalGain'));
