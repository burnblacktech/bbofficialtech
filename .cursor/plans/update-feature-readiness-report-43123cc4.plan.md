---
name: User Flows Compliance Assessment
overview: ""
todos: []
---

# User Flows Compliance Assessment

## Executive Summary

**Overall Compliance: ~70%**

The codebase has strong coverage of core ITR filing flows (~90%) but gaps in authentication features, CA marketplace, and additional tools. This assessment maps each section from `docs/user-flows-enduser.md` to current implementation status.

---

## PART 1: AUTHENTICATION & ACCOUNT (~60% Complete)

### ✅ Implemented

- Email/password registration (`backend/src/routes/auth.js`)
- Email/password login
- Google OAuth (routes exist)
- Basic profile management
- Password reset functionality

### ⚠️ Partially Implemented

- Mobile OTP login/registration (backend may exist, UI unclear)
- Aadhaar linking (mentioned but not verified)
- Session management (basic exists)

### ❌ Missing

- Mobile OTP signup flow
- Aadhaar linking UI
- Two-factor authentication
- Biometric login
- Comprehensive preferences & settings UI
- Notification preferences management
- Filing preferences (default regime, auto-copy settings)
- Privacy settings UI
- Accessibility settings
- Complete session management UI

**Files to Review:**

- `frontend/src/pages/Auth/SignupPage.js`
- `frontend/src/pages/User/ProfileSettings.js`
- `backend/src/routes/auth.js`

---

## PART 2: DASHBOARD & NAVIGATION (~75% Complete)

### ✅ Implemented

- Main dashboard exists (`frontend/src/pages/Dashboard/UserDashboard.js`)
- Filing status summary
- Quick actions
- Filing history view

### ⚠️ Partially Implemented

- Notifications center (backend may exist, UI needs verification)
- Help & support (some components exist)

### ❌ Missing

- Comprehensive notifications center UI
- Notification filtering by type
- Help article search
- Video tutorials integration
- Tax glossary
- Live chat integration
- Phone support integration
- Bug reporting UI
- Feature request UI

**Files to Review:**

- `frontend/src/pages/Dashboard/UserDashboard.js`
- `frontend/src/components/Dashboard/DashboardWidgets.js`

---

## PART 3: ITR FILING - PRE-FILING (~85% Complete)

### ✅ Implemented

- ITR type selection (`frontend/src/components/ITR/ITRFormSelector.js`)
- Assessment year selection
- Form 16 upload & extraction
- AIS/26AS upload
- Document upload system
- Previous year copy (recently completed)

### ⚠️ Partially Implemented

- Data fetching from Income Tax Portal (ERI integration exists but may need UI)
- Broker statement import (capital gains has some support)

### ❌ Missing

- Complete broker statement import UI (Zerodha, Groww, Upstox, Angel One)
- Bulk document upload UI enhancements
- Upload progress visualization improvements

**Files to Review:**

- `frontend/src/pages/ITR/ITRFiling.js`
- `frontend/src/components/ITR/ITRFormSelector.js`
- `docs/reference/itr-flow-analysis.md`

---

## PART 4: ITR FILING - DATA ENTRY (~80% Complete)

### ✅ Implemented

- Personal information form
- Salary income (with HRA calculator)
- House property income (basic)
- Capital gains (with broker import support)
- Business/professional income (basic)
- All deduction sections (80C, 80D, 80CCD, etc.)
- Taxes paid entry
- Bank account details
- Foreign assets (Schedule FA)

### ⚠️ Partially Implemented

- House property (missing OCR for rent receipts, pre-construction interest UI)
- Capital gains (missing tax harvesting suggestions UI)
- Other sources income (AIS integration may be partial)

### ❌ Missing

- Advanced house property features:
- OCR for rent receipts
- Pre-construction interest detailed UI
- Capital gains tax harvesting suggestions UI
- Enhanced income breakdowns (detailed salary components UI)
- Multiple properties management UI

**Files to Review:**

- `frontend/src/features/income/`
- `frontend/src/features/deductions/`
- `frontend/src/pages/ITR/ITRComputation.js`

---

