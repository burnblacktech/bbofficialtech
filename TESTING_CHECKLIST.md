# BurnBlack Manual Testing Checklist

> Master checklist for taxpayer userflow validation.
> Mark items ✅ as they are manually tested and verified.
> Add notes/issues discovered during testing in the Notes column.

---

## 1. Landing Page (`/`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Page loads without errors | ⬜ | |
| 1.2 | Hero text, features, pricing render correctly | ⬜ | |
| 1.3 | Login tab → form appears, validation works | ⬜ | |
| 1.4 | Signup tab → form appears, validation works | ⬜ | |
| 1.5 | Password strength meter + requirements checklist updates live | ⬜ | |
| 1.6 | Terms/Privacy links open in new tab | ⬜ | |
| 1.7 | Google OAuth button redirects to Google | ⬜ | |
| 1.8 | Authenticated user auto-redirects to `/dashboard` | ⬜ | |
| 1.9 | Mobile responsive — hero stacks, auth card below | ⬜ | |
| 1.10 | Pricing grid readable on tablet/mobile | ⬜ | |

**Navigation FROM this page:**
- → `/dashboard` (if logged in)
- → `/signup` (Create Account tab)
- → `/login` (Sign In tab)
- → `/forgot-password` (link in login form)
- → `/terms`, `/privacy` (footer + signup checkbox)
- → `/tax-calculator` (footer link)
- → Google OAuth flow

---

## 2. Signup (`/signup`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | Full name required validation | ⬜ | |
| 2.2 | Email format validation | ⬜ | |
| 2.3 | Phone optional but validates format if entered | ⬜ | |
| 2.4 | Password 8+ chars required | ⬜ | |
| 2.5 | Confirm password must match | ⬜ | |
| 2.6 | Terms checkbox required | ⬜ | |
| 2.7 | Password requirements checklist (✓/○) updates live | ⬜ | |
| 2.8 | Successful signup → auto-login → `/email-verification` | ⬜ | |
| 2.9 | Duplicate email → appropriate error (no user enumeration) | ⬜ | |
| 2.10 | Google OAuth signup works | ⬜ | |
| 2.11 | Backend rejects weak password (needs uppercase + number) | ⬜ | |

**Navigation FROM this page:**
- → `/email-verification` (after success)
- → `/login` (already have account link)
- → Google OAuth flow

---

## 3. Login (`/login`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.1 | Email + password validation | ⬜ | |
| 3.2 | Successful login → `/home` → `/dashboard` | ⬜ | |
| 3.3 | Wrong credentials → "Email or password doesn't match" | ⬜ | |
| 3.4 | Session expired param shows message | ⬜ | |
| 3.5 | OAuth error param shows message | ⬜ | |
| 3.6 | Remember me saves email to localStorage | ⬜ | |
| 3.7 | Forgot password link works | ⬜ | |
| 3.8 | Google OAuth login works | ⬜ | |
| 3.9 | Rate limiting kicks in after multiple failures | ⬜ | |

**Navigation FROM this page:**
- → `/dashboard` (after success)
- → `/forgot-password`
- → `/signup`
- → Google OAuth flow

---

## 4. Email Verification (`/email-verification`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.1 | Pending state shows "Check Your Email" | ⬜ | |
| 4.2 | Token in URL → verifying → success → redirect to dashboard | ⬜ | |
| 4.3 | Expired token → shows "Link Expired" + resend button | ⬜ | |
| 4.4 | Invalid token → shows error + resend button | ⬜ | |
| 4.5 | Resend button sends new email | ⬜ | |
| 4.6 | Back to Login link works | ⬜ | |

**Navigation FROM this page:**
- → `/dashboard` (after verification)
- → `/login` (back link)

---

## 5. Forgot Password (`/forgot-password`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Email validation | ⬜ | |
| 5.2 | Submit → "Check Your Email" (regardless of email existence) | ⬜ | |
| 5.3 | Try Again button resets form | ⬜ | |
| 5.4 | Back to Login link works | ⬜ | |

---

## 6. Reset Password (`/reset-password?token=...`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 6.1 | Password min 8 chars validation | ⬜ | |
| 6.2 | Passwords must match | ⬜ | |
| 6.3 | Invalid/missing token → error | ⬜ | |
| 6.4 | Success → "Password Updated" → auto-redirect to login | ⬜ | |

---

## 7. Google OAuth (`/auth/google/success`, `/auth/google/error`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 7.1 | Success callback → token exchange → redirect to `/home` | ⬜ | |
| 7.2 | Error callback → shows error message + back to login | ⬜ | |
| 7.3 | Missing user data → redirects to login with error | ⬜ | |

