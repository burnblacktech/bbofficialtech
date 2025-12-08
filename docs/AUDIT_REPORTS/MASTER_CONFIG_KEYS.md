# Master Configuration Keys Audit

**Generated:** 2024-12-02  
**Source:** Comprehensive audit of all pages (Batches 1-5)

---

## Summary

This document lists all configuration keys identified during the audit, categorized by:
- **Status:** ✅ Present, ❌ Missing, ⚠️ Needs Verification
- **Priority:** Critical, High, Medium, Low
- **Usage:** Where the key is used or should be used

---

## Frontend Environment Variables

### Core API Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `REACT_APP_API_URL` | Yes | ✅ Present | Critical | Used in APIClient.js, all API calls |
| `REACT_APP_GA_ID` | Optional | ❌ Missing | Medium | Google Analytics tracking |
| `REACT_APP_SENTRY_DSN` | Optional | ❌ Missing | Medium | Error tracking with Sentry |
| `REACT_APP_ENVIRONMENT` | Optional | ❌ Missing | Low | Environment name (dev/staging/prod) |

### External API Keys

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `SUREPASS_API_KEY` | Yes | ✅ Present | Critical | PAN verification (backend) |
| `SUREPASS_API_BASE_URL` | Yes | ✅ Present | Critical | PAN verification API base URL |
| `FEATURE_PAN_VERIFICATION_LIVE` | Yes | ✅ Present | Critical | Enable/disable live PAN verification |

---

## Backend Environment Variables

### Server Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `NODE_ENV` | Yes | ✅ Present | Critical | Environment (development/production) |
| `PORT` | Yes | ✅ Present | Critical | Server port |
| `FRONTEND_URL` | Yes | ✅ Present | Critical | CORS origin |

### Database Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `DB_HOST` | Yes | ✅ Present | Critical | PostgreSQL host |
| `DB_PORT` | Yes | ✅ Present | Critical | PostgreSQL port |
| `DB_NAME` | Yes | ✅ Present | Critical | Database name |
| `DB_USER` | Yes | ✅ Present | Critical | Database user |
| `DB_PASSWORD` | Yes | ✅ Present | Critical | Database password |
| `DB_SSL` | Yes | ✅ Present | Critical | SSL connection flag |

### JWT Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `JWT_SECRET` | Yes | ✅ Present | Critical | JWT token signing secret |
| `JWT_EXPIRES_IN` | Yes | ✅ Present | Critical | JWT expiration time |
| `JWT_REFRESH_EXPIRES_IN` | Yes | ✅ Present | Critical | Refresh token expiration |

### OAuth Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `GOOGLE_CLIENT_ID` | Optional | ✅ Present | High | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | ✅ Present | High | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Optional | ✅ Present | High | Google OAuth callback URL |

### Email Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `SMTP_HOST` | Yes | ✅ Present | Critical | SMTP server host |
| `SMTP_PORT` | Yes | ✅ Present | Critical | SMTP server port |
| `SMTP_USER` | Yes | ✅ Present | Critical | SMTP username |
| `SMTP_PASS` | Yes | ✅ Present | Critical | SMTP password |
| `SMTP_FROM` | Yes | ✅ Present | Critical | Default from email address |

### SMS Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `TWILIO_ACCOUNT_SID` | Optional | ✅ Present | High | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Optional | ✅ Present | High | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional | ✅ Present | High | Twilio phone number |

### Redis Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `REDIS_HOST` | Optional | ✅ Present | Medium | Redis host |
| `REDIS_PORT` | Optional | ✅ Present | Medium | Redis port |
| `REDIS_PASSWORD` | Optional | ✅ Present | Medium | Redis password |

### Security Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `BCRYPT_ROUNDS` | Yes | ✅ Present | Critical | Password hashing rounds |
| `RATE_LIMIT_WINDOW_MS` | Yes | ✅ Present | Critical | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | Yes | ✅ Present | Critical | Max requests per window |
| `MAX_CONCURRENT_SESSIONS` | Optional | ✅ Present | High | Max concurrent user sessions |

### Business Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `COMPANY_NAME` | Yes | ✅ Present | High | Company name |
| `COMPANY_EMAIL` | Yes | ✅ Present | High | Company support email |
| `COMPANY_PHONE` | Yes | ✅ Present | High | Company support phone |
| `COMPANY_ADDRESS` | Yes | ✅ Present | High | Company address |
| `SUPPORT_PHONE_NUMBER` | Yes | ❌ Missing | High | Support phone (should be configurable) |
| `SUPPORT_EMAIL` | Yes | ❌ Missing | High | Support email (should be configurable) |

