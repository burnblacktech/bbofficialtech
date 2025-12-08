# BurnBlack - Super Admin Functions & Flows

Complete inventory of all super admin capabilities for platform management.

**Last Updated:** January 2025  
**Implementation Status:** See gap analysis in `docs/AUDIT_REPORTS/SUPERADMIN_DASHBOARD_GAPS.md`

---

## Implementation Status Summary

**Overall Coverage:** ~35% of documented endpoints implemented

> **Visual Tokens**  
> Admin UI work should reuse the Solar Gold primary (`#FFC300`), Ember Amber accent (`#FF9800`), and Slate/Porcelain neutrals from `docs/UI.md`. Status states (success/error/warning/info) must match the shared semantic palette to ensure parity between end-user and admin experiences.

### Status Legend
- ✅ **Implemented** - Feature is fully implemented and functional
- ⚠️ **Partial** - Feature is partially implemented or uses mock data
- ❌ **Missing** - Feature is documented but not implemented

### Quick Status by Category

| Category | Status | Coverage |
|----------|--------|----------|
| Dashboard & Analytics | ✅ Mostly Implemented | ~80% |
| User Management | ✅ Mostly Implemented | ~85% |
| CA Management | ⚠️ Partially Implemented | ~40% |
| Filing Management | ✅ Mostly Implemented | ~95% |
| Financial Management | ❌ Mostly Missing | ~10% |
| Support & Communication | ⚠️ Partially Implemented | ~50% |
| System Configuration | ❌ Missing | ~0% |
| System Monitoring | ⚠️ Partially Implemented | ~20% |
| Document Management | ✅ Implemented | ~100% |

