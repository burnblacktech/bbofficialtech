---
name: UX Discrepancies Review
overview: Comprehensive UX review of the entire platform to identify and flag all design inconsistencies, non-brand color usage, typography issues, component variations, spacing problems, and accessibility gaps.
todos:
  - id: color-audit
    content: Audit all components and pages for non-brand color usage (gray-*, blue-*, green-*, purple-*, neutral-*) and create comprehensive list with file paths and line numbers
    status: completed
  - id: typography-audit
    content: Audit typography usage across platform - identify direct size usage (text-xs, text-sm, etc.) and inconsistent font weights/line-heights
    status: completed
  - id: component-audit
    content: Audit all button, input, and card components for inconsistencies - identify duplicate implementations and style variations
    status: completed
  - id: spacing-audit
    content: Audit spacing usage - identify arbitrary values and inconsistent padding/margin patterns
    status: completed
  - id: border-radius-audit
    content: Audit border radius usage - identify non-standard values (rounded-sm, rounded-md, rounded-lg) and inconsistencies
    status: completed
  - id: shadow-audit
    content: Audit shadow/elevation usage - identify non-standard shadows (shadow-sm, shadow-md, etc.) and inconsistencies
    status: completed
  - id: loading-state-audit
    content: Audit loading states across platform - identify inconsistent spinners, missing skeleton screens, and inconsistent disabled states
    status: completed
  - id: error-message-audit
    content: Audit error message display - identify inconsistent placement, styling, and missing error icons
    status: completed
  - id: accessibility-audit
    content: Audit accessibility - identify missing ARIA labels, inconsistent focus indicators, keyboard navigation issues, and color contrast problems
    status: completed
  - id: responsive-audit
    content: Audit responsive design - identify inconsistent breakpoints, mobile navigation patterns, touch target sizes, and mobile spacing issues
    status: completed
  - id: create-reports
    content: Create comprehensive UX discrepancies report, component audit report, accessibility report, and responsive design report with all findings
    status: completed
    dependencies:
      - color-audit
      - typography-audit
      - component-audit
      - spacing-audit
      - border-radius-audit
      - shadow-audit
      - loading-state-audit
      - error-message-audit
      - accessibility-audit
      - responsive-audit
---

# UX Discrepancies Review Plan

## Overview

This plan provides a systematic review of the entire platform to identify all UX discrepancies, design inconsistencies, and violations of the design system. The review will cover colors, typography, components, spacing, shadows, accessibility, and responsive design.

## Review Categories

### 1. Color System Audit

**Objective**: Identify all non-brand color usage and replace with design system colors.

**Files to Review**:

- All component files in `frontend/src/components/`
- All page files in `frontend/src/pages/`
- Layout components: `Header.js`, `Sidebar.js`, `Footer.js`

**Issues to Flag**:

- `gray-*` → Should use `slate-*`
- `blue-*` → Should use `info-*` or `primary-*`
- `green-*` → Should use `success-*`
- `purple-*` → Should use `primary-*` or `ember-*` (or remove if not needed)
- `orange-*` → Should use `ember-*`
- `neutral-*` → Should use `slate-*`
- Any hardcoded hex colors

**Expected Findings**:

- `frontend/src/components/Layout/OnboardingWizard.js` - Multiple non-brand colors
- `frontend/src/components/ITR/ITRVStatusCard.js` - `gray-*` usage (line 83-85)
- `frontend/src/components/Layout/Sidebar.js` - `gray-*` usage
- `frontend/src/components/Layout/Header.js` - `gray-*` usage
- `frontend/src/components/ITR/core/ITRFormRenderer.js` - `gray-*` usage
- `frontend/src/components/ITR/AadhaarLinking.js` - `gray-*` usage
- `frontend/src/components/ITR/DeductionBreakdown.js` - `gray-*` usage

### 2. Typography Audit

**Objective**: Identify inconsistent typography usage and standardize to design system tokens.

**Design System Tokens** (from `tailwind.config.js`):

- Headings: `text-heading-1` through `text-heading-4`
- Body: `text-body-large`, `text-body-regular`, `text-body-small`
- Special: `text-label`, `text-amount`, `text-code`

**Issues to Flag**:

- Direct size usage: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- Inconsistent font weights
- Missing line-height specifications
- Inconsistent letter-spacing

**Files to Review**:

- All component files
- All page files

### 3. Component Consistency Audit

**Objective**: Identify duplicate or inconsistent component implementations.

#### 3.1 Button Components

**Files to Review**:

- `frontend/src/components/UI/Button.js`
- `frontend/src/components/DesignSystem/components/Button.js`
- `frontend/src/components/common/Button.js`
- `frontend/src/components/ITR/PauseResumeButton.js`

**Issues to Flag**:

- Different button styles across components
- Inconsistent hover states
- Inconsistent focus states
- Inconsistent disabled states
- Inconsistent sizes
- Inconsistent variants

#### 3.2 Input Components

**Files to Review**:

- `frontend/src/components/UI/TextInput.js`
- `frontend/src/components/UI/input.js`
- `frontend/src/components/DesignSystem/components/Input.js`
- `frontend/src/components/Forms/ValidatedNumberInput.js`
- `frontend/src/components/UI/CurrencyInput/CurrencyInput.js`

