# Admin Pages and Routes Mapping

**Generated:** December 4, 2025  
**Purpose:** Map all existing admin pages to their routes and sidebar status

---

## Existing Admin Pages Inventory

### Total Pages Found: 24

| # | Page Component | File Path | Route Status | Sidebar Status | Priority |
|---|----------------|-----------|--------------|----------------|----------|
| 1 | AdminDashboard | AdminDashboard.js | ✓ `/admin/dashboard` | ✓ In Sidebar | P0 |
| 2 | AdminUserManagement | AdminUserManagement.js | ✓ `/admin/users` | ✓ In Sidebar | P0 |
| 3 | AdminUserDetails | AdminUserDetails.js | ✓ `/admin/users/:userId` | ✓ In Sidebar | P0 |
| 4 | AdminFilings | AdminFilings.js | ✓ `/admin/filings` | ✓ In Sidebar | P0 |
| 5 | AdminFilingDetails | AdminFilingDetails.jsx | ✓ `/admin/filings/:filingId` | ✓ In Sidebar | P0 |
| 6 | AdminDocuments | AdminDocuments.jsx | ✓ `/admin/documents` | ✓ In Sidebar | P0 |
| 7 | AdminCAFirms | AdminCAFirms.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 8 | AdminTicketQueue | AdminTicketQueue.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 9 | AdminTransactionManagement | AdminTransactionManagement.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 10 | AdminRefundManagement | AdminRefundManagement.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 11 | AdminCouponManagement | AdminCouponManagement.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 12 | AdminPricingPlans | AdminPricingPlans.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 13 | AdminCAPayouts | AdminCAPayouts.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 14 | AdminCAPerformance | AdminCAPerformance.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 15 | AdminCAVerificationQueue | AdminCAVerificationQueue.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 16 | AdminUserSegments | AdminUserSegments.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 17 | AdminAnalytics | AdminAnalytics.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 18 | AdminReports | AdminReports.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 19 | AdminSystemHealth | AdminSystemHealth.js | ❌ No Route | ❌ Not in Sidebar | P0 |
| 20 | AdminKnowledgeBase | AdminKnowledgeBase.js | ❌ No Route | ❌ Not in Sidebar | P1 |
| 21 | AdminControlPanel | AdminControlPanel.js | ❌ No Route | ❌ Not in Sidebar | P1 |
| 22 | AdminPlatformOverview | AdminPlatformOverview.js | ❌ No Route | ❌ Not in Sidebar | P2 |
| 23 | AdminAddUser | AdminAddUser.js | ❌ No Route | ❌ Not in Sidebar | P2 |
| 24 | AdminLogin | AdminLogin.js | ✓ `/admin/login` | N/A (Public) | P0 |

---

## Route Registration Status

### Registered Routes (7 routes)

1. `/admin/dashboard` → AdminDashboard
2. `/admin/users` → AdminUserManagement
3. `/admin/users/:userId` → AdminUserDetails
4. `/admin/filings` → AdminFilings
5. `/admin/filings/:filingId` → AdminFilingDetails
6. `/admin/documents` → AdminDocuments
7. `/admin/login` → AdminLogin (public route)

### Missing Routes (17 routes need to be added)

**P0 - Critical:**
1. `/admin/ca-firms` → AdminCAFirms
2. `/admin/tickets` → AdminTicketQueue
3. `/admin/transactions` → AdminTransactionManagement
4. `/admin/refunds` → AdminRefundManagement
5. `/admin/coupons` → AdminCouponManagement
6. `/admin/pricing` → AdminPricingPlans
7. `/admin/cas/payouts` → AdminCAPayouts
8. `/admin/cas/performance` → AdminCAPerformance
9. `/admin/cas/verification` → AdminCAVerificationQueue
10. `/admin/users/segments` → AdminUserSegments
11. `/admin/analytics` → AdminAnalytics
12. `/admin/reports` → AdminReports
13. `/admin/system/health` → AdminSystemHealth

**P1 - High Priority:**
14. `/admin/knowledge-base` → AdminKnowledgeBase
15. `/admin/control-panel` → AdminControlPanel

**P2 - Medium Priority:**
16. `/admin/platform/overview` → AdminPlatformOverview
17. `/admin/users/add` → AdminAddUser

---

## Sidebar Navigation Status

### Currently in Sidebar (9 items)

1. Dashboard → `/admin/dashboard` ✓
2. User Management → `/admin/users` ✓
3. ITR Filings → `/admin/filings` ✓
4. Documents → `/admin/documents` ✓
5. CA Firm Management → `/admin/ca-firms` (route missing!)
6. Service Tickets → `/admin/tickets` (route missing!)
7. Invoice Management → `/admin/invoices` (route missing!)
8. Pricing Control → `/admin/pricing` (route missing!)
9. System Settings → `/admin/settings` (route missing!)

**Note:** Items 5-9 are in sidebar but routes don't exist! This is a critical issue.

### Should Be in Sidebar (13+ items)