### ITR Configuration

| Key | Required | Status | Priority | Usage |
|-----|----------|--------|----------|-------|
| `ITR_CURRENT_YEAR` | Yes | ✅ Present | Critical | Current assessment year |
| `ITR_PREVIOUS_YEAR` | Yes | ✅ Present | Critical | Previous assessment year |
| `ITR_DEADLINE` | Yes | ✅ Present | Critical | ITR filing deadline |

---

## Missing API Endpoints (Configuration Required)

### Public Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/public/stats` | Landing Page | High | ❌ Missing |
| `/api/public/testimonials` | Landing Page | High | ❌ Missing |

### User Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/users/preferences` | Preferences Page | High | ❌ Missing |
| `/api/users/preferences/save` | Preferences Page | High | ❌ Missing |
| `/api/users/preferences/load` | Preferences Page | High | ❌ Missing |
| `/api/users/notifications/settings` | Notifications Page | High | ❌ Missing |
| `/api/users/notifications/settings/save` | Notifications Page | High | ❌ Missing |

### Financial Profile Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/financial-profile` | Financial Profile Page | High | ✅ Present |
| `/api/financial-profile/history` | Financial Profile Page | High | ✅ Present |
| `/api/financial-profile/insights` | Financial Profile Page | High | ✅ Present |
| `/api/financial-profile/refresh` | Financial Profile Page | High | ✅ Present |
| `/api/itr/it-portal/connect` | Financial Profile Page | High | ❌ Missing |
| `/api/financial-profile/reports/download` | Financial Profile Page | High | ❌ Missing |

### Tools Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/tools/investment-planner` | Tools Page | High | ❌ Missing |
| `/api/tools/tax-calendar` | Tools Page | High | ❌ Missing |
| `/api/tools/knowledge-base` | Tools Page | High | ❌ Missing |

### Session Management Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/auth/sessions` | Session Management | Critical | ❌ Missing |
| `/api/auth/sessions/:id/logout` | Session Management | Critical | ❌ Missing |
| `/api/auth/sessions/logout-all` | Session Management | Critical | ❌ Missing |

### Support Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/support/tickets` | Contact Support | High | ✅ Present |
| `/api/support/tickets/create` | Contact Support | High | ✅ Present |
| `/api/support/chat` | Contact Support | Critical | ❌ Missing |
| `/api/support/chat/messages` | Contact Support | Critical | ❌ Missing |
| `/api/support/chat/history` | Contact Support | High | ❌ Missing |

### Admin Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/admin/dashboard/stats` | Admin Dashboard | High | ✅ Present |
| `/api/admin/dashboard/charts` | Admin Dashboard | High | ✅ Present |
| `/api/admin/dashboard/alerts` | Admin Dashboard | High | ✅ Present |
| `/api/admin/dashboard/system-health` | Admin Dashboard | Medium | ❌ Missing |
| `/api/admin/dashboard/top-performers` | Admin Dashboard | Medium | ❌ Missing |
| `/api/admin/users` | Admin User Management | High | ✅ Present |
| `/api/admin/users/:id` | Admin User Management | High | ✅ Present |
| `/api/admin/users/:id/status` | Admin User Management | High | ✅ Present |
| `/api/admin/users/:id/role` | Admin User Management | High | ✅ Present |

### CA/Firm Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/firm/dashboard/stats` | Firm Dashboard | High | ✅ Present |
| `/api/firm/dashboard/charts` | Firm Dashboard | High | ✅ Present |
| `/api/firm/dashboard/alerts` | Firm Dashboard | High | ✅ Present |
| `/api/firm/staff` | Firm Dashboard | High | ✅ Present |
| `/api/firm/clients` | Firm Dashboard | High | ✅ Present |
| `/api/ca/clients` | CA Staff Dashboard | High | ✅ Present |
| `/api/ca/clients/:id` | CA Staff Dashboard | High | ✅ Present |
| `/api/ca/marketplace` | CA Marketplace | High | ✅ Present |
| `/api/ca/marketplace/apply` | CA Marketplace | High | ✅ Present |

