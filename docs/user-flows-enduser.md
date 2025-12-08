# BurnBlack - Complete User Functions & Flows

Let me map out every user function and flow systematically.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK USER FUNCTIONS - COMPLETE INVENTORY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER TYPES                                                                 │
│  ──────────                                                                 │
│  1. Individual Filer (B2C) - New User                                       │
│  2. Individual Filer (B2C) - Returning User                                 │
│  3. CA/Professional (B2B)                                                   │
│  4. Client of CA (B2B2C)                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 1: AUTHENTICATION & ACCOUNT

> **Design Token Reminder**  
> All visual references in this document assume the Solar Gold / Ember Amber palette defined in `docs/UI.md` (primary `#FFC300`, secondary `#FF9800`), with Porcelain/Slate neutrals for surfaces and the shared semantic colors for status messaging.

### Dashboard Implementation Checklist

| Flow Reference | UI Section / Behavior | Frontend Route or Component | Notes |
|----------------|-----------------------|-----------------------------|-------|
| 2.1 Main Dashboard | Tax Impact Bar (sticky), quick stats | `apps/web/src/app/(dashboard)/dashboard/page.tsx` + `components/layout/tax-computation-bar` | Must compute both regimes via `use-tax-computation.ts` |
| 2.1/2.2 | Section cards (Personal Info, Income, Deductions, TDS, Bank) w/ Breathing Grid states | `components/layout/breathing-grid` + feature-specific cards under `features/*/components` | Each section pulls summary via React Query hooks |
| 2.3 Notifications Center | Notification drawer + deep links | `features/notifications/` (TBD) | Shares token styles with admin alerts |
| 3.x Pre-Filing Setup | Start flow (ITR type, AY, data source) | `apps/web/src/app/(filing)/start/page.tsx` | Buttons use primary/ember tokens |
| 4.x Data Entry | Section detail experience | `apps/web/src/app/(filing)/itr/[type]/[year]/page.tsx` | Ensure glance state always visible per Breathing Grid |