**Note:** For detailed gap analysis and implementation roadmap, see:
- `docs/AUDIT_REPORTS/SUPERADMIN_DASHBOARD_GAPS.md` - Comprehensive gap analysis
- `docs/AUDIT_REPORTS/SUPERADMIN_DASHBOARD_IMPLEMENTATION_ROADMAP.md` - Implementation plan

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPER ADMIN OVERVIEW                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ROLE DEFINITION                                                            │
│  ───────────────                                                            │
│  Super Admin has unrestricted access to all platform functions,             │
│  configurations, and data. Responsible for platform operations,             │
│  compliance, and business management.                                       │
│                                                                             │
│  ACCESS LEVELS                                                              │
│  ─────────────                                                              │
│  1. Super Admin     - Full unrestricted access (this document)             │
│  2. Admin           - Limited admin (no billing, no system config)          │
│  3. Support         - Read-only + support actions                          │
│  4. Finance         - Billing & revenue only                               │
│  5. Compliance      - Audit & compliance only                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 1: DASHBOARD & ANALYTICS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. SUPER ADMIN DASHBOARD & ANALYTICS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1.1 EXECUTIVE DASHBOARD                                                    │
│  ├── View platform health overview                                          │
│  │   ├── System uptime                                                     │
│  │   ├── API response times                                                │
│  │   ├── Error rates                                                       │
│  │   ├── Active users (real-time)                                          │
│  │   └── Server load                                                       │
│  ├── View business KPIs                                                    │
│  │   ├── Total registered users                                            │
│  │   ├── Active users (DAU/MAU)                                            │
│  │   ├── Total ITRs filed                                                  │
│  │   ├── Revenue (today/week/month/year)                                   │
│  │   ├── Conversion rates                                                  │
│  │   └── Churn rate                                                        │
│  ├── View filing statistics                                                │
│  │   ├── ITRs filed today                                                  │
│  │   ├── ITRs by type (ITR-1, 2, 3, 4)                                     │
│  │   ├── ITRs by regime (Old/New)                                          │
│  │   ├── Average completion time                                           │
│  │   └── Drop-off rates by section                                         │
│  ├── View financial overview                                               │
│  │   ├── Total revenue                                                     │
│  │   ├── Revenue by plan                                                   │
│  │   ├── Pending payments                                                  │
│  │   ├── Refunds processed                                                 │
│  │   └── Outstanding invoices                                              │
│  └── View alerts & notifications                                           │
│      ├── System alerts                                                     │
│      ├── Security alerts                                                   │
│      ├── Compliance alerts                                                 │
│      └── Business alerts                                                   │
│                                                                             │
│  1.2 ANALYTICS & REPORTING                                                  │
│  ├── User analytics                                                        │
│  │   ├── User acquisition trends                                           │
│  │   ├── User demographics                                                 │
│  │   ├── Geographic distribution                                           │
│  │   ├── Device/browser breakdown                                          │
│  │   ├── User journey funnel                                               │
│  │   ├── Feature adoption rates                                            │
│  │   └── User retention cohorts                                            │
│  ├── Filing analytics                                                      │
│  │   ├── Filing trends over time                                           │
│  │   ├── Peak filing hours/days                                            │
│  │   ├── Average income distribution                                       │
│  │   ├── Deduction patterns                                                │
│  │   ├── Discrepancy rates                                                 │
│  │   ├── Auto-fill success rates                                           │
│  │   └── Document upload analytics                                         │
│  ├── Revenue analytics                                                     │
│  │   ├── Revenue trends                                                    │
│  │   ├── Revenue by segment                                                │
│  │   ├── ARPU (Average Revenue Per User)                                   │
│  │   ├── LTV (Lifetime Value)                                              │
│  │   ├── Payment method breakdown                                          │
│  │   └── Refund analysis                                                   │
│  ├── CA/B2B analytics                                                      │
│  │   ├── CA registration trends                                            │
│  │   ├── CA performance metrics                                            │
│  │   ├── Client per CA distribution                                        │
│  │   └── B2B revenue contribution                                          │
│  ├── Custom report builder                                                 │
│  │   ├── Select metrics                                                    │
│  │   ├── Select dimensions                                                 │
│  │   ├── Apply filters                                                     │
│  │   ├── Set date range                                                    │
│  │   ├── Save report template                                              │
│  │   └── Schedule report delivery                                          │
│  └── Export reports                                                        │
│      ├── Export to CSV                                                     │
│      ├── Export to Excel                                                   │
│      ├── Export to PDF                                                     │
│      └── API access for BI tools                                           │
│                                                                             │
│  1.3 REAL-TIME MONITORING                                                   │
│  ├── Live user activity feed                                               │
│  ├── Live filing submissions                                               │
│  ├── Live payment transactions                                             │
│  ├── Live error occurrences                                                │
│  ├── Geographic activity map                                               │
│  └── Custom alert triggers                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 2: USER MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. USER MANAGEMENT                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2.1 USER DIRECTORY                                                         │
│  ├── View all users                                                        │
│  ├── Search users                                                          │
│  │   ├── By name                                                           │
│  │   ├── By email                                                          │
│  │   ├── By mobile                                                         │
│  │   ├── By PAN                                                            │
│  │   └── By user ID                                                        │
│  ├── Filter users                                                          │
│  │   ├── By status (Active/Inactive/Suspended/Deleted)                     │
│  │   ├── By user type (Individual/CA/Enterprise)                           │
│  │   ├── By registration date                                              │
│  │   ├── By last login                                                     │
│  │   ├── By plan/subscription                                              │
│  │   ├── By verification status                                            │
│  │   └── By filing history                                                 │
│  ├── Sort users                                                            │
│  │   ├── By registration date                                              │
│  │   ├── By last activity                                                  │
│  │   ├── By name                                                           │
│  │   └── By total filings                                                  │
│  ├── Bulk select users                                                     │
│  └── Export user list                                                      │
│                                                                             │
│  2.2 USER PROFILE MANAGEMENT                                                │
│  ├── View user profile                                                     │
│  │   ├── Basic information                                                 │
│  │   ├── Contact details                                                   │
│  │   ├── KYC/Verification status                                           │
│  │   ├── Subscription details                                              │
│  │   ├── Payment history                                                   │
│  │   ├── Filing history                                                    │
│  │   ├── Document uploads                                                  │
│  │   ├── Activity log                                                      │
│  │   ├── Support tickets                                                   │
│  │   └── Notes (internal)                                                  │
│  ├── Edit user profile                                                     │
│  │   ├── Update basic info                                                 │
│  │   ├── Update contact details                                            │
│  │   ├── Update verification status                                        │
│  │   └── Add internal notes                                                │
│  ├── User impersonation                                                    │
│  │   ├── Login as user (with audit trail)                                  │
│  │   ├── View user's dashboard                                             │
│  │   ├── Debug user issues                                                 │
│  │   └── Exit impersonation                                                │
│  ├── Account actions                                                       │
│  │   ├── Activate account                                                  │
│  │   ├── Deactivate account                                                │
│  │   ├── Suspend account                                                   │
│  │   ├── Unsuspend account                                                 │
│  │   ├── Delete account (soft)                                             │
│  │   ├── Delete account (hard/GDPR)                                        │
│  │   ├── Merge duplicate accounts                                          │
│  │   └── Transfer account ownership                                        │
│  ├── Password/Security actions                                             │
│  │   ├── Force password reset                                              │
│  │   ├── Unlock account                                                    │
│  │   ├── Clear failed login attempts                                       │
│  │   ├── Invalidate all sessions                                           │
│  │   ├── Enable/disable 2FA                                                │
│  │   └── Revoke API tokens                                                 │
│  └── Communication                                                         │
│      ├── Send email to user                                                │
│      ├── Send SMS to user                                                  │
│      ├── Send push notification                                            │
│      └── View communication history                                        │
│                                                                             │
│  2.3 BULK USER OPERATIONS                                                   │
│  ├── Bulk activate/deactivate                                              │
│  ├── Bulk send email                                                       │
│  ├── Bulk send SMS                                                         │
│  ├── Bulk assign plan                                                      │
│  ├── Bulk export data                                                      │
│  └── Bulk delete (with confirmation)                                       │
│                                                                             │
│  2.4 USER VERIFICATION                                                      │
│  ├── View pending verifications                                            │
│  ├── PAN verification queue                                                │
│  │   ├── View submitted PANs                                               │
│  │   ├── Approve PAN                                                       │
│  │   ├── Reject PAN (with reason)                                          │
│  │   └── Request re-submission                                             │
│  ├── Aadhaar verification queue                                            │
│  ├── Bank account verification queue                                       │
│  ├── CA verification queue                                                 │
│  │   ├── View CA registration requests                                     │
│  │   ├── Verify CA credentials                                             │
│  │   ├── Approve CA account                                                │
│  │   ├── Reject CA account (with reason)                                   │
│  │   └── Request additional documents                                      │
│  └── Document verification queue                                           │
│                                                                             │
│  2.5 USER SEGMENTS                                                          │
│  ├── Create user segment                                                   │
│  ├── Define segment criteria                                               │
│  ├── View segment members                                                  │
│  ├── Edit segment                                                          │
│  ├── Delete segment                                                        │
│  └── Use segment for targeting                                             │
│      ├── Email campaigns                                                   │
│      ├── Promotions                                                        │
│      └── Feature rollouts                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 3: CA/PROFESSIONAL MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. CA/PROFESSIONAL MANAGEMENT                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3.1 CA DIRECTORY                                                           │
│  ├── View all CAs                                                          │
│  ├── Search CAs                                                            │
│  │   ├── By name                                                           │
│  │   ├── By membership number                                              │
│  │   ├── By firm name                                                      │
│  │   └── By location                                                       │
│  ├── Filter CAs                                                            │
│  │   ├── By status (Active/Inactive/Suspended/Pending)                     │
│  │   ├── By verification status                                            │
│  │   ├── By client count                                                   │
│  │   ├── By rating                                                         │
│  │   ├── By filings completed                                              │
│  │   └── By revenue generated                                              │
│  └── Export CA list                                                        │
│                                                                             │
│  3.2 CA PROFILE MANAGEMENT                                                  │
│  ├── View CA profile                                                       │
│  │   ├── Personal information                                              │
│  │   ├── Professional credentials                                          │
│  │   ├── Firm details                                                      │
│  │   ├── Verification documents                                            │
│  │   ├── Client list                                                       │
│  │   ├── Filing history                                                    │
│  │   ├── Earnings/Commission                                               │
│  │   ├── Ratings & reviews                                                 │
│  │   └── Performance metrics                                               │
│  ├── Edit CA profile                                                       │
│  ├── CA account actions                                                    │
│  │   ├── Approve CA                                                        │
│  │   ├── Reject CA                                                         │
│  │   ├── Suspend CA                                                        │
│  │   ├── Reinstate CA                                                      │
│  │   ├── Upgrade CA tier                                                   │
│  │   └── Downgrade CA tier                                                 │
│  └── CA communication                                                      │
│      ├── Send message                                                      │
│      ├── Send notification                                                 │
│      └── View communication history                                        │
│                                                                             │
│  3.3 CA VERIFICATION                                                        │
│  ├── View pending CA applications                                          │
│  ├── Review CA documents                                                   │
│  │   ├── ICAI membership certificate                                       │
│  │   ├── COP (Certificate of Practice)                                     │
│  │   ├── Identity proof                                                    │
│  │   ├── Address proof                                                     │
│  │   └── Firm registration (if applicable)                                 │
│  ├── Verify with ICAI database                                             │
│  ├── Approve/Reject application                                            │
│  ├── Request additional documents                                          │
│  └── Set verification expiry                                               │
│                                                                             │
│  3.4 CA PERFORMANCE MANAGEMENT                                              │
│  ├── View CA leaderboard                                                   │
│  ├── View CA performance metrics                                           │
│  │   ├── Filings completed                                                 │
│  │   ├── Average completion time                                           │
│  │   ├── Client satisfaction score                                         │
│  │   ├── Error/rejection rate                                              │
│  │   ├── Response time                                                     │
│  │   └── Revenue generated                                                 │
│  ├── Set performance benchmarks                                            │
│  ├── Flag underperforming CAs                                              │
│  ├── Issue warnings                                                        │
│  └── Award top performers                                                  │
│                                                                             │
│  3.5 CA COMMISSION/PAYOUT                                                   │
│  ├── View commission structure                                             │
│  ├── Edit commission rates                                                 │
│  ├── View pending payouts                                                  │
│  ├── Process payouts                                                       │
│  │   ├── Individual payout                                                 │
│  │   ├── Bulk payout                                                       │
│  │   └── Scheduled payout                                                  │
│  ├── View payout history                                                   │
│  ├── Handle payout disputes                                                │
│  └── Generate payout reports                                               │
│                                                                             │
│  3.6 CA TIERS/PARTNERSHIP                                                   │
│  ├── Define CA tiers                                                       │
│  │   ├── Tier criteria                                                     │
│  │   ├── Tier benefits                                                     │
│  │   └── Commission rates                                                  │
│  ├── Manage tier assignments                                               │
│  ├── View tier distribution                                                │
│  └── Partner program management                                            │
│      ├── Partner applications                                              │
│      ├── Partner agreements                                                │
│      └── Partner benefits                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 4: ITR/FILING MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. ITR/FILING MANAGEMENT                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4.1 FILING DIRECTORY                                                       │
│  ├── View all filings                                                      │
│  ├── Search filings                                                        │
│  │   ├── By acknowledgment number                                          │
│  │   ├── By user PAN                                                       │
│  │   ├── By user name                                                      │
│  │   └── By filing ID                                                      │
│  ├── Filter filings                                                        │
│  │   ├── By status (Draft/Submitted/Verified/Processed)                    │
│  │   ├── By ITR type                                                       │
│  │   ├── By assessment year                                                │
│  │   ├── By regime                                                         │
│  │   ├── By income range                                                   │
│  │   ├── By filing date                                                    │
│  │   ├── By CA (if applicable)                                             │
│  │   └── By discrepancy status                                             │
│  ├── Sort filings                                                          │
│  └── Export filing list                                                    │
│                                                                             │
│  4.2 FILING DETAILS VIEW                                                    │
│  ├── View complete filing                                                  │
│  │   ├── Personal information                                              │
│  │   ├── All income sections                                               │
│  │   ├── All deductions                                                    │
│  │   ├── Tax computation                                                   │
│  │   ├── Taxes paid                                                        │
│  │   ├── Bank details                                                      │
│  │   └── Verification details                                              │
│  ├── View filing timeline                                                  │
│  │   ├── Creation date                                                     │
│  │   ├── Modification history                                              │
│  │   ├── Submission date                                                   │
│  │   ├── Verification date                                                 │
│  │   └── Processing updates                                                │
│  ├── View documents                                                        │
│  │   ├── Uploaded documents                                                │
│  │   ├── Generated ITR form                                                │
│  │   ├── ITR-V                                                             │
│  │   └── Acknowledgment                                                    │
│  ├── View discrepancies                                                    │
│  ├── View audit trail                                                      │
│  └── View related filings                                                  │
│                                                                             │
│  4.3 FILING OPERATIONS                                                      │
│  ├── Edit filing (with reason)                                             │
│  ├── Override validation                                                   │
│  ├── Force status change                                                   │
│  ├── Reprocess filing                                                      │
│  ├── Cancel filing                                                         │
│  ├── Mark as test filing                                                   │
│  ├── Flag for review                                                       │
│  ├── Add admin notes                                                       │
│  ├── Download filing documents                                             │
│  └── Regenerate documents                                                  │
│                                                                             │
│  4.4 FILING ISSUES/ERRORS                                                   │
│  ├── View filings with errors                                              │
│  ├── View submission failures                                              │
│  ├── View verification failures                                            │
│  ├── Diagnose issues                                                       │
│  ├── Manual intervention                                                   │
│  │   ├── Fix data errors                                                   │
│  │   ├── Retry submission                                                  │
│  │   ├── Manual verification                                               │
│  │   └── Escalate to IT Portal                                             │
│  └── Communicate with user                                                 │
│                                                                             │
│  4.5 BULK FILING OPERATIONS                                                 │
│  ├── Bulk status update                                                    │
│  ├── Bulk export                                                           │
│  ├── Bulk reprocessing                                                     │
│  └── Bulk notification                                                     │
│                                                                             │
│  4.6 FILING STATISTICS                                                      │
│  ├── Filing volume by date                                                 │
│  ├── Filing distribution by type                                           │
│  ├── Average processing time                                               │
│  ├── Success/failure rates                                                 │
│  ├── Discrepancy rates                                                     │
│  └── Revenue per filing                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: DOCUMENT MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. DOCUMENT MANAGEMENT                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5.1 DOCUMENT DIRECTORY                                                     │
│  ├── View all documents                                                    │
│  ├── Search documents                                                      │
│  │   ├── By user                                                           │
│  │   ├── By document type                                                  │
│  │   ├── By upload date                                                    │
│  │   └── By processing status                                              │
│  ├── Filter documents                                                      │
│  │   ├── By type (Form 16, AIS, 26AS, etc.)                                │
│  │   ├── By status (Pending/Processed/Failed)                              │
│  │   ├── By assessment year                                                │
│  │   └── By extraction status                                              │
│  └── Export document list                                                  │
│                                                                             │
│  5.2 DOCUMENT OPERATIONS                                                    │
│  ├── View document                                                         │
│  ├── Download document                                                     │
│  ├── View extracted data                                                   │
│  ├── Edit extracted data                                                   │
│  ├── Reprocess document                                                    │
│  ├── Delete document                                                       │
│  ├── Flag document                                                         │
│  └── View processing logs                                                  │
│                                                                             │
│  5.3 OCR/EXTRACTION MANAGEMENT                                              │
│  ├── View extraction queue                                                 │
│  ├── View extraction success rate                                          │
│  ├── View extraction errors                                                │
│  ├── Manual extraction override                                            │
│  ├── Train extraction model                                                │
│  │   ├── Upload training samples                                           │
│  │   ├── Label training data                                               │
│  │   └── Validate model accuracy                                           │
│  └── Configure extraction rules                                            │
│                                                                             │
│  5.4 DOCUMENT TEMPLATES                                                     │
│  ├── View document templates                                               │
│  │   ├── Form 16 templates (by employer)                                   │
│  │   ├── AIS template                                                      │
│  │   ├── 26AS template                                                     │
│  │   └── Broker statement templates                                        │
│  ├── Add template                                                          │
│  ├── Edit template                                                         │
│  ├── Map template fields                                                   │
│  ├── Test template                                                         │
│  └── Deactivate template                                                   │
│                                                                             │
│  5.5 STORAGE MANAGEMENT                                                     │
│  ├── View storage usage                                                    │
│  ├── View storage by user                                                  │
│  ├── Set storage limits                                                    │
│  ├── Archive old documents                                                 │
│  ├── Delete expired documents                                              │
│  └── Storage cost analysis                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 6: FINANCIAL MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. FINANCIAL MANAGEMENT                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  6.1 REVENUE DASHBOARD                                                      │
│  ├── View total revenue                                                    │
│  │   ├── Today                                                             │
│  │   ├── This week                                                         │
│  │   ├── This month                                                        │
│  │   ├── This quarter                                                      │
│  │   └── This year                                                         │
│  ├── View revenue breakdown                                                │
│  │   ├── By plan type                                                      │
│  │   ├── By user type (B2C/B2B)                                            │
│  │   ├── By payment method                                                 │
│  │   ├── By geography                                                      │
│  │   └── By acquisition channel                                            │
│  ├── View revenue trends                                                   │
│  ├── View MRR/ARR                                                          │
│  ├── View projected revenue                                                │
│  └── Compare with targets                                                  │
│                                                                             │
│  6.2 TRANSACTION MANAGEMENT                                                 │
│  ├── View all transactions                                                 │
│  ├── Search transactions                                                   │
│  │   ├── By transaction ID                                                 │
│  │   ├── By user                                                           │
│  │   ├── By amount                                                         │
│  │   └── By payment method                                                 │
│  ├── Filter transactions                                                   │
│  │   ├── By status (Success/Failed/Pending/Refunded)                       │
│  │   ├── By type (Payment/Refund/Chargeback)                               │
│  │   ├── By date range                                                     │
│  │   └── By gateway                                                        │
│  ├── View transaction details                                              │
│  │   ├── Payment details                                                   │
│  │   ├── User details                                                      │
│  │   ├── Gateway response                                                  │
│  │   └── Related transactions                                              │
│  ├── Transaction operations                                                │
│  │   ├── Initiate refund                                                   │
│  │   ├── Process chargeback                                                │
│  │   ├── Retry failed payment                                              │
│  │   ├── Mark as disputed                                                  │
│  │   └── Add notes                                                         │
│  └── Export transactions                                                   │
│                                                                             │
│  6.3 REFUND MANAGEMENT                                                      │
│  ├── View refund requests                                                  │
│  ├── View pending refunds                                                  │
│  ├── Approve refund                                                        │
│  ├── Reject refund (with reason)                                           │
│  ├── Process refund                                                        │
│  │   ├── Full refund                                                       │
│  │   ├── Partial refund                                                    │
│  │   └── Credit to wallet                                                  │
│  ├── View refund history                                                   │
│  ├── Refund analytics                                                      │
│  │   ├── Refund rate                                                       │
│  │   ├── Refund reasons                                                    │
│  │   └── Refund amount trends                                              │
│  └── Configure refund policy                                               │
│                                                                             │
│  6.4 PRICING MANAGEMENT                                                     │
│  ├── View pricing plans                                                    │
│  ├── Create pricing plan                                                   │
│  │   ├── Plan name                                                         │
│  │   ├── Plan description                                                  │
│  │   ├── Price                                                             │
│  │   ├── Features included                                                 │
│  │   ├── ITR types allowed                                                 │
│  │   ├── Validity period                                                   │
│  │   └── User type restrictions                                            │
│  ├── Edit pricing plan                                                     │
│  ├── Activate/Deactivate plan                                              │
│  ├── View plan subscribers                                                 │
│  ├── Price change management                                               │
│  │   ├── Schedule price change                                             │
│  │   ├── Grandfather existing users                                        │
│  │   └── Notify affected users                                             │
│  └── A/B test pricing                                                      │
│                                                                             │
│  6.5 COUPON/DISCOUNT MANAGEMENT                                             │
│  ├── View all coupons                                                      │
│  ├── Create coupon                                                         │
│  │   ├── Coupon code                                                       │
│  │   ├── Discount type (% or flat)                                         │
│  │   ├── Discount value                                                    │
│  │   ├── Usage limits                                                      │
│  │   ├── Validity period                                                   │
│  │   ├── Applicable plans                                                  │
│  │   ├── User restrictions                                                 │
│  │   └── Minimum order value                                               │
│  ├── Edit coupon                                                           │
│  ├── Activate/Deactivate coupon                                            │
│  ├── View coupon usage                                                     │
│  ├── Coupon analytics                                                      │
│  └── Bulk generate coupons                                                 │
│                                                                             │
│  6.6 INVOICE MANAGEMENT                                                     │
│  ├── View all invoices                                                     │
│  ├── Generate invoice                                                      │
│  ├── Download invoice                                                      │
│  ├── Send invoice to user                                                  │
│  ├── Mark invoice as paid                                                  │
│  ├── Credit note generation                                                │
│  └── Configure invoice template                                            │
│                                                                             │
│  6.7 PAYOUT MANAGEMENT                                                      │
│  ├── CA payouts (see Section 3.5)                                          │
│  ├── Affiliate payouts                                                     │
│  ├── Partner payouts                                                       │
│  ├── View pending payouts                                                  │
│  ├── Process payouts                                                       │
│  ├── Payout reports                                                        │
│  └── Configure payout schedules                                            │
│                                                                             │
│  6.8 TAX/GST MANAGEMENT                                                     │
│  ├── View GST collected                                                    │
│  ├── GST reports                                                           │
│  │   ├── GSTR-1 data                                                       │
│  │   ├── GSTR-3B data                                                      │
│  │   └── Monthly summary                                                   │
│  ├── TDS reports                                                           │
│  ├── Configure tax rates                                                   │
│  └── Export for filing                                                     │
│                                                                             │
│  6.9 FINANCIAL REPORTS                                                      │
│  ├── Revenue reports                                                       │
│  ├── Collection reports                                                    │
│  ├── Refund reports                                                        │
│  ├── Payout reports                                                        │
│  ├── Tax reports                                                           │
│  ├── Reconciliation reports                                                │
│  ├── Aging reports                                                         │
│  └── Custom financial reports                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 7: SUPPORT & COMMUNICATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. SUPPORT & COMMUNICATION                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  7.1 SUPPORT TICKET MANAGEMENT                                              │
│  ├── View all tickets                                                      │
│  ├── Search tickets                                                        │
│  │   ├── By ticket ID                                                      │
│  │   ├── By user                                                           │
│  │   ├── By subject                                                        │
│  │   └── By keyword                                                        │
│  ├── Filter tickets                                                        │
│  │   ├── By status (Open/In Progress/Resolved/Closed)                      │
│  │   ├── By priority (Low/Medium/High/Critical)                            │
│  │   ├── By category                                                       │
│  │   ├── By assigned agent                                                 │
│  │   ├── By SLA status                                                     │
│  │   └── By date                                                           │
│  ├── View ticket details                                                   │
│  │   ├── User information                                                  │
│  │   ├── Ticket history                                                    │
│  │   ├── Attachments                                                       │
│  │   ├── Related filings                                                   │
│  │   └── Internal notes                                                    │
│  ├── Ticket operations                                                     │
│  │   ├── Assign ticket                                                     │
│  │   ├── Change priority                                                   │
│  │   ├── Change status                                                     │
│  │   ├── Add response                                                      │
│  │   ├── Add internal note                                                 │
│  │   ├── Escalate ticket                                                   │
│  │   ├── Merge tickets                                                     │
│  │   └── Close ticket                                                      │
│  ├── Ticket analytics                                                      │
│  │   ├── Volume trends                                                     │
│  │   ├── Resolution time                                                   │
│  │   ├── First response time                                               │
│  │   ├── SLA compliance                                                    │
│  │   ├── Category breakdown                                                │
│  │   └── Agent performance                                                 │
│  └── Bulk ticket operations                                                │
│                                                                             │
│  7.2 LIVE CHAT MANAGEMENT                                                   │
│  ├── View active chats                                                     │
│  ├── Join chat                                                             │
│  ├── Transfer chat                                                         │
│  ├── End chat                                                              │
│  ├── View chat history                                                     │
│  ├── Chat analytics                                                        │
│  │   ├── Chat volume                                                       │
│  │   ├── Wait times                                                        │
│  │   ├── Resolution rate                                                   │
│  │   └── Satisfaction score                                                │
│  └── Configure chat settings                                               │
│      ├── Business hours                                                    │
│      ├── Auto-responses                                                    │
│      └── Routing rules                                                     │
│                                                                             │
│  7.3 EMAIL CAMPAIGNS                                                        │
│  ├── View all campaigns                                                    │
│  ├── Create campaign                                                       │
│  │   ├── Campaign name                                                     │
│  │   ├── Email subject                                                     │
│  │   ├── Email content (rich editor)                                       │
│  │   ├── Target audience                                                   │
│  │   ├── Send time (immediate/scheduled)                                   │
│  │   └── A/B testing options                                               │
│  ├── Edit campaign                                                         │
│  ├── Preview campaign                                                      │
│  ├── Send test email                                                       │
│  ├── Schedule campaign                                                     │
│  ├── Pause/Resume campaign                                                 │
│  ├── View campaign performance                                             │
│  │   ├── Sent count                                                        │
│  │   ├── Delivery rate                                                     │
│  │   ├── Open rate                                                         │
│  │   ├── Click rate                                                        │
│  │   ├── Unsubscribe rate                                                  │
│  │   └── Conversion rate                                                   │
│  └── Campaign templates                                                    │
│      ├── View templates                                                    │
│      ├── Create template                                                   │
│      ├── Edit template                                                     │
│      └── Delete template                                                   │
│                                                                             │
│  7.4 SMS CAMPAIGNS                                                          │
│  ├── View all SMS campaigns                                                │
│  ├── Create SMS campaign                                                   │
│  ├── View SMS performance                                                  │
│  ├── SMS templates                                                         │
│  └── DLT template management                                               │
│                                                                             │
│  7.5 PUSH NOTIFICATIONS                                                     │
│  ├── View push campaigns                                                   │
│  ├── Create push notification                                              │
│  │   ├── Title                                                             │
│  │   ├── Message                                                           │
│  │   ├── Deep link                                                         │
│  │   ├── Image (optional)                                                  │
│  │   └── Target audience                                                   │
│  ├── Schedule push                                                         │
│  └── Push analytics                                                        │
│                                                                             │
│  7.6 IN-APP ANNOUNCEMENTS                                                   │
│  ├── View announcements                                                    │
│  ├── Create announcement                                                   │
│  │   ├── Title                                                             │
│  │   ├── Content                                                           │
│  │   ├── Type (Banner/Modal/Toast)                                         │
│  │   ├── Target pages                                                      │
│  │   ├── Target users                                                      │
│  │   ├── Start/End date                                                    │
│  │   └── Priority                                                          │
│  ├── Edit announcement                                                     │
│  ├── Activate/Deactivate                                                   │
│  └── View announcement metrics                                             │
│                                                                             │
│  7.7 KNOWLEDGE BASE MANAGEMENT                                              │
│  ├── View articles                                                         │
│  ├── Create article                                                        │
│  │   ├── Title                                                             │
│  │   ├── Content (rich editor)                                             │
│  │   ├── Category                                                          │
│  │   ├── Tags                                                              │
│  │   ├── SEO metadata                                                      │
│  │   └── Related articles                                                  │
│  ├── Edit article                                                          │
│  ├── Publish/Unpublish                                                     │
│  ├── View article metrics                                                  │
│  │   ├── Views                                                             │
│  │   ├── Helpfulness rating                                                │
│  │   └── Search ranking                                                    │
│  ├── Category management                                                   │
│  └── FAQ management                                                        │
│                                                                             │
│  7.8 FEEDBACK MANAGEMENT                                                    │
│  ├── View all feedback                                                     │
│  ├── Filter feedback                                                       │
│  │   ├── By type (Bug/Feature/General)                                     │
│  │   ├── By rating                                                         │
│  │   └── By status                                                         │
│  ├── Respond to feedback                                                   │
│  ├── Mark as addressed                                                     │
│  ├── Convert to ticket                                                     │
│  ├── Convert to feature request                                            │
│  └── Feedback analytics                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 8: SYSTEM CONFIGURATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. SYSTEM CONFIGURATION                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  8.1 APPLICATION SETTINGS                                                   │
│  ├── General settings                                                      │
│  │   ├── Application name                                                  │
│  │   ├── Logo                                                              │
│  │   ├── Favicon                                                           │
│  │   ├── Contact email                                                     │
│  │   ├── Support email                                                     │
│  │   └── Support phone                                                     │
│  ├── Business settings                                                     │
│  │   ├── Business name                                                     │
│  │   ├── GST number                                                        │
│  │   ├── Registered address                                                │
│  │   └── Bank details                                                      │
│  ├── Filing settings                                                       │
│  │   ├── Supported ITR types                                               │
│  │   ├── Supported assessment years                                        │
│  │   ├── Filing deadlines                                                  │
│  │   ├── Default regime                                                    │
│  │   └── Auto-save interval                                                │
│  └── Regional settings                                                     │
│      ├── Default language                                                  │
│      ├── Supported languages                                               │
│      ├── Date format                                                       │
│      ├── Currency format                                                   │
│      └── Time zone                                                         │
│                                                                             │
│  8.2 TAX CONFIGURATION                                                      │
│  ├── Tax slabs (Old regime)                                                │
│  │   ├── View current slabs                                                │
│  │   ├── Update slabs                                                      │
│  │   └── Slab history                                                      │
│  ├── Tax slabs (New regime)                                                │
│  ├── Surcharge rates                                                       │
│  ├── Cess rates                                                            │
│  ├── Deduction limits                                                      │
│  │   ├── Section 80C limit                                                 │
│  │   ├── Section 80D limits                                                │
│  │   ├── Section 80CCD(1B) limit                                           │
│  │   └── Other deduction limits                                            │
│  ├── Exemption limits                                                      │
│  ├── Standard deduction                                                    │
│  ├── Rebate u/s 87A                                                        │
│  └── Index rates (for LTCG)                                                │
│                                                                             │
│  8.3 INTEGRATION SETTINGS                                                   │
│  ├── Income Tax Portal integration                                         │
│  │   ├── API credentials                                                   │
│  │   ├── Connection status                                                 │
│  │   └── Rate limits                                                       │
│  ├── Payment gateway settings                                              │
│  │   ├── Razorpay configuration                                            │
│  │   ├── PayU configuration                                                │
│  │   ├── Enable/disable gateways                                           │
│  │   └── Gateway priority                                                  │
│  ├── SMS gateway settings                                                  │
│  │   ├── Provider configuration                                            │
│  │   ├── Sender ID                                                         │
│  │   └── DLT configuration                                                 │
│  ├── Email settings                                                        │
│  │   ├── SMTP configuration                                                │
│  │   ├── Sender email                                                      │
│  │   └── Email templates                                                   │
│  ├── OCR/Document processing                                               │
│  │   ├── Provider configuration                                            │
│  │   └── Model settings                                                    │
│  ├── Storage settings                                                      │
│  │   ├── S3 configuration                                                  │
│  │   └── Storage limits                                                    │
│  └── Analytics integration                                                 │
│      ├── Google Analytics                                                  │
│      ├── Mixpanel                                                          │
│      └── Custom analytics                                                  │
│                                                                             │
│  8.4 NOTIFICATION SETTINGS                                                  │
│  ├── Email notification triggers                                           │
│  ├── SMS notification triggers                                             │
│  ├── Push notification triggers                                            │
│  ├── Notification templates                                                │
│  └── Notification preferences defaults                                     │
│                                                                             │
│  8.5 SECURITY SETTINGS                                                      │
│  ├── Authentication settings                                               │
│  │   ├── Password policy                                                   │
│  │   │   ├── Minimum length                                                │
│  │   │   ├── Complexity requirements                                       │
│  │   │   ├── Password expiry                                               │
│  │   │   └── Password history                                              │
│  │   ├── Session settings                                                  │
│  │   │   ├── Session timeout                                               │
│  │   │   ├── Max concurrent sessions                                       │
│  │   │   └── Remember me duration                                          │
│  │   ├── 2FA settings                                                      │
│  │   │   ├── Enable/disable 2FA                                            │
│  │   │   ├── 2FA methods                                                   │
│  │   │   └── Force 2FA for admin                                           │
│  │   └── OAuth settings                                                    │
│  │       ├── Google OAuth                                                  │
│  │       └── Other providers                                               │
│  ├── Rate limiting                                                         │
│  │   ├── API rate limits                                                   │
│  │   ├── Login attempt limits                                              │
│  │   └── OTP request limits                                                │
│  ├── IP restrictions                                                       │
│  │   ├── Admin IP whitelist                                                │
│  │   ├── Blocked IPs                                                       │
│  │   └── Geo-blocking                                                      │
│  ├── Data encryption                                                       │
│  │   ├── Encryption keys management                                        │
│  │   ├── Key rotation                                                      │
│  │   └── Encryption settings                                               │
│  └── CORS settings                                                         │
│                                                                             │
│  8.6 FEATURE FLAGS                                                          │
│  ├── View feature flags                                                    │
│  ├── Create feature flag                                                   │
│  │   ├── Flag name                                                         │
│  │   ├── Flag key                                                          │
│  │   ├── Description                                                       │
│  │   ├── Default value                                                     │
│  │   └── Targeting rules                                                   │
│  ├── Edit feature flag                                                     │
│  ├── Enable/Disable flag                                                   │
│  ├── Set flag targeting                                                    │
│  │   ├── All users                                                         │
│  │   ├── Percentage rollout                                                │
│  │   ├── User segments                                                     │
│  │   └── Specific users                                                    │
│  └── Feature flag analytics                                                │
│                                                                             │
│  8.7 WORKFLOW CONFIGURATION                                                 │
│  ├── Filing workflow                                                       │
│  │   ├── Required steps                                                    │
│  │   ├── Optional steps                                                    │
│  │   └── Step dependencies                                                 │
│  ├── Approval workflow                                                     │
│  │   ├── CA approval required                                              │
│  │   └── Admin approval required                                           │
│  ├── Verification workflow                                                 │
│  │   ├── PAN verification required                                         │
│  │   ├── Aadhaar verification required                                     │
│  │   └── Bank verification required                                        │
│  └── Notification workflow                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 9: ADMIN USER MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. ADMIN USER & ROLE MANAGEMENT                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  9.1 ADMIN USER MANAGEMENT                                                  │
│  ├── View all admin users                                                  │
│  ├── Search admin users                                                    │
│  ├── Create admin user                                                     │
│  │   ├── Name                                                              │
│  │   ├── Email                                                             │
│  │   ├── Role assignment                                                   │
│  │   ├── Department                                                        │
│  │   └── Access restrictions                                               │
│  ├── Edit admin user                                                       │
│  ├── Activate/Deactivate admin                                             │
│  ├── Reset admin password                                                  │
│  ├── Revoke admin access                                                   │
│  ├── View admin activity log                                               │
│  └── Delete admin user                                                     │
│                                                                             │
│  9.2 ROLE MANAGEMENT                                                        │
│  ├── View all roles                                                        │
│  ├── Create role                                                           │
│  │   ├── Role name                                                         │
│  │   ├── Role description                                                  │
│  │   └── Permission assignment                                             │
│  ├── Edit role                                                             │
│  ├── Clone role                                                            │
│  ├── Delete role                                                           │
│  └── View role assignments                                                 │
│                                                                             │
│  9.3 PERMISSION MANAGEMENT                                                  │
│  ├── View all permissions                                                  │
│  ├── Permission categories                                                 │
│  │   ├── User management                                                   │
│  │   ├── Filing management                                                 │
│  │   ├── Financial management                                              │
│  │   ├── Support management                                                │
│  │   ├── System configuration                                              │
│  │   ├── Reports & analytics                                               │
│  │   └── Security & compliance                                             │
│  ├── Create permission                                                     │
│  ├── Edit permission                                                       │
│  └── Assign permissions to role                                            │
│                                                                             │
│  9.4 DEPARTMENT MANAGEMENT                                                  │
│  ├── View departments                                                      │
│  ├── Create department                                                     │
│  ├── Edit department                                                       │
│  ├── Assign admins to department                                           │
│  └── Delete department                                                     │
│                                                                             │
│  9.5 ACCESS CONTROL                                                         │
│  ├── IP-based access control                                               │
│  ├── Time-based access control                                             │
│  ├── Module-level access                                                   │
│  ├── Data-level access                                                     │
│  └── Action-level access                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 10: AUDIT & COMPLIANCE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  10. AUDIT & COMPLIANCE                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  10.1 AUDIT LOGS                                                            │
│  ├── View all audit logs                                                   │
│  ├── Search audit logs                                                     │
│  │   ├── By user                                                           │
│  │   ├── By action                                                         │
│  │   ├── By module                                                         │
│  │   ├── By IP address                                                     │
│  │   └── By date range                                                     │
│  ├── Filter audit logs                                                     │
│  │   ├── By action type (Create/Read/Update/Delete)                        │
│  │   ├── By severity                                                       │
│  │   └── By user type (Admin/User/CA)                                      │
│  ├── View log details                                                      │
│  │   ├── Timestamp                                                         │
│  │   ├── User details                                                      │
│  │   ├── Action performed                                                  │
│  │   ├── Affected data (before/after)                                      │
│  │   ├── IP address                                                        │
│  │   ├── User agent                                                        │
│  │   └── Request details                                                   │
│  ├── Export audit logs                                                     │
│  └── Configure audit retention                                             │
│                                                                             │
│  10.2 ADMIN ACTIVITY LOGS                                                   │
│  ├── View admin logins                                                     │
│  ├── View admin actions                                                    │
│  ├── View impersonation logs                                               │
│  ├── View configuration changes                                            │
│  └── View permission changes                                               │
│                                                                             │
│  10.3 SECURITY LOGS                                                         │
│  ├── View failed login attempts                                            │
│  ├── View blocked IPs                                                      │
│  ├── View suspicious activities                                            │
│  ├── View 2FA events                                                       │
│  ├── View password changes                                                 │
│  └── View session events                                                   │
│                                                                             │
│  10.4 DATA ACCESS LOGS                                                      │
│  ├── View PII access logs                                                  │
│  ├── View document access logs                                             │
│  ├── View export logs                                                      │
│  └── View bulk operation logs                                              │
│                                                                             │
│  10.5 COMPLIANCE MANAGEMENT                                                 │
│  ├── GDPR compliance                                                       │
│  │   ├── Data subject requests                                             │
│  │   │   ├── View requests                                                 │
│  │   │   ├── Process access request                                        │
│  │   │   ├── Process deletion request                                      │
│  │   │   ├── Process rectification request                                 │
│  │   │   └── Process portability request                                   │
│  │   ├── Consent management                                                │
│  │   │   ├── View consent records                                          │
│  │   │   └── Consent audit trail                                           │
│  │   └── Data processing records                                           │
│  ├── IT Act compliance                                                     │
│  │   ├── Data localization status                                          │
│  │   └── Security audit reports                                            │
│  ├── RBI compliance (payment related)                                      │
│  └── Compliance reports                                                    │
│      ├── Generate compliance report                                        │
│      ├── Schedule compliance reports                                       │
│      └── Share with auditors                                               │
│                                                                             │
│  10.6 DATA RETENTION                                                        │
│  ├── View retention policies                                               │
│  ├── Configure retention periods                                           │
│  │   ├── User data retention                                               │
│  │   ├── Filing data retention                                             │
│  │   ├── Document retention                                                │
│  │   ├── Log retention                                                     │
│  │   └── Financial data retention                                          │
│  ├── View data scheduled for deletion                                      │
│  ├── Execute data deletion                                                 │
│  ├── Archive data                                                          │
│  └── Restore archived data                                                 │
│                                                                             │
│  10.7 SECURITY AUDITS                                                       │
│  ├── Run security scan                                                     │
│  ├── View vulnerability reports                                            │
│  ├── Track remediation                                                     │
│  ├── Penetration test reports                                              │
│  └── Security compliance checklist                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 11: SYSTEM MONITORING & MAINTENANCE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  11. SYSTEM MONITORING & MAINTENANCE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  11.1 SYSTEM HEALTH                                                         │
│  ├── View system status                                                    │
│  │   ├── Application servers                                               │
│  │   ├── Database servers                                                  │
│  │   ├── Cache servers                                                     │
│  │   ├── Queue servers                                                     │
│  │   ├── Storage systems                                                   │
│  │   └── External services                                                 │
│  ├── View performance metrics                                              │
│  │   ├── CPU usage                                                         │
│  │   ├── Memory usage                                                      │
│  │   ├── Disk usage                                                        │
│  │   ├── Network I/O                                                       │
│  │   └── Database connections                                              │
│  ├── View API performance                                                  │
│  │   ├── Response times                                                    │
│  │   ├── Request volume                                                    │
│  │   ├── Error rates                                                       │
│  │   └── Slow queries                                                      │
│  ├── View uptime statistics                                                │
│  └── Configure health alerts                                               │
│                                                                             │
│  11.2 ERROR MONITORING                                                      │
│  ├── View error dashboard                                                  │
│  ├── View error details                                                    │
│  │   ├── Stack trace                                                       │
│  │   ├── User context                                                      │
│  │   ├── Request data                                                      │
│  │   └── Environment info                                                  │
│  ├── Group errors                                                          │
│  ├── Assign errors                                                         │
│  ├── Mark as resolved                                                      │
│  ├── Set error priority                                                    │
│  └── Configure error alerts                                                │
│                                                                             │
│  11.3 JOB MONITORING                                                        │
│  ├── View background jobs                                                  │
│  │   ├── Running jobs                                                      │
│  │   ├── Queued jobs                                                       │
│  │   ├── Completed jobs                                                    │
│  │   └── Failed jobs                                                       │
│  ├── View job details                                                      │
│  ├── Retry failed job                                                      │
│  ├── Cancel job                                                            │
│  ├── Pause queue                                                           │
│  ├── Resume queue                                                          │
│  └── Job performance metrics                                               │
│                                                                             │
│  11.4 SCHEDULED TASKS                                                       │
│  ├── View scheduled tasks                                                  │
│  ├── Create scheduled task                                                 │
│  ├── Edit schedule                                                         │
│  ├── Enable/Disable task                                                   │
│  ├── Run task manually                                                     │
│  ├── View task history                                                     │
│  └── Task failure alerts                                                   │
│                                                                             │
│  11.5 DATABASE MANAGEMENT                                                   │
│  ├── View database status                                                  │
│  ├── View slow queries                                                     │
│  ├── Query analyzer                                                        │
│  ├── Index management                                                      │
│  ├── View table statistics                                                 │
│  ├── Run database maintenance                                              │
│  │   ├── Vacuum/Optimize                                                   │
│  │   ├── Reindex                                                           │
│  │   └── Analyze                                                           │
│  └── Database backup management                                            │
│      ├── View backups                                                      │
│      ├── Trigger backup                                                    │
│      ├── Restore from backup                                               │
│      └── Configure backup schedule                                         │
│                                                                             │
│  11.6 CACHE MANAGEMENT                                                      │
│  ├── View cache status                                                     │
│  ├── View cache hit rate                                                   │
│  ├── Clear specific cache                                                  │
│  ├── Clear all cache                                                       │
│  ├── View cache keys                                                       │
│  └── Configure cache settings                                              │
│                                                                             │
│  11.7 MAINTENANCE MODE                                                      │
│  ├── Enable maintenance mode                                               │
│  │   ├── Full maintenance                                                  │
│  │   ├── Partial maintenance (specific features)                           │
│  │   └── Read-only mode                                                    │
│  ├── Set maintenance message                                               │
│  ├── Set estimated downtime                                                │
│  ├── Whitelist IPs during maintenance                                      │
│  ├── Disable maintenance mode                                              │
│  └── Schedule maintenance window                                           │
│                                                                             │
│  11.8 DEPLOYMENT MANAGEMENT                                                 │
│  ├── View deployment history                                               │
│  ├── View current version                                                  │
│  ├── Trigger deployment                                                    │
│  ├── Rollback deployment                                                   │
│  ├── View deployment status                                                │
│  └── Configure deployment settings                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 12: INTEGRATIONS & API MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  12. INTEGRATIONS & API MANAGEMENT                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  12.1 EXTERNAL INTEGRATIONS                                                 │
│  ├── Income Tax Portal                                                     │
│  │   ├── View connection status                                            │
│  │   ├── Test connection                                                   │
│  │   ├── View API usage                                                    │
│  │   ├── View error logs                                                   │
│  │   └── Configure credentials                                             │
│  ├── Payment gateways                                                      │
│  │   ├── Razorpay status                                                   │
│  │   ├── PayU status                                                       │
│  │   ├── Transaction logs                                                  │
│  │   └── Webhook management                                                │
│  ├── SMS providers                                                         │
│  │   ├── Provider status                                                   │
│  │   ├── Delivery rates                                                    │
│  │   └── Credit balance                                                    │
│  ├── Email providers                                                       │
│  │   ├── SMTP status                                                       │
│  │   ├── Delivery rates                                                    │
│  │   └── Bounce management                                                 │
│  ├── OCR/Document services                                                 │
│  ├── Bank verification services                                            │
│  └── Analytics services                                                    │
│                                                                             │
│  12.2 WEBHOOK MANAGEMENT                                                    │
│  ├── View incoming webhooks                                                │
│  ├── View outgoing webhooks                                                │
│  ├── Configure webhook endpoints                                           │
│  ├── Webhook security (signing keys)                                       │
│  ├── Webhook retry policy                                                  │
│  ├── View webhook logs                                                     │
│  └── Test webhooks                                                         │
│                                                                             │
│  12.3 API MANAGEMENT (For Partners)                                         │
│  ├── View API clients                                                      │
│  ├── Create API client                                                     │
│  │   ├── Client name                                                       │
│  │   ├── Allowed scopes                                                    │
│  │   ├── Rate limits                                                       │
│  │   └── IP restrictions                                                   │
│  ├── Generate API keys                                                     │
│  ├── Revoke API keys                                                       │
│  ├── View API usage                                                        │
│  │   ├── Request volume                                                    │
│  │   ├── Endpoint breakdown                                                │
│  │   ├── Error rates                                                       │
│  │   └── Rate limit hits                                                   │
│  ├── API documentation management                                          │
│  └── API versioning                                                        │
│                                                                             │
│  12.4 DATA SYNC                                                             │
│  ├── View sync status                                                      │
│  ├── Trigger manual sync                                                   │
│  ├── View sync history                                                     │
│  ├── View sync errors                                                      │
│  └── Configure sync schedule                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 13: MARKETING & GROWTH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  13. MARKETING & GROWTH                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  13.1 REFERRAL PROGRAM                                                      │
│  ├── View referral dashboard                                               │
│  ├── Configure referral program                                            │
│  │   ├── Referrer reward                                                   │
│  │   ├── Referee reward                                                    │
│  │   ├── Eligibility criteria                                              │
│  │   └── Reward limits                                                     │
│  ├── View referrals                                                        │
│  ├── View pending rewards                                                  │
│  ├── Process rewards                                                       │
│  ├── View referral analytics                                               │
│  └── Manage referral fraud                                                 │
│                                                                             │
│  13.2 AFFILIATE PROGRAM                                                     │
│  ├── View affiliates                                                       │
│  ├── Approve affiliate applications                                        │
│  ├── Configure commission structure                                        │
│  ├── Generate affiliate links                                              │
│  ├── View affiliate performance                                            │
│  ├── Process affiliate payouts                                             │
│  └── Affiliate analytics                                                   │
│                                                                             │
│  13.3 PROMOTIONS                                                            │
│  ├── View active promotions                                                │
│  ├── Create promotion                                                      │
│  │   ├── Promotion name                                                    │
│  │   ├── Promotion type                                                    │
│  │   ├── Discount/Benefit                                                  │
│  │   ├── Eligibility                                                       │
│  │   └── Duration                                                          │
│  ├── Edit promotion                                                        │
│  ├── End promotion early                                                   │
│  └── Promotion analytics                                                   │
│                                                                             │
│  13.4 LANDING PAGES                                                         │
│  ├── View landing pages                                                    │
│  ├── Create landing page                                                   │
│  ├── Edit landing page                                                     │
│  ├── A/B test landing pages                                                │
│  ├── Landing page analytics                                                │
│  └── SEO settings                                                          │
│                                                                             │
│  13.5 UTM & ATTRIBUTION                                                     │
│  ├── View UTM tracking data                                                │
│  ├── View attribution reports                                              │
│  ├── Configure attribution model                                           │
│  └── Channel performance analysis                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 14: CONTENT MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  14. CONTENT MANAGEMENT                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  14.1 STATIC PAGES                                                          │
│  ├── View all pages                                                        │
│  ├── Create page                                                           │
│  ├── Edit page                                                             │
│  │   ├── About Us                                                          │
│  │   ├── Terms of Service                                                  │
│  │   ├── Privacy Policy                                                    │
│  │   ├── Refund Policy                                                     │
│  │   └── Contact Us                                                        │
│  ├── Publish/Unpublish                                                     │
│  └── Page version history                                                  │
│                                                                             │
│  14.2 BLOG MANAGEMENT                                                       │
│  ├── View all posts                                                        │
│  ├── Create post                                                           │
│  ├── Edit post                                                             │
│  ├── Publish/Unpublish                                                     │
│  ├── Schedule post                                                         │
│  ├── Category management                                                   │
│  ├── Tag management                                                        │
│  ├── Author management                                                     │
│  └── Post analytics                                                        │
│                                                                             │
│  14.3 MEDIA LIBRARY                                                         │
│  ├── View all media                                                        │
│  ├── Upload media                                                          │
│  ├── Edit media details                                                    │
│  ├── Delete media                                                          │
│  ├── Organize in folders                                                   │
│  └── Media usage tracking                                                  │
│                                                                             │
│  14.4 SEO MANAGEMENT                                                        │
│  ├── Meta tags management                                                  │
│  ├── Sitemap configuration                                                 │
│  ├── Robots.txt management                                                 │
│  ├── Schema markup                                                         │
│  └── Redirect management                                                   │
│                                                                             │
│  14.5 TRANSLATIONS                                                          │
│  ├── View translations                                                     │
│  ├── Add translation                                                       │
│  ├── Edit translation                                                      │
│  ├── Import translations                                                   │
│  ├── Export translations                                                   │
│  ├── Machine translation                                                   │
│  └── Translation completion status                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY: SUPER ADMIN FUNCTION COUNT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPER ADMIN FUNCTION COUNT SUMMARY                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Category                                    │ Functions                    │
│  ────────────────────────────────────────────┼──────────────────────────────│
│  1. Dashboard & Analytics                    │ ~60                          │
│  2. User Management                          │ ~70                          │
│  3. CA/Professional Management               │ ~50                          │
│  4. ITR/Filing Management                    │ ~45                          │
│  5. Document Management                      │ ~35                          │
│  6. Financial Management                     │ ~100                         │
│  7. Support & Communication                  │ ~75                          │
│  8. System Configuration                     │ ~80                          │
│  9. Admin User & Role Management             │ ~35                          │
│  10. Audit & Compliance                      │ ~50                          │
│  11. System Monitoring & Maintenance         │ ~55                          │
│  12. Integrations & API Management           │ ~35                          │
│  13. Marketing & Growth                      │ ~35                          │
│  14. Content Management                      │ ~35                          │
│  ────────────────────────────────────────────┼──────────────────────────────│
│  TOTAL SUPER ADMIN FUNCTIONS                 │ ~760+                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRIORITY GROUPING FOR ADMIN PANEL IMPLEMENTATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION PRIORITY - ADMIN PANEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  P0 - CRITICAL (Launch Essentials)                                          │
│  ──────────────────────────────────                                         │
│  ├── Admin authentication & basic RBAC                                      │
│  ├── User directory (view, search, basic actions)                           │
│  ├── Filing directory (view, search)                                        │
│  ├── Basic dashboard (KPIs, filing stats)                                   │
│  ├── Transaction management (view, refunds)                                 │
│  ├── Support ticket management                                              │
│  ├── Basic audit logs                                                       │
│  └── System health monitoring                                               │
│                                                                             │
│  P1 - HIGH (Operational Efficiency)                                         │
│  ──────────────────────────────────                                         │
│  ├── Advanced user management (bulk ops, segments)                          │
│  ├── CA management & verification                                           │
│  ├── Filing operations (edit, reprocess)                                    │
│  ├── Document management                                                    │
│  ├── Pricing & coupon management                                            │
│  ├── Email/SMS campaigns                                                    │
│  ├── Knowledge base management                                              │
│  ├── Tax configuration                                                      │
│  ├── Role & permission management                                           │
│  └── Error monitoring                                                       │
│                                                                             │
│  P2 - MEDIUM (Scale & Optimize)                                             │
│  ──────────────────────────────────                                         │
│  ├── Advanced analytics & reporting                                         │
│  ├── Custom report builder                                                  │
│  ├── CA payout management                                                   │
│  ├── Feature flags                                                          │
│  ├── Integration management                                                 │
│  ├── Webhook management                                                     │
│  ├── Compliance management (GDPR)                                           │
│  ├── Data retention management                                              │
│  ├── Job monitoring                                                         │
│  └── Cache management                                                       │
│                                                                             │
│  P3 - LOW (Advanced Features)                                               │
│  ──────────────────────────────────                                         │
│  ├── Referral & affiliate program                                           │
│  ├── Landing page builder                                                   │
│  ├── Blog management                                                        │
│  ├── A/B testing                                                            │
│  ├── Advanced OCR training                                                  │
│  ├── API client management                                                  │
│  ├── Deployment management                                                  │
│  ├── Database management tools                                              │
│  └── Multi-language content management                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN PANEL - ROLE-BASED ACCESS MATRIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ROLE-BASED ACCESS CONTROL MATRIX                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ROLES:                                                                     │
│  SA = Super Admin  │  AD = Admin  │  SP = Support  │  FN = Finance         │
│  CM = Compliance   │  MK = Marketing                                        │
│                                                                             │
│  ┌────────────────────────────────────┬────┬────┬────┬────┬────┬────┐      │
│  │ Module / Function                  │ SA │ AD │ SP │ FN │ CM │ MK │      │
│  ├────────────────────────────────────┼────┼────┼────┼────┼────┼────┤      │
│  │                                    │    │    │    │    │    │    │      │
│  │ DASHBOARD                          │    │    │    │    │    │    │      │
│  │ ├─ Executive Dashboard             │ ✓  │ ✓  │ R  │ R  │ R  │ R  │      │
│  │ ├─ Revenue Dashboard               │ ✓  │ R  │ ✗  │ ✓  │ R  │ R  │      │
│  │ └─ Real-time Monitoring            │ ✓  │ ✓  │ R  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ USER MANAGEMENT                    │    │    │    │    │    │    │      │
│  │ ├─ View Users                      │ ✓  │ ✓  │ ✓  │ R  │ ✓  │ R  │      │
│  │ ├─ Edit Users                      │ ✓  │ ✓  │ L  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Delete Users                    │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Impersonate User                │ ✓  │ L  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ └─ User Verification               │ ✓  │ ✓  │ ✓  │ ✗  │ ✓  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ CA MANAGEMENT                      │    │    │    │    │    │    │      │
│  │ ├─ View CAs                        │ ✓  │ ✓  │ ✓  │ R  │ ✓  │ R  │      │
│  │ ├─ Approve/Reject CAs              │ ✓  │ ✓  │ ✗  │ ✗  │ ✓  │ ✗  │      │
│  │ ├─ CA Payouts                      │ ✓  │ R  │ ✗  │ ✓  │ ✗  │ ✗  │      │
│  │ └─ CA Tier Management              │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ FILING MANAGEMENT                  │    │    │    │    │    │    │      │
│  │ ├─ View Filings                    │ ✓  │ ✓  │ ✓  │ R  │ ✓  │ R  │      │
│  │ ├─ Edit Filings                    │ ✓  │ ✓  │ L  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Override Validation             │ ✓  │ L  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ └─ Filing Operations               │ ✓  │ ✓  │ L  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ DOCUMENT MANAGEMENT                │    │    │    │    │    │    │      │
│  │ ├─ View Documents                  │ ✓  │ ✓  │ ✓  │ ✗  │ ✓  │ ✗  │      │
│  │ ├─ Delete Documents                │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ └─ OCR Configuration               │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ FINANCIAL MANAGEMENT               │    │    │    │    │    │    │      │
│  │ ├─ View Transactions               │ ✓  │ R  │ R  │ ✓  │ R  │ R  │      │
│  │ ├─ Process Refunds                 │ ✓  │ L  │ ✗  │ ✓  │ ✗  │ ✗  │      │
│  │ ├─ Pricing Management              │ ✓  │ ✗  │ ✗  │ ✓  │ ✗  │ R  │      │
│  │ ├─ Coupon Management               │ ✓  │ ✓  │ ✗  │ ✓  │ ✗  │ ✓  │      │
│  │ └─ Financial Reports               │ ✓  │ R  │ ✗  │ ✓  │ R  │ R  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ SUPPORT & COMMUNICATION            │    │    │    │    │    │    │      │
│  │ ├─ Support Tickets                 │ ✓  │ ✓  │ ✓  │ ✗  │ R  │ ✗  │      │
│  │ ├─ Live Chat                       │ ✓  │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Email Campaigns                 │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │      │
│  │ ├─ SMS Campaigns                   │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │      │
│  │ └─ Knowledge Base                  │ ✓  │ ✓  │ ✓  │ ✗  │ ✗  │ ✓  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ SYSTEM CONFIGURATION               │    │    │    │    │    │    │      │
│  │ ├─ Application Settings            │ ✓  │ R  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Tax Configuration               │ ✓  │ ✓  │ ✗  │ ✗  │ R  │ ✗  │      │
│  │ ├─ Integration Settings            │ ✓  │ R  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Security Settings               │ ✓  │ ✗  │ ✗  │ ✗  │ R  │ ✗  │      │
│  │ └─ Feature Flags                   │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ ADMIN & ROLE MANAGEMENT            │    │    │    │    │    │    │      │
│  │ ├─ View Admin Users                │ ✓  │ R  │ ✗  │ ✗  │ R  │ ✗  │      │
│  │ ├─ Manage Admin Users              │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Role Management                 │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ └─ Permission Management           │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ AUDIT & COMPLIANCE                 │    │    │    │    │    │    │      │
│  │ ├─ Audit Logs                      │ ✓  │ R  │ R  │ R  │ ✓  │ ✗  │      │
│  │ ├─ Security Logs                   │ ✓  │ R  │ ✗  │ ✗  │ ✓  │ ✗  │      │
│  │ ├─ Compliance Management           │ ✓  │ R  │ ✗  │ ✗  │ ✓  │ ✗  │      │
│  │ └─ Data Retention                  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ SYSTEM MONITORING                  │    │    │    │    │    │    │      │
│  │ ├─ System Health                   │ ✓  │ ✓  │ R  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Error Monitoring                │ ✓  │ ✓  │ R  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Job Monitoring                  │ ✓  │ ✓  │ R  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Database Management             │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ ├─ Maintenance Mode                │ ✓  │ L  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │ └─ Deployment Management           │ ✓  │ ✗  │ ✗  │ ✗  │ ✗  │ ✗  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ MARKETING & GROWTH                 │    │    │    │    │    │    │      │
│  │ ├─ Referral Program                │ ✓  │ ✓  │ ✗  │ R  │ ✗  │ ✓  │      │
│  │ ├─ Affiliate Program               │ ✓  │ R  │ ✗  │ ✓  │ ✗  │ ✓  │      │
│  │ ├─ Promotions                      │ ✓  │ ✓  │ ✗  │ R  │ ✗  │ ✓  │      │
│  │ └─ Landing Pages                   │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │      │
│  │                                    │    │    │    │    │    │    │      │
│  │ CONTENT MANAGEMENT                 │    │    │    │    │    │    │      │
│  │ ├─ Static Pages                    │ ✓  │ ✓  │ ✗  │ ✗  │ R  │ ✓  │      │
│  │ ├─ Blog Management                 │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │      │
│  │ ├─ Media Library                   │ ✓  │ ✓  │ ✓  │ ✗  │ ✗  │ ✓  │      │
│  │ └─ Translations                    │ ✓  │ ✓  │ ✗  │ ✗  │ ✗  │ ✓  │      │
│  │                                    │    │    │    │    │    │    │      │
│  └────────────────────────────────────┴────┴────┴────┴────┴────┴────┘      │
│                                                                             │
│  LEGEND:                                                                    │
│  ✓ = Full Access    R = Read Only    L = Limited (with restrictions)       │
│  ✗ = No Access                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN PANEL - CODE STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL APPLICATION STRUCTURE                                          │
├─────────────────────────────────────────────────────────────────────────────┤

