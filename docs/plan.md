This plan implements a complete design system overhaul to align with docs/reference/newUI.md specifications. It includes updating all design tokens and creating/updating component library components to match the exact specifications.
Overview
The current design system has partial alignment with newUI.md, but needs comprehensive updates to match exact specifications:
Color system: Current uses #FFC300 for primary, needs to use #D4AF37 Gold system
Typography: Missing Plus Jakarta Sans display font
Spacing: Currently 8px base, needs 4px base unit
Shadows: Need exact 5-level elevation system
Animations: Need specific easing curves (ease-smooth, ease-bounce, ease-spring)
Components: Need Income Cards, updated Buttons, Forms with floating labels
Phase 1: Design Tokens Update
1.1 Color System Tokens
File: frontend/src/components/DesignSystem/tokens/colors.js
Update to match newUI.md Section 5.0:
Gold (Primary Brand): #FFF8E7 (100), #FFE4A0 (300), #D4AF37 (500), #B8960C (700), #7A6508 (900)
Yellow (Accent/Warning): #FFFDE7 (100), #FFF59D (300), #FFEB3B (500), #FBC02D (700), #F57F17 (900)
Neutral (Black to White): #0D0D0D (900), #404040 (700), #737373 (500), #A6A6A6 (300), #E5E5E5 (100), #FAFAFA (50)
Semantic Colors:
Success: #ECFDF5 (light), #10B981 (base), #065F46 (dark)
Warning: #FFF8E7 (light), #D4AF37 (base), #92750C (dark) - Uses Gold
Error: #FEF2F2 (light), #EF4444 (base), #991B1B (dark)
Info: #EFF6FF (light), #3B82F6 (base), #1E40AF (dark)
Dark Mode: Background hierarchy (#0D0D0D, #171717, #262626, #363636), Gold-400 (#E5C158) for dark mode
1.2 Typography Tokens
Files: 
frontend/src/components/DesignSystem/tokens/typography.js
frontend/tailwind.config.js
Add Plus Jakarta Sans font loading in frontend/public/index.html
Update to match newUI.md Section 6.0:
Font Stack:
Primary: Inter (existing)
Display: Plus Jakarta Sans (NEW - for headings, large numbers)
Monospace: JetBrains Mono (existing)
Type Scale (1.250 Major Third):
Display 1: 48px/56px, Plus Jakarta Sans 600
Display 2: 36px/44px, Plus Jakarta Sans 600
H1: 28px/36px, Inter 600, letter-spacing: -0.02em
H2: 24px/32px, Inter 600, letter-spacing: -0.01em
H3: 20px/28px, Inter 600
H4: 16px/24px, Inter 600
Body Large: 16px/26px, Inter 400
Body Regular: 14px/22px, Inter 400
Body Small: 12px/18px, Inter 400
Label: 12px/16px, Inter 500, Uppercase, letter-spacing: 0.05em
Amount: 20px/28px, Inter 600, tabular-nums
Code: 14px/20px, JetBrains Mono 400
1.3 Spacing Tokens
Files:
frontend/src/components/DesignSystem/tokens/spacing.js
frontend/tailwind.config.js
Update to match newUI.md Section 7.0 (4px base unit):
space-0: 0px
space-1: 4px (0.25)
space-2: 8px (0.5)
space-3: 12px (0.75)
space-4: 16px (1)
space-5: 20px (1.25)
space-6: 24px (1.5)
space-8: 32px (2)
space-10: 40px (2.5)
space-12: 48px (3)
space-16: 64px (4)
space-20: 80px (5)
space-24: 96px (6)
1.4 Elevation & Shadow System
File: frontend/tailwind.config.js
Update to match newUI.md Section 8.0 (5 elevation levels):
Level 0: shadow: none (flat/default surface)
Level 1: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06) (cards at rest)
Level 2: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) (cards hover/expanded)
Level 3: 0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.08) (dropdowns, popovers)
Level 4: 0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.10) (modals, dialogs)
Gold Accent Shadow: 0 4px 14px rgba(212, 175, 55, 0.4) (primary CTAs, selected states)
1.5 Animation & Easing Tokens
Files:
frontend/src/components/DesignSystem/tokens/animations.js
frontend/src/lib/motion.js
frontend/tailwind.config.js
Update to match newUI.md Section 9.0:
Easing Curves:
ease-smooth: cubic-bezier(0.4, 0, 0.2, 1) (most UI transitions)
ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1) (success states, celebrations)
ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275) (modals, popups)
Animation Durations:
Small (button state): 150ms
Medium (card expand): 250ms
Large (page transition): 350ms
Card expand/collapse: 300ms
Value update: 400ms
Regime switch: 500ms
1.6 Tailwind Config Update
File: frontend/tailwind.config.js
Update colors to use new Gold palette (#D4AF37) instead of current #FFC300
Update fontFamily to include Plus Jakarta Sans
Update fontSize to match newUI.md type scale
Update spacing to 4px base unit
Update boxShadow with exact elevation levels
Update transitionTimingFunction with new easing curves
Update keyframes for animations (shimmer, card expand/collapse, value update, regime switch)
Phase 2: Component Library Creation/Update
2.1 Income Card Component
New File: frontend/src/components/DesignSystem/IncomeCard.js
Implement per newUI.md Section 10.1:
Collapsed State (10.1.1):
Icon + Title (H3, Inter 600)
Amount display (20px, Inter 600, tabular-nums)
Meta text (Body Small, Gray-500)
Status badge (Complete/Warning/Incomplete/Error/Not Applicable)
Review CTA link
Padding: 24px, Border-radius: 12px, Shadow: Level 1
Hover: Border Gold-300, Shadow Level 2, translateY(-2px)
Expanded State (10.1.2):
All collapsed content
Data source banner (Info-Light background)
Data table with employer/source breakdowns
Summary section with totals
Add action links
Animation: 300ms expand with content fade-in (100ms delay)
2.2 Button Components
File: frontend/src/components/DesignSystem/components/Button.js
Update to match newUI.md Section 9.3.4:
Primary Button (Gold):
Rest: BG Gold-500 (#D4AF37), Shadow Level 1
Hover: BG Gold-600, Gold glow shadow, translateY(-1px)
Active: BG Gold-700, no shadow, translateY(1px)
Loading: BG Gold-400, spinner Gold-700, pointer-events: none
Success: BG Success-Base, checkmark scale animation
Secondary Button (Outline):
Rest: Border Black-900, transparent BG
Hover: BG Black-900 (5%), text Black-900
Active: BG Black-900 (10%)
Transitions: 150ms with ease-smooth
2.3 Form Input Components
File: frontend/src/components/DesignSystem/FormInputs.js
Update to match newUI.md Section 9.3.5:
Floating Label Animation:
Before focus: Placeholder text in input
After focus: Label slides up (translateY(-24px) scale(0.85)), 150ms ease-out
Input States:
Empty: Border Gray-300, placeholder text
Focus: Border Gold-500 (2px), shadow 0 0 0 3px rgba(212, 175, 55, 0.2)
Filled: Border Gray-300, checkmark fades in when valid
Error: Border Error-Base, shadow 0 0 0 3px rgba(239, 68, 68, 0.2), shake animation on submit (100ms, 3 iterations)
2.4 Animation Components
File: frontend/src/lib/motion.js
Update animation variants:
Card expand/collapse: 300ms with ease-smooth, content fade-in with 100ms delay
Value update: 400ms number interpolation with blur/rebound effect
Regime switch: 500ms with ease-spring, cross-fade values, ring animation
Success celebrations: 2000ms sequence (checkmark draw 0-400ms, confetti 400-800ms, content reveal 800-2000ms)
2.5 Modal/Dialog Components
File: frontend/src/components/DesignSystem/components/Modal.js
Update to match newUI.md:
Shadow: Level 4 (modal elevation)
Animation: ease-spring entrance
Backdrop: Dark overlay with blur
2.6 Toast/Notification Components
File: Create frontend/src/components/DesignSystem/Toast.js
Implement per newUI.md animation specifications:
Enter: toastEnter animation (200ms ease-smooth)
Exit: toastExit animation (200ms ease-in)
Position: Bottom-right with proper spacing
2.7 Skeleton Loading
File: frontend/src/components/DesignSystem/Skeleton.js
Update shimmer animation:
Background: linear-gradient(90deg, Gray-200 0%, Gray-100 50%, Gray-200 100%)
Animation: shimmer 1.5s infinite
Background-size: 200% 100%
Phase 3: Update Existing Components
3.1 Update SectionCard Component
File: frontend/src/components/DesignSystem/SectionCard.js
Update colors to use new Gold palette
Update status colors (Warning uses Gold-500 instead of amber)
Update shadows to use new elevation levels
Update animations to use new easing curves
3.2 Update FormInputs Component
File: frontend/src/components/DesignSystem/FormInputs.js
Implement floating label animation
Update focus border to Gold-500
Update error states to match specifications
Add shake animation for errors
3.3 Update BreathingGrid Component
File: frontend/src/components/DesignSystem/BreathingGrid.js
Update animations to use new easing curves
Update shadow transitions to new elevation levels
Ensure color usage matches new palette
3.4 Update ITR Components
Files:
frontend/src/components/ITR/DataSourceSelector.js
frontend/src/components/ITR/ITRSelectionCards.js
frontend/src/components/ITR/GuideMeQuestionnaire.js
Update color classes to use new Gold palette
Update typography to use Plus Jakarta Sans for display text
Update button styles to match new specifications
Update card shadows and hover states
Phase 4: CSS & Global Styles
4.1 Update Design System CSS
File: frontend/src/styles/design-system.css
Update CSS custom properties to match new tokens
Add Plus Jakarta Sans font-face declaration
Update color variables
Update spacing variables
Update shadow variables
4.2 Update Global Styles
File: frontend/src/index.css
Ensure Inter and Plus Jakarta Sans are loaded
Update base typography styles
Update color utilities
4.3 Add Font Loading
File: frontend/public/index.html
Add Google Fonts link for Plus Jakarta Sans:
  <link rel="preconnect" href="https://fonts.googleapis.com">  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
Phase 5: Testing & Validation
5.1 Visual Testing
Verify all colors match newUI.md hex values
Verify typography scales match specifications
Verify spacing uses 4px base unit
Verify shadows match elevation levels
Verify animations match easing curves
5.2 Component Testing
Test Income Card collapsed/expanded states
Test Button states (rest, hover, active, loading, success)
Test Form inputs with floating labels
Test Modal animations
Test Toast notifications
Test Skeleton loading shimmer
5.3 Integration Testing
Verify ITR components use new design system
Verify no visual regressions
Verify dark mode support
Verify responsive behavior
Files to Create/Modify
New Files:
frontend/src/components/DesignSystem/IncomeCard.js - Income Card component (collapsed & expanded)
frontend/src/components/DesignSystem/Toast.js - Toast notification component
Files to Update:
frontend/src/components/DesignSystem/tokens/colors.js - Gold color system
frontend/src/components/DesignSystem/tokens/typography.js - Add Plus Jakarta Sans, update scales
frontend/src/components/DesignSystem/tokens/spacing.js - 4px base unit
frontend/src/components/DesignSystem/tokens/animations.js - New easing curves
frontend/tailwind.config.js - All token updates
frontend/src/lib/motion.js - Animation variants and easing
frontend/src/components/DesignSystem/components/Button.js - Button states
frontend/src/components/DesignSystem/FormInputs.js - Floating labels, states
frontend/src/components/DesignSystem/SectionCard.js - Color and shadow updates
frontend/src/components/DesignSystem/BreathingGrid.js - Animation updates
frontend/src/components/DesignSystem/Skeleton.js - Shimmer update
frontend/src/styles/design-system.css - CSS variables
frontend/src/index.css - Global styles
frontend