// =====================================================
// MAIN APP COMPONENT - MVP ROUTES
// =====================================================

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Core components (synchronous - needed immediately)
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteLoader from './components/UI/RouteLoader';

// Styles
import './styles/theme.css';
import './styles/GlobalStyles.css';

// =====================================================
// LAZY IMPORTS - MVP ONLY
// =====================================================

// Public
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const HomeRedirect = lazy(() => import('./pages/HomeRedirect'));
const TaxCalculator = lazy(() => import('./pages/Tools/TaxCalculator'));

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
const ITRDeterminationWizard = lazy(() => import('./pages/Filing/ITRDetermination/ITRDeterminationWizard'));
const SubmissionStatus = lazy(() => import('./pages/Filing/SubmissionStatus'));
const ITR1Flow = lazy(() => import('./pages/Filing/ITR1/ITR1Flow'));

// ITR
const PANVerification = lazy(() => import('./pages/ITR/PANVerification'));
const FilingHistory = lazy(() => import('./pages/ITR/FilingHistory'));
const EVerification = lazy(() => import('./pages/ITR/EVerification'));

// User
const ProfileSettings = lazy(() => import('./pages/User/ProfileSettings'));
const SessionManagement = lazy(() => import('./pages/User/SessionManagement'));
const AuditTrailPage = lazy(() => import('./pages/User/AuditTrailPage'));
const DataExportPage = lazy(() => import('./pages/User/DataExportPage'));
const Acknowledgment = lazy(() => import('./pages/Acknowledgment'));

// Family + Vault + Post-Filing
const FamilyPage = lazy(() => import('./pages/Family/FamilyPage'));
const VaultPage = lazy(() => import('./pages/Vault/VaultPage'));
const RefundTracker = lazy(() => import('./pages/PostFiling/RefundTracker'));
const CPCDecoder = lazy(() => import('./pages/PostFiling/CPCDecoder'));
const RevisedReturnWizard = lazy(() => import('./pages/PostFiling/RevisedReturnWizard'));

// Admin
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminProtectedRoute = lazy(() => import('./components/auth/AdminProtectedRoute'));

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
      <Route path="/tax-calculator" element={<Bare message="Loading..."><TaxCalculator /></Bare>} />
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
        <Route path="/activity" element={<Page><AuditTrailPage /></Page>} />
        <Route path="/data" element={<Page><DataExportPage /></Page>} />

        {/* Family + Vault */}
        <Route path="/family" element={<Page><FamilyPage /></Page>} />
        <Route path="/vault" element={<Page><VaultPage /></Page>} />

        {/* Post-Filing */}
        <Route path="/post-filing/:filingId/refund" element={<Page><RefundTracker /></Page>} />
        <Route path="/post-filing/:filingId/cpc" element={<Page><CPCDecoder /></Page>} />
        <Route path="/post-filing/:filingId/revised" element={<Page><RevisedReturnWizard /></Page>} />

        {/* PAN Verification */}
        <Route path="/itr/pan-verification" element={<Page><PANVerification /></Page>} />

        {/* Filing: start */}
        <Route path="/filing/start" element={<Page message="Loading..."><ITRDeterminationWizard /></Page>} />

        {/* ITR filing — unified HUD inside main layout */}
        <Route path="/filing/:filingId/itr1" element={<Page message="Loading..."><ITR1Flow /></Page>} />
        <Route path="/filing/:filingId/itr2" element={<Page message="Loading..."><ITR1Flow /></Page>} />
        <Route path="/filing/:filingId/itr3" element={<Page message="Loading..."><ITR1Flow /></Page>} />
        <Route path="/filing/:filingId/itr4" element={<Page message="Loading..."><ITR1Flow /></Page>} />
        <Route path="/filing/:filingId/submission-status" element={<Page><SubmissionStatus /></Page>} />

        {/* ITR utilities */}
        <Route path="/itr/history" element={<Page><FilingHistory /></Page>} />
        <Route path="/itr/e-verify" element={<Page><EVerification /></Page>} />
        <Route path="/itr/acknowledgment" element={<Page><AcknowledgmentRedirect /></Page>} />
        <Route path="/acknowledgment/:filingId" element={<Page><Acknowledgment /></Page>} />
      </Route>

      {/* ── Admin ── */}
      <Route element={<Suspense fallback={<RouteLoader message="Loading admin..." />}><AdminProtectedRoute /></Suspense>}>
        <Route element={<Suspense fallback={<RouteLoader />}><AdminLayout /></Suspense>}>
          <Route path="/admin" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/filings" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/revenue" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/eri" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/coupons" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/health" element={<Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense>} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>
);

const App = () => {
  // Prevent scroll-wheel from changing number input values globally
  useEffect(() => {
    const handler = () => { if (document.activeElement?.type === 'number') document.activeElement.blur(); };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