**P0 - Add Immediately:**
1. Analytics → `/admin/analytics`
2. Reports → `/admin/reports`
3. User Segments → `/admin/users/segments`
4. CA Verification → `/admin/cas/verification`
5. CA Performance → `/admin/cas/performance`
6. CA Payouts → `/admin/cas/payouts`
7. Transactions → `/admin/transactions`
8. Refunds → `/admin/refunds`
9. Coupons → `/admin/coupons`
10. System Health → `/admin/system/health`

**P1 - Add Soon:**
11. Knowledge Base → `/admin/knowledge-base`
12. Control Panel → `/admin/control-panel`

---

## Missing Pages (Need to be Created)

### P0 - Critical

1. **Audit Logs** (`/admin/audit/logs`)
   - Required Flow: PART 10.1
   - Features: View all audit logs, search, filter, export

2. **Admin Activity Logs** (`/admin/audit/admin-activity`)
   - Required Flow: PART 10.2
   - Features: Admin logins, actions, impersonation logs

3. **Security Logs** (`/admin/audit/security`)
   - Required Flow: PART 10.3
   - Features: Failed logins, blocked IPs, suspicious activities

4. **User Verification Queue** (`/admin/verification/users`)
   - Required Flow: PART 2.4
   - Features: PAN, Aadhaar, Bank verification queues

5. **System Configuration** (`/admin/settings/general`)
   - Required Flow: PART 8.1
   - Features: App settings, business settings, filing settings

6. **Tax Configuration** (`/admin/settings/tax`)
   - Required Flow: PART 8.2
   - Features: Tax slabs, deduction limits, exemption limits

7. **Security Settings** (`/admin/settings/security`)
   - Required Flow: PART 8.5
   - Features: Auth settings, rate limiting, IP restrictions

8. **Feature Flags** (`/admin/settings/feature-flags`)
   - Required Flow: PART 8.6
   - Features: View, create, edit, enable/disable flags

### P1 - High Priority

9. **Integration Settings** (`/admin/settings/integrations`)
10. **Notification Settings** (`/admin/settings/notifications`)
11. **Admin User Management** (`/admin/team/admins`)
12. **Role Management** (`/admin/team/roles`)
13. **Permission Management** (`/admin/team/permissions`)

---

## Action Items

### Immediate (Fix Broken Sidebar Links)

1. Create routes for sidebar items that don't have routes:
   - `/admin/ca-firms` → AdminCAFirms
   - `/admin/tickets` → AdminTicketQueue
   - `/admin/invoices` → (need to check if page exists)
   - `/admin/pricing` → AdminPricingPlans
   - `/admin/settings` → (need to create or use existing)

### Phase 1 (Add Existing Pages to Sidebar)

2. Add routes for existing pages:
   - All P0 pages listed above
   - Register routes in App.js
   - Add to sidebar navigation

### Phase 2 (Create Missing Critical Pages)

3. Create missing P0 pages:
   - Audit Logs
   - User Verification Queue
   - System Configuration pages
   - Tax Configuration
   - Security Settings

---

## Route Structure Recommendation

```
/admin
├── /dashboard                    ✓ Exists
├── /users
│   ├── /                         ✓ Exists
│   ├── /:userId                  ✓ Exists
│   ├── /segments                 ❌ Page exists, route missing
│   └── /add                      ❌ Page exists, route missing
├── /filings
│   ├── /                         ✓ Exists
│   └── /:filingId                ✓ Exists
├── /documents                    ✓ Exists
├── /cas
│   ├── /firms                    ❌ Page exists, route missing
│   ├── /verification             ❌ Page exists, route missing
│   ├── /performance              ❌ Page exists, route missing
│   └── /payouts                  ❌ Page exists, route missing
├── /tickets                      ❌ Page exists, route missing
├── /transactions                 ❌ Page exists, route missing
├── /refunds                      ❌ Page exists, route missing
├── /coupons                      ❌ Page exists, route missing
├── /pricing                      ❌ Page exists, route missing
├── /invoices                     ❌ Route missing (page unclear)
├── /analytics                    ❌ Page exists, route missing
├── /reports                      ❌ Page exists, route missing
├── /system
│   └── /health                   ❌ Page exists, route missing
├── /settings
│   ├── /general                  ❌ Missing
│   ├── /tax                      ❌ Missing
│   ├── /integrations             ❌ Missing
│   ├── /notifications            ❌ Missing
│   ├── /security                 ❌ Missing
│   └── /feature-flags            ❌ Missing
├── /audit
│   ├── /logs                     ❌ Missing
│   ├── /admin-activity           ❌ Missing
│   └── /security                 ❌ Missing
├── /verification
│   └── /users                    ❌ Missing
├── /knowledge-base               ❌ Page exists, route missing
├── /control-panel                ❌ Page exists, route missing
└── /team
    ├── /admins                   ❌ Missing
    ├── /roles                    ❌ Missing
    └── /permissions              ❌ Missing
```

---

## Summary Statistics

- **Total Pages:** 24
- **Pages with Routes:** 7 (29%)
- **Pages without Routes:** 17 (71%)
- **Pages in Sidebar:** 9
- **Pages Missing from Sidebar:** 13+
- **Missing Pages to Create:** 13+ (P0: 8, P1: 5+)

**Coverage:** ~29% of existing pages have routes, ~38% are in sidebar