## PART 5: TAX COMPUTATION & COMPARISON (~90% Complete)

### ✅ Implemented

- Real-time tax computation (`backend/src/services/business/TaxRegimeCalculator.js`)
- Old vs New regime comparison
- Tax Optimizer (What-if analysis)
- AI-powered suggestions (recently enhanced)
- Detailed computation sheet
- Slab-wise tax calculation

### ⚠️ Partially Implemented

- Regime comparison UI (exists but may need enhancements)

### ❌ Missing

- None significant

**Files to Review:**

- `frontend/src/features/tax-optimizer/`
- `backend/src/services/business/TaxSimulationService.js`

---

## PART 6: DISCREPANCY MANAGEMENT (~85% Complete)

### ✅ Implemented

- Discrepancy detection (`frontend/src/features/discrepancy/`)
- Discrepancy resolution UI
- Filtering by section, severity, source
- Bulk resolve functionality
- Discrepancy reporting

### ⚠️ Partially Implemented

- None significant

### ❌ Missing

- None significant

**Files:**

- `frontend/src/features/discrepancy/components/DiscrepancyManager.js`
- `backend/src/models/DiscrepancyResolution.js`

---

## PART 7: REVIEW & SUBMISSION (~90% Complete)

### ✅ Implemented

- Pre-submission validation
- Review summary
- E-verification (5 methods: Aadhaar OTP, Net Banking, Demat, Bank EVC, DSC)
- Submission confirmation
- Acknowledgment receipt

### ⚠️ Partially Implemented

- Tax payment integration (Razorpay exists, UI may need verification)

### ❌ Missing

- Enhanced tax payment UI (if not complete)
- Interest calculation UI (234A/234B/234C) - backend exists

**Files:**

- `frontend/src/components/ITR/FinalActions.js`
- `frontend/src/components/ITR/EVerificationModal.js`

---

## PART 8: DRAFT MANAGEMENT (~95% Complete)

### ✅ Implemented

- Auto-save (`frontend/src/hooks/useDraftManagement.js`)
- Manual save
- Version history (`frontend/src/features/itr/components/version-history.jsx`)
- Version comparison
- Restore previous version
- Export/Import (JSON)
- PDF export
- Share draft (recently completed)

### ⚠️ Partially Implemented

- None significant

### ❌ Missing

- None significant

**Files:**

- `frontend/src/features/itr/services/draft.service.js`
- `backend/src/services/business/VersionService.js`

---

## PART 9: REFUND TRACKING (~85% Complete)

### ✅ Implemented

- Refund status tracking (`backend/src/services/business/RefundTrackingService.js`)
- Refund timeline
- Refund history
- Bank account update
- Refund re-issue request

### ⚠️ Partially Implemented

- ITD integration (mock data exists, live integration pending)

### ❌ Missing

- Live ITD refund status checking (ERI integration needed)

**Files:**

- `frontend/src/features/refund/components/refund-status.jsx`
- `backend/src/models/RefundTracking.js`

---

## PART 10: CA ASSISTANCE (B2B2C) (~40% Complete)

### ✅ Implemented

- CA dashboard (`frontend/src/pages/Dashboard/CAFirmAdminDashboard.js`)
- CA review queue (`frontend/src/pages/Firm/CAReviewQueue.js`)
- CA client management (`frontend/src/pages/CA/CAClientManagement.js`)
- Share draft for CA review (recently completed)
- CA bot (`frontend/src/components/CABot/CABot.tsx`)

### ⚠️ Partially Implemented

- Document sharing (backend may exist, UI needs verification)
- CA communication (chat may exist)

### ❌ Missing

- **CA Marketplace UI** (critical gap)
- Browse CA marketplace
- Filter CAs by location, specialization, rating, price
- View CA profile
- Send inquiry to CA
- Book consultation
- Accept CA invitation
- Payment for CA services UI
- Complete B2B2C workflow integration

**Files to Review:**

- `backend/src/routes/ca-firms.js`
- `backend/src/models/CAFirm.js`
- Need to create: `frontend/src/pages/CA/Marketplace.js`

---