**Issues to Flag**:

- Different input styles
- Inconsistent validation states
- Inconsistent error message display
- Inconsistent focus states
- Inconsistent placeholder styles

#### 3.3 Card Components

**Files to Review**:

- All components using card-like structures
- `frontend/src/components/UI/InteractiveCard.js`
- `frontend/src/components/ITR/ITRVStatusCard.js`

**Issues to Flag**:

- Inconsistent card padding
- Inconsistent card borders
- Inconsistent card shadows
- Inconsistent card hover states

### 4. Spacing Audit

**Objective**: Identify inconsistent spacing usage.

**Design System** (4px base unit):

- `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, etc.

**Issues to Flag**:

- Arbitrary spacing values
- Inconsistent padding/margin patterns
- Inconsistent gap usage in flex/grid layouts

**Files to Review**:

- All component files

### 5. Border Radius Audit

**Objective**: Standardize border radius usage.

**Design System Tokens**:

- `rounded-xl` = 12px
- `rounded-2xl` = 16px
- `rounded-3xl` = 20px

**Issues to Flag**:

- `rounded-sm`, `rounded-md`, `rounded-lg` usage
- Inconsistent radius values
- Missing radius on interactive elements

**Files to Review**:

- All component files

### 6. Shadow/Elevation Audit

**Objective**: Standardize shadow usage to elevation system.

**Design System Tokens**:

- `shadow-elevation-1` through `shadow-elevation-4`
- `shadow-gold-accent` for primary CTAs

**Issues to Flag**:

- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` usage
- Inconsistent shadow values
- Missing shadows on elevated elements

**Files to Review**:

- All component files

### 7. Loading State Audit

**Objective**: Identify inconsistent loading indicators.

**Issues to Flag**:

- Different spinner styles
- Missing skeleton screens
- Inconsistent loading text
- Inconsistent disabled states during loading

**Files to Review**:

- All components with async operations
- Form submission handlers
- Data fetching components

### 8. Error Message Audit

**Objective**: Standardize error message display.

**Issues to Flag**:

- Inconsistent error message placement
- Inconsistent error message styling
- Missing error icons
- Inconsistent validation feedback timing

**Files to Review**:

- All form components
- All input components
- Validation error displays

### 9. Accessibility Audit

**Objective**: Identify accessibility violations.

**Issues to Flag**:

- Missing ARIA labels
- Missing ARIA descriptions
- Inconsistent focus indicators
- Missing keyboard navigation
- Color contrast issues
- Missing alt text on images
- Missing form labels
- Missing error announcements

**Files to Review**:

- All interactive components
- All form components
- All navigation components

### 10. Responsive Design Audit

**Objective**: Identify responsive design inconsistencies.

**Issues to Flag**:

- Inconsistent breakpoint usage
- Inconsistent mobile navigation patterns
- Touch target sizes < 44x44px
- Inconsistent mobile spacing
- Horizontal scrolling issues
- Text readability on mobile

**Files to Review**:

- All page components
- All layout components
- All form components

## Implementation Strategy

### Phase 1: Critical Color Fixes

1. Replace all `gray-*` with `slate-*`
2. Replace all `blue-*` with `info-*` or `primary-*`
3. Replace all `green-*` with `success-*`
4. Remove or replace `purple-*` usage
5. Replace `neutral-*` with `slate-*`

### Phase 2: Typography Standardization

1. Replace direct sizes with design system tokens
2. Standardize font weights
3. Ensure consistent line-heights

### Phase 3: Component Consolidation

1. Audit all button components → consolidate to one
2. Audit all input components → consolidate to one
3. Standardize card components

### Phase 4: Design Token Standardization

1. Standardize border radius
2. Standardize shadows
3. Standardize spacing

### Phase 5: UX Polish

1. Standardize loading states
2. Standardize error messages
3. Fix accessibility issues
4. Fix responsive design issues

## Deliverables

1. **UX Discrepancies Report** (`docs/UX_DISCREPANCIES_REPORT.md`)

- Categorized list of all issues
- File paths and line numbers
- Severity ratings
- Recommended fixes

2. **Component Audit Report**

- List of duplicate components
- Recommended consolidation strategy

3. **Accessibility Report**

- WCAG compliance issues
- Screen reader compatibility issues
- Keyboard navigation issues

4. **Responsive Design Report**

- Mobile/tablet/desktop inconsistencies
- Breakpoint usage analysis

## Success Criteria

- Zero non-brand color usage
- 100% design system token usage for typography
- Single source of truth for each component type
- Consistent spacing throughout
- WCAG 2.1 AA compliance
- Responsive design consistency across all breakpoints

## Files to Create

1. `docs/UX_DISCREPANCIES_REPORT.md` - Comprehensive report of all issues
2. `docs/COMPONENT_AUDIT_REPORT.md` - Component consolidation recommendations
3. `docs/ACCESSIBILITY_REPORT.md` - Accessibility findings
4. `docs/RESPONSIVE_DESIGN_REPORT.md` - Responsive design findings

## Estimated Scope

- **Files to Review**: ~200+ component and page files
- **Issues Expected**: 500+ discrepancies
- **Time Estimate**: 2-3 days for comprehensive review
- **Fix Time**: 1-2 weeks for all fixes