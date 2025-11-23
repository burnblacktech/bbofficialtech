// =====================================================
// MAIN APP COMPONENT - CLEAN ROUTE STRUCTURE
// Clear separation of public and protected routes
// =====================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Core components
import Layout from './components/Layout.js';
import LandingPage from './pages/Landing/LandingPage';
import HomeRedirect from './pages/HomeRedirect';

// Auth components
import LoginPage from './pages/Auth/LoginPage';
import GoogleOAuthSuccess from './pages/Auth/GoogleOAuthSuccess';

// Admin components
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLayout from './components/Admin/AdminLayout';

// CA Firm components
import CAFirmAdminDashboard from './pages/Dashboard/CAFirmAdminDashboard';
import CAStaffDashboard from './pages/Dashboard/CAStaffDashboard';

// User pages
import UserDashboard from './pages/Dashboard/UserDashboard';
import StartFiling from './pages/ITR/StartFiling';
import ITRFiling from './pages/ITR/ITRFiling';
import DynamicFilingPage from './pages/ITR/DynamicFilingPage';
import FilingHistory from './pages/ITR/FilingHistory';
import AddMembers from './pages/Members/AddMembers';
import UserSettings from './pages/User/UserSettings';
import ProfileSettings from './pages/User/ProfileSettings';
import FinancialProfilePage from './pages/FinancialProfile/FinancialProfilePage';
import ServiceTicketManagement from './pages/Service/ServiceTicketManagement';
// Design System Components (Development only)
// import StyleGuide from './components/DesignSystem/StyleGuide'; // Temporarily disabled

// CABot Page (Development/Testing)
// import CABotPage from './pages/CABot/CABotPage'; // Temporarily disabled

// Context providers
import { AuthProvider } from './contexts/AuthContext';
// import { CABotProvider } from './contexts/CABotContext'; // Temporarily disabled

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Error boundaries
import ErrorBoundary from './components/ErrorBoundary';

// Styles
import './styles/GlobalStyles.css';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main App Component
const AppContent = () => {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/success" element={<GoogleOAuthSuccess />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Smart redirector - determines correct dashboard based on role */}
          <Route path="/home" element={<HomeRedirect />} />
          
          {/* User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <Layout>
                <UserDashboard />
              </Layout>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/firm/dashboard" 
            element={
              <AdminLayout>
                <CAFirmAdminDashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/ca/clients" 
            element={
              <Layout>
                <CAStaffDashboard />
              </Layout>
            } 
          />
          
          {/* ITR Filing Routes */}
          <Route 
            path="/itr/start" 
            element={
              <Layout>
                <StartFiling />
              </Layout>
            } 
          />
          <Route 
            path="/itr/filing" 
            element={
              <Layout>
                <ITRFiling />
              </Layout>
            } 
          />
          <Route 
            path="/dynamic-filing/:id" 
            element={
              <Layout>
                <DynamicFilingPage />
              </Layout>
            } 
          />
          <Route 
            path="/filing-history" 
            element={
              <Layout>
                <FilingHistory />
              </Layout>
            } 
          />
          
          {/* CA Bot Route - Temporarily disabled */}
          {/* <Route
            path="/ca-bot"
            element={
              <CABotProvider>
                <Layout>
                  <CABotPage />
                </Layout>
              </CABotProvider>
            }
          /> */}
          </Route>
        
        {/* Catch all - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Mobile Navigation */}
    </div>
  );
};

// Root App Component
const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;