## PART 11: ADDITIONAL TOOLS (~70% Complete)

### ✅ Implemented

- Tax calculators (`frontend/src/components/ITR/TaxCalculator.js`)
- Investment planning (`frontend/src/features/tools/investment-planning/`)
- 80C planner
- NPS calculator
- Health insurance planner
- Tax saving suggestions

### ⚠️ Partially Implemented

- Deadlines & reminders (`backend/src/services/business/DeadlineService.js` exists, UI needs verification)
- Knowledge base (may exist, needs verification)
- Document tools (Form 16 reader, AIS reader may exist)

### ❌ Missing

- HRA calculator (standalone)
- Advance tax calculator (standalone)
- TDS calculator (standalone)
- Rent receipt generator
- Old vs New regime calculator (standalone)
- Tax calendar UI
- Custom reminders UI
- Tax guides by topic
- Section-wise explanations
- ITR form guides
- Tax saving tips
- Latest tax news
- Video tutorials integration

**Files:**

- `frontend/src/features/tools/`
- `backend/src/controllers/ToolsController.js`

---

## CRITICAL GAPS SUMMARY

### 🔴 HIGH PRIORITY (Blocking B2B2C Flow)

1. **CA Marketplace UI** - Complete missing feature
2. **CA Inquiry & Booking System** - Client-side workflow
3. **CA Payment Integration** - For CA services

### 🟡 MEDIUM PRIORITY (User Experience)

1. **Mobile OTP Authentication** - Complete UI flow
2. **Notifications Center** - Full UI implementation
3. **Help & Support** - Complete integration
4. **Enhanced Income Features** - OCR, tax harvesting UI
5. **Additional Tools** - Calculators, knowledge base UI

### 🟢 LOW PRIORITY (Nice to Have)

1. **Accessibility Settings** - UI implementation
2. **Biometric Login** - Mobile app feature
3. **Video Tutorials** - Integration
4. **Live Chat** - Third-party integration

---

## IMPLEMENTATION PRIORITY

Based on `docs/user-flows-enduser.md` priority grouping:

### P0 - CRITICAL (MVP) - ✅ 90% Complete

- Core ITR filing flow: ✅ Complete
- Basic auth: ✅ Complete
- Tax computation: ✅ Complete
- Submission: ✅ Complete

### P1 - HIGH (Complete Individual Flow) - 🔄 75% Complete

- AIS/26AS integration: ✅ Complete
- All income sections: ⚠️ 80% (missing advanced features)
- All deductions: ✅ Complete
- Discrepancy handling: ✅ Complete
- Draft management: ✅ Complete
- Refund tracking: ✅ Complete
- Profile management: ⚠️ 60% (missing preferences)

### P2 - MEDIUM (Enhanced Experience) - 🔄 60% Complete

- Previous year copy: ✅ Complete
- Tax optimizer: ✅ Complete
- Advanced capital gains: ⚠️ 70% (missing tax harvesting UI)
- Broker statement import: ⚠️ 70%
- Version history: ✅ Complete
- Calculators & tools: ⚠️ 60% (missing some calculators)

### P3 - LOW (B2B & Advanced) - 🔄 40% Complete

- CA marketplace: ❌ Missing
- CA workflow: ⚠️ 50% (backend exists, UI incomplete)
- Multi-language: ❌ Missing
- Advanced analytics: ⚠️ Partial

---

## PHASE 1 PRIORITIES (Immediate Implementation)

### Priority 1: CA Marketplace & B2B2C Flow (Revenue Critical)

**Impact**: Unblocks B2B2C revenue stream, enables CA marketplace monetization
**Effort**: High (3-4 weeks)
**Dependencies**: Backend CA firm APIs exist

**Tasks:**

1. **CA Marketplace Browse Page**

- Create `frontend/src/pages/CA/Marketplace.js`
- CA listing grid with cards (name, rating, specialization, price)
- Filter sidebar (location, specialization, rating, price range)
- Search functionality
- Pagination

2. **CA Profile View**

- Create `frontend/src/pages/CA/CAProfile.js`
- CA details, reviews, pricing, availability
- "Send Inquiry" button
- "Book Consultation" button
- Portfolio/examples