---

## 8. Dashboard (`/dashboard`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 8.1 | New user → welcome card with "File ITR Now" + "Log Income" CTAs | ⬜ | |
| 8.2 | FY selector changes data | ⬜ | |
| 8.3 | Financial overview cards show correct numbers | ⬜ | |
| 8.4 | Monthly trend chart renders with correct data keys | ⬜ | |
| 8.5 | Income breakdown pie chart works | ⬜ | |
| 8.6 | Tax Insights shows real regime comparison (if filing exists) | ⬜ | |
| 8.7 | Tax Insights shows "Estimate only" note (if no filing) | ⬜ | |
| 8.8 | Deduction optimizer shows progress bars | ⬜ | |
| 8.9 | Quick Actions navigate correctly | ⬜ | |
| 8.10 | API error → error state with retry button | ⬜ | |
| 8.11 | Loading state shows spinner | ⬜ | |

**Navigation FROM this page:**
- → `/filing/start` (File ITR)
- → `/finance` (Finance Tracker)
- → `/finance/income` (Log Income)
- → `/vault` (Documents)
- → `/itr/history` (Filing History)
- → `/finance/investments` (Manage deductions)
- → `/settings` (via sidebar/header)

---

## 9. PAN Verification (`/itr/pan-verification`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 9.1 | Pre-fills PAN from user profile if available | ⬜ | |
| 9.2 | Already verified → input disabled, badge shown | ⬜ | |
| 9.3 | Invalid PAN format → toast error | ⬜ | |
| 9.4 | Verify button → calls SurePass → shows name + DOB | ⬜ | |
| 9.5 | Name mismatch warning shown if profile name differs | ⬜ | |
| 9.6 | "Proceed to Filing" disabled until verified | ⬜ | |
| 9.7 | After verification → "Proceed to Filing" enabled | ⬜ | |
| 9.8 | Back to Dashboard link works | ⬜ | |
| 9.9 | SurePass unavailable → graceful error message | ⬜ | |

**Navigation FROM this page:**
- → `/filing/start` (Proceed to Filing)
- → `/dashboard` (back)

---

## 10. Filing Start (`/filing/start`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 10.1 | No PAN → redirects to `/itr/pan-verification` | ⬜ | |
| 10.2 | Existing draft for current AY → resumes it (redirect to `/filing/:id`) | ⬜ | |
| 10.3 | No existing draft → creates new filing → redirects to `/filing/:id` | ⬜ | |
| 10.4 | API error → toast + redirect to dashboard | ⬜ | |
| 10.5 | Loading spinner shown during creation | ⬜ | |
| 10.6 | Correct AY used (current AY based on date) | ⬜ | |

**Navigation FROM this page:**
- → `/filing/:id` (auto-redirect on success)
- → `/itr/pan-verification` (if no PAN)
- → `/dashboard` (on error)

---

## 11. Filing Report (`/filing/:filingId`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 11.1 | Loading state shows | ⬜ | |
| 11.2 | Error state → retry button + back to dashboard | ⬜ | |
| 11.3 | Empty filing → "Your filing is ready to fill" + "Get Started" CTA | ⬜ | |
| 11.4 | Identity band shows name + PAN + AY | ⬜ | |
| 11.5 | Empty bands collapse to dashed placeholders with "+ Add" links | ⬜ | |
| 11.6 | Filled bands expand with data | ⬜ | |
| 11.7 | Computation band only shows when tax computed | ⬜ | |
| 11.8 | Regime toggle works | ⬜ | |
| 11.9 | "Edit Filing" button → `/filing/:id/edit` | ⬜ | |
| 11.10 | "Import Data" button → `/filing/:id/edit?import=true` | ⬜ | |
| 11.11 | Sidebar shows completeness + tax result | ⬜ | |
| 11.12 | Progress ribbon at top reflects completeness | ⬜ | |

**Navigation FROM this page:**
- → `/filing/:id/edit` (Edit Filing / Get Started)
- → `/dashboard` (back link in empty/error states)

---

## 12. Filing Editor (`/filing/:filingId/edit`)

