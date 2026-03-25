// =====================================================
// MAIN APP COMPONENT - MVP ROUTES
// =====================================================

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

// Core components (synchronous - needed immediately)
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteLoader from './components/UI/RouteLoader';
import { ITRProvider } from './contexts/ITRContext';
import { getAllFilingRoutes } from './routes/filingRoutes';

// Styles
import './styles/GlobalStyles.css';

// =====================================================
// LAZY IMPORTS - MVP ONLY
// =====================================================

// Public
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const HomeRedirect = lazy(() => import('./pages/HomeRedirect'));

// Auth
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/Auth/SignupPage'));
const EmailVerification = lazy(() => import('./pages/Auth/EmailVerification'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const GoogleOAuthSuccess = lazy(() => import('./pages/Auth/GoogleOAuthSuccess'));
const GoogleOAuthError = lazy(() => import('./pages/Auth/GoogleOAuthError'));

// Dashboard
const UserDashboard = lazy(() => import('./pages/Dashboard/UserDashboard'));

// Filing flow
const StartFilingPage = lazy(() => import('./pages/Filing/StartFilingPage'));
const ITRDeterminationWizard = lazy(() => import('./pages/Filing/ITRDetermination/ITRDeterminationWizard'));
const DeductionsPage = lazy(() => import('./pages/Filing/DeductionsPage'));
const TaxCalculationPage = lazy(() => import('./pages/Filing/TaxCalculationPage'));
const ReviewSubmitPage = lazy(() => import('./pages/Filing/ReviewSubmitPage'));
const SubmissionStatus = lazy(() => import('./pages/Filing/SubmissionStatus'));

// ITR
const PANVerification = lazy(() => import('./pages/ITR/PANVerification'));
const FilingHistory = lazy(() => import('./pages/ITR/FilingHistory'));
const EVerification = lazy(() => import('./pages/ITR/EVerification'));

// Income
const UnifiedIncomePage = lazy(() => import('./pages/Income/UnifiedIncomePage'));

// User
const ProfileSettings = lazy(() => import('./pages/User/ProfileSettings'));
const SessionManagement = lazy(() => import('./pages/User/SessionManagement'));
const Acknowledgment = lazy(() => import('./pages/Acknowledgment'));

// =====================================================
// HELPERS
// =====================================================

function AcknowledgmentRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const filingId = params.get('filingId') || location.state?.filingId || null;
  if (!filingId) return <Navigate to="/dashboard" replace />;
  return <Navigate to={`/acknowledgment/${filingId}`} replace state={{ ...(location.state || {}), filingId }} />;
}

// Wrap route element with Suspense + Layout
const Page = ({ children, message = 'Loading...' }) => (
  <Layout>
    <Suspense fallback={<RouteLoader message={message} />}>
      {children}
    </Suspense>
  </Layout>
);

const Bare = ({ children, message = 'Loading...' }) => (
  <Suspense fallback={<RouteLoader message={message} />}>
    {children}
  </Suspense>
);

// =====================================================
// APP
// =====================================================

const AppContent = () => (
  <div className="app">
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Bare><LandingPage /></Bare>} />
      <Route path="/login" element={<Bare message="Loading login..."><LoginPage /></Bare>} />
      <Route path="/signup" element={<Bare message="Loading signup..."><SignupPage /></Bare>} />
      <Route path="/email-verification" element={<Bare><EmailVerification /></Bare>} />
      <Route path="/forgot-password" element={<Bare><ForgotPassword /></Bare>} />
      <Route path="/reset-password" element={<Bare><ResetPassword /></Bare>} />
      <Route path="/auth/google/success" element={<Bare><GoogleOAuthSuccess /></Bare>} />
      <Route path="/auth/google/error" element={<Bare><GoogleOAuthError /></Bare>} />

      {/* ── Protected ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Bare><HomeRedirect /></Bare>} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Page message="Loading dashboard..."><UserDashboard /></Page>} />

        {/* Profile & Settings */}
        <Route path="/profile" element={<Page><ProfileSettings /></Page>} />
        <Route path="/sessions" element={<Page><SessionManagement /></Page>} />

        {/* PAN Verification */}
        <Route path="/itr/pan-verification" element={<Page><PANVerification /></Page>} />

        {/* Filing: start + determination */}
        <Route path="/filing/start" element={<Page message="Loading filing wizard..."><ITRDeterminationWizard /></Page>} />
        <Route path="/filing/new" element={<Page><StartFilingPage /></Page>} />

        {/* Filing: per-filing flow */}
        <Route path="/filing/:filingId/income" element={<Page><UnifiedIncomePage /></Page>} />
        <Route path="/filing/:filingId/deductions" element={<Page><DeductionsPage /></Page>} />
        <Route path="/filing/:filingId/tax-calculation" element={<Page><TaxCalculationPage /></Page>} />
        <Route path="/filing/:filingId/review" element={<Page><ReviewSubmitPage /></Page>} />
        <Route path="/filing/:filingId/submission-status" element={<Page><SubmissionStatus /></Page>} />

        {/* Centralized filing sub-routes (from filingRoutes.js) */}
        <Route element={<ITRProvider><Outlet /></ITRProvider>}>
          {getAllFilingRoutes().map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Page message={`Loading ${route.title || 'filing'}...`}>
                  <route.component />
                </Page>
              }
            />
          ))}
        </Route>

        {/* ITR utilities */}
        <Route path="/itr/history" element={<Page><FilingHistory /></Page>} />
        <Route path="/itr/e-verify" element={<Page><EVerification /></Page>} />
        <Route path="/itr/acknowledgment" element={<Page><AcknowledgmentRedirect /></Page>} />
        <Route path="/acknowledgment/:filingId" element={<Page><Acknowledgment /></Page>} />

        {/* Income (standalone) */}
        <Route path="/income" element={<Page><UnifiedIncomePage /></Page>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