3. **CA Inquiry & Booking System**

- Inquiry form modal/page
- Booking calendar integration
- Inquiry status tracking
- Email notifications

4. **CA Payment Integration**

- Payment flow for CA services
- Integration with existing Razorpay setup
- Invoice generation

**Files to Create:**

- `frontend/src/pages/CA/Marketplace.js`
- `frontend/src/pages/CA/CAProfile.js`
- `frontend/src/components/CA/CAInquiryModal.jsx`
- `frontend/src/components/CA/CABookingModal.jsx`
- `frontend/src/features/ca-marketplace/services/marketplace.service.js`

**Files to Review:**

- `backend/src/routes/ca-firms.js` - Verify available endpoints
- `backend/src/models/CAFirm.js` - Understand data structure

---

### Priority 2: User Preferences & Settings (User Experience)

**Impact**: Improves user retention, enables personalization
**Effort**: Medium (1-2 weeks)
**Dependencies**: None

**Tasks:**

1. **Preferences Page**

- Create `frontend/src/pages/Settings/Preferences.js`
- Filing preferences (default regime, auto-copy from previous year)
- Notification preferences (email, SMS, push)
- Privacy settings (data sharing, marketing communications)

2. **Enhanced Profile Settings**

- Enhance `frontend/src/pages/User/ProfileSettings.js`
- Add accessibility settings (high contrast, reduced motion, font size)
- Add language preference (English, Hindi)
- Session management UI

**Files to Create:**

- `frontend/src/pages/Settings/Preferences.js`
- `frontend/src/components/Settings/FilingPreferences.jsx`
- `frontend/src/components/Settings/NotificationPreferences.jsx`
- `frontend/src/components/Settings/PrivacySettings.jsx`
- `frontend/src/components/Settings/AccessibilitySettings.jsx`

**Files to Enhance:**

- `frontend/src/pages/User/ProfileSettings.js` - Add new sections

---

### Priority 3: Notifications Center (User Engagement)

**Impact**: Improves user engagement, reduces support queries
**Effort**: Medium (1-2 weeks)
**Dependencies**: Backend notification APIs (verify existence)

**Tasks:**

1. **Notifications Center Page**

- Create `frontend/src/pages/Notifications/NotificationsCenter.js`
- List all notifications
- Filter by type (filing updates, document requests, deadlines, refunds, system)
- Mark as read/unread
- Delete notifications
- Deep links to relevant pages

2. **Notification Badge Integration**

- Add notification count badge to header/nav
- Real-time updates

**Files to Create:**

- `frontend/src/pages/Notifications/NotificationsCenter.js`
- `frontend/src/components/Notifications/NotificationList.jsx`
- `frontend/src/components/Notifications/NotificationFilters.jsx`
- `frontend/src/components/Notifications/NotificationBadge.jsx`

**Files to Review:**

- Backend notification APIs (verify endpoints exist)

---

### Priority 4: Mobile OTP Authentication (User Onboarding)

**Impact**: Improves signup conversion, reduces friction
**Effort**: Medium (1 week)
**Dependencies**: OTP service integration (verify backend exists)

**Tasks:**

1. **Mobile OTP Signup Flow**

- Enhance `frontend/src/pages/Auth/SignupPage.js`
- Add mobile number input option
- OTP verification step
- Mobile-first signup flow

2. **Mobile OTP Login**

- Add mobile OTP option to login page
- OTP input and verification

**Files to Enhance:**

- `frontend/src/pages/Auth/SignupPage.js` - Add mobile OTP flow
- `frontend/src/pages/Auth/LoginPage.js` - Add mobile OTP option
- `frontend/src/components/Auth/OTPVerification.jsx` - Create reusable OTP component

**Files to Review:**

- `backend/src/routes/auth.js` - Verify mobile OTP endpoints exist

---

### Priority 5: Enhanced Income Features (Competitive Differentiation)

**Impact**: Improves user experience, competitive feature parity
**Effort**: Medium-High (2 weeks)
**Dependencies**: OCR service integration

**Tasks:**