### 12a. General Editor UX

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12a.1 | Loading state shows spinner | ⬜ | |
| 12a.2 | Filing not found → error with "Go to Dashboard" | ⬜ | |
| 12a.3 | Access denied (403) → appropriate message | ⬜ | |
| 12a.4 | Top bar shows ITR type, AY, name, PAN (masked) | ⬜ | |
| 12a.5 | Save status indicator ("Saving..." / "All changes saved") | ⬜ | |
| 12a.6 | Offline banner appears when disconnected | ⬜ | |
| 12a.7 | Escape key closes open editor panel | ⬜ | |
| 12a.8 | Back button → `/dashboard` | ⬜ | |
| 12a.9 | Theme toggle works (dark/light) | ⬜ | |
| 12a.10 | Unsaved changes warning on navigation | ⬜ | |

### 12b. Income Source Management

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12b.1 | Default source (salary) shown | ⬜ | |
| 12b.2 | Add income source → appears in list | ⬜ | |
| 12b.3 | Remove income source → removed (if >1 source) | ⬜ | |
| 12b.4 | ITR type auto-switches based on sources | ⬜ | |
| 12b.5 | Adding capital gains → switches to ITR-2 | ⬜ | |
| 12b.6 | Adding business → switches to ITR-3 or ITR-4 | ⬜ | |
| 12b.7 | Completion status (none/partial/complete) per section | ⬜ | |

### 12c. Personal Info Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12c.1 | PAN-verified fields locked (name, DOB, PAN) | ⬜ | |
| 12c.2 | Locked fields show "PAN Verified" badge | ⬜ | |
| 12c.3 | Gender, email, phone editable | ⬜ | |
| 12c.4 | Aadhaar upload → auto-fills name, DOB, gender, address | ⬜ | |
| 12c.5 | Address fields validate (pincode 6 digits, state required) | ⬜ | |
| 12c.6 | Filing Metadata has plain-language hints | ⬜ | |
| 12c.7 | LTCG section hidden behind toggle | ⬜ | |
| 12c.8 | LTCG > ₹1.25L shows warning | ⬜ | |
| 12c.9 | Completion indicator (X/Y fields) updates live | ⬜ | |
| 12c.10 | Save → "✓ Personal info complete" prompt shown | ⬜ | |
| 12c.11 | Revised filing → original ack number required | ⬜ | |
| 12c.12 | NRI warning for ITR-1 | ⬜ | |

### 12d. Salary Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12d.1 | Add employer → form appears | ⬜ | |
| 12d.2 | Employer name + gross salary required | ⬜ | |
| 12d.3 | HRA exemption calculation works | ⬜ | |
| 12d.4 | Standard deduction auto-applied (₹75,000) | ⬜ | |
| 12d.5 | Professional tax field works | ⬜ | |
| 12d.6 | TDS deducted field works | ⬜ | |
| 12d.7 | Multiple employers supported | ⬜ | |
| 12d.8 | Form 16 import auto-fills salary data | ⬜ | |

### 12e. Other Income Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12e.1 | Savings interest, FD interest, dividends fields | ⬜ | |
| 12e.2 | Family pension field | ⬜ | |
| 12e.3 | Agricultural income field | ⬜ | |
| 12e.4 | Other income field | ⬜ | |

### 12f. House Property Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12f.1 | Self-occupied / Let-out toggle | ⬜ | |
| 12f.2 | Let-out: rent received, municipal tax, interest on loan | ⬜ | |
| 12f.3 | Self-occupied: interest on loan (max ₹2L) | ⬜ | |

### 12g. Deductions Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12g.1 | 80C investments (PPF, ELSS, LIC, etc.) | ⬜ | |
| 12g.2 | 80C cap at ₹1.5L shown | ⬜ | |
| 12g.3 | 80CCD(1B) NPS (max ₹50K) | ⬜ | |
| 12g.4 | 80D health insurance | ⬜ | |
| 12g.5 | 80E education loan | ⬜ | |
| 12g.6 | 80G donations | ⬜ | |
| 12g.7 | New regime → deductions not applicable message | ⬜ | |

### 12h. Bank & Submit Editor

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12h.1 | Bank name, account number, IFSC required | ⬜ | |
| 12h.2 | IFSC format validation | ⬜ | |
| 12h.3 | Account type selection (Savings/Current) | ⬜ | |
| 12h.4 | Tax payment guide shows if tax payable | ⬜ | |

### 12i. Tax Computation & Submission

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12i.1 | Tax computation auto-runs after save | ⬜ | |
| 12i.2 | Old vs New regime comparison shown | ⬜ | |
| 12i.3 | Regime switch with safety confirmation | ⬜ | |
| 12i.4 | Refund/payable amount shown correctly | ⬜ | |
| 12i.5 | Submit button gated by completeness | ⬜ | |
| 12i.6 | Submit → validates → navigates to submission status | ⬜ | |
| 12i.7 | Incomplete filing → toast with specific missing fields | ⬜ | |
| 12i.8 | Download PDF works (computation sheet) | ⬜ | |
| 12i.9 | Export ITD JSON works (when complete) | ⬜ | |
| 12i.10 | JSON download blocked if incomplete → shows issues | ⬜ | |