### Short-Term Roadmap (End-User Focus)
1. **P0:** Authentication + Dashboard (Sections 1, 2.1) – must match Solar Gold palette and share components with admin stats where applicable.
2. **P0:** Tax computation + regime comparison (Sections 5.1/5.2) – embed in `tax-computation-bar`.
3. **P1:** Filing sections prioritized by frequency – Salary, Deductions, TDS (Sections 4.2, 4.8, 4.9).
4. **P1:** Draft management + discrepancy handling (Sections 6 & 8) leveraging shared status tokens.
5. **P2:** Refund tracking + CA assistance (Sections 9 & 10) once dashboard foundation is stable.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. AUTHENTICATION & ACCOUNT MANAGEMENT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1.1 REGISTRATION                                                           │
│  ├── Sign up with email/password                                            │
│  ├── Sign up with mobile OTP                                                │
│  ├── Sign up with Google                                                    │
│  ├── PAN verification during signup                                         │
│  ├── Aadhaar linking (optional)                                             │
│  ├── Email verification                                                     │
│  ├── Mobile verification                                                    │
│  └── Accept terms & privacy policy                                          │
│                                                                             │
│  1.2 LOGIN                                                                  │
│  ├── Login with email/password                                              │
│  ├── Login with mobile OTP                                                  │
│  ├── Login with Google                                                      │
│  ├── Remember device                                                        │
│  ├── Two-factor authentication (optional)                                   │
│  └── Biometric login (mobile app - future)                                  │
│                                                                             │
│  1.3 PASSWORD MANAGEMENT                                                    │
│  ├── Forgot password                                                        │
│  ├── Reset password via email                                               │
│  ├── Reset password via mobile OTP                                          │
│  ├── Change password (logged in)                                            │
│  └── Password strength validation                                           │
│                                                                             │
│  1.4 PROFILE MANAGEMENT                                                     │
│  ├── View profile                                                           │
│  ├── Edit personal details                                                  │
│  │   ├── Name                                                               │
│  │   ├── Email                                                              │
│  │   ├── Mobile number                                                      │
│  │   ├── Address                                                            │
│  │   └── Profile photo                                                      │
│  ├── Update PAN details                                                     │
│  ├── Link/unlink Aadhaar                                                    │
│  ├── Manage linked bank accounts                                            │
│  ├── View/download previous ITRs                                            │
│  └── Delete account                                                         │
│                                                                             │
│  1.5 PREFERENCES & SETTINGS                                                 │
│  ├── Language preference (English, Hindi, regional)                         │
│  ├── Notification preferences                                               │
│  │   ├── Email notifications                                                │
│  │   ├── SMS notifications                                                  │
│  │   ├── Push notifications (app)                                           │
│  │   └── Reminder frequency                                                 │
│  ├── Filing preferences                                                     │
│  │   ├── Default regime preference                                          │
│  │   ├── Skip onboarding tour                                               │
│  │   ├── Auto-copy from previous year                                       │
│  │   └── Expert mode toggle                                                 │
│  ├── Privacy settings                                                       │
│  │   ├── Data sharing preferences                                           │
│  │   └── Marketing communications                                           │
│  └── Accessibility settings                                                 │
│      ├── High contrast mode                                                 │
│      ├── Reduced motion                                                     │
│      └── Font size adjustment                                               │
│                                                                             │
│  1.6 SESSION MANAGEMENT                                                     │
│  ├── View active sessions                                                   │
│  ├── Logout from current device                                             │
│  ├── Logout from all devices                                                │
│  └── Session timeout handling                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 2: DASHBOARD & NAVIGATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. DASHBOARD & NAVIGATION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2.1 MAIN DASHBOARD                                                         │
│  ├── View filing status summary                                             │
│  │   ├── Current year filing status                                         │
│  │   ├── Pending actions count                                              │
│  │   └── Deadline reminders                                                 │
│  ├── Quick stats                                                            │
│  │   ├── Total income (current year)                                        │
│  │   ├── Tax liability                                                      │
│  │   └── Refund status                                                      │
│  ├── Continue draft filing                                                  │
│  ├── Start new filing                                                       │
│  ├── View filing history                                                    │
│  └── Quick actions                                                          │
│      ├── Upload documents                                                   │
│      ├── Check refund status                                                │
│      └── Download ITR-V                                                     │
│                                                                             │
│  2.2 FILING HISTORY                                                         │
│  ├── View all past filings                                                  │
│  ├── Filter by assessment year                                              │
│  ├── Filter by status                                                       │
│  ├── View filing details                                                    │
│  ├── Download filed ITR                                                     │
│  ├── Download ITR-V/acknowledgment                                          │
│  ├── View computation sheet                                                 │
│  └── File revised return (if applicable)                                    │
│                                                                             │
│  2.3 NOTIFICATIONS CENTER                                                   │
│  ├── View all notifications                                                 │
│  ├── Filter by type                                                         │
│  │   ├── Filing updates                                                     │
│  │   ├── Document requests                                                  │
│  │   ├── Deadline reminders                                                 │
│  │   ├── Refund updates                                                     │
│  │   └── System announcements                                               │
│  ├── Mark as read/unread                                                    │
│  ├── Delete notifications                                                   │
│  └── Notification actions (deep links)                                      │
│                                                                             │
│  2.4 HELP & SUPPORT                                                         │
│  ├── Search help articles                                                   │
│  ├── Browse FAQs by category                                                │
│  ├── View video tutorials                                                   │
│  ├── Tax glossary                                                           │
│  ├── Contact support                                                        │
│  │   ├── Live chat                                                          │
│  │   ├── Email support                                                      │
│  │   └── Phone support                                                      │
│  ├── Report a bug                                                           │
│  └── Feature request                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 3: ITR FILING - PRE-FILING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. ITR FILING - PRE-FILING PHASE                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3.1 ITR TYPE SELECTION                                                     │
│  ├── Answer income source questionnaire                                     │
│  ├── View recommended ITR type                                              │
│  ├── See ITR type comparison                                                │
│  ├── Override recommendation (manual selection)                             │
│  └── Confirm ITR type                                                       │
│                                                                             │
│  3.2 ASSESSMENT YEAR SELECTION                                              │
│  ├── Select assessment year                                                 │
│  ├── View deadline for selected year                                        │
│  ├── Check if belated return                                                │
│  └── Check if revised return                                                │
│                                                                             │
│  3.3 DATA SOURCE SELECTION                                                  │
│  ├── Choose starting method                                                 │
│  │   ├── Upload Form 16 (recommended)                                       │
│  │   ├── Fetch from Income Tax Portal                                       │
│  │   ├── Copy from previous year                                            │
│  │   └── Start fresh (manual)                                               │
│  └── Confirm data source                                                    │
│                                                                             │
│  3.4 DOCUMENT UPLOAD                                                        │
│  ├── Upload Form 16 Part A                                                  │
│  ├── Upload Form 16 Part B                                                  │
│  ├── Upload AIS (Annual Information Statement)                              │
│  ├── Upload 26AS                                                            │
│  ├── Upload broker statements                                               │
│  │   ├── Zerodha                                                            │
│  │   ├── Groww                                                              │
│  │   ├── Upstox                                                             │
│  │   ├── Angel One                                                          │
│  │   └── Other (generic format)                                             │
│  ├── Upload bank statements                                                 │
│  ├── Upload rent receipts                                                   │
│  ├── Upload investment proofs (80C, 80D, etc.)                              │
│  ├── Bulk upload multiple documents                                         │
│  ├── View upload progress                                                   │
│  ├── View extracted data preview                                            │
│  ├── Retry failed uploads                                                   │
│  └── Delete uploaded documents                                              │
│                                                                             │
│  3.5 DATA FETCHING (API Integration)                                        │
│  ├── Connect to Income Tax Portal                                           │
│  │   ├── Enter IT Portal credentials                                        │
│  │   ├── OTP verification                                                   │
│  │   └── Authorize data fetch                                               │
│  ├── Fetch AIS data                                                         │
│  ├── Fetch 26AS data                                                        │
│  ├── Fetch pre-filled ITR data                                              │
│  ├── View fetched data summary                                              │
│  └── Refresh fetched data                                                   │
│                                                                             │
│  3.6 PREVIOUS YEAR DATA                                                     │
│  ├── Select previous year to copy from                                      │
│  ├── Preview data to be copied                                              │
│  ├── Select specific sections to copy                                       │
│  ├── Confirm copy action                                                    │
│  └── Review copied data                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 4: ITR FILING - DATA ENTRY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. ITR FILING - DATA ENTRY (BREATHING GRID)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4.1 PERSONAL INFORMATION                                                   │
│  ├── View/edit basic details                                                │
│  │   ├── Name (as per PAN)                                                  │
│  │   ├── PAN                                                                │
│  │   ├── Date of birth                                                      │
│  │   ├── Gender                                                             │
│  │   ├── Father's name                                                      │
│  │   └── Aadhaar number                                                     │
│  ├── View/edit contact details                                              │
│  │   ├── Mobile number                                                      │
│  │   ├── Email address                                                      │
│  │   └── Address (residence)                                                │
│  ├── View/edit filing status                                                │
│  │   ├── Residential status                                                 │
│  │   ├── Filing type (Original/Revised)                                     │
│  │   └── Return filing section                                              │
│  ├── Employer details (if salaried)                                         │
│  │   ├── Employer name                                                      │
│  │   ├── Employer TAN                                                       │
│  │   ├── Employer address                                                   │
│  │   └── Employer category                                                  │
│  └── Verify PAN with IT Department                                          │
│                                                                             │
│  4.2 INCOME - SALARY                                                        │
│  ├── Add salary income                                                      │
│  │   ├── Employer details                                                   │
│  │   ├── Gross salary                                                       │
│  │   ├── Basic + DA                                                         │
│  │   ├── HRA received                                                       │
│  │   ├── Other allowances                                                   │
│  │   ├── Perquisites                                                        │
│  │   ├── Profits in lieu of salary                                          │
│  │   └── Less: Standard deduction                                           │
│  ├── Edit salary breakdown                                                  │
│  ├── Add multiple employers                                                 │
│  ├── Delete salary entry                                                    │
│  ├── Calculate HRA exemption                                                │
│  │   ├── HRA received                                                       │
│  │   ├── Rent paid                                                          │
│  │   ├── City type (Metro/Non-metro)                                        │
│  │   └── View exemption calculation                                         │
│  ├── View Form 16 vs entered data comparison                                │
│  └── Resolve salary discrepancies                                           │
│                                                                             │
│  4.3 INCOME - HOUSE PROPERTY                                                │
│  ├── Add house property                                                     │
│  │   ├── Property type (Self-occupied/Let-out/Deemed let-out)               │
│  │   ├── Property address                                                   │
│  │   ├── Co-owner details (if any)                                          │
│  │   └── Ownership percentage                                               │
│  ├── For let-out property                                                   │
│  │   ├── Annual rent received                                               │
│  │   ├── Municipal taxes paid                                               │
│  │   ├── Unrealized rent                                                    │
│  │   └── Standard deduction (30%)                                           │
│  ├── Home loan interest                                                     │
│  │   ├── Lender name                                                        │
│  │   ├── Lender PAN                                                         │
│  │   ├── Interest paid                                                      │
│  │   └── Principal repayment (for 80C)                                      │
│  ├── Pre-construction interest                                              │
│  ├── Add multiple properties                                                │
│  ├── Edit property details                                                  │
│  ├── Delete property                                                        │
│  ├── Upload rent agreement                                                  │
│  └── Upload rent receipts (OCR extraction)                                  │
│                                                                             │
│  4.4 INCOME - CAPITAL GAINS                                                 │
│  ├── Add equity capital gains                                               │
│  │   ├── Short-term (listed with STT)                                       │
│  │   ├── Short-term (others)                                                │
│  │   ├── Long-term (listed with STT)                                        │
│  │   └── Long-term (others)                                                 │
│  ├── Add mutual fund capital gains                                          │
│  │   ├── Equity-oriented funds                                              │
│  │   └── Debt-oriented funds                                                │
│  ├── Add property capital gains                                             │
│  │   ├── Sale consideration                                                 │
│  │   ├── Purchase cost                                                      │
│  │   ├── Improvement cost                                                   │
│  │   ├── Transfer expenses                                                  │
│  │   ├── Indexed cost calculation                                           │
│  │   └── Exemption claimed (54, 54F, 54EC)                                  │
│  ├── Add other capital gains                                                │
│  │   ├── Gold/jewelry                                                       │
│  │   ├── Bonds/debentures                                                   │
│  │   └── Other assets                                                       │
│  ├── Import broker statement                                                │
│  ├── View transaction-wise breakdown                                        │
│  ├── Edit individual transactions                                           │
│  ├── Carry forward losses                                                   │
│  │   ├── View losses from previous years                                    │
│  │   ├── Set off against current gains                                      │
│  │   └── Calculate carry forward amount                                     │
│  ├── Resolve AIS discrepancies                                              │
│  └── Tax harvesting suggestions                                             │
│                                                                             │
│  4.5 INCOME - OTHER SOURCES                                                 │
│  ├── Add interest income                                                    │
│  │   ├── Savings account interest                                           │
│  │   ├── Fixed deposit interest                                             │
│  │   ├── Recurring deposit interest                                         │
│  │   ├── Income tax refund interest                                         │
│  │   └── Other interest                                                     │
│  ├── Add dividend income                                                    │
│  │   ├── Dividend from domestic companies                                   │
│  │   └── Dividend from foreign companies                                    │
│  ├── Add rental income (other than house property)                          │
│  ├── Add agricultural income                                                │
│  ├── Add winning from lottery/games                                         │
│  ├── Add income from other sources                                          │
│  ├── Import from AIS                                                        │
│  ├── Edit income entries                                                    │
│  ├── Delete income entries                                                  │
│  └── Resolve discrepancies with AIS/26AS                                    │
│                                                                             │
│  4.6 INCOME - BUSINESS/PROFESSION (ITR-3, ITR-4)                            │
│  ├── Business type selection                                                │
│  ├── Presumptive income (44AD/44ADA)                                        │
│  │   ├── Gross turnover/receipts                                            │
│  │   ├── Presumptive profit percentage                                      │
│  │   └── Net profit calculation                                             │
│  ├── Regular business income                                                │
│  │   ├── P&L account entry                                                  │
│  │   ├── Balance sheet entry                                                │
│  │   ├── Depreciation schedule                                              │
│  │   └── Partner's remuneration                                             │
│  ├── GST details                                                            │
│  ├── Audit details (if applicable)                                          │
│  └── Import from accounting software                                        │
│                                                                             │
│  4.7 INCOME - EXEMPT INCOME                                                 │
│  ├── Add exempt income                                                      │
│  │   ├── Agricultural income (for rate purposes)                            │
│  │   ├── Share of income from partnership                                   │
│  │   ├── Long-term capital gains (up to ₹1 lakh)                            │
│  │   ├── Dividend income (old regime)                                       │
│  │   └── Other exempt income                                                │
│  └── Verify exempt income declarations                                      │
│                                                                             │
│  4.8 DEDUCTIONS - CHAPTER VI-A                                              │
│  ├── Section 80C (₹1.5 lakh limit)                                          │
│  │   ├── Life insurance premium                                             │
│  │   ├── PPF contribution                                                   │
│  │   ├── EPF contribution (employee)                                        │
│  │   ├── ELSS investment                                                    │
│  │   ├── NSC investment                                                     │
│  │   ├── Tax saving FD                                                      │
│  │   ├── Tuition fees                                                       │
│  │   ├── Home loan principal repayment                                      │
│  │   ├── Sukanya Samriddhi                                                  │
│  │   └── Other 80C investments                                              │
│  ├── Section 80CCC (Pension fund)                                           │
│  ├── Section 80CCD                                                          │
│  │   ├── NPS employee contribution (1B)                                     │
│  │   ├── NPS employer contribution (2)                                      │
│  │   └── Additional NPS (1B - ₹50k extra)                                   │
│  ├── Section 80D (Health insurance)                                         │
│  │   ├── Self & family premium                                              │
│  │   ├── Parents premium                                                    │
│  │   ├── Preventive health checkup                                          │
│  │   └── Medical expenditure (senior citizens)                              │
│  ├── Section 80DD (Disabled dependent)                                      │
│  ├── Section 80DDB (Medical treatment)                                      │
│  ├── Section 80E (Education loan interest)                                  │
│  ├── Section 80EE/80EEA (Home loan interest - first time)                   │
│  ├── Section 80G (Donations)                                                │
│  │   ├── 100% deduction donations                                           │
│  │   ├── 50% deduction donations                                            │
│  │   ├── Donee details (Name, PAN, Address)                                 │
│  │   └── Upload donation receipts                                           │
│  ├── Section 80GG (Rent paid - no HRA)                                      │
│  ├── Section 80GGA (Scientific research donations)                          │
│  ├── Section 80GGC (Political party donations)                              │
│  ├── Section 80TTA/80TTB (Savings interest)                                 │
│  ├── Section 80U (Person with disability)                                   │
│  ├── View total deductions                                                  │
│  ├── View deduction limits and utilization                                  │
│  ├── Upload investment proofs                                               │
│  └── AI suggestions for additional deductions                               │
│                                                                             │
│  4.9 TAXES PAID                                                             │
│  ├── TDS on salary                                                          │
│  │   ├── View Form 16 TDS                                                   │
│  │   ├── Add manually                                                       │
│  │   └── Verify with 26AS                                                   │
│  ├── TDS on other income                                                    │
│  │   ├── TDS on interest                                                    │
│  │   ├── TDS on rent                                                        │
│  │   ├── TDS on professional fees                                           │
│  │   └── TDS on sale of property                                            │
│  ├── TCS (Tax Collected at Source)                                          │
│  ├── Advance tax paid                                                       │
│  │   ├── Challan details                                                    │
│  │   ├── BSR code                                                           │
│  │   ├── Date of payment                                                    │
│  │   └── Amount                                                             │
│  ├── Self-assessment tax paid                                               │
│  ├── Import from 26AS                                                       │
│  ├── Resolve TDS mismatches                                                 │
│  └── Calculate tax shortfall/excess                                         │
│                                                                             │
│  4.10 BANK ACCOUNT DETAILS                                                  │
│  ├── Add bank account                                                       │
│  │   ├── Account number                                                     │
│  │   ├── IFSC code                                                          │
│  │   ├── Bank name (auto-populated)                                         │
│  │   └── Account type                                                       │
│  ├── Verify bank account                                                    │
│  ├── Select refund account                                                  │
│  ├── Add multiple accounts                                                  │
│  ├── Edit bank details                                                      │
│  ├── Delete bank account                                                    │
│  └── Pre-validate bank account                                              │
│                                                                             │
│  4.11 FOREIGN ASSETS & INCOME (Schedule FA)                                 │
│  ├── Declare foreign bank accounts                                          │
│  ├── Declare foreign equity holdings                                        │
│  ├── Declare foreign immovable property                                     │
│  ├── Declare foreign assets other                                           │
│  ├── Foreign income details                                                 │
│  ├── DTAA benefits claimed                                                  │
│  └── Upload supporting documents                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: ITR FILING - TAX COMPUTATION & COMPARISON

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. TAX COMPUTATION & REGIME COMPARISON                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5.1 REAL-TIME TAX COMPUTATION                                              │
│  ├── View gross total income                                                │
│  ├── View total deductions                                                  │
│  ├── View taxable income                                                    │
│  ├── View tax on income                                                     │
│  ├── View surcharge (if applicable)                                         │
│  ├── View education cess                                                    │
│  ├── View total tax liability                                               │
│  ├── View taxes paid                                                        │
│  ├── View refund/tax payable                                                │
│  └── See computation update in real-time                                    │
│                                                                             │
│  5.2 REGIME COMPARISON                                                      │
│  ├── View side-by-side comparison                                           │
│  │   ├── Old regime computation                                             │
│  │   ├── New regime computation                                             │
│  │   └── Difference breakdown                                               │
│  ├── See recommended regime                                                 │
│  ├── View factors affecting recommendation                                  │
│  ├── Toggle between regimes                                                 │
│  ├── Lock regime selection                                                  │
│  └── Understand regime implications                                         │
│                                                                             │
│  5.3 TAX OPTIMIZER (What-if Analysis)                                       │
│  ├── Simulate additional 80C investment                                     │
│  ├── Simulate NPS contribution                                              │
│  ├── Simulate health insurance                                              │
│  ├── Simulate HRA optimization                                              │
│  ├── View potential savings                                                 │
│  ├── Apply simulation to actual return                                      │
│  └── Get AI-powered suggestions                                             │
│                                                                             │
│  5.4 DETAILED COMPUTATION SHEET                                             │
│  ├── View full computation breakdown                                        │
│  ├── View slab-wise tax calculation                                         │
│  ├── View rebate u/s 87A (if applicable)                                    │
│  ├── View relief u/s 89 (if applicable)                                     │
│  ├── Download computation sheet                                             │
│  └── Print computation sheet                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 6: DISCREPANCY MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. DISCREPANCY MANAGEMENT                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  6.1 DISCREPANCY DETECTION                                                  │
│  ├── View all discrepancies                                                 │
│  ├── Filter by section                                                      │
│  ├── Filter by severity (Info/Warning/Critical)                             │
│  ├── Filter by source (AIS/26AS/Form16)                                     │
│  └── View discrepancy count by section                                      │
│                                                                             │
│  6.2 DISCREPANCY RESOLUTION                                                 │
│  ├── View discrepancy details                                               │
│  │   ├── Your entered value                                                 │
│  │   ├── Source value                                                       │
│  │   └── Difference amount                                                  │
│  ├── Accept source value                                                    │
│  ├── Keep your value                                                        │
│  ├── Enter different value                                                  │
│  ├── Add explanation                                                        │
│  ├── Upload supporting document                                             │
│  ├── Mark as intentional                                                    │
│  └── Bulk resolve similar discrepancies                                     │
│                                                                             │
│  6.3 DISCREPANCY REPORTING                                                  │
│  ├── View resolution history                                                │
│  ├── Export discrepancy report                                              │
│  └── View audit trail                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 7: REVIEW & SUBMISSION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. REVIEW & SUBMISSION                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  7.1 VALIDATION & REVIEW                                                    │
│  ├── Run pre-submission validation                                          │
│  ├── View validation errors                                                 │
│  ├── View validation warnings                                               │
│  ├── Fix validation errors                                                  │
│  ├── Acknowledge warnings                                                   │
│  ├── View section-wise completion status                                    │
│  ├── Review all entered data                                                │
│  ├── Print preview of ITR                                                   │
│  └── Download draft ITR (JSON/PDF)                                          │
│                                                                             │
│  7.2 TAX PAYMENT (if payable)                                               │
│  ├── View tax payable amount                                                │
│  ├── Calculate interest u/s 234A/234B/234C                                  │
│  ├── Generate challan                                                       │
│  ├── Pay online                                                             │
│  │   ├── Net banking                                                        │
│  │   ├── Debit card                                                         │
│  │   ├── UPI                                                                │
│  │   └── NEFT/RTGS                                                          │
│  ├── Upload payment proof                                                   │
│  ├── Add challan details manually                                           │
│  └── Verify payment with 26AS                                               │
│                                                                             │
│  7.3 FINAL SUBMISSION                                                       │
│  ├── Final review summary                                                   │
│  │   ├── Total income                                                       │
│  │   ├── Total deductions                                                   │
│  │   ├── Taxable income                                                     │
│  │   ├── Tax liability                                                      │
│  │   └── Refund/Payable                                                     │
│  ├── Accept declaration                                                     │
│  ├── Confirm submission                                                     │
│  ├── E-verification options                                                 │
│  │   ├── Aadhaar OTP                                                        │
│  │   ├── Net banking                                                        │
│  │   ├── Demat account                                                      │
│  │   ├── Bank account (EVC)                                                 │
│  │   └── DSC (Digital Signature)                                            │
│  ├── Submit ITR                                                             │
│  └── View submission confirmation                                           │
│                                                                             │
│  7.4 POST-SUBMISSION                                                        │
│  ├── View acknowledgment number                                             │
│  ├── Download ITR-V                                                         │
│  ├── Download filed ITR                                                     │
│  ├── Email confirmation                                                     │
│  ├── SMS confirmation                                                       │
│  ├── Track refund status                                                    │
│  ├── View processing status                                                 │
│  └── File revised return (if needed)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 8: DRAFT MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. DRAFT MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  8.1 AUTO-SAVE                                                              │
│  ├── Auto-save every 30 seconds                                             │
│  ├── Save on field blur                                                     │
│  ├── Save on section change                                                 │
│  ├── View last saved timestamp                                              │
│  └── Recover unsaved changes                                                │
│                                                                             │
│  8.2 MANUAL SAVE                                                            │
│  ├── Save draft                                                             │
│  ├── Save with version name                                                 │
│  ├── Quick save (Ctrl+S)                                                    │
│  └── Save and exit                                                          │
│                                                                             │
│  8.3 DRAFT VERSIONS                                                         │
│  ├── View version history                                                   │
│  ├── Compare versions                                                       │
│  ├── Restore previous version                                               │
│  ├── Delete old versions                                                    │
│  └── Name/rename versions                                                   │
│                                                                             │
│  8.4 EXPORT/IMPORT                                                          │
│  ├── Export as JSON                                                         │
│  ├── Export as PDF                                                          │
│  ├── Import from JSON                                                       │
│  ├── Import from other platforms                                            │
│  └── Share draft (for CA review)                                            │
│                                                                             │
│  8.5 DRAFT CLEANUP                                                          │
│  ├── Discard draft                                                          │
│  ├── Reset section                                                          │
│  ├── Reset all data                                                         │
│  └── Confirm destructive actions                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 9: REFUND TRACKING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. REFUND TRACKING                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  9.1 REFUND STATUS                                                          │
│  ├── View expected refund amount                                            │
│  ├── View refund status                                                     │
│  │   ├── Processing                                                         │
│  │   ├── Refund issued                                                      │
│  │   ├── Refund credited                                                    │
│  │   ├── Refund failed                                                      │
│  │   └── Refund adjusted                                                    │
│  ├── View refund timeline                                                   │
│  ├── View bank account for refund                                           │
│  ├── Update bank account (if failed)                                        │
│  └── Raise refund re-issue request                                          │
│                                                                             │
│  9.2 REFUND HISTORY                                                         │
│  ├── View all past refunds                                                  │
│  ├── View refund details                                                    │
│  ├── Download refund confirmation                                           │
│  └── View interest on refund                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 10: CA ASSISTANCE (B2B2C Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  10. CA ASSISTANCE (Client Side)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  10.1 CONNECT WITH CA                                                       │
│  ├── Browse CA marketplace                                                  │
│  ├── Filter CAs by                                                          │
│  │   ├── Location                                                           │
│  │   ├── Specialization                                                     │
│  │   ├── Rating                                                             │
│  │   └── Price range                                                        │
│  ├── View CA profile                                                        │
│  ├── Send inquiry                                                           │
│  ├── Book consultation                                                      │
│  ├── Accept CA invitation                                                   │
│  └── Disconnect from CA                                                     │
│                                                                             │
│  10.2 DOCUMENT SHARING                                                      │
│  ├── View documents requested by CA                                         │
│  ├── Upload requested documents                                             │
│  ├── View shared documents                                                  │
│  ├── Revoke document access                                                 │
│  └── Receive upload reminders                                               │
│                                                                             │
│  10.3 REVIEW CA'S WORK                                                      │
│  ├── View return prepared by CA                                             │
│  ├── View section-wise summary                                              │
│  ├── Request changes                                                        │
│  ├── Ask questions (chat)                                                   │
│  ├── Approve return                                                         │
│  └── Provide e-signature                                                    │
│                                                                             │
│  10.4 PAYMENT                                                               │
│  ├── View CA fees                                                           │
│  ├── Pay CA fees                                                            │
│  ├── View payment history                                                   │
│  └── Download invoices                                                      │
│                                                                             │
│  10.5 COMMUNICATION                                                         │
│  ├── Chat with CA                                                           │
│  ├── View message history                                                   │
│  ├── Receive notifications                                                  │
│  └── Schedule call with CA                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 11: ADDITIONAL TOOLS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  11. ADDITIONAL TOOLS & UTILITIES                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  11.1 TAX CALCULATORS                                                       │
│  ├── Income tax calculator                                                  │
│  ├── HRA calculator                                                         │
│  ├── Capital gains calculator                                               │
│  ├── Advance tax calculator                                                 │
│  ├── TDS calculator                                                         │
│  ├── Rent receipt generator                                                 │
│  └── Old vs New regime calculator                                           │
│                                                                             │
│  11.2 INVESTMENT PLANNING                                                   │
│  ├── Tax saving investment suggestions                                      │
│  ├── 80C investment planner                                                 │
│  ├── NPS benefit calculator                                                 │
│  └── Health insurance planner                                               │
│                                                                             │
│  11.3 DOCUMENT TOOLS                                                        │
│  ├── Form 16 reader                                                         │
│  ├── AIS reader                                                             │
│  ├── 26AS reader                                                            │
│  ├── Rent receipt generator                                                 │
│  └── Investment declaration generator                                       │
│                                                                             │
│  11.4 DEADLINES & REMINDERS                                                 │
│  ├── View tax calendar                                                      │
│  ├── Set custom reminders                                                   │
│  ├── Advance tax due dates                                                  │
│  ├── TDS deposit dates                                                      │
│  └── ITR filing deadlines                                                   │
│                                                                             │
│  11.5 TAX KNOWLEDGE BASE                                                    │
│  ├── Tax guides by topic                                                    │
│  ├── Section-wise explanations                                              │
│  ├── ITR form guides                                                        │
│  ├── Tax saving tips                                                        │
│  ├── Latest tax news                                                        │
│  └── Video tutorials                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY: FUNCTION COUNT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FUNCTION COUNT SUMMARY                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Category                                    │ Functions                    │
│  ────────────────────────────────────────────┼──────────────────────────────│
│  1. Authentication & Account                 │ ~45                          │
│  2. Dashboard & Navigation                   │ ~30                          │
│  3. Pre-Filing (Upload, Fetch, Copy)         │ ~35                          │
│  4. Data Entry (All Sections)                │ ~150                         │
│  5. Tax Computation & Comparison             │ ~20                          │
│  6. Discrepancy Management                   │ ~15                          │
│  7. Review & Submission                      │ ~25                          │
│  8. Draft Management                         │ ~20                          │
│  9. Refund Tracking                          │ ~12                          │
│  10. CA Assistance (Client Side)             │ ~20                          │
│  11. Additional Tools                        │ ~30                          │
│  ────────────────────────────────────────────┼──────────────────────────────│
│  TOTAL ESTIMATED USER FUNCTIONS              │ ~400+                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRIORITY GROUPING FOR IMPLEMENTATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION PRIORITY                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  P0 - CRITICAL (MVP)                                                        │
│  ├── Basic auth (signup, login, logout)                                     │
│  ├── ITR type selection                                                     │
│  ├── Form 16 upload & extraction                                            │
│  ├── Personal info, Salary, Deductions (80C, 80D)                           │
│  ├── Basic tax computation                                                  │
│  ├── Regime comparison                                                      │
│  ├── Validation & submission                                                │
│  └── E-verification                                                         │
│                                                                             │
│  P1 - HIGH (Complete Individual Flow)                                       │
│  ├── AIS/26AS integration                                                   │
│  ├── House property income                                                  │
│  ├── Capital gains (equity)                                                 │
│  ├── All deduction sections                                                 │
│  ├── Discrepancy handling                                                   │
│  ├── Draft management                                                       │
│  ├── Refund tracking                                                        │
│  └── Profile management                                                     │
│                                                                             │
│  P2 - MEDIUM (Enhanced Experience)                                          │
│  ├── Previous year copy                                                     │
│  ├── Tax optimizer                                                          │
│  ├── Advanced capital gains                                                 │
│  ├── Foreign assets                                                         │
│  ├── Broker statement import                                                │
│  ├── Version history                                                        │
│  └── Calculators & tools                                                    │
│                                                                             │
│  P3 - LOW (B2B & Advanced)                                                  │
│  ├── CA marketplace                                                         │
│  ├── CA workflow                                                            │
│  ├── Business income (ITR-3)                                                │
│  ├── Multi-language                                                         │
│  └── Advanced analytics                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

This is the complete inventory of user functions. Want me to:

1. **Detail specific user flows** with screen-by-screen wireframes?
2. **Create user journey maps** for specific personas?
3. **Map functions to UI components** from the design system?
4. **Define API requirements** for each function?