1. **House Property OCR**

- Add OCR for rent receipts in house property form
- Auto-extract rent amount, dates, landlord details
- Manual correction UI

2. **Pre-construction Interest UI**

- Enhanced UI for pre-construction interest calculation
- Year-wise breakdown
- Amortization calculator

3. **Capital Gains Tax Harvesting**

- Add tax harvesting suggestions UI
- Show potential savings from loss set-off
- Action buttons to apply suggestions

**Files to Enhance:**

- `frontend/src/features/income/house-property/components/HousePropertyForm.js` - Add OCR upload
- `frontend/src/features/income/house-property/components/PreConstructionInterest.jsx` - Create new component
- `frontend/src/features/income/capital-gains/components/TaxHarvestingSuggestions.jsx` - Create new component

**Files to Review:**

- OCR service integration (verify if service exists)

---

### Priority 6: Help & Support Center (User Support)

**Impact**: Reduces support burden, improves self-service
**Effort**: Medium (1-2 weeks)
**Dependencies**: Content creation, knowledge base backend

**Tasks:**

1. **Help Center Page**

- Create `frontend/src/pages/Help/HelpCenter.js`
- Search help articles
- Browse FAQs by category
- Tax glossary
- Contact support (email, phone)

2. **Knowledge Base Integration**

- Section-wise tax guides
- ITR form guides
- Tax saving tips
- Video tutorials (embed)

**Files to Create:**

- `frontend/src/pages/Help/HelpCenter.js`
- `frontend/src/components/Help/HelpSearch.jsx`
- `frontend/src/components/Help/FAQList.jsx`
- `frontend/src/components/Help/TaxGlossary.jsx`
- `frontend/src/components/Help/ContactSupport.jsx`

---

## PHASE 1 IMPLEMENTATION ORDER

**Week 1-2:**

1. CA Marketplace Browse Page (Priority 1.1)
2. CA Profile View (Priority 1.2)

**Week 3-4:**

3. CA Inquiry & Booking System (Priority 1.3)
4. CA Payment Integration (Priority 1.4)

**Week 5:**

5. User Preferences Page (Priority 2.1)
6. Enhanced Profile Settings (Priority 2.2)

**Week 6:**

7. Notifications Center (Priority 3)

**Week 7:**

8. Mobile OTP Authentication (Priority 4)

**Week 8-9:**

9. Enhanced Income Features (Priority 5)

**Week 10:**

10. Help & Support Center (Priority 6)

---

## PHASE 1 PRIORITIES (Immediate Implementation)

### Priority 1: CA Marketplace & B2B2C Flow (Revenue Critical)

**Impact**: Unblocks B2B2C revenue stream, enables CA marketplace monetization
**Effort**: High (3-4 weeks)
**Dependencies**: Backend CA firm APIs exist

**Tasks:**

1. CA Marketplace Browse Page - Create listing, filters, search
2. CA Profile View - Individual CA details, reviews, booking
3. CA Inquiry & Booking System - Inquiry form, booking calendar
4. CA Payment Integration - Payment flow for CA services

**Files to Create:**

- `frontend/src/pages/CA/Marketplace.js`
- `frontend/src/pages/CA/CAProfile.js`
- `frontend/src/components/CA/CAInquiryModal.jsx`
- `frontend/src/components/CA/CABookingModal.jsx`
- `frontend/src/features/ca-marketplace/services/marketplace.service.js`

---

### Priority 2: User Preferences & Settings (User Experience)

**Impact**: Improves user retention, enables personalization
**Effort**: Medium (1-2 weeks)

**Tasks:**

1. Preferences Page - Filing, notification, privacy, accessibility settings
2. Enhanced Profile Settings - Add new preference sections

**Files to Create:**

- `frontend/src/pages/Settings/Preferences.js`
- `frontend/src/components/Settings/FilingPreferences.jsx`
- `frontend/src/components/Settings/NotificationPreferences.jsx`
- `frontend/src/components/Settings/PrivacySettings.jsx`
- `frontend/src/components/Settings/AccessibilitySettings.jsx`

---