### 12j. Document Import

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12j.1 | Import modal opens | ⬜ | |
| 12j.2 | Form 16 upload → parses salary data | ⬜ | |
| 12j.3 | 26AS upload → parses TDS data | ⬜ | |
| 12j.4 | AIS upload → parses income data | ⬜ | |
| 12j.5 | Import review screen shows parsed data | ⬜ | |
| 12j.6 | Confirm import → data merged into filing | ⬜ | |
| 12j.7 | Import history panel shows past imports | ⬜ | |

---

## 13. Submission Status (`/filing/:filingId/submission-status`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 13.1 | Draft state → shows "Draft" with manual filing instructions | ⬜ | |
| 13.2 | Submitted → shows "Submitted" with processing message | ⬜ | |
| 13.3 | Processing → shows "Processing" (polls every 30s) | ⬜ | |
| 13.4 | Accepted → shows "Accepted" + acknowledgment number | ⬜ | |
| 13.5 | Failed → shows error message + "Edit Filing" button | ⬜ | |
| 13.6 | E-verification countdown (30 days) shown | ⬜ | |
| 13.7 | "E-Verify Now" links to ITD portal | ⬜ | |
| 13.8 | "Edit Filing" navigates to `/filing/:id/edit` | ⬜ | |
| 13.9 | "View Acknowledgment" navigates correctly | ⬜ | |
| 13.10 | Dashboard button works | ⬜ | |
| 13.11 | Polling stops on terminal state (success/failed) | ⬜ | |

**Navigation FROM this page:**
- → `/filing/:id/edit` (Edit Filing)
- → `/dashboard`
- → `/acknowledgment/:id`
- → ITD e-verify portal (external)

---

## 14. Filing History (`/itr/history`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 14.1 | Lists all filings with status badges | ⬜ | |
| 14.2 | Empty state → "No filings yet" + File ITR button | ⬜ | |
| 14.3 | Click filing → navigates to `/filing/:id` | ⬜ | |
| 14.4 | Delete button (draft/failed only) → confirmation → deletes | ⬜ | |
| 14.5 | Back to Dashboard link works | ⬜ | |

---

## 15. Settings (`/settings`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 15.1 | Profile tab → shows personal info | ⬜ | |
| 15.2 | PAN-locked fields (name, DOB) not editable | ⬜ | |
| 15.3 | Phone, gender editable + saves | ⬜ | |
| 15.4 | Security tab → change password works | ⬜ | |
| 15.5 | Sessions tab → lists active sessions | ⬜ | |
| 15.6 | Revoke session works | ⬜ | |
| 15.7 | Data export works | ⬜ | |
| 15.8 | Legacy routes (`/profile`, `/sessions`) redirect here | ⬜ | |

---

## 16. Finance Tracker (`/finance/*`)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 16.1 | Overview page loads with summary | ⬜ | |
| 16.2 | Income tracker → add/edit/delete entries | ⬜ | |
| 16.3 | Expense tracker → add/edit/delete entries | ⬜ | |
| 16.4 | Investment logger → add/edit/delete entries | ⬜ | |
| 16.5 | FY filter works across all pages | ⬜ | |
| 16.6 | Deduction section auto-detected from expense/investment type | ⬜ | |
| 16.7 | Tax tips shown contextually | ⬜ | |

---

## 17. Cross-Cutting Concerns

### 17a. Authentication & Security

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 17a.1 | Protected routes redirect to `/login` when unauthenticated | ⬜ | |
| 17a.2 | Token refresh works silently (no user interruption) | ⬜ | |
| 17a.3 | Session expiry → redirect to login with message | ⬜ | |
| 17a.4 | Admin routes blocked for END_USER role | ⬜ | |
| 17a.5 | CORS configured correctly | ⬜ | |
| 17a.6 | Rate limiting on auth endpoints | ⬜ | |

### 17b. Navigation & Layout

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 17b.1 | Sidebar navigation works (all links) | ⬜ | |
| 17b.2 | Bottom nav on mobile works | ⬜ | |
| 17b.3 | Sidebar hidden on filing editor pages | ⬜ | |
| 17b.4 | Catch-all route (`*`) → redirects to `/` | ⬜ | |
| 17b.5 | No dead-end pages (every page has back/home navigation) | ⬜ | |