apps/admin/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                  # Protected admin routes
│   │   │   ├── layout.tsx                # Admin layout with sidebar
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Executive dashboard
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # User directory
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx          # User detail
│   │   │   │   │   ├── filings/
│   │   │   │   │   ├── transactions/
│   │   │   │   │   └── activity/
│   │   │   │   ├── segments/
│   │   │   │   └── verification/
│   │   │   │
│   │   │   ├── cas/
│   │   │   │   ├── page.tsx              # CA directory
│   │   │   │   ├── [id]/
│   │   │   │   ├── verification/
│   │   │   │   └── payouts/
│   │   │   │
│   │   │   ├── filings/
│   │   │   │   ├── page.tsx              # Filing directory
│   │   │   │   ├── [id]/
│   │   │   │   └── issues/
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── templates/
│   │   │   │   └── storage/
│   │   │   │
│   │   │   ├── finance/
│   │   │   │   ├── transactions/
│   │   │   │   ├── refunds/
│   │   │   │   ├── pricing/
│   │   │   │   ├── coupons/
│   │   │   │   ├── invoices/
│   │   │   │   ├── payouts/
│   │   │   │   └── reports/
│   │   │   │
│   │   │   ├── support/
│   │   │   │   ├── tickets/
│   │   │   │   ├── chat/
│   │   │   │   └── feedback/
│   │   │   │
│   │   │   ├── communications/
│   │   │   │   ├── email-campaigns/
│   │   │   │   ├── sms-campaigns/
│   │   │   │   ├── push-notifications/
│   │   │   │   └── announcements/
│   │   │   │
│   │   │   ├── content/
│   │   │   │   ├── pages/
│   │   │   │   ├── blog/
│   │   │   │   ├── knowledge-base/
│   │   │   │   ├── media/
│   │   │   │   └── translations/
│   │   │   │
│   │   │   ├── marketing/
│   │   │   │   ├── referrals/
│   │   │   │   ├── affiliates/
│   │   │   │   ├── promotions/
│   │   │   │   └── landing-pages/
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── general/
│   │   │   │   ├── tax-config/
│   │   │   │   ├── integrations/
│   │   │   │   ├── notifications/
│   │   │   │   ├── security/
│   │   │   │   └── feature-flags/
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── admins/
│   │   │   │   ├── roles/
│   │   │   │   └── permissions/
│   │   │   │
│   │   │   ├── audit/
│   │   │   │   ├── logs/
│   │   │   │   ├── security/
│   │   │   │   ├── compliance/
│   │   │   │   └── data-retention/
│   │   │   │
│   │   │   ├── system/
│   │   │   │   ├── health/
│   │   │   │   ├── errors/
│   │   │   │   ├── jobs/
│   │   │   │   ├── scheduled-tasks/
│   │   │   │   ├── database/
│   │   │   │   ├── cache/
│   │   │   │   └── maintenance/
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── external/
│   │   │   │   ├── webhooks/
│   │   │   │   └── api-clients/
│   │   │   │
│   │   │   └── analytics/
│   │   │       ├── users/
│   │   │       ├── filings/
│   │   │       ├── revenue/
│   │   │       └── reports/
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                           # Shared with main app
│   │   │
│   │   ├── admin/                        # Admin-specific components
│   │   │   ├── layout/
│   │   │   │   ├── admin-header.tsx
│   │   │   │   ├── admin-sidebar.tsx
│   │   │   │   ├── admin-breadcrumb.tsx
│   │   │   │   └── admin-footer.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── stat-card.tsx
│   │   │   │   ├── kpi-widget.tsx
│   │   │   │   ├── activity-feed.tsx
│   │   │   │   ├── alerts-panel.tsx
│   │   │   │   └── quick-actions.tsx
│   │   │   │
│   │   │   ├── data-table/
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── data-table-toolbar.tsx
│   │   │   │   ├── data-table-pagination.tsx
│   │   │   │   ├── data-table-filters.tsx
│   │   │   │   └── data-table-actions.tsx
│   │   │   │
│   │   │   ├── charts/
│   │   │   │   ├── line-chart.tsx
│   │   │   │   ├── bar-chart.tsx
│   │   │   │   ├── pie-chart.tsx
│   │   │   │   ├── area-chart.tsx
│   │   │   │   └── trend-indicator.tsx
│   │   │   │
│   │   │   ├── filters/
│   │   │   │   ├── date-range-picker.tsx
│   │   │   │   ├── multi-select-filter.tsx
│   │   │   │   └── search-filter.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── page-header.tsx
│   │   │       ├── section-header.tsx
│   │   │       ├── detail-panel.tsx
│   │   │       ├── confirmation-dialog.tsx
│   │   │       └── bulk-action-bar.tsx
│   │   │
│   │   └── features/                     # Feature-specific components
│   │       ├── users/
│   │       ├── cas/
│   │       ├── filings/
│   │       ├── finance/
│   │       ├── support/
│   │       └── ...
│   │
│   ├── features/                         # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── store/
│   │   │
│   │   ├── users/
│   │   │   ├── components/
│   │   │   │   ├── user-table.tsx
│   │   │   │   ├── user-detail.tsx
│   │   │   │   ├── user-actions.tsx
│   │   │   │   ├── user-form.tsx
│   │   │   │   └── user-filters.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-users.ts
│   │   │   │   ├── use-user.ts
│   │   │   │   └── use-user-actions.ts
│   │   │   ├── services/
│   │   │   │   └── users.service.ts
│   │   │   ├── types/
│   │   │   │   └── users.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cas/
│   │   ├── filings/
│   │   ├── documents/
│   │   ├── finance/
│   │   ├── support/
│   │   ├── communications/
│   │   ├── content/
│   │   ├── marketing/
│   │   ├── settings/
│   │   ├── team/
│   │   ├── audit/
│   │   ├── system/
│   │   ├── integrations/
│   │   └── analytics/
│   │
│   ├── hooks/
│   │   ├── use-permissions.ts            # Permission checking
│   │   ├── use-admin-auth.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── admin-client.ts           # Admin API client
│   │   ├── utils/
│   │   └── constants/
│   │       └── permissions.ts            # Permission constants
│   │
│   ├── store/
│   │   ├── admin-auth.store.ts
│   │   └── admin-ui.store.ts
│   │
│   ├── services/
│   │   └── admin-api.service.ts
│   │
│   ├── types/
│   │   ├── admin.types.ts
│   │   └── permissions.types.ts
│   │
│   └── providers/
│       ├── admin-providers.tsx
│       └── permission-provider.tsx
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json