### ITR Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/itr/pan/verify` | ITR Flow | Critical | ✅ Present |
| `/api/itr/pan/status/:pan` | ITR Flow | High | ✅ Present |
| `/api/itr/drafts` | ITR Flow | Critical | ✅ Present |
| `/api/itr/drafts/:id` | ITR Flow | Critical | ✅ Present |
| `/api/itr/drafts/:id/save` | ITR Flow | Critical | ✅ Present |
| `/api/itr/drafts/:id/validate` | ITR Flow | Critical | ✅ Present |
| `/api/itr/drafts/:id/submit` | ITR Flow | Critical | ✅ Present |
| `/api/itr/filings` | Filing History | High | ✅ Present |
| `/api/itr/filings/:id` | Filing History | High | ✅ Present |
| `/api/itr/filings/:id/refund/status` | Refund Tracking | High | ✅ Present |
| `/api/itr/refunds/history` | Refund Tracking | High | ✅ Present |

### Document Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/documents` | Documents Page | High | ✅ Present |
| `/api/documents/upload` | Documents Page | High | ✅ Present |
| `/api/documents/:id` | Documents Page | High | ✅ Present |
| `/api/documents/:id/download` | Documents Page | High | ✅ Present |
| `/api/documents/:id/delete` | Documents Page | High | ✅ Present |

### Help Endpoints

| Endpoint | Required For | Priority | Status |
|----------|-------------|----------|--------|
| `/api/help/faqs` | FAQs Page | High | ✅ Present |
| `/api/help/faqs/:id` | FAQs Page | High | ✅ Present |
| `/api/help/search` | Help Center | High | ✅ Present |
| `/api/help/categories` | Help Center | High | ✅ Present |

---

## Configuration Keys by Priority

### Critical (Must Have)

1. `REACT_APP_API_URL` - ✅ Present
2. `SUREPASS_API_KEY` - ✅ Present
3. `JWT_SECRET` - ✅ Present
4. `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - ✅ Present
5. `/api/auth/sessions` - ❌ Missing
6. `/api/auth/sessions/:id/logout` - ❌ Missing
7. `/api/auth/sessions/logout-all` - ❌ Missing
8. `/api/support/chat` - ❌ Missing

### High Priority (Should Have)

1. `SUPPORT_PHONE_NUMBER` - ❌ Missing
2. `SUPPORT_EMAIL` - ❌ Missing
3. `/api/public/stats` - ❌ Missing
4. `/api/public/testimonials` - ❌ Missing
5. `/api/users/preferences` - ❌ Missing
6. `/api/financial-profile/reports/download` - ❌ Missing
7. `/api/itr/it-portal/connect` - ❌ Missing
8. `/api/tools/investment-planner` - ❌ Missing
9. `/api/tools/tax-calendar` - ❌ Missing
10. `/api/tools/knowledge-base` - ❌ Missing
11. `/api/support/chat/history` - ❌ Missing

### Medium Priority (Nice to Have)

1. `REACT_APP_GA_ID` - ❌ Missing
2. `REACT_APP_SENTRY_DSN` - ❌ Missing
3. `/api/admin/dashboard/system-health` - ❌ Missing
4. `/api/admin/dashboard/top-performers` - ❌ Missing

### Low Priority (Future Enhancement)

1. `REACT_APP_ENVIRONMENT` - ❌ Missing

---

## Recommendations

### Immediate Actions (Critical)

1. **Implement Session Management APIs** - Create all session endpoints
2. **Implement Live Chat API** - Create chat endpoints
3. **Add Support Contact Config** - Make support phone/email configurable

### Short-term Actions (High Priority)

1. **Create Public Stats API** - For landing page trust indicators
2. **Create Testimonials API** - For landing page testimonials
3. **Create Preferences API** - For user preferences persistence
4. **Create Tools APIs** - For investment planner, tax calendar, knowledge base
5. **Create Financial Profile Download** - For report downloads
6. **Create IT Portal Integration** - For IT Portal refresh

### Long-term Actions (Medium/Low Priority)

1. **Add Analytics** - Google Analytics integration
2. **Add Error Tracking** - Sentry integration
3. **Add System Health** - Real system health monitoring
4. **Add Top Performers** - CA performance tracking

---

**Last Updated:** 2024-12-02  
**Next Review:** After implementation of critical items