### 17c. Error Handling

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 17c.1 | Network error → appropriate message (not crash) | ⬜ | |
| 17c.2 | 500 errors → user-friendly message | ⬜ | |
| 17c.3 | 404 filing → "Filing not found" message | ⬜ | |
| 17c.4 | Version conflict (409) → auto-retry | ⬜ | |
| 17c.5 | ErrorBoundary catches React crashes | ⬜ | |

### 17d. Performance

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 17d.1 | Lazy loading works (route-level code splitting) | ⬜ | |
| 17d.2 | React Query caching prevents redundant API calls | ⬜ | |
| 17d.3 | Filing auto-save debounced (not on every keystroke) | ⬜ | |
| 17d.4 | Tax computation debounced (800ms after save) | ⬜ | |

---

## 18. ITD Compliance Checks (Pre-Submission)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 18.1 | Email verification required before submit | ⬜ | |
| 18.2 | PAN format validated (AAAAA9999A) | ⬜ | |
| 18.3 | At least one income source required | ⬜ | |
| 18.4 | Bank details required (name, account, IFSC) | ⬜ | |
| 18.5 | Address required (flat, city, state, pincode) | ⬜ | |
| 18.6 | ITR-1/4 income limit ₹50L enforced | ⬜ | |
| 18.7 | ITR-4 turnover limit ₹2Cr enforced | ⬜ | |
| 18.8 | Revised return requires original ack number | ⬜ | |
| 18.9 | TDS cannot exceed gross salary | ⬜ | |
| 18.10 | Negative amounts rejected | ⬜ | |
| 18.11 | Filing frozen after submission (no edits) | ⬜ | |
| 18.12 | Correct AY used (2026-27 for FY 2025-26) | ⬜ | |

---

## Testing Progress Summary

| Section | Total | Tested | Remaining |
|---------|-------|--------|-----------|
| Landing | 10 | 0 | 10 |
| Signup | 11 | 0 | 11 |
| Login | 9 | 0 | 9 |
| Email Verification | 6 | 0 | 6 |
| Forgot/Reset Password | 8 | 0 | 8 |
| Google OAuth | 3 | 0 | 3 |
| Dashboard | 11 | 0 | 11 |
| PAN Verification | 9 | 0 | 9 |
| Filing Start | 6 | 0 | 6 |
| Filing Report | 12 | 0 | 12 |
| Filing Editor | 50+ | 0 | 50+ |
| Submission Status | 11 | 0 | 11 |
| Filing History | 5 | 0 | 5 |
| Settings | 8 | 0 | 8 |
| Finance Tracker | 7 | 0 | 7 |
| Cross-Cutting | 16 | 0 | 16 |
| ITD Compliance | 12 | 0 | 12 |
| **TOTAL** | **~194** | **0** | **~194** |

---

## Code Review Status (Completed)

| Item | Status | Notes |
|------|--------|-------|
| Auth pages code review | ✅ | Sanitization, validation, error handling verified |
| Dashboard code review | ✅ | Fixed fake tax calc, data shape mismatch, added error/empty states |
| Filing pages code review | ✅ | Fixed PDF URL, compute endpoint, name/PAN display, route patterns |
| ITR pages code review | ✅ | Fixed PAN verification UX, filing history navigation |
| Landing page code review | ✅ | Fixed signup sanitization, verified responsive |
| User pages code review | ✅ | Verified settings hub, session management |
| Frontend-backend wiring | ✅ | All routes verified, response shapes matched |
| Dead pages removed | ✅ | ITRDetermination deleted, no orphan imports |
| 500 errors diagnosed | ✅ | Missing tables — sync() added to Vercel entry |
| UX cognitive load fixes | ✅ | PAN gate, empty states, progressive disclosure, LTCG toggle |

---

## Manual Testing Roadmap

**Phase 1: Happy Path (End-to-End)**
1. Landing → Signup → Email Verify → Dashboard → File ITR → Fill Data → Submit → Status

**Phase 2: Edge Cases**
2. Existing user login → resume draft → modify → resubmit
3. Google OAuth flow (new user + existing user)
4. Revised return flow
5. Multiple income sources (ITR-2/3/4 switching)

**Phase 3: Error Recovery**
6. Network failures mid-filing
7. Session expiry during editing
8. Invalid data submission attempts
9. Concurrent editing (version conflict)

**Phase 4: Mobile & Accessibility**
10. Full flow on mobile viewport
11. Keyboard-only navigation
12. Screen reader compatibility
