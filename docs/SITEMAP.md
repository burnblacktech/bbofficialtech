# BurnBlack Platform Sitemap

**Last Updated:** 2024-12-02  
**Version:** 1.0.0

## Overview

This document provides a comprehensive sitemap of all routes in the BurnBlack ITR Platform, including frontend user-facing pages and backend API endpoints. Routes are categorized by access level and functionality.

---

## Frontend Routes

### Public Routes (No Authentication Required)

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/` | `LandingPage` | Public landing page with marketing content | ✅ Active |
| `/login` | `LoginPage` | User login page with email/password and Google OAuth | ✅ Active |
| `/signup` | `SignupPage` | User registration page | ✅ Active |
| `/signup/mobile` | `MobileOTPSignup` | Mobile OTP-based signup | ✅ Active |
| `/email-verification` | `EmailVerification` | Email verification page | ✅ Active |
| `/mobile-verification` | `MobileVerification` | Mobile number verification | ✅ Active |
| `/forgot-password` | `ForgotPassword` | Password reset request | ✅ Active |
| `/reset-password` | `ResetPassword` | Password reset form | ✅ Active |
| `/auth/google/success` | `GoogleOAuthSuccess` | Google OAuth callback handler | ✅ Active |
| `/ca/register` | `RegisterCAFirm` | CA firm registration | ✅ Active |
| `/ca/registration-success` | `RegistrationSuccess` | CA registration confirmation | ✅ Active |
| `/ca/marketplace` | `CAMarketplace` | Public CA marketplace directory | ✅ Active |
| `/ca/:firmId` | `CAProfile` | Public CA firm profile page | ✅ Active |

### Protected Routes (Authentication Required)

#### Dashboard & Navigation

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/home` | `HomeRedirect` | Smart redirector based on user role | User | ✅ Active |
| `/dashboard` | `UserDashboard` | Main user dashboard | User | ✅ Active |

