# ITR Filing Flow - Complete File List

## 📋 Flow Overview

```
1. PAN Verification → 2. Person Selection → 3. Data Source Selection → 4. ITR Determination → 5. Computation
```

---

## 1️⃣ PAN VERIFICATION

### Frontend Components
- **`frontend/src/pages/ITR/PANVerification.js`**
  - Standalone PAN verification page
  - Route: `/itr/pan-verification`
  - Features: Full-screen PAN verification with SurePass API integration

- **`frontend/src/components/ITR/PANVerificationInline.js`**
  - Inline PAN verification component
  - Used in: FilingPersonSelector, personal info forms
  - Features: Compact inline verification, auto-proceed on success

- **`frontend/src/constants/panVerification.js`**
  - PAN verification constants and validation rules
  - PAN format regex patterns

### Backend Services
- **`backend/src/services/business/PANVerificationService.js`**
  - SurePass API integration service
  - PAN verification logic and response handling

- **`backend/src/routes/itr.js`** (Lines 437-615)
  - API Routes:
    - `GET /api/itr/pan/:panNumber/status` - Check PAN verification status
    - `POST /api/itr/pan/verify` - Verify PAN via SurePass

### Models/Database
- **`backend/src/models/User.js`**
  - User model with PAN fields: `panNumber`, `panVerified`, `panVerifiedAt`

- **`backend/src/models/Member.js`**
  - Family member model with PAN fields: `panNumber`, `panVerified`, `panVerifiedAt`

---

## 2️⃣ PERSON SELECTION

### Frontend Components
- **`frontend/src/components/ITR/FilingPersonSelector.js`**
  - Main person selection page
  - Route: `/itr/select-person`
  - Features:
    - Self vs Family member selection
    - PAN verification status checking
    - Inline PAN verification for self
    - Family member list with PAN status
    - Navigation to add new members

- **`frontend/src/pages/ITR/StartFiling.js`** (if exists)
  - Entry point before person selection
  - Route: `/itr/start`

### Backend Services
- **`backend/src/routes/itr.js`** (Lines 444-521)
  - `GET /api/itr/pan/:panNumber/status` - Check PAN status for user/family member

---

## 3️⃣ DATA SOURCE SELECTION

### Frontend Components
- **`frontend/src/components/ITR/DataSourceSelector.js`**
  - Data source selection page
  - Route: `/itr/data-source`
  - Features:
    - Form 16 upload
    - AIS/26AS fetch
    - Previous year copy
    - Expert/Guided mode selection
    - Auto mode options

### Services
- **`frontend/src/services/ITRAutoFillService.js`**
  - Auto-fill service for Form 16, AIS/26AS data

- **`backend/src/services/business/ITRDataPrefetchService.js`**
  - Backend service for fetching AIS, Form 26AS, ERI data

---

## 4️⃣ ITR DETERMINATION / SELECTION

### Frontend Pages

#### Mode Selection
- **`frontend/src/pages/ITR/ITRModeSelection.js`**
  - Route: `/itr/mode-selection`
  - Features: Choose between Expert, Guided, or Auto mode

#### Expert Mode (Direct Selection)
- **`frontend/src/pages/ITR/ITRDirectSelection.js`**
  - Route: `/itr/direct-selection`
  - Features: Direct ITR-1/2/3/4 selection with eligibility criteria

#### Guided Mode (Questionnaire)
- **`frontend/src/pages/ITR/IncomeSourceSelector.js`**
  - Route: `/itr/income-sources`
  - Features: Income source selection for ITR recommendation

- **`frontend/src/components/ITR/GuideMeQuestionnaire.js`**
  - 5-step questionnaire component
  - Used in: IncomeSourceSelector
  - Features: Progressive disclosure, ITR recommendation based on answers

- **`frontend/src/pages/ITR/ITRFormSelection.js`**
  - Route: `/itr/select-form`
  - Features: Smart questionnaire + ITR type recommendation

#### ITR Recommendation Components
- **`frontend/src/components/ITR/ITRFormRecommender.js`**
  - ITR recommendation component
  - Route: `/itr/recommend-form`
  - Features: AI-powered ITR type detection

- **`frontend/src/components/ITR/ITRFormSelector.js`**
  - ITR form selection modal/component
  - Used in: Various selection pages

- **`frontend/src/components/ITR/ITRSelectionCards.js`**
  - ITR type selection cards component
  - Used in: Direct selection pages