└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN API ENDPOINTS STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN API ENDPOINTS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BASE: /api/v1/admin                                                        │
│                                                                             │
│  AUTHENTICATION                                                             │
│  ─────────────────                                                          │
│  POST   /auth/login                     # Admin login                       │
│  POST   /auth/logout                    # Admin logout                      │
│  POST   /auth/refresh                   # Refresh token                     │
│  GET    /auth/me                        # Get current admin                 │
│  POST   /auth/impersonate/:userId       # Impersonate user                  │
│  POST   /auth/stop-impersonation        # Stop impersonation                │
│                                                                             │
│  DASHBOARD                                                                  │
│  ─────────────────                                                          │
│  GET    /dashboard/stats                # KPI statistics                    │
│  GET    /dashboard/charts/:type         # Chart data                        │
│  GET    /dashboard/alerts               # System alerts                     │
│  GET    /dashboard/activity             # Recent activity                   │
│                                                                             │
│  USERS                                                                      │
│  ─────────────────                                                          │
│  GET    /users                          # List users (paginated)            │
│  GET    /users/:id                      # Get user detail                   │
│  PUT    /users/:id                      # Update user                       │
│  DELETE /users/:id                      # Delete user (soft)                │
│  POST   /users/:id/activate             # Activate user                     │
│  POST   /users/:id/deactivate           # Deactivate user                   │
│  POST   /users/:id/suspend              # Suspend user                      │
│  POST   /users/:id/reset-password       # Force password reset              │
│  POST   /users/:id/invalidate-sessions  # Invalidate all sessions           │
│  GET    /users/:id/activity             # User activity log                 │
│  GET    /users/:id/filings              # User filings                      │
│  GET    /users/:id/transactions         # User transactions                 │
│  POST   /users/bulk                     # Bulk operations                   │
│  GET    /users/export                   # Export users                      │
│                                                                             │
│  USER SEGMENTS                                                              │
│  ─────────────────                                                          │
│  GET    /users/segments                 # List segments                     │
│  POST   /users/segments                 # Create segment                    │
│  PUT    /users/segments/:id             # Update segment                    │
│  DELETE /users/segments/:id             # Delete segment                    │
│  GET    /users/segments/:id/members     # Segment members                   │
│                                                                             │
│  VERIFICATION                                                               │
│  ─────────────────                                                          │
│  GET    /verification/pending           # Pending verifications             │
│  POST   /verification/:type/:id/approve # Approve verification              │
│  POST   /verification/:type/:id/reject  # Reject verification               │
│                                                                             │
│  CAs                                                                        │
│  ─────────────────                                                          │
│  GET    /cas                            # List CAs                          │
│  GET    /cas/:id                        # Get CA detail                     │
│  PUT    /cas/:id                        # Update CA                         │
│  POST   /cas/:id/approve                # Approve CA                        │
│  POST   /cas/:id/reject                 # Reject CA                         │
│  POST   /cas/:id/suspend                # Suspend CA                        │
│  GET    /cas/:id/clients                # CA clients                        │
│  GET    /cas/:id/performance            # CA performance metrics            │
│  GET    /cas/payouts                    # Pending payouts                   │
│  POST   /cas/payouts/process            # Process payouts                   │
│                                                                             │
│  FILINGS                                                                    │
│  ─────────────────                                                          │
│  GET    /filings                        # List filings                      │
│  GET    /filings/:id                    # Get filing detail                 │
│  PUT    /filings/:id                    # Update filing                     │
│  POST   /filings/:id/reprocess          # Reprocess filing                  │
│  POST   /filings/:id/cancel             # Cancel filing                     │
│  GET    /filings/:id/audit-log          # Filing audit log                  │
│  GET    /filings/:id/documents          # Filing documents                  │
│  GET    /filings/issues                 # Filings with issues               │
│  GET    /filings/export                 # Export filings                    │
│                                                                             │
│  DOCUMENTS                                                                  │
│  ─────────────────                                                          │
│  GET    /documents                      # List documents                    │
│  GET    /documents/:id                  # Get document                      │
│  DELETE /documents/:id                  # Delete document                   │
│  POST   /documents/:id/reprocess        # Reprocess document                │
│  GET    /documents/templates            # Document templates                │
│  POST   /documents/templates            # Create template                   │
│  PUT    /documents/templates/:id        # Update template                   │
│                                                                             │
│  TRANSACTIONS                                                               │
│  ─────────────────                                                          │
│  GET    /transactions                   # List transactions                 │
│  GET    /transactions/:id               # Transaction detail                │
│  POST   /transactions/:id/refund        # Process refund                    │
│  GET    /transactions/export            # Export transactions               │
│                                                                             │
│  REFUNDS                                                                    │
│  ─────────────────                                                          │
│  GET    /refunds                        # List refund requests              │
│  POST   /refunds/:id/approve            # Approve refund                    │
│  POST   /refunds/:id/reject             # Reject refund                     │
│  POST   /refunds/:id/process            # Process refund                    │
│                                                                             │
│  PRICING                                                                    │
│  ─────────────────                                                          │
│  GET    /pricing/plans                  # List pricing plans                │
│  POST   /pricing/plans                  # Create plan                       │
│  PUT    /pricing/plans/:id              # Update plan                       │
│  DELETE /pricing/plans/:id              # Delete plan                       │
│                                                                             │
│  COUPONS                                                                    │
│  ─────────────────                                                          │
│  GET    /coupons                        # List coupons                      │
│  POST   /coupons                        # Create coupon                     │
│  PUT    /coupons/:id                    # Update coupon                     │
│  DELETE /coupons/:id                    # Delete coupon                     │
│  GET    /coupons/:id/usage              # Coupon usage stats                │
│                                                                             │
│  SUPPORT                                                                    │
│  ─────────────────                                                          │
│  GET    /support/tickets                # List tickets                      │
│  GET    /support/tickets/:id            # Get ticket                        │
│  PUT    /support/tickets/:id            # Update ticket                     │
│  POST   /support/tickets/:id/reply      # Reply to ticket                   │
│  POST   /support/tickets/:id/assign     # Assign ticket                     │
│  POST   /support/tickets/:id/close      # Close ticket                      │
│  GET    /support/tickets/stats          # Ticket statistics                 │
│                                                                             │
│  COMMUNICATIONS                                                             │
│  ─────────────────                                                          │
│  GET    /communications/campaigns       # List campaigns                    │
│  POST   /communications/campaigns       # Create campaign                   │
│  PUT    /communications/campaigns/:id   # Update campaign                   │
│  POST   /communications/campaigns/:id/send # Send campaign                  │
│  GET    /communications/campaigns/:id/stats # Campaign stats                │
│  GET    /communications/templates       # Email/SMS templates               │
│  POST   /communications/templates       # Create template                   │
│                                                                             │
│  CONTENT                                                                    │
│  ─────────────────                                                          │
│  GET    /content/pages                  # List pages                        │
│  POST   /content/pages                  # Create page                       │
│  PUT    /content/pages/:id              # Update page                       │
│  GET    /content/posts                  # List blog posts                   │
│  POST   /content/posts                  # Create post                       │
│  PUT    /content/posts/:id              # Update post                       │
│  GET    /content/media                  # List media                        │
│  POST   /content/media                  # Upload media                      │
│  DELETE /content/media/:id              # Delete media                      │
│                                                                             │
│  SETTINGS                                                                   │
│  ─────────────────                                                          │
│  GET    /settings                       # Get all settings                  │
│  PUT    /settings/:category             # Update settings category          │
│  GET    /settings/tax-config            # Tax configuration                 │
│  PUT    /settings/tax-config            # Update tax config                 │
│  GET    /settings/feature-flags         # Feature flags                     │
│  PUT    /settings/feature-flags/:key    # Update feature flag               │
│                                                                             │
│  TEAM                                                                       │
│  ─────────────────                                                          │
│  GET    /team/admins                    # List admin users                  │
│  POST   /team/admins                    # Create admin                      │
│  PUT    /team/admins/:id                # Update admin                      │
│  DELETE /team/admins/:id                # Delete admin                      │
│  GET    /team/roles                     # List roles                        │
│  POST   /team/roles                     # Create role                       │
│  PUT    /team/roles/:id                 # Update role                       │
│  DELETE /team/roles/:id                 # Delete role                       │
│  GET    /team/permissions               # List permissions                  │
│                                                                             │
│  AUDIT                                                                      │
│  ─────────────────                                                          │
│  GET    /audit/logs                     # Audit logs                        │
│  GET    /audit/security                 # Security logs                     │
│  GET    /audit/admin-activity           # Admin activity logs               │
│  GET    /audit/data-access              # Data access logs                  │
│  GET    /audit/export                   # Export audit logs                 │
│                                                                             │
│  COMPLIANCE                                                                 │
│  ─────────────────                                                          │
│  GET    /compliance/gdpr/requests       # GDPR requests                     │
│  POST   /compliance/gdpr/requests/:id/process # Process GDPR request        │
│  GET    /compliance/data-retention      # Data retention policies           │
│  PUT    /compliance/data-retention      # Update retention policy           │
│  POST   /compliance/data-retention/execute # Execute retention              │
│                                                                             │
│  SYSTEM                                                                     │
│  ─────────────────                                                          │
│  GET    /system/health                  # System health                     │
│  GET    /system/metrics                 # System metrics                    │
│  GET    /system/errors                  # Error logs                        │
│  GET    /system/jobs                    # Background jobs                   │
│  POST   /system/jobs/:id/retry          # Retry job                         │
│  GET    /system/scheduled-tasks         # Scheduled tasks                   │
│  POST   /system/cache/clear             # Clear cache                       │
│  POST   /system/maintenance/enable      # Enable maintenance mode           │
│  POST   /system/maintenance/disable     # Disable maintenance mode          │
│                                                                             │
│  ANALYTICS                                                                  │
│  ─────────────────                                                          │
│  GET    /analytics/users                # User analytics                    │
│  GET    /analytics/filings              # Filing analytics                  │
│  GET    /analytics/revenue              # Revenue analytics                 │
│  GET    /analytics/custom               # Custom reports                    │
│  POST   /analytics/reports              # Generate report                   │
│  GET    /analytics/reports/:id          # Get report                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN DASHBOARD WIREFRAME

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - EXECUTIVE VIEW                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔥 BurnBlack Admin           [🔍 Search...]    [🔔 3] [👤 Admin ▼] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────┬───────────────────────────────────────────────────────┐  │
│  │              │                                                       │  │
│  │  📊 Dashboard│  EXECUTIVE DASHBOARD                    [Today ▼]    │  │
│  │  👥 Users    │  ─────────────────────────────────────────────────── │  │
│  │  👔 CAs      │                                                       │  │
│  │  📄 Filings  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │  📁 Documents│  │   12,547   │ │    847     │ │  ₹4.2L     │ │    98.5%   │ │
│  │  💰 Finance  │  │Total Users │ │ITRs Today  │ │Revenue Today│ │  Uptime   │ │
│  │  🎫 Support  │  │ ↑ 12% MTD  │ │ ↑ 23% DoD  │ │ ↑ 18% DoD  │ │           │ │
│  │  📧 Comms    │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│  │  📝 Content  │                                                       │  │
│  │  📈 Marketing│  ┌─────────────────────────────────┐ ┌─────────────────┐ │
│  │  ⚙️ Settings │  │  FILING TRENDS                  │ │ ALERTS (3)      │ │
│  │  👥 Team     │  │  ┌───────────────────────────┐  │ │ ─────────────── │ │
│  │  📋 Audit    │  │  │     📈                    │  │ │ ⚠ High error    │ │
│  │  🖥️ System   │  │  │   /    \     /\          │  │ │   rate on OCR   │ │
│  │  🔗 Integrate│  │  │  /      \   /  \   /\    │  │ │ ⚠ 5 pending CA  │ │
│  │  📊 Analytics│  │  │ /        \_/    \_/  \   │  │ │   verifications │ │
│  │              │  │  └───────────────────────────┘  │ │ 🔴 Payment      │ │
│  │              │  │  ── ITR-1  ── ITR-2  ── ITR-3   │ │   gateway issue │ │
│  │              │  └─────────────────────────────────┘ └─────────────────┘ │
│  │              │                                                       │  │
│  │              │  ┌─────────────────────────────────┐ ┌─────────────────┐ │
│  │              │  │  REVENUE BREAKDOWN              │ │ QUICK ACTIONS   │ │
│  │              │  │  ┌───────────────────────────┐  │ │ ─────────────── │ │
│  │              │  │  │  ████████ ITR-1   45%    │  │ │ [👥 View Users] │ │
│  │              │  │  │  ██████   ITR-2   30%    │  │ │ [📄 View Filings]│ │
│  │              │  │  │  ████     ITR-3   15%    │  │ │ [🎫 Open Tickets]│ │
│  │              │  │  │  ██       ITR-4   10%    │  │ │ [⚙️ Settings]   │ │
│  │              │  │  └───────────────────────────┘  │ │                 │ │
│  │              │  └─────────────────────────────────┘ └─────────────────┘ │
│  │              │                                                       │  │
│  │              │  RECENT ACTIVITY                                       │  │
│  │              │  ─────────────────────────────────────────────────── │  │
│  │              │  • Rahul Kumar filed ITR-2 successfully    2 min ago │  │
│  │              │  • CA Priya Sharma approved                5 min ago │  │
│  │              │  • Refund processed for User #12345       10 min ago │  │
│  │              │  • New support ticket #4567               15 min ago │  │
│  │              │  [View All Activity →]                               │  │
│  │              │                                                       │  │
│  └──────────────┴───────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN DATA TABLE PATTERN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USERS - DATA TABLE VIEW                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USERS                                              [+ Add User] [Export ▼] │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [🔍 Search users...]                                                │   │
│  │                                                                     │   │
│  │ Filters: [Status ▼] [User Type ▼] [Date Range ▼] [+ Add Filter]   │   │
│  │                                                                     │   │
│  │ Active filters: [Status: Active ✕] [Type: Individual ✕] [Clear All]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☐ │ User          │ Email            │ PAN        │ Status │ Filings│ Actions │
│  ├───┼────────────────┼──────────────────┼────────────┼────────┼────────┼─────────┤
│  │ ☐ │ Rahul Kumar   │ rahul@email.com  │ ABCRK1234F │ ● Active│    3   │ ⋮      │
│  │ ☐ │ Priya Sharma  │ priya@email.com  │ PRISH5678G │ ● Active│    2   │ ⋮      │
│  │ ☐ │ Amit Patel    │ amit@email.com   │ AMTPL9012H │ ○ Inactive│  1   │ ⋮      │
│  │ ☐ │ Sneha Gupta   │ sneha@email.com  │ SNGPT3456J │ ● Active│    5   │ ⋮      │
│  │ ☐ │ Vikram Singh  │ vikram@email.com │ VKRSG7890K │ ⊘ Suspended│ 0  │ ⋮      │
│  └───┴────────────────┴──────────────────┴────────────┴────────┴────────┴─────────┘
│                                                                             │
│  ☐ 2 selected  [Bulk Actions ▼]                                            │
│                                                                             │
│  Showing 1-10 of 12,547 users     [← Previous]  1  2  3  ...  1255  [Next →]│
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ACTION MENU (⋮):                                                           │
│  ┌─────────────────────┐                                                   │
│  │ 👁️ View Details     │                                                   │
│  │ ✏️ Edit User        │                                                   │
│  │ 🔑 Reset Password   │                                                   │
│  │ 👤 Impersonate      │                                                   │
│  │ ─────────────────── │                                                   │
│  │ ✅ Activate         │                                                   │
│  │ ⏸️ Deactivate       │                                                   │
│  │ 🚫 Suspend          │                                                   │
│  │ ─────────────────── │                                                   │
│  │ 🗑️ Delete           │                                                   │
│  └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN USER DETAIL PANEL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER DETAIL - Rahul Kumar                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┬─────────────────────────────────────────────┐   │
│  │                       │                                             │   │
│  │  ┌───────────────┐    │  Rahul Kumar                    [Edit]     │   │
│  │  │               │    │  rahul.kumar@email.com                      │   │
│  │  │      👤       │    │  +91 98765 43210                           │   │
│  │  │               │    │                                             │   │
│  │  └───────────────┘    │  ─────────────────────────────────────────  │   │
│  │                       │                                             │   │
│  │  Status: ● Active     │  PAN: ABCRK1234F  ✓ Verified               │   │
│  │  Type: Individual     │  Aadhaar: ●●●● ●●●● 1234  ✓ Linked         │   │
│  │  Plan: Premium        │  Registered: 15 Jan 2024                    │   │
│  │  User ID: USR-12345   │  Last Login: 2 hours ago                    │   │
│  │                       │                                             │   │
│  └───────────────────────┴─────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Overview] [Filings] [Transactions] [Documents] [Activity] [Notes] │   │
│  │ ═══════════                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  OVERVIEW                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │       3         │ │    ₹2,500       │ │    ₹67,500      │              │
│  │  Total Filings  │ │  Total Paid     │ │  Refunds Rec'd  │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│  Recent Filings                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ITR-2 │ AY 2024-25 │ ✓ Filed │ 15 Jun 2024 │ Refund: ₹22,500 │ View │   │
│  │ ITR-2 │ AY 2023-24 │ ✓ Filed │ 20 Jul 2023 │ Refund: ₹18,000 │ View │   │
│  │ ITR-1 │ AY 2022-23 │ ✓ Filed │ 28 Jul 2022 │ Refund: ₹12,000 │ View │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Quick Actions                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │ 👤 Impersonate│ │ 📧 Send Email │ │ 🔑 Reset Pass │ │ ⏸️ Deactivate │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                             │
│  Internal Notes                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [+ Add Note]                                                        │   │
│  │                                                                     │   │
│  │ 📝 Called user regarding discrepancy - resolved      - Admin1, 2d  │   │
│  │ 📝 User requested callback for CA assistance         - Admin2, 5d  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## QUICK REFERENCE - ADMIN PANEL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL - QUICK REFERENCE                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEY MODULES                                                                │
│  ───────────                                                                │
│  • Dashboard - KPIs, alerts, activity feed                                 │
│  • Users - Directory, verification, segments                               │
│  • CAs - Verification, performance, payouts                                │
│  • Filings - Search, operations, issues                                    │
│  • Finance - Transactions, refunds, pricing, coupons                       │
│  • Support - Tickets, chat, feedback                                       │
│  • Settings - App config, tax rates, integrations, security                │
│  • Team - Admin users, roles, permissions                                  │
│  • Audit - Logs, compliance, data retention                                │
│  • System - Health, errors, jobs, maintenance                              │
│                                                                             │
│  KEY FEATURES                                                               │
│  ────────────                                                               │
│  • Role-based access control (6 roles)                                     │
│  • User impersonation (with audit)                                         │
│  • Bulk operations                                                         │
│  • Advanced filtering & search                                             │
│  • Export capabilities                                                     │
│  • Real-time monitoring                                                    │
│  • Feature flags                                                           │
│  • Audit logging                                                           │
│                                                                             │
│  FUNCTION COUNT                                                             │
│  ──────────────                                                             │
│  • Total Admin Functions: ~760+                                            │
│  • P0 Critical: ~80 functions                                              │
│  • P1 High: ~150 functions                                                 │
│  • P2 Medium: ~250 functions                                               │
│  • P3 Low: ~280 functions                                                  │
│                                                                             │
│  TECH STACK (Admin Panel)                                                   │
│  ────────────────────────                                                   │
│  • Next.js 14 (App Router)                                                 │
│  • Tailwind CSS + shadcn/ui                                                │
│  • TanStack Table (data tables)                                            │
│  • Recharts (charts)                                                       │
│  • React Query (data fetching)                                             │
│  • Zustand (state)                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

This completes the comprehensive Super Admin function inventory. 

**Summary:**
- **~760+ admin functions** across 14 major categories
- **6 admin roles** with granular permissions
- **Priority-based implementation** roadmap
- **Complete API structure** for backend
- **Admin panel code structure** for frontend

Would you like me to:
1. **Detail specific admin workflows** (e.g., CA verification flow)?
2. **Create admin panel component specifications**?
3. **Define admin API schemas** in detail?
4. **Map admin functions to database models**?