### Priority 3: Notifications Center (User Engagement)

**Impact**: Improves user engagement, reduces support queries
**Effort**: Medium (1-2 weeks)

**Tasks:**

1. Notifications Center Page - List, filter, mark read/unread
2. Notification Badge Integration - Header badge with count

**Files to Create:**

- `frontend/src/pages/Notifications/NotificationsCenter.js`
- `frontend/src/components/Notifications/NotificationList.jsx`
- `frontend/src/components/Notifications/NotificationFilters.jsx`
- `frontend/src/components/Notifications/NotificationBadge.jsx`

---

### Priority 4: Mobile OTP Authentication (User Onboarding)

**Impact**: Improves signup conversion, reduces friction
**Effort**: Medium (1 week)

**Tasks:**

1. Mobile OTP Signup Flow - Add mobile number option to signup
2. Mobile OTP Login - Add mobile OTP option to login

**Files to Enhance:**

- `frontend/src/pages/Auth/SignupPage.js`
- `frontend/src/pages/Auth/LoginPage.js`
- `frontend/src/components/Auth/OTPVerification.jsx` (new)

---

### Priority 5: Enhanced Income Features (Competitive Differentiation)

**Impact**: Improves user experience, competitive feature parity
**Effort**: Medium-High (2 weeks)

**Tasks:**

1. House Property OCR - OCR for rent receipts
2. Pre-construction Interest UI - Enhanced calculation UI
3. Capital Gains Tax Harvesting - Suggestions UI

**Files to Enhance:**

- `frontend/src/features/income/house-property/components/HousePropertyForm.js`
- `frontend/src/features/income/house-property/components/PreConstructionInterest.jsx` (new)
- `frontend/src/features/income/capital-gains/components/TaxHarvestingSuggestions.jsx` (new)

---

### Priority 6: Help & Support Center (User Support)

**Impact**: Reduces support burden, improves self-service
**Effort**: Medium (1-2 weeks)

**Tasks:**

1. Help Center Page - Search, FAQs, glossary, contact
2. Knowledge Base Integration - Guides, tips, tutorials

**Files to Create:**

- `frontend/src/pages/Help/HelpCenter.js`
- `frontend/src/components/Help/HelpSearch.jsx`
- `frontend/src/components/Help/FAQList.jsx`
- `frontend/src/components/Help/TaxGlossary.jsx`
- `frontend/src/components/Help/ContactSupport.jsx`

---

## PHASE 1 IMPLEMENTATION ORDER

**Week 1-2:** CA Marketplace Browse & Profile (Priority 1.1-1.2)
**Week 3-4:** CA Inquiry, Booking & Payment (Priority 1.3-1.4)
**Week 5:** User Preferences & Settings (Priority 2)
**Week 6:** Notifications Center (Priority 3)
**Week 7:** Mobile OTP Authentication (Priority 4)
**Week 8-9:** Enhanced Income Features (Priority 5)
**Week 10:** Help & Support Center (Priority 6)

---

## RECOMMENDATIONS

1. **Immediate Focus**: CA Marketplace UI (blocks B2B2C revenue)
2. **Short-term**: Complete authentication features (mobile OTP, preferences)
3. **Medium-term**: Enhanced income features (OCR, tax harvesting)
4. **Long-term**: Additional tools and knowledge base

---

## FILES TO CREATE/ENHANCE

### New Files Needed

- `frontend/src/pages/CA/Marketplace.js` - CA marketplace browsing
- `frontend/src/pages/CA/CAProfile.js` - Individual CA profile view
- `frontend/src/pages/Notifications/NotificationsCenter.js` - Full notifications UI
- `frontend/src/pages/Help/HelpCenter.js` - Help & support center
- `frontend/src/pages/Settings/Preferences.js` - User preferences

### Files to Enhance

- `frontend/src/pages/Auth/SignupPage.js` - Add mobile OTP flow
- `frontend/src/pages/User/ProfileSettings.js` - Add preferences, accessibility
- `frontend/src/features/income/house-property/` - Add OCR, pre-construction interest
- `frontend/src/features/tools/` - Add missing calculators, knowledge base UI