### Frontend Services
- **`frontend/src/services/ITRAutoDetector.js`**
  - Frontend service for ITR type auto-detection
  - Rules engine for ITR eligibility
  - ITR recommendation logic

### Backend Services
- **`backend/src/routes/itr.js`** (if exists)
  - `POST /api/itr/recommend-form` - Backend ITR recommendation API

### ITR Configuration Files
- **`frontend/src/components/ITR/config/ITR1Config.js`**
  - ITR-1 field definitions and structure

- **`frontend/src/components/ITR/config/ITR2Config.js`**
  - ITR-2 field definitions and structure

- **`frontend/src/components/ITR/config/ITR3Config.js`**
  - ITR-3 field definitions and structure

- **`frontend/src/components/ITR/config/ITR4Config.js`**
  - ITR-4 field definitions and structure

- **`frontend/src/components/ITR/config/ITRConfigRegistry.js`**
  - Central registry for all ITR configs

---

## 5️⃣ ITR COMPUTATION

### Main Computation Page
- **`frontend/src/pages/ITR/ITRComputation.js`**
  - Main computation page
  - Route: `/itr/computation`
  - Features:
    - Expandable sections (BreathingGrid)
    - Real-time tax computation
    - Draft saving
    - Auto-fill integration
    - Tax regime toggle
    - Validation summary

### Computation Section Component
- **`frontend/src/components/ITR/ComputationSection.js`**
  - Reusable expandable section component
  - Renders section-specific forms based on section ID
  - Handles: Personal Info, Income, Deductions, Taxes Paid, Bank Details, etc.

### Section-Specific Form Components

#### Personal Information
- **`frontend/src/features/personal-info/PersonalInfoForm.js`** (or similar)
  - Personal information form component

#### Income Forms
- **`frontend/src/features/income/salary/SalaryForm.js`**
  - Salary income form

- **`frontend/src/features/income/house-property/HousePropertyForm.js`**
  - House property income form

- **`frontend/src/features/income/capital-gains/CapitalGainsForm.js`**
  - Capital gains form

- **`frontend/src/features/income/business/components/BusinessIncomeForm.js`**
  - Business income form

- **`frontend/src/features/income/business/components/ProfessionalIncomeForm.js`**
  - Professional income form

- **`frontend/src/features/income/agricultural/components/AgriculturalIncomeForm.js`**
  - Agricultural income form

- **`frontend/src/features/income/foreign/ForeignIncomeForm.js`**
  - Foreign income form

- **`frontend/src/features/income/exempt-income/components/ExemptIncomeForm.js`**
  - Exempt income form

- **`frontend/src/features/income/other-sources/OtherSourcesForm.js`**
  - Other sources income form

- **ITR-2 Specific:**
  - **`frontend/src/features/income/ITR2IncomeForm.js`** (if exists)

- **ITR-3 Specific:**
  - **`frontend/src/features/income/business/components/balance-sheet-form.js`**
  - **`frontend/src/features/income/business/components/audit-information-form.js`**
  - **`frontend/src/features/income/ITR3IncomeForm.js`** (if exists)

- **ITR-4 Specific:**
  - **`frontend/src/features/income/ITR4IncomeForm.js`** (if exists)
  - **`frontend/src/features/income/presumptive/PresumptiveIncomeForm.js`**
  - **`frontend/src/features/income/presumptive/Section44AEForm.js`**

#### Deductions
- **`frontend/src/features/deductions/DeductionsManager.js`**
  - Deductions manager component

- **`frontend/src/components/ITR/DeductionBreakdown.js`**
  - Deduction breakdown display

#### Taxes Paid
- **`frontend/src/features/taxes-paid/TaxesPaidForm.js`**
  - Taxes paid form

#### Tax Computation
- **`frontend/src/components/ITR/TaxCalculator.js`**
  - Tax calculation component
  - Real-time tax computation display

- **`frontend/src/components/ITR/TaxComputationBar.js`**
  - Fixed tax computation summary bar

#### Bank Details
- **`frontend/src/features/bank-details/BankDetailsForm.js`**
  - Bank account details form

#### Foreign Assets
- **`frontend/src/features/foreign-assets/ScheduleFA.js`**
  - Schedule FA - Foreign assets form

#### Other Computation Components
- **`frontend/src/components/ITR/ComputationSheet.js`**
  - Alternative computation sheet view

- **`frontend/src/components/ITR/TaxRegimeToggle.js`**
  - Tax regime toggle (Old/New regime)

- **`frontend/src/components/ITR/YearSelector.js`**
  - Assessment year selector