#### ITR Filing Flow

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/itr/select-person` | `FilingPersonSelector` | Select person for filing (self/family) | User | ✅ Active |
| `/itr/data-source` | `DataSourceSelector` | Select data source (fresh/previous year/upload) | User | ✅ Active |
| `/itr/computation` | `ITRComputation` | ITR computation and form filling | User | ✅ Active |
| `/itr/filing/:filingId/*` | `ITRComputation` | Resume/edit existing filing | User | ✅ Active |
| `/itr/previous-year-selector` | `PreviousYearSelector` | Select previous year filing to copy | User | ✅ Active |
| `/itr/previous-year-preview` | `PreviousYearPreview` | Preview previous year data | User | ✅ Active |
| `/itr/previous-year-review` | `PreviousYearReview` | Review and confirm previous year data | User | ✅ Active |
| `/itr/start` | `StartFiling` | Legacy start filing route | User | ⚠️ Legacy |
| `/filing-history` | `FilingHistory` | View all filing history | User | ✅ Active |
| `/itr/refund-tracking` | `RefundTracking` | Track ITR refund status | User | ✅ Active |

#### User Management

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/profile` | `ProfileSettings` | User profile management (tabs: profile, security, bank, filings) | User | ✅ Active |
| `/preferences` | `Preferences` | User preferences and settings | User | ✅ Active |
| `/notifications` | `NotificationsCenter` | Notification management center | User | ✅ Active |
| `/sessions` | `SessionManagement` | Active session management | User | ✅ Active |
| `/documents` | `Documents` | Document upload and management | User | ✅ Active |
| `/add-members` | `AddMembers` | Add family members for filing | User | ✅ Active |
| `/financial-profile` | `FinancialProfilePage` | Financial profile information | User | ✅ Active |
| `/tools` | `ToolsPage` | Tax tools and calculators | User | ✅ Active |

#### Admin Routes

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/admin/dashboard` | `AdminDashboard` | Admin control panel | Admin | ✅ Active |
| `/admin/users` | `AdminUserManagement` | User management interface | Admin | ✅ Active |
| `/admin/users/:userId` | `AdminUserDetails` | Individual user details | Admin | ✅ Active |
| `/admin/filings` | `AdminFilings` | All filings management | Admin | ✅ Active |
| `/admin/filings/:filingId` | `AdminFilingDetails` | Individual filing details | Admin | ✅ Active |
| `/admin/documents` | `AdminDocuments` | Document management | Admin | ✅ Active |

#### CA Firm Routes

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/firm/dashboard` | `CAFirmAdminDashboard` | CA firm admin dashboard | Firm Admin | ✅ Active |
| `/ca/clients` | `CAStaffDashboard` | CA staff client management | CA Staff | ✅ Active |
| `/firm/:firmId/dashboard` | `FirmDashboard` | Firm-specific dashboard | Firm Admin | ✅ Active |
| `/firm/:firmId/clients` | `ClientList` | Firm client list | Firm Admin | ✅ Active |
| `/firm/:firmId/clients/new` | `ClientOnboardingForm` | New client onboarding | Firm Admin | ✅ Active |
| `/firm/:firmId/review-queue` | `CAReviewQueue` | CA review queue for filings | Firm Admin | ✅ Active |

#### Help & Support

| Route | Component | Description | Auth Level | Status |
|-------|-----------|-------------|------------|--------|
| `/help` | `HelpCenter` | Main help center | User | ✅ Active |
| `/help/faqs` | `FAQs` | Frequently asked questions | User | ✅ Active |
| `/help/glossary` | `TaxGlossary` | Tax terminology glossary | User | ✅ Active |
| `/help/contact` | `ContactSupport` | Contact support form | User | ✅ Active |
| `/help/articles/:articleId` | `ArticleView` | Individual help article | User | ✅ Active |
| `/help/report-bug` | `ReportBug` | Bug reporting form | User | ✅ Active |
| `/help/feature-request` | `FeatureRequest` | Feature request form | User | ✅ Active |

#### Disabled Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/ca-bot` | `CABotPage` | CA Bot conversational interface | ❌ Disabled |

---

## Backend API Routes

All API routes are prefixed with `/api/`

### Core API Endpoints

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `GET` | `/api/` | API information and route discovery | Public | ✅ Active |
| `GET` | `/api/health` | Health check endpoint | Public | ✅ Active |
| `GET` | `/api/status` | API status information | Public | ✅ Active |
| `GET` | `/api/docs` | API documentation | Public | ✅ Active |

### Authentication Routes (`/api/auth`)

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `POST` | `/api/auth/register` | User registration | Public | ✅ Active |
| `POST` | `/api/auth/login` | User login | Public | ✅ Active |
| `POST` | `/api/auth/google` | Google OAuth authentication | Public | ✅ Active |
| `POST` | `/api/auth/refresh` | Refresh JWT token | Public | ✅ Active |
| `POST` | `/api/auth/logout` | User logout | User | ✅ Active |
| `GET` | `/api/auth/profile` | Get user profile | User | ✅ Active |
| `PATCH` | `/api/auth/profile` | Update user profile | User | ✅ Active |

### ITR Routes (`/api/itr`)

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `POST` | `/api/itr/filings` | Create new ITR filing | User | ✅ Active |
| `GET` | `/api/itr/filings/:id` | Get ITR filing details | User | ✅ Active |
| `PUT` | `/api/itr/filings/:id` | Update ITR filing | User | ✅ Active |
| `POST` | `/api/itr/filings/:id/submit` | Submit ITR filing | User | ✅ Active |
| `POST` | `/api/itr/pan/verify` | Verify PAN number | User | ✅ Active |
| `GET` | `/api/itr/pan/status` | Get PAN verification status | User | ✅ Active |
| `GET` | `/api/itr/refunds/history` | Get refund history | User | ✅ Active |
| `GET` | `/api/itr/filings/:filingId/refund/status` | Get refund status for filing | User | ✅ Active |

### User Routes (`/api/users`)

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `GET` | `/api/users/profile` | Get user profile | User | ✅ Active |
| `PATCH` | `/api/users/profile` | Update user profile | User | ✅ Active |
| `PATCH` | `/api/users/pan` | Update PAN number | User | ✅ Active |

### CA Bot Routes (`/api/cabot`)

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `POST` | `/api/cabot/message` | Send message to CA Bot | User | ✅ Active |
| `GET` | `/api/cabot/context` | Get conversation context | User | ✅ Active |
| `POST` | `/api/cabot/reset` | Reset conversation | User | ✅ Active |

### Payments Routes (`/api/payments`)

| Method | Route | Description | Auth | Status |
|--------|-------|-------------|------|--------|
| `POST` | `/api/payments/create-order` | Create payment order | User | ✅ Active |
| `POST` | `/api/payments/verify-signature` | Verify payment signature | User | ✅ Active |
| `GET` | `/api/payments/status/:id` | Get payment status | User | ✅ Active |

### Additional API Route Groups

- `/api/admin/*` - Admin management endpoints
- `/api/support/*` - Support ticket endpoints
- `/api/help/*` - Help content endpoints
- `/api/notifications/*` - Notification endpoints
- `/api/ca-marketplace/*` - CA marketplace endpoints
- `/api/ocr/*` - OCR processing endpoints
- `/api/tools/*` - Tools and calculator endpoints
- `/api/documents/*` - Document management endpoints
- `/api/broker/*` - Broker integration endpoints
- `/api/firm-onboarding/*` - Firm onboarding endpoints
- `/api/members/*` - Family member management endpoints
- `/api/ca-firms/*` - CA firm management endpoints
- `/api/tickets/*` - Service ticket endpoints
- `/api/subscriptions/*` - Subscription management endpoints
- `/api/eri/*` - ERI (Electronic Return Intermediary) endpoints
- `/api/drafts/*` - Draft management endpoints
- `/api/bank/*` - Bank account management endpoints

---

## Route Dependencies

### Authentication Flow
1. `/` (Landing) → `/login` or `/signup`
2. `/login` → `/dashboard` (on success)
3. `/signup` → `/email-verification` or `/mobile-verification`
4. Verification → `/dashboard`

### ITR Filing Flow
1. `/dashboard` → `/itr/select-person`
2. `/itr/select-person` → `/itr/data-source`
3. `/itr/data-source` → `/itr/computation`
4. `/itr/computation` → `/filing-history` (on submission)

### Profile Management Flow
1. `/dashboard` → `/profile`
2. `/profile` → Various tabs (profile, security, bank-accounts, filings)

---

## Route Status Legend

- ✅ **Active** - Route is fully functional and in use
- ⚠️ **Legacy** - Route exists but may redirect or be deprecated
- ❌ **Disabled** - Route is commented out or not accessible

---

## Notes

- All protected routes require authentication via `ProtectedRoute` component
- Admin routes require `admin` role
- CA Firm routes require `firm_admin` or `ca_staff` role
- API routes use JWT token authentication via `authenticateToken` middleware
- Rate limiting is applied to sensitive endpoints
- CORS is configured for specific allowed origins

