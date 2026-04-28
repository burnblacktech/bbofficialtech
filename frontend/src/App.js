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
const TermsPage = lazy(() => import('./pages/Legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/Legal/PrivacyPage'));

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

// Finance pages
const FinanceOverview = lazy(() => import('./pages/Finance/FinanceOverview'));
const IncomeTracker = lazy(() => import('./pages/Finance/IncomeTracker'));
const ExpenseTracker = lazy(() => import('./pages/Finance/ExpenseTracker'));
const InvestmentLogger = lazy(() => import('./pages/Finance/InvestmentLogger'));

// Payments
const PaymentHistory = lazy(() => import('./pages/Payments/PaymentHistory'));

// Unified Settings Hub
const SettingsHub = lazy(() => import('./pages/Settings/SettingsHub'));

// Admin
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/Admin/AdminUserDetail'));
const AdminFilings = lazy(() => import('./pages/Admin/AdminFilings'));
const AdminRevenue = lazy(() => import('./pages/Admin/AdminRevenue'));
const AdminERI = lazy(() => import('./pages/Admin/AdminERI'));
const AdminCoupons = lazy(() => import('./pages/Admin/AdminCoupons'));
const AdminHealth = lazy(() => import('./pages/Admin/AdminHealth'));
const AdminFilingList = lazy(() => import('./pages/Admin/AdminFilingList'));
const AdminFilingCreate = lazy(() => import('./pages/Admin/AdminFilingCreate'));
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

const AppContent = () => {
  // Handle admin impersonation token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const impersonateToken = params.get('impersonate');
    if (impersonateToken) {
      localStorage.setItem('accessToken', impersonateToken);
      localStorage.setItem('isImpersonation', 'true');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
  }, []);

  return (
  <div className="app">
    {localStorage.getItem('isImpersonation') === 'true' && (
      <div style={{ background: '#DC2626', color: '#fff', padding: '6px 16px', fontSize: 12, fontWeight: 600, textAlign: 'center', position: 'sticky', top: 0, zIndex: 9999 }}>
        ⚠️ ADMIN IMPERSONATION MODE — Viewing as another user · <button onClick={() => { localStorage.removeItem('isImpersonation'); localStorage.removeItem('accessToken'); window.close(); }} style={{ background: 'none', border: '1px solid #fff', color: '#fff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11, marginLeft: 8, minHeight: 'auto' }}>Exit</button>
      </div>
    )}
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Bare><LandingPage /></Bare>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/tax-calculator" element={<Bare message="Loading..."><TaxCalculator /></Bare>} />
      <Route path="/terms" element={<Bare><TermsPage /></Bare>} />
      <Route path="/privacy" element={<Bare><PrivacyPage /></Bare>} />
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

        {/* Unified Settings Hub */}
        <Route path="/settings" element={<Page><SettingsHub /></Page>} />

        {/* Legacy redirects → Settings Hub */}
        <Route path="/profile" element={<Navigate to="/settings#profile" replace />} />
        <Route path="/sessions" element={<Navigate to="/settings#sessions" replace />} />
        <Route path="/data" element={<Navigate to="/settings#data" replace />} />

        {/* Activity Log */}
        <Route path="/activity" element={<Page><AuditTrailPage /></Page>} />

        {/* Finance pages */}
        <Route path="/finance" element={<Page><FinanceOverview /></Page>} />
        <Route path="/finance/income" element={<Page><IncomeTracker /></Page>} />
        <Route path="/finance/expenses" element={<Page><ExpenseTracker /></Page>} />
        <Route path="/finance/investments" element={<Page><InvestmentLogger /></Page>} />

        {/* Family + Vault */}
        <Route path="/family" element={<Page><FamilyPage /></Page>} />
        <Route path="/vault" element={<Page><VaultPage /></Page>} />

        {/* Payments */}
        <Route path="/payments" element={<Page><PaymentHistory /></Page>} />

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
          <Route path="/admin/users" element={<Suspense fallback={<RouteLoader />}><AdminUsers /></Suspense>} />
          <Route path="/admin/users/:userId" element={<Suspense fallback={<RouteLoader />}><AdminUserDetail /></Suspense>} />
          <Route path="/admin/filings" element={<Suspense fallback={<RouteLoader />}><AdminFilings /></Suspense>} />
          <Route path="/admin/revenue" element={<Suspense fallback={<RouteLoader />}><AdminRevenue /></Suspense>} />
          <Route path="/admin/eri" element={<Suspense fallback={<RouteLoader />}><AdminERI /></Suspense>} />
          <Route path="/admin/coupons" element={<Suspense fallback={<RouteLoader />}><AdminCoupons /></Suspense>} />
          <Route path="/admin/filing-mgmt" element={<Suspense fallback={<RouteLoader />}><AdminFilingList /></Suspense>} />
          <Route path="/admin/filing-mgmt/create" element={<Suspense fallback={<RouteLoader />}><AdminFilingCreate /></Suspense>} />
          <Route path="/admin/health" element={<Suspense fallback={<RouteLoader />}><AdminHealth /></Suspense>} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>
  );
};

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