- **`frontend/src/components/ITR/ValidationSummary.js`**
  - Form validation summary component

### Design System Components
- **`frontend/src/components/DesignSystem/BreathingGrid.js`**
  - Grid layout component for sections

- **`frontend/src/components/DesignSystem/SectionCard.js`**
  - Individual section card component

- **`frontend/src/components/DesignSystem/FixedViewportContainer.js`**
  - Fixed viewport container component

### Tax Computation Services

#### Frontend
- **`frontend/src/lib/taxEngine.js`**
  - Client-side tax computation engine
  - Supports Old/New regime
  - Agricultural income aggregation

#### Backend
- **`backend/src/services/business/TaxRegimeCalculator.js`**
  - Backend tax computation service
  - Old & New regime calculations

- **`backend/src/services/business/ITRDataPrefetchService.js`**
  - Data prefetch service for AIS, Form 26AS, ERI

### Validation & Recommendations
- **`frontend/src/components/ITR/core/ITRValidationEngine.js`**
  - ITR validation engine

- **`frontend/src/hooks/useRealTimeValidation.js`**
  - Real-time validation hook

- **`frontend/src/services/AIRecommendationEngine.js`**
  - AI recommendation service

- **`backend/src/services/business/AIRecommendationService.js`**
  - Backend AI recommendation service

### Auto-Save & Draft
- **`frontend/src/hooks/useAutoSave.js`**
  - Auto-save hook for drafts

- **`backend/src/routes/itr.js`**
  - `POST /api/itr/drafts` - Save draft
  - `GET /api/itr/drafts/:draftId` - Load draft
  - `PUT /api/itr/drafts/:draftId` - Update draft

### Export Services
- **`frontend/src/services/itrJsonExportService.js`**
  - JSON export service for ITR data

---

## 📊 Summary by Category

### **PAN Verification Flow (4 files)**
1. `frontend/src/pages/ITR/PANVerification.js`
2. `frontend/src/components/ITR/PANVerificationInline.js`
3. `backend/src/services/business/PANVerificationService.js`
4. `frontend/src/constants/panVerification.js`

### **Person Selection (2 files)**
1. `frontend/src/components/ITR/FilingPersonSelector.js`
2. `frontend/src/pages/ITR/StartFiling.js` (if exists)

### **Data Source Selection (1 file)**
1. `frontend/src/components/ITR/DataSourceSelector.js`

### **ITR Determination (10+ files)**
1. `frontend/src/pages/ITR/ITRModeSelection.js`
2. `frontend/src/pages/ITR/ITRDirectSelection.js`
3. `frontend/src/pages/ITR/IncomeSourceSelector.js`
4. `frontend/src/components/ITR/GuideMeQuestionnaire.js`
5. `frontend/src/pages/ITR/ITRFormSelection.js`
6. `frontend/src/components/ITR/ITRFormRecommender.js`
7. `frontend/src/components/ITR/ITRFormSelector.js`
8. `frontend/src/components/ITR/ITRSelectionCards.js`
9. `frontend/src/services/ITRAutoDetector.js`
10. ITR Config files (ITR1Config.js, ITR2Config.js, ITR3Config.js, ITR4Config.js, ITRConfigRegistry.js)

### **Computation Section (30+ files)**
1. **Main Page:** `frontend/src/pages/ITR/ITRComputation.js`
2. **Section Component:** `frontend/src/components/ITR/ComputationSection.js`
3. **Form Components:** 15+ income/deduction/tax forms in `frontend/src/features/`
4. **Tax Services:** `frontend/src/lib/taxEngine.js`, `backend/src/services/business/TaxRegimeCalculator.js`
5. **Validation:** `frontend/src/components/ITR/core/ITRValidationEngine.js`
6. **Design System:** BreathingGrid, SectionCard, FixedViewportContainer

---

## 🔗 Key Navigation Flow

```
/itr/select-person (FilingPersonSelector)
    ↓
/itr/data-source (DataSourceSelector)
    ↓
/itr/select-form OR /itr/direct-selection OR /itr/income-sources
    ↓
/itr/computation (ITRComputation)
    └─→ Uses ComputationSection for each section
```

---

## 📝 Notes

- **Total Files:** ~50-60 files in the complete flow
- **Most Critical:** 
  - `ITRComputation.js` - Main computation page
  - `ComputationSection.js` - Section rendering logic
  - `FilingPersonSelector.js` - Entry point
  - `DataSourceSelector.js` - Data source selection
  - `ITRFormSelection.js` / `ITRDirectSelection.js` - ITR determination

