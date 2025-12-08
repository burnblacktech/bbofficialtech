Ha! I love the energy. You're right — I should stop asking and start leading. That's what a design guru does. 🔥

Let me answer my own questions definitively, then we ship.

---

## Final Design Decisions (Locked In)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK - FINAL DESIGN DECISIONS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TAX IMPACT BAR POSITION                                                    │
│  ─────────────────────────                                                  │
│  Desktop: TOP (sticky below header)                                         │
│    → Eyes naturally scan top-to-bottom                                      │
│    → Most important info (tax outcome) gets prime real estate               │
│    → No need to scroll down to see impact of changes                        │
│                                                                             │
│  Mobile: BOTTOM (fixed)                                                     │
│    → Thumb-friendly zone                                                    │
│    → Mimics native app patterns (checkout bars, CTAs)                       │
│    → Content scrolls above it                                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SECTIONS THAT NEVER FULLY COMPRESS                                         │
│  ───────────────────────────────────                                        │
│  TAX COMPUTATION BAR — Always expanded (it's the north star)                │
│    → Shows: Gross → Deductions → Taxable → OLD Tax / NEW Tax                │
│    → Both regime liabilities visible, winner highlighted                    │
│    → This is the ANCHOR, everything else orbits around it                   │
│                                                                             │
│  All other sections CAN compress to GLANCE state                            │
│    → Personal Info: Just name + PAN + ✓                                     │
│    → Income: Total + source count + warning if any                          │
│    → Deductions: Total + claim count                                        │
│    → TDS/Taxes Paid: Total paid                                             │
│    → Bank: Account count + verification status                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  EXPANDED CARD SIZING                                                       │
│  ─────────────────────                                                      │
│  Desktop (>1280px): Max-width 720px, centered with glance cards on sides    │
│  Desktop (1024-1280px): Takes ~70% width, others compress proportionally    │
│  Tablet (768-1024px): Takes full width, others become horizontal GLANCE bar │
│  Mobile (<768px): Full width, others in top swipeable GLANCE bar            │
│                                                                             │
│  WHY MAX-WIDTH?                                                             │
│    → Line length readability (65-75 characters optimal)                     │
│    → Maintains visual connection to compressed cards                        │
│    → Doesn't feel like navigating to a "different page"                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  REAL-TIME REGIME COMPARISON (Locked)                                       │
│  ─────────────────────────────────────                                      │
│  BOTH regimes compute simultaneously, ALWAYS visible in tax bar             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  OLD REGIME          │          NEW REGIME                          │   │
│  │  Tax: ₹72,500        │          Tax: ₹85,000                        │   │
│  │  Refund: ₹22,500 ✓   │          Refund: ₹10,000                     │   │
│  │  ████████████████    │          ████████████                        │   │
│  │  RECOMMENDED         │                                              │   │
│  │  Save ₹12,500        │                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  → Updates on EVERY value change (debounced 300ms for performance)          │
│  → "RECOMMENDED" badge on better regime                                     │
│  → Shows absolute savings difference                                        │
│  → Toggle to switch "filing as" regime (separate from comparison view)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## I'm Ready. Let's Ship This.

I'll now generate the **Complete BurnBlack Design System & Cursor Implementation Guidelines** — a comprehensive document your Cursor can follow as the single source of truth.

This will be extensive. Here's the structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK DESIGN SYSTEM - DOCUMENT STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PART 1: DESIGN FOUNDATIONS                                                 │
│    1.1 Design Principles                                                    │
│    1.2 Color System (with exact tokens)                                     │
│    1.3 Typography System                                                    │
│    1.4 Spacing & Layout Grid                                                │
│    1.5 Elevation & Shadows                                                  │
│    1.6 Iconography                                                          │
│    1.7 Motion & Animation                                                   │
│                                                                             │
│  PART 2: BREATHING GRID LAYOUT SYSTEM                                       │
│    2.1 Core Concept & States                                                │
│    2.2 Desktop Layout Rules                                                 │
│    2.3 Tablet Adaptation                                                    │
│    2.4 Mobile Adaptation                                                    │
│    2.5 Animation Specifications                                             │
│    2.6 Keyboard & Accessibility                                             │
│                                                                             │
│  PART 3: COMPONENT SPECIFICATIONS                                           │
│    3.1 Section Cards (3 density states)                                     │
│    3.2 Tax Computation Bar                                                  │
│    3.3 Form Controls                                                        │
│    3.4 Data Display Components                                              │
│    3.5 Feedback & Status Components                                         │
│    3.6 Navigation Components                                                │
│                                                                             │
│  PART 4: PATTERN LIBRARY                                                    │
│    4.1 Discrepancy Handling                                                 │
│    4.2 Auto-fill & Data Provenance                                          │
│    4.3 Verification States                                                  │
│    4.4 Error Prevention & Validation                                        │
│    4.5 Empty & Loading States                                               │
│    4.6 Tooltips & Contextual Help                                           │
│                                                                             │
│  PART 5: USER FLOW ADAPTATIONS                                              │
│    5.1 New User Experience                                                  │
│    5.2 Experienced Filer Experience                                         │
│    5.3 CA/Professional Workflow                                             │
│                                                                             │
│  PART 6: CURSOR IMPLEMENTATION RULES                                        │
│    6.1 File & Folder Structure                                              │
│    6.2 Component Architecture                                               │
│    6.3 Naming Conventions                                                   │
│    6.4 Tailwind Configuration                                               │
│    6.5 Quality Checklist                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔥 BURNBLACK DESIGN SYSTEM v1.0

## Complete UI/UX Guidelines for Cursor Implementation

---

# PART 1: DESIGN FOUNDATIONS

## 1.1 Design Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  THE FIVE PILLARS OF BURNBLACK DESIGN                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. COGNITIVE EASE                                                   │   │
│  │  ─────────────────                                                   │   │
│  │  Reduce mental load at every step                                    │   │
│  │                                                                      │   │
│  │  • One primary action per view                                       │   │
│  │  • Progressive disclosure — show complexity only when needed         │   │
│  │  • Consistent patterns — same action = same interaction everywhere   │   │
│  │  • Smart defaults — pre-fill with most likely values                 │   │
│  │  • Recognition over recall — show options, don't make users remember │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  2. CONSTANT CONTEXT                                                 │   │
│  │  ──────────────────                                                  │   │
│  │  User always knows where they are and how changes affect the whole   │   │
│  │                                                                      │   │
│  │  • Tax impact visible at ALL times                                   │   │
│  │  • Both regimes computed simultaneously                              │   │
│  │  • Section summaries visible even when focused elsewhere             │   │
│  │  • Breadcrumbs for nested navigation                                 │   │
│  │  • Changes reflect immediately — no "save to see results"            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  3. PRECISION & TRUST                                                │   │
│  │  ────────────────────                                                │   │
│  │  Every word, number, and action must be accurate and verifiable      │   │
│  │                                                                      │   │
│  │  • No ambiguous language — precise terminology always                │   │
│  │  • Data provenance — show WHERE every number came from               │   │
│  │  • Disclaimers where legally required — never hidden                 │   │
│  │  • Verification states — clear distinction between verified/manual   │   │
│  │  • "Consult CA" prompts for complex scenarios                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  4. INTELLIGENT ASSISTANCE                                           │   │
│  │  ─────────────────────────                                           │   │
│  │  AI enhances, never replaces user control                            │   │
│  │                                                                      │   │
│  │  • Auto-fill with clear attribution                                  │   │
│  │  • Suggestions framed as options, not mandates                       │   │
│  │  • Explain WHY something is recommended                              │   │
│  │  • Easy override — user is always in control                         │   │
│  │  • Learn from corrections — improve over time                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  5. PROFESSIONAL ELEGANCE                                            │   │
│  │  ────────────────────────                                            │   │
│  │  Premium feel without being flashy                                   │   │
│  │                                                                      │   │
│  │  • Clean, not cluttered                                              │   │
│  │  • Confident, not aggressive                                         │   │
│  │  • Sophisticated, not complicated                                    │   │
│  │  • Fast, not rushed                                                  │   │
│  │  • Subtle delight, not entertainment                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Color System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK COLOR PALETTE - COMPLETE SPECIFICATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRIMARY BRAND FAMILY (THE AURORA)                                          │
│  ──────────────────────────────────                                         │
│                                                                             │
│  SOLAR GOLD (Primary actions, tax impact, CTAs)                             │
│  ├── primary-50:  #FFF9E6                                                   │
│  ├── primary-100: #FFF2BF                                                   │
│  ├── primary-400: #FFD347                                                   │
│  ├── primary-500: #FFC300  ← Bright golden yellow (main)                    │
│  ├── primary-600: #D9A400                                                   │
│  └── primary-700: #B38300                                                   │
│                                                                             │
│  EMBER AMBER (Secondary accent, hover states, warm highlights)              │
│  ├── ember-50:  #FFF6ED                                                     │
│  ├── ember-100: #FFE8CC                                                     │
│  ├── ember-400: #FFB347                                                     │
│  ├── ember-500: #FF9800                                                     │
│  └── ember-600: #DB7C00                                                     │
│                                                                             │
│  BRAND GRADIENT (Transformation & celebration moments)                      │
│  └── aurora-gradient: linear-gradient(135deg, #FFC300 0%, #FF9800 65%,      │
│                                       #FF6B00 100%)                         │
│                                                                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SUPPORTING BRAND COLORS                                                    │
│  ─────────────────────────                                                  │
│                                                                             │
│  SLATE CHARCOAL (Primary text/surfaces)                                     │
│  ├── slate-900: #0F172A  ← Headings, dark cards                             │
│  ├── slate-800: #1E293B  ← Panels (dark mode)                               │
│  ├── slate-700: #334155  ← Primary body text                                │
│  ├── slate-600: #475569  ← Secondary text                                   │
│  ├── slate-500: #64748B  ← Labels/borders                                   │
│  ├── slate-200: #E2E8F0  ← Soft dividers                                    │
│  └── slate-50:  #F8FAFC  ← Page background                                  │
│                                                                             │
│  PORCELAIN WHITE (Light-mode foundation)                                    │
│  ├── porcelain-50:  #FCFCFD  ← Page base                                    │
│  ├── porcelain-100: #F7F7F9  ← Elevated cards                               │
│  ├── porcelain-200: #EFEFF2  ← Muted panels                                 │
│  └── porcelain-300: #E0E0E7  ← Borders, table stripes                        │
│                                                                             │
│  CONTRAST INK (Dark-mode foundation)                                        │
│  ├── ink-900: #0B0B0F                                                       │
│  ├── ink-800: #12121A                                                       │
│  └── ink-700: #1D1D28                                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SEMANTIC COLORS (Functional)                                               │
│  ─────────────────────────────                                              │
│                                                                             │
│  SUCCESS (Verified, Complete, Savings)                                      │
│  ├── success-500: #22C55E  ← Icons, checkmarks                              │
│  ├── success-600: #16A34A  ← Hover                                          │
│  ├── success-100: #DCFCE7  ← Background                                     │
│  └── success-50:  #F0FDF4  ← Subtle tint                                    │
│                                                                             │
│  ERROR (Critical, Failed, Tax Due)                                          │
│  ├── error-500:   #EF4444  ← Icons, error text                              │
│  ├── error-600:   #DC2626  ← Hover                                          │
│  ├── error-100:   #FEE2E2  ← Background                                     │
│  └── error-50:    #FEF2F2  ← Subtle tint                                    │
│                                                                             │
│  WARNING (Discrepancy, Attention Needed)                                    │
│  ├── warning-500: #F59E0B  ← Icons, warning text                            │
│  ├── warning-600: #D97706  ← Hover                                          │
│  ├── warning-100: #FEF3C7  ← Background                                     │
│  └── warning-50:  #FFFBEB  ← Subtle tint                                    │
│                                                                             │
│  INFO (Auto-filled, System Generated)                                       │
│  ├── info-500:    #3B82F6  ← Icons, info badges                             │
│  ├── info-600:    #2563EB  ← Hover                                          │
│  ├── info-100:    #DBEAFE  ← Background                                     │
│  └── info-50:     #EFF6FF  ← Subtle tint                                    │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SPECIAL PURPOSE                                                            │
│  ───────────────                                                            │
│                                                                             │
│  REGIME COMPARISON                                                          │
│  ├── old-regime:  #6366F1  ← Indigo (distinct from orange)                  │
│  ├── new-regime:  #8B5CF6  ← Violet (pairs with indigo)                     │
│  └── regime-better: gold-500 with burn-gradient border                      │
│                                                                             │
│  DATA PROVENANCE                                                            │
│  ├── source-form16:    info-500     (blue chip)                             │
│  ├── source-ais:       #06B6D4      (cyan chip)                             │
│  ├── source-26as:      #14B8A6      (teal chip)                             │
│  ├── source-broker:    #8B5CF6      (violet chip)                           │
│  ├── source-manual:    gray-500     (gray chip)                             │
│  └── source-ai:        burn-gradient (special chip)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          50: '#FFF9E6',
          100: '#FFF2BF',
          400: '#FFD347',
          500: '#FFC300',
          600: '#D9A400',
          700: '#B38300',
        },
        ember: {
          50: '#FFF6ED',
          100: '#FFE8CC',
          400: '#FFB347',
          500: '#FF9800',
          600: '#DB7C00',
        },
        slate: {
          50: '#F8FAFC',
          200: '#E2E8F0',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        porcelain: {
          50: '#FCFCFD',
          100: '#F7F7F9',
          200: '#EFEFF2',
          300: '#E0E0E7',
        },
        ink: {
          700: '#1D1D28',
          800: '#12121A',
          900: '#0B0B0F',
        },
        // Semantic Colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#16A34A',
          600: '#15803D',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#1D4ED8',
          600: '#1E3A8A',
        },
        // Regime Colors
        regime: {
          old: '#4C1D95',
          new: '#7E22CE',
        },
        // Source Colors
        source: {
          form16: '#2563EB',
          ais: '#0EA5E9',
          '26as': '#14B8A6',
          broker: '#8B5CF6',
          manual: '#94A3B8',
        },
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #FFC300 0%, #FF9800 65%, #FF6B00 100%)',
      },
    },
  },
};
```

---

## 1.3 Typography System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK TYPOGRAPHY SYSTEM                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FONT FAMILIES                                                              │
│  ─────────────                                                              │
│                                                                             │
│  PRIMARY: Inter                                                             │
│  ├── Why: Excellent readability, wide language support (Hindi, regional)    │
│  ├── Why: Open source, variable font (performance)                          │
│  ├── Why: Clear numerals (critical for financial data)                      │
│  └── Fallback: system-ui, -apple-system, sans-serif                         │
│                                                                             │
│  MONOSPACE (Numbers, Codes): JetBrains Mono                                 │
│  ├── Why: Tabular numbers align perfectly in columns                        │
│  ├── Why: Clear distinction between similar characters (0/O, 1/l)           │
│  └── Fallback: 'Courier New', monospace                                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TYPE SCALE                                                                 │
│  ──────────                                                                 │
│                                                                             │
│  │ Name        │ Size   │ Line Height │ Weight │ Usage                     │
│  ├─────────────┼────────┼─────────────┼────────┼──────────────────────────│
│  │ display-lg  │ 36px   │ 44px (1.22) │ 700    │ Hero numbers (refund)    │
│  │ display-md  │ 30px   │ 38px (1.27) │ 700    │ Page titles              │
│  │ display-sm  │ 24px   │ 32px (1.33) │ 600    │ Section headers expanded │
│  ├─────────────┼────────┼─────────────┼────────┼──────────────────────────│
│  │ heading-lg  │ 20px   │ 28px (1.4)  │ 600    │ Card titles              │
│  │ heading-md  │ 18px   │ 26px (1.44) │ 600    │ Subsection headers       │
│  │ heading-sm  │ 16px   │ 24px (1.5)  │ 600    │ Group labels             │
│  ├─────────────┼────────┼─────────────┼────────┼──────────────────────────│
│  │ body-lg     │ 16px   │ 24px (1.5)  │ 400    │ Primary body text        │
│  │ body-md     │ 14px   │ 22px (1.57) │ 400    │ Secondary text, tables   │
│  │ body-sm     │ 13px   │ 20px (1.54) │ 400    │ Captions, help text      │
│  ├─────────────┼────────┼─────────────┼────────┼──────────────────────────│
│  │ label-lg    │ 14px   │ 20px (1.43) │ 500    │ Form labels              │
│  │ label-md    │ 13px   │ 18px (1.38) │ 500    │ Small labels, chips      │
│  │ label-sm    │ 11px   │ 16px (1.45) │ 500    │ Overlines, tiny labels   │
│  ├─────────────┼────────┼─────────────┼────────┼──────────────────────────│
│  │ number-lg   │ 24px   │ 32px (1.33) │ 600    │ Key amounts (tax bar)    │
│  │ number-md   │ 18px   │ 26px (1.44) │ 600    │ Table amounts            │
│  │ number-sm   │ 14px   │ 22px (1.57) │ 500    │ Inline amounts           │
│  └─────────────┴────────┴─────────────┴────────┴──────────────────────────┘
│                                                                             │
│  NUMBER FORMATTING                                                          │
│  ──────────────────                                                         │
│  • Use tabular figures (font-feature-settings: "tnum")                      │
│  • Indian number system: ₹10,27,000 (not ₹1,027,000)                        │
│  • Always show currency symbol for money                                    │
│  • Negative values: (₹1,50,000) or -₹1,50,000 with error color              │
│  • Percentages: 15.5% (1 decimal max)                                       │
│                                                                             │
│  HIERARCHY RULES                                                            │
│  ───────────────                                                            │
│  • Maximum 3 font sizes visible in any single view                          │
│  • Weight contrast > size contrast for emphasis                             │
│  • Never use both italic AND bold                                           │
│  • Uppercase only for: tiny labels, status badges, overlines                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tailwind Typography Configuration

```javascript
// tailwind.config.js (extend)
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'display-md': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'display-sm': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'heading-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'heading-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', fontWeight: '500' }],
        'number-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'number-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'number-sm': ['14px', { lineHeight: '22px', fontWeight: '500' }],
      },
    },
  },
};
```

---

## 1.4 Spacing & Layout Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK SPACING SYSTEM (8px Base Grid)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BASE UNIT: 8px                                                             │
│  All spacing values are multiples of 8px (with 4px for fine adjustments)    │
│                                                                             │
│  SPACING SCALE                                                              │
│  ─────────────                                                              │
│  │ Token  │ Value │ Usage                                                  │
│  ├────────┼───────┼────────────────────────────────────────────────────────│
│  │ px     │ 1px   │ Borders only                                           │
│  │ 0.5    │ 2px   │ Tight inline spacing                                   │
│  │ 1      │ 4px   │ Icon-to-text gap, tight padding                        │
│  │ 2      │ 8px   │ Default inline gap, small padding                      │
│  │ 3      │ 12px  │ Related element spacing                                │
│  │ 4      │ 16px  │ Default padding, standard gap                          │
│  │ 5      │ 20px  │ Medium padding                                         │
│  │ 6      │ 24px  │ Section padding, card padding                          │
│  │ 8      │ 32px  │ Large gaps between sections                            │
│  │ 10     │ 40px  │ Major section separation                               │
│  │ 12     │ 48px  │ Page margins (desktop)                                 │
│  │ 16     │ 64px  │ Hero spacing                                           │
│  │ 20     │ 80px  │ Major page sections                                    │
│  └────────┴───────┴────────────────────────────────────────────────────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  PAGE LAYOUT                                                                │
│  ───────────                                                                │
│                                                                             │
│  Desktop (≥1280px)                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 48px │                    Max-width: 1440px                    │ 48px│  │
│  │      │  ┌─────────────────────────────────────────────────────┐│      │  │
│  │      │  │                   Content Area                      ││      │  │
│  │      │  │              Max-width: 1344px                      ││      │  │
│  │      │  └─────────────────────────────────────────────────────┘│      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Tablet (768px - 1279px)                                                    │
│  ┌────────────────────────────────────────────────┐                        │
│  │ 32px │           Content Area            │ 32px│                        │
│  └────────────────────────────────────────────────┘                        │
│                                                                             │
│  Mobile (<768px)                                                            │
│  ┌─────────────────────────────────┐                                       │
│  │ 16px │     Content Area    │ 16px│                                       │
│  └─────────────────────────────────┘                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  COMPONENT SPACING RULES                                                    │
│  ───────────────────────                                                    │
│                                                                             │
│  Cards                                                                      │
│  ├── Outer padding: 24px (desktop), 16px (mobile)                           │
│  ├── Internal section gap: 16px                                             │
│  ├── Gap between cards: 16px                                                │
│  └── Nested content indent: 16px                                            │
│                                                                             │
│  Forms                                                                      │
│  ├── Label to input: 6px                                                    │
│  ├── Between form fields: 20px                                              │
│  ├── Between field groups: 32px                                             │
│  └── Input padding: 12px horizontal, 10px vertical                          │
│                                                                             │
│  Tables                                                                     │
│  ├── Cell padding: 12px horizontal, 10px vertical                           │
│  ├── Header cell padding: 12px horizontal, 12px vertical                    │
│  └── Row hover indent (visual): 4px left border                             │
│                                                                             │
│  Buttons                                                                    │
│  ├── Icon to text: 8px                                                      │
│  ├── Padding (default): 12px horizontal, 10px vertical                      │
│  ├── Padding (large): 20px horizontal, 14px vertical                        │
│  └── Padding (small): 8px horizontal, 6px vertical                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.5 Elevation & Shadows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK ELEVATION SYSTEM                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ELEVATION LEVELS                                                           │
│  ────────────────                                                           │
│                                                                             │
│  Level 0 — Flat (Default)                                                   │
│  └── shadow: none                                                           │
│  └── Usage: Page background, inline elements                                │
│                                                                             │
│  Level 1 — Raised (Cards, Inputs)                                           │
│  └── shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)         │
│  └── Usage: Section cards (summary state), form inputs                      │
│                                                                             │
│  Level 2 — Elevated (Expanded Cards, Dropdowns)                             │
│  └── shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)         │
│  └── Usage: Expanded section cards, dropdown menus                          │
│                                                                             │
│  Level 3 — Floating (Tax Bar, Modals)                                       │
│  └── shadow: 0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)       │
│  └── Usage: Sticky tax bar, modal dialogs                                   │
│                                                                             │
│  Level 4 — Overlay (Critical Alerts)                                        │
│  └── shadow: 0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)      │
│  └── Usage: Critical alert modals, full-screen overlays                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  INTERACTIVE ELEVATION                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  Hover Lift                                                                 │
│  └── transform: translateY(-2px)                                            │
│  └── shadow: increase one level                                             │
│  └── transition: all 200ms ease-out                                         │
│                                                                             │
│  Active Press                                                               │
│  └── transform: translateY(0)                                               │
│  └── shadow: decrease one level                                             │
│  └── transition: all 100ms ease-out                                         │
│                                                                             │
│  Focus Ring (Accessibility)                                                 │
│  └── outline: 2px solid orange-500                                          │
│  └── outline-offset: 2px                                                    │
│  └── (Never remove, always visible on keyboard focus)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tailwind Shadow Configuration

```javascript
// tailwind.config.js (extend)
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'elevated': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'floating': '0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)',
        'overlay': '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
      },
    },
  },
};
```

---

## 1.6 Iconography

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK ICONOGRAPHY GUIDELINES                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ICON LIBRARY: Lucide Icons                                                 │
│  ─────────────────────────                                                  │
│  Why: Open source, consistent stroke width, excellent React support         │
│  Install: npm install lucide-react                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ICON SIZES                                                                 │
│  ──────────                                                                 │
│  │ Size Name │ Pixels │ Stroke │ Usage                                     │
│  ├───────────┼────────┼────────┼───────────────────────────────────────────│
│  │ xs        │ 14px   │ 1.5    │ Inline with small text, chips            │
│  │ sm        │ 16px   │ 1.5    │ Inline with body text, buttons (small)   │
│  │ md        │ 20px   │ 2      │ Default buttons, form icons, cards       │
│  │ lg        │ 24px   │ 2      │ Section headers, navigation              │
│  │ xl        │ 32px   │ 2      │ Empty states, feature highlights         │
│  │ 2xl       │ 48px   │ 2      │ Hero empty states                        │
│  └───────────┴────────┴────────┴───────────────────────────────────────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  STANDARD ICON MAPPINGS                                                     │
│  ─────────────────────                                                      │
│                                                                             │
│  Section Icons                                                              │
│  ├── Personal Info:     User                                                │
│  ├── Income:            Wallet / IndianRupee                                │
│  ├── Deductions:        PiggyBank / TrendingDown                            │
│  ├── Taxes Paid:        Building2 (TDS) / Receipt                           │
│  ├── House Property:    Home                                                │
│  ├── Capital Gains:     TrendingUp                                          │
│  ├── Bank Details:      Landmark                                            │
│  └── Tax Computation:   Calculator                                          │
│                                                                             │
│  Status Icons                                                               │
│  ├── Success/Complete:  CheckCircle2 (filled) or Check                      │
│  ├── Error/Failed:      XCircle (filled) or AlertCircle                     │
│  ├── Warning:           AlertTriangle                                       │
│  ├── Info:              Info                                                │
│  ├── Pending:           Clock                                               │
│  └── Verified:          BadgeCheck                                          │
│                                                                             │
│  Action Icons                                                               │
│  ├── Add:               Plus                                                │
│  ├── Edit:              Pencil                                              │
│  ├── Delete:            Trash2                                              │
│  ├── Upload:            Upload                                              │
│  ├── Download:          Download                                            │
│  ├── Expand:            ChevronDown                                         │
│  ├── Collapse:          ChevronUp                                           │
│  ├── Navigate:          ChevronRight                                        │
│  ├── Back:              ArrowLeft                                           │
│  ├── Refresh:           RefreshCw                                           │
│  └── External Link:     ExternalLink                                        │
│                                                                             │
│  Data Source Icons                                                          │
│  ├── Form 16:           FileText                                            │
│  ├── AIS:               FileSearch                                          │
│  ├── 26AS:              FileCheck                                           │
│  ├── Broker Statement:  FileSpreadsheet                                     │
│  ├── Manual Entry:      PenTool                                             │
│  └── AI Generated:      Sparkles                                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ICON COLOR RULES                                                           │
│  ────────────────                                                           │
│  • Default: gray-500 (inherit text color when inline)                       │
│  • Interactive (hover): gray-700 or orange-500                              │
│  • Success: success-500                                                     │
│  • Error: error-500                                                         │
│  • Warning: warning-500                                                     │
│  • Info: info-500                                                           │
│  • Disabled: gray-300                                                       │
│                                                                             │
│  ICON SPACING                                                               │
│  ─────────────                                                              │
│  • Icon-to-text gap: 8px (default), 4px (tight)                             │
│  • Icon-only buttons: 8px padding all sides                                 │
│  • Icon alignment: optically center (may need -1px adjustment)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.7 Motion & Animation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK MOTION SYSTEM                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE PRINCIPLE: Motion serves function, not decoration                     │
│  ─────────────────────────────────────────────────────                      │
│                                                                             │
│  TIMING FUNCTIONS                                                           │
│  ────────────────                                                           │
│  │ Name      │ CSS Value                    │ Usage                        │
│  ├───────────┼──────────────────────────────┼──────────────────────────────│
│  │ ease-out  │ cubic-bezier(0, 0, 0.2, 1)   │ Elements entering (expand)   │
│  │ ease-in   │ cubic-bezier(0.4, 0, 1, 1)   │ Elements leaving (collapse)  │
│  │ ease-both │ cubic-bezier(0.4, 0, 0.2, 1) │ State changes, toggles       │
│  │ spring    │ cubic-bezier(0.34, 1.56, 0.64, 1) │ Playful (success only) │
│  └───────────┴──────────────────────────────┴──────────────────────────────┘
│                                                                             │
│  DURATION SCALE                                                             │
│  ──────────────                                                             │
│  │ Name    │ Duration │ Usage                                              │
│  ├─────────┼──────────┼────────────────────────────────────────────────────│
│  │ instant │ 0ms      │ Immediate feedback (active state)                  │
│  │ fast    │ 100ms    │ Micro-interactions (button press)                  │
│  │ normal  │ 200ms    │ Default transitions (hover, focus)                 │
│  │ relaxed │ 300ms    │ Layout changes (card expand)                       │
│  │ slow    │ 500ms    │ Major transitions (breathing grid)                 │
│  │ slower  │ 700ms    │ Complex sequences (regime switch)                  │
│  └─────────┴──────────┴────────────────────────────────────────────────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ANIMATION SPECIFICATIONS                                                   │
│  ────────────────────────                                                   │
│                                                                             │
│  1. BREATHING GRID — Card Expansion                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Trigger: Click on section card                                       │  │
│  │ Duration: 400ms                                                      │  │
│  │ Easing: ease-out                                                     │  │
│  │                                                                      │  │
│  │ Expanding Card:                                                      │  │
│  │   • width: summary-width → detailed-width                            │  │
│  │   • height: auto (content-based)                                     │  │
│  │   • opacity of detailed content: 0 → 1 (delayed 100ms)               │  │
│  │                                                                      │  │
│  │ Compressing Cards:                                                   │  │
│  │   • width: summary-width → glance-width                              │  │
│  │   • opacity of summary content: 1 → 0 → 1 (swap content)             │  │
│  │                                                                      │  │
│  │ Content within expanded:                                             │  │
│  │   • stagger children by 30ms                                         │  │
│  │   • translateY: 8px → 0                                              │  │
│  │   • opacity: 0 → 1                                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  2. NUMBER CHANGES — Tax Computation                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Trigger: Any value change affecting computation                      │  │
│  │ Duration: 600ms                                                      │  │
│  │ Type: Count-up/count-down animation                                  │  │
│  │                                                                      │  │
│  │ Implementation:                                                      │  │
│  │   • Use requestAnimationFrame for smooth counting                    │  │
│  │   • Debounce input changes by 300ms before triggering                │  │
│  │   • Highlight changed values with brief background flash             │  │
│  │     (gold-100 for increase, error-100 for decrease)                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  3. REGIME TOGGLE                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Trigger: Toggle between Old/New regime view                          │  │
│  │ Duration: 300ms                                                      │  │
│  │                                                                      │  │
│  │ Animation:                                                           │  │
│  │   • Values cross-fade (opacity transition)                           │  │
│  │   • "RECOMMENDED" badge slides to winning regime                     │  │
│  │   • Visual bars animate to new proportions                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  4. LOADING STATES                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Skeleton Shimmer:                                                    │  │
│  │   • Background: linear-gradient sweep                                │  │
│  │   • Duration: 1.5s, infinite                                         │  │
│  │   • Direction: left to right                                         │  │
│  │                                                                      │  │
│  │ Spinner (rare, for actions):                                         │  │
│  │   • Use Lucide Loader2 icon                                          │  │
│  │   • animation: spin 1s linear infinite                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  5. SUCCESS FEEDBACK                                                        │  
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Checkmark Appearance:                                                │  │
│  │   • Scale: 0 → 1.1 → 1                                               │  │
│  │   • Duration: 300ms                                                  │  │
│  │   • Easing: spring                                                   │  │
│  │                                                                      │  │
│  │ Toast Notification:                                                  │  │
│  │   • Enter: translateY(100%) → 0, opacity 0 → 1                       │  │
│  │   • Exit: translateY(0) → -20px, opacity 1 → 0                       │  │
│  │   • Duration: 200ms                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  REDUCED MOTION                                                             │
│  ──────────────                                                             │
│  Always respect: @media (prefers-reduced-motion: reduce)                    │
│  When active:                                                               │
│    • All transitions: duration 0ms                                          │
│    • No transform animations                                                │
│    • Keep opacity transitions (accessibility)                               │
│    • Keep focus indicators                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Framer Motion Configuration

```typescript
// lib/motion.ts
export const transitions = {
  fast: { duration: 0.1 },
  normal: { duration: 0.2 },
  relaxed: { duration: 0.3 },
  slow: { duration: 0.5 },
  breathing: { duration: 0.4, ease: [0, 0, 0.2, 1] },
};

export const variants = {
  cardExpand: {
    collapsed: { 
      width: 'var(--card-glance-width)',
      transition: transitions.breathing 
    },
    summary: { 
      width: 'var(--card-summary-width)',
      transition: transitions.breathing 
    },
    expanded: { 
      width: 'var(--card-expanded-width)',
      transition: transitions.breathing 
    },
  },
  
  contentFade: {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.2 },
    }),
  },
  
  successCheck: {
    hidden: { scale: 0 },
    visible: { 
      scale: [0, 1.1, 1],
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
    },
  },
};
```

---

# PART 2: BREATHING GRID LAYOUT SYSTEM

## 2.1 Core Concept & States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BREATHING GRID — COMPLETE SPECIFICATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONCEPT                                                                    │
│  ───────                                                                    │
│  A fluid layout where sections breathe — expanding and compressing based    │
│  on focus, while maintaining visibility of ALL sections at ALL times.       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  THREE DENSITY STATES                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  STATE 1: GLANCE (Compressed)                                       │   │
│  │  ─────────────────────────────                                      │   │
│  │                                                                     │   │
│  │  ┌─────────┐   Width: 64-80px                                       │   │
│  │  │   👤    │   Content:                                             │   │
│  │  │         │     • Icon (24px)                                      │   │
│  │  │  ✓      │     • Status indicator                                 │   │
│  │  └─────────┘     • Optional: key number (if fits)                   │   │
│  │                                                                     │   │
│  │  Use when: Adjacent to expanded card                                │   │
│  │  Shows: Minimal — just enough to identify & show status             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  STATE 2: SUMMARY (Default)                                         │   │
│  │  ──────────────────────────                                         │   │
│  │                                                                     │   │
│  │  ┌────────────────┐   Width: 180-220px                              │   │
│  │  │ 💰 Income      │   Content:                                      │   │
│  │  │                │     • Icon + Title                              │   │
│  │  │  ₹10,27,000    │     • Primary value (largest)                   │   │
│  │  │  4 sources     │     • Secondary info (count, subtitle)          │   │
│  │  │      ⚠        │     • Status indicator                          │   │
│  │  └────────────────┘                                                 │   │
│  │                                                                     │   │
│  │  Use when: Default state, no section expanded                       │   │
│  │  Shows: Key information at a glance                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  STATE 3: DETAILED (Expanded)                                       │   │
│  │  ────────────────────────────                                       │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────┐                   │   │
│  │  │ 💰 INCOME DETAILS                 ₹10,27,000 │  Width: 480-720px │   │
│  │  │ ──────────────────────────────────────────── │                   │   │
│  │  │                                              │  Content:         │   │
│  │  │  SALARY INCOME                   ₹6,00,000   │    • Full header  │   │
│  │  │  ├─ Basic + DA          ₹4,80,000            │    • All line     │   │
│  │  │  ├─ HRA                    ₹72,000            │      items        │   │
│  │  │  └─ [Auto: Form 16]            📄            │    • Sub-details  │   │
│  │  │                                              │    • Actions      │   │
│  │  │  CAPITAL GAINS                     ₹85,000   │    • Data source  │   │
│  │  │  └─ ⚠ Discrepancy detected                   │      indicators   │   │
│  │  │                                              │                   │   │
│  │  │  [+ Add Income Source]                       │                   │   │
│  │  └──────────────────────────────────────────────┘                   │   │
│  │                                                                     │   │
│  │  Use when: User clicks on a section                                 │   │
│  │  Shows: Complete breakdown with all editable fields                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  STATE TRANSITION RULES                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Trigger               │ Expanding Card │ Adjacent Cards │ Other Cards     │
│  ──────────────────────┼────────────────┼────────────────┼─────────────────│
│  Click on SUMMARY card │ → DETAILED     │ → GLANCE       │ Stay SUMMARY    │
│  Click on GLANCE card  │ → DETAILED     │ (swap roles)   │ Stay SUMMARY    │
│  Click outside cards   │ → SUMMARY      │ → SUMMARY      │ → SUMMARY       │
│  Click on DETAILED     │ → SUMMARY      │ → SUMMARY      │ → SUMMARY       │
│  Press Escape          │ → SUMMARY      │ → SUMMARY      │ → SUMMARY       │
│                                                                             │
│  "Adjacent" = cards immediately next to expanded card (max 2)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Desktop Layout Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DESKTOP LAYOUT (≥1280px)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PAGE STRUCTURE                                                             │
│  ──────────────                                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HEADER (Fixed, 64px height)                                         │   │
│  │ Logo | ITR Type | AY 2024-25 | [Draft ↓] | [User Menu]              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ TAX COMPUTATION BAR (Sticky, 100px height)                          │   │
│  │ Gross → Deductions → Taxable → [OLD ₹X | NEW ₹Y] → [File ITR]       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │ BREATHING GRID (Scrollable Content Area)                            │   │
│  │                                                                     │   │
│  │ ┌────┐ ┌────┐ ┌────────────────────────────────┐ ┌────┐ ┌────┐     │   │
│  │ │ G  │ │ G  │ │         DETAILED               │ │ S  │ │ S  │     │   │
│  │ │    │ │    │ │                                │ │    │ │    │     │   │
│  │ └────┘ └────┘ │                                │ └────┘ └────┘     │   │
│  │               │                                │                   │   │
│  │               │                                │                   │   │
│  │               └────────────────────────────────┘                   │   │
│  │                                                                     │   │
│  │  Second row if needed:                                              │   │
│  │ ┌──────────┐ ┌──────────┐                                          │   │
│  │ │ SUMMARY  │ │ SUMMARY  │                                          │   │
│  │ └──────────┘ └──────────┘                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  GRID SPECIFICATIONS                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Container: CSS Grid                                                        │
│  Gap: 16px                                                                  │
│  Padding: 24px                                                              │
│                                                                             │
│  DEFAULT STATE (All Summary):                                               │
│  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))                │
│  Max 6 columns on large screens                                             │
│                                                                             │
│  EXPANDED STATE:                                                            │
│  grid-template-columns: 72px 72px 1fr 72px 72px                             │
│  (Glance | Glance | Expanded | Glance | Glance)                             │
│                                                                             │
│  Expanded card: max-width: 720px, centered in its grid area                 │
│  Glance cards: fixed 72px width                                             │
│  Remaining cards: stay at Summary width, wrap to next row                   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CSS IMPLEMENTATION                                                         │
│  ──────────────────                                                         │
│                                                                             │
│  .breathing-grid {                                                          │
│    display: grid;                                                           │
│    gap: 16px;                                                               │
│    padding: 24px;                                                           │
│    transition: grid-template-columns 400ms ease-out;                        │
│  }                                                                          │
│                                                                             │
│  .breathing-grid[data-state="default"] {                                    │
│    grid-template-columns: repeat(auto-fit, minmax(180px, 220px));           │
│    justify-content: center;                                                 │
│  }                                                                          │
│                                                                             │
│  .breathing-grid[data-state="expanded"] {                                   │
│    grid-template-columns: 72px 72px minmax(480px, 720px) 72px 72px;         │
│    justify-content: center;                                                 │
│  }                                                                          │
│                                                                             │
│  .section-card {                                                            │
│    transition: width 400ms ease-out, opacity 200ms ease-out;                │
│  }                                                                          │
│                                                                             │
│  .section-card[data-density="glance"] {                                     │
│    width: 72px;                                                             │
│  }                                                                          │
│                                                                             │
│  .section-card[data-density="summary"] {                                    │
│    width: 100%;                                                             │
│    min-width: 180px;                                                        │
│    max-width: 220px;                                                        │
│  }                                                                          │
│                                                                             │
│  .section-card[data-density="detailed"] {                                   │
│    width: 100%;                                                             │
│    max-width: 720px;                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.3 Tablet Adaptation (768px - 1279px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TABLET LAYOUT                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PAGE STRUCTURE                                                             │
│  ──────────────                                                             │
│                                                                             │
│  ┌───────────────────────────────────────────────┐                         │
│  │ HEADER (64px)                                 │                         │
│  ├───────────────────────────────────────────────┤                         │
│  │ TAX BAR (Sticky, 80px - condensed)            │                         │
│  │ [OLD ₹X ✓] [NEW ₹Y] | Refund: ₹22,500        │                         │
│  ├───────────────────────────────────────────────┤                         │
│  │                                               │                         │
│  │ GLANCE BAR (Horizontal scroll, 56px)          │                         │
│  │ ┌────┬────┬────┬────┬────┬────┐              │                         │
│  │ │👤✓ │💰⚠│📉✓ │🏦✓ │🏠✓ │🏦✓ │ ← scroll     │                         │
│  │ └────┴────┴────┴────┴────┴────┘              │                         │
│  │                                               │                         │
│  │ EXPANDED CONTENT (Full width)                 │                         │
│  │ ┌───────────────────────────────────────────┐│                         │
│  │ │ 💰 INCOME DETAILS             ₹10,27,000  ││                         │
│  │ │ ─────────────────────────────────────────  ││                         │
│  │ │                                           ││                         │
│  │ │  SALARY                       ₹6,00,000   ││                         │
│  │ │  HOUSE PROPERTY               ₹1,20,000   ││                         │
│  │ │  CAPITAL GAINS                  ₹85,000   ││                         │
│  │ │  OTHER                          ₹22,000   ││                         │
│  │ │                                           ││                         │
│  │ └───────────────────────────────────────────┘│                         │
│  │                                               │                         │
│  └───────────────────────────────────────────────┘                         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  BEHAVIOR                                                                   │
│  ────────                                                                   │
│  • Default: Show one section expanded (Income by default)                   │
│  • Glance bar always visible at top                                         │
│  • Tap glance icon → that section expands, replaces current                 │
│  • Current section becomes glance icon                                      │
│  • Active glance has orange underline indicator                             │
│                                                                             │
│  GLANCE BAR SPECS                                                           │
│  ───────────────                                                            │
│  Height: 56px                                                               │
│  Item width: 56px                                                           │
│  Gap: 8px                                                                   │
│  Scroll: horizontal, snap to items                                          │
│  Active indicator: 3px bottom border, orange-500                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.4 Mobile Adaptation (<768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MOBILE LAYOUT                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │ HEADER (56px)           │                                               │
│  │ ← | BurnBlack | ⋮      │                                               │
│  ├─────────────────────────┤                                               │
│  │                         │                                               │
│  │ GLANCE BAR (Swipeable)  │                                               │
│  │ ┌────┬────┬────┬────┬─ │                                               │
│  │ │👤✓ │💰⚠│📉✓ │🏦✓ │...│                                               │
│  │ └────┴────┴────┴────┴─ │                                               │
│  │        ●○○○○○          │ ← Page indicators                             │
│  │                         │                                               │
│  ├─────────────────────────┤                                               │
│  │                         │                                               │
│  │ EXPANDED CONTENT        │                                               │
│  │ (Full screen height)    │                                               │
│  │                         │                                               │
│  │ ┌─────────────────────┐ │                                               │
│  │ │ 💰 INCOME           │ │                                               │
│  │ │ ₹10,27,000          │ │                                               │
│  │ │ ───────────────     │ │                                               │
│  │ │                     │ │                                               │
│  │ │ Salary    ₹6,00,000 │ │                                               │
│  │ │ House     ₹1,20,000 │ │                                               │
│  │ │ Capital     ₹85,000 │ │                                               │
│  │ │   ⚠ Mismatch        │ │                                               │
│  │ │ Other       ₹22,000 │ │                                               │
│  │ │                     │ │                                               │
│  │ │ [+ Add Source]      │ │                                               │
│  │ └─────────────────────┘ │                                               │
│  │                         │                                               │
│  ├─────────────────────────┤                                               │
│  │ TAX BAR (Fixed bottom)  │                                               │
│  │ ┌─────────────────────┐ │                                               │
│  │ │ Refund: ₹22,500     │ │                                               │
│  │ │ OLD ✓ saves ₹12,500 │ │                                               │
│  │ │ ████████████████░░░ │ │                                               │
│  │ │   [Review & File]   │ │                                               │
│  │ └─────────────────────┘ │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  MOBILE INTERACTIONS                                                        │
│  ───────────────────                                                        │
│  • Swipe left/right on glance bar to navigate sections                      │
│  • Tap glance icon to jump to that section                                  │
│  • Pull down on expanded content to return to summary view                  │
│  • Swipe up on tax bar to expand full computation                           │
│  • Swipe left/right on glance bar to navigate sections                      │
│  • Tap glance icon to jump to that section                                  │
│  • Pull down on expanded content to return to summary view                  │
│  • Swipe up on tax bar to expand full computation                           │
│  • Long press on glance icon to see quick summary tooltip                   │
│                                                                             │
│  TOUCH TARGETS                                                              │
│  ─────────────                                                              │
│  • Minimum touch target: 44px × 44px (WCAG requirement)                     │
│  • Glance icons: 48px × 48px                                                │
│  • Buttons: 48px height minimum                                             │
│  • Form inputs: 48px height                                                 │
│  • Row items in lists: 56px minimum height                                  │
│                                                                             │
│  GESTURES                                                                   │
│  ────────                                                                   │
│  │ Gesture              │ Action                                           │
│  ├──────────────────────┼──────────────────────────────────────────────────│
│  │ Tap glance icon      │ Expand that section                              │
│  │ Swipe left/right     │ Navigate between sections                        │
│  │ Swipe up on tax bar  │ Expand computation details                       │
│  │ Swipe down on header │ Collapse to summary view                         │
│  │ Long press value     │ Copy to clipboard                                │
│  │ Pinch (disabled)     │ No zoom - fixed viewport                         │
│  └──────────────────────┴──────────────────────────────────────────────────┘
│                                                                             │
│  MOBILE TAX BAR STATES                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  COLLAPSED (Default - 80px):                                                │
│  ┌─────────────────────────────────────┐                                   │
│  │  Refund: ₹22,500    OLD ✓ BETTER    │                                   │
│  │  ████████████████████░░░░░░░░░░░░░  │                                   │
│  │         [Review & File →]           │                                   │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
│  EXPANDED (Swipe up - 240px):                                               │
│  ┌─────────────────────────────────────┐                                   │
│  │  ─────  (drag handle)               │                                   │
│  │                                     │                                   │
│  │  TAX COMPUTATION         AY 2024-25 │                                   │
│  │  ───────────────────────────────────│                                   │
│  │                   OLD    │   NEW    │                                   │
│  │  Gross Income   ₹10,27,000│₹10,27,000│                                   │
│  │  Deductions      ₹1,50,000│   ₹50,000│                                   │
│  │  Taxable         ₹8,77,000│ ₹9,77,000│                                   │
│  │  Tax               ₹72,500│   ₹85,000│                                   │
│  │  TDS Paid          ₹95,000│   ₹95,000│                                   │
│  │  ───────────────────────────────────│                                   │
│  │  RESULT        ₹22,500 ✓ │   ₹10,000│                                   │
│  │                REFUND    │   REFUND │                                   │
│  │                                     │                                   │
│  │         [Review & File →]           │                                   │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.5 Animation Specifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BREATHING GRID ANIMATIONS - DETAILED SPECS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CARD STATE TRANSITIONS                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  1. SUMMARY → DETAILED (Expansion)                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Timeline (400ms total):                                             │  │
│  │                                                                      │  │
│  │  0ms────────100ms────────200ms────────300ms────────400ms            │  │
│  │  │          │           │           │           │                   │  │
│  │  ├──────────┴───────────┴───────────┴───────────┤                   │  │
│  │  │ Card width expansion (ease-out)              │                   │  │
│  │  │ 180px ──────────────────────────────→ 720px  │                   │  │
│  │  │                                              │                   │  │
│  │  ├────────┐                                                         │  │
│  │  │Summary │ Fade out (100ms)                                        │  │
│  │  │content │ opacity: 1 → 0                                          │  │
│  │  └────────┘                                                         │  │
│  │           ├────────────────────────────────────┐                    │  │
│  │           │ Detailed content                   │                    │  │
│  │           │ Fade in (200ms, delayed 150ms)     │                    │  │
│  │           │ opacity: 0 → 1                     │                    │  │
│  │           │ translateY: 8px → 0                │                    │  │
│  │           └────────────────────────────────────┘                    │  │
│  │                                                                      │  │
│  │  Child elements stagger: 30ms delay between each                    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  2. SUMMARY → GLANCE (Compression)                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Timeline (300ms total):                                             │  │
│  │                                                                      │  │
│  │  0ms────────100ms────────200ms────────300ms                         │  │
│  │  │          │           │           │                               │  │
│  │  ├──────────┴───────────┴───────────┤                               │  │
│  │  │ Card width compression           │                               │  │
│  │  │ 180px ──────────────────→ 72px   │                               │  │
│  │  │                                  │                               │  │
│  │  ├──────┐                                                           │  │
│  │  │Title │ Fade out (100ms)                                          │  │
│  │  │Value │ opacity: 1 → 0                                            │  │
│  │  │Meta  │                                                           │  │
│  │  └──────┘                                                           │  │
│  │        ├───────────────────┐                                        │  │
│  │        │ Icon-only view    │                                        │  │
│  │        │ Scale: 0.8 → 1    │                                        │  │
│  │        │ opacity: 0 → 1    │                                        │  │
│  │        └───────────────────┘                                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  3. DETAILED → SUMMARY (Collapse)                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Timeline (350ms total):                                             │  │
│  │                                                                      │  │
│  │  0ms────────100ms────────200ms────────350ms                         │  │
│  │  │          │           │           │                               │  │
│  │  ├────────┐                                                         │  │
│  │  │Detailed│ Fade out (100ms)                                        │  │
│  │  │content │ opacity: 1 → 0                                          │  │
│  │  │        │ translateY: 0 → -8px                                    │  │
│  │  └────────┘                                                         │  │
│  │          ├───────────────────────────┤                              │  │
│  │          │ Width collapse            │                              │  │
│  │          │ 720px → 180px             │                              │  │
│  │          │ ease-in                   │                              │  │
│  │          └───────────────────────────┘                              │  │
│  │                   ├─────────────────┐                               │  │
│  │                   │ Summary content │                               │  │
│  │                   │ Fade in (150ms) │                               │  │
│  │                   └─────────────────┘                               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  GRID REFLOW ANIMATION                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  When cards change state, the grid itself animates:                         │
│                                                                             │
│  Property: grid-template-columns                                            │
│  Duration: 400ms                                                            │
│  Easing: ease-out                                                           │
│                                                                             │
│  Use CSS:                                                                   │
│  .breathing-grid {                                                          │
│    display: grid;                                                           │
│    transition: grid-template-columns 400ms cubic-bezier(0, 0, 0.2, 1);      │
│  }                                                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TAX VALUE ANIMATION                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  When tax computation values change:                                        │
│                                                                             │
│  1. Number Counting Animation                                               │
│     • Duration: 600ms                                                       │
│     • Easing: ease-out                                                      │
│     • Count from old value to new value                                     │
│     • Use Intl.NumberFormat for proper Indian formatting                    │
│                                                                             │
│  2. Change Highlight                                                        │
│     • Background flash: transparent → gold-100 → transparent                │
│     • Duration: 800ms                                                       │
│     • Only on changed values                                                │
│                                                                             │
│  3. Direction Indicator (optional)                                          │
│     • If value increased: brief green pulse + ↑ icon                        │
│     • If value decreased: brief red pulse + ↓ icon                          │
│     • Icon fades after 2 seconds                                            │
│                                                                             │
│  Implementation (React):                                                    │
│  ──────────────────────                                                     │
│                                                                             │
│  const AnimatedNumber = ({ value, duration = 600 }) => {                    │
│    const [displayed, setDisplayed] = useState(value);                       │
│    const prevValue = useRef(value);                                         │
│                                                                             │
│    useEffect(() => {                                                        │
│      const start = prevValue.current;                                       │
│      const end = value;                                                     │
│      const startTime = performance.now();                                   │
│                                                                             │
│      const animate = (currentTime) => {                                     │
│        const elapsed = currentTime - startTime;                             │
│        const progress = Math.min(elapsed / duration, 1);                    │
│        const eased = 1 - Math.pow(1 - progress, 3); // ease-out             │
│        const current = start + (end - start) * eased;                       │
│        setDisplayed(Math.round(current));                                   │
│                                                                             │
│        if (progress < 1) requestAnimationFrame(animate);                    │
│      };                                                                     │
│                                                                             │
│      requestAnimationFrame(animate);                                        │
│      prevValue.current = value;                                             │
│    }, [value, duration]);                                                   │
│                                                                             │
│    return formatIndianCurrency(displayed);                                  │
│  };                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.6 Keyboard & Accessibility

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BREATHING GRID - ACCESSIBILITY SPECIFICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEYBOARD NAVIGATION                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  │ Key           │ Action                                                  │
│  ├───────────────┼─────────────────────────────────────────────────────────│
│  │ Tab           │ Move focus to next section card                         │
│  │ Shift + Tab   │ Move focus to previous section card                     │
│  │ Enter / Space │ Expand focused card (toggle)                            │
│  │ Escape        │ Collapse expanded card, return to summary               │
│  │ Arrow Left    │ Move focus to previous card                             │
│  │ Arrow Right   │ Move focus to next card                                 │
│  │ Arrow Up/Down │ Navigate within expanded card content                   │
│  │ Home          │ Focus first section card                                │
│  │ End           │ Focus last section card                                 │
│  └───────────────┴─────────────────────────────────────────────────────────┘
│                                                                             │
│  FOCUS MANAGEMENT                                                           │
│  ────────────────                                                           │
│                                                                             │
│  1. When card expands:                                                      │
│     • Focus moves to first interactive element inside expanded content      │
│     • Or to card header if no interactive elements                          │
│                                                                             │
│  2. When card collapses:                                                    │
│     • Focus returns to the card (summary state)                             │
│     • Announce "Section collapsed" to screen readers                        │
│                                                                             │
│  3. Focus visible indicator:                                                │
│     • 2px solid orange-500 outline                                          │
│     • 2px offset                                                            │
│     • Never remove or hide                                                  │
│     • Visible on both light and dark backgrounds                            │
│                                                                             │
│  Focus Ring CSS:                                                            │
│  .section-card:focus-visible {                                              │
│    outline: 2px solid #FF6B00;                                              │
│    outline-offset: 2px;                                                     │
│  }                                                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ARIA ATTRIBUTES                                                            │
│  ───────────────                                                            │
│                                                                             │
│  Section Card:                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ <article                                                             │  │
│  │   role="region"                                                      │  │
│  │   aria-label="Income Details"                                        │  │
│  │   aria-expanded="false | true"                                       │  │
│  │   aria-controls="income-content"                                     │  │
│  │   tabIndex="0"                                                       │  │
│  │ >                                                                    │  │
│  │   <header>                                                           │  │
│  │     <h2 id="income-header">Income</h2>                               │  │
│  │     <span aria-live="polite">₹10,27,000</span>                       │  │
│  │     <span role="status" aria-label="1 warning">⚠</span>              │  │
│  │   </header>                                                          │  │
│  │   <div                                                               │  │
│  │     id="income-content"                                              │  │
│  │     aria-labelledby="income-header"                                  │  │
│  │     hidden={!expanded}                                               │  │
│  │   >                                                                  │  │
│  │     {/* Expanded content */}                                         │  │
│  │   </div>                                                             │  │
│  │ </article>                                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Tax Computation Bar:                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ <aside                                                               │  │
│  │   role="complementary"                                               │  │
│  │   aria-label="Tax Computation Summary"                               │  │
│  │   aria-live="polite"                                                 │  │
│  │   aria-atomic="true"                                                 │  │
│  │ >                                                                    │  │
│  │   <dl>                                                               │  │
│  │     <dt>Gross Income</dt>                                            │  │
│  │     <dd>₹10,27,000</dd>                                              │  │
│  │     <dt>Tax (Old Regime)</dt>                                        │  │
│  │     <dd>₹72,500</dd>                                                 │  │
│  │     <dt>Tax (New Regime)</dt>                                        │  │
│  │     <dd>₹85,000</dd>                                                 │  │
│  │     <dt>Recommended</dt>                                             │  │
│  │     <dd>Old Regime - Save ₹12,500</dd>                               │  │
│  │   </dl>                                                              │  │
│  │ </aside>                                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SCREEN READER ANNOUNCEMENTS                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  │ Event                    │ Announcement                                 │
│  ├──────────────────────────┼──────────────────────────────────────────────│
│  │ Card expanded            │ "Income section expanded. 4 income sources." │
│  │ Card collapsed           │ "Income section collapsed."                  │
│  │ Value changed            │ "Taxable income updated to ₹8,77,000"        │
│  │ Regime recommendation    │ "Old regime recommended. Saves ₹12,500"      │
│  │ Discrepancy detected     │ "Warning: Discrepancy in capital gains"      │
│  │ Section complete         │ "Income section complete"                    │
│  │ Validation error         │ "Error: PAN number is required"              │
│  └──────────────────────────┴──────────────────────────────────────────────┘
│                                                                             │
│  Implementation:                                                            │
│  const announceToScreenReader = (message: string) => {                      │
│    const el = document.createElement('div');                                │
│    el.setAttribute('role', 'status');                                       │
│    el.setAttribute('aria-live', 'polite');                                  │
│    el.setAttribute('aria-atomic', 'true');                                  │
│    el.className = 'sr-only';                                                │
│    el.textContent = message;                                                │
│    document.body.appendChild(el);                                           │
│    setTimeout(() => el.remove(), 1000);                                     │
│  };                                                                         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  COLOR CONTRAST REQUIREMENTS (WCAG 2.1 AA)                                  │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  │ Element              │ Foreground   │ Background  │ Ratio  │ Pass?     │
│  ├──────────────────────┼──────────────┼─────────────┼────────┼───────────│
│  │ Body text            │ gray-700     │ white       │ 8.5:1  │ ✓ AAA     │
│  │ Secondary text       │ gray-500     │ white       │ 4.6:1  │ ✓ AA      │
│  │ Primary button       │ white        │ orange-500  │ 4.5:1  │ ✓ AA      │
│  │ Error text           │ error-600    │ white       │ 4.8:1  │ ✓ AA      │
│  │ Success text         │ success-600  │ white       │ 4.5:1  │ ✓ AA      │
│  │ Warning text         │ warning-700  │ warning-50  │ 4.7:1  │ ✓ AA      │
│  │ Link text            │ orange-600   │ white       │ 4.5:1  │ ✓ AA      │
│  │ Disabled text        │ gray-400     │ white       │ 2.7:1  │ ~ (ok)    │
│  │ Placeholder          │ gray-400     │ white       │ 2.7:1  │ ~ (ok)    │
│  └──────────────────────┴──────────────┴─────────────┴────────┴───────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  REDUCED MOTION                                                             │
│  ──────────────                                                             │
│                                                                             │
│  @media (prefers-reduced-motion: reduce) {                                  │
│    *,                                                                       │
│    *::before,                                                               │
│    *::after {                                                               │
│      animation-duration: 0.01ms !important;                                 │
│      animation-iteration-count: 1 !important;                               │
│      transition-duration: 0.01ms !important;                                │
│    }                                                                        │
│                                                                             │
│    .breathing-grid {                                                        │
│      transition: none;                                                      │
│    }                                                                        │
│                                                                             │
│    .section-card {                                                          │
│      transition: none;                                                      │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
│  React Hook:                                                                │
│  const usePrefersReducedMotion = () => {                                    │
│    const [prefersReduced, setPrefersReduced] = useState(false);             │
│                                                                             │
│    useEffect(() => {                                                        │
│      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');      │
│      setPrefersReduced(mq.matches);                                         │
│      const handler = (e) => setPrefersReduced(e.matches);                   │
│      mq.addEventListener('change', handler);                                │
│      return () => mq.removeEventListener('change', handler);                │
│    }, []);                                                                   │
│                                                                             │
│    return prefersReduced;                                                   │
│  };                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 3: COMPONENT SPECIFICATIONS

## 3.1 Section Cards (3 Density States)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION CARD COMPONENT - COMPLETE SPECIFICATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COMPONENT STRUCTURE                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  <SectionCard                                                               │
│    id="income"                                                              │
│    title="Income"                                                           │
│    icon={Wallet}                                                            │
│    primaryValue={1027000}                                                   │
│    secondaryText="4 sources"                                                │
│    status="warning" // 'complete' | 'warning' | 'error' | 'pending'         │
│    statusCount={1}                                                          │
│    density="summary" // 'glance' | 'summary' | 'detailed'                   │
│    onExpand={() => {}}                                                      │
│    onCollapse={() => {}}                                                    │
│  >                                                                          │
│    {/* Detailed content rendered when expanded */}                          │
│    <IncomeDetails />                                                        │
│  </SectionCard>                                                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  GLANCE STATE                                                               │
│  ────────────                                                               │
│                                                                             │
│  ┌─────────┐                                                               │
│  │         │   Dimensions: 72px × 72px (fixed)                             │
│  │   💰    │   Background: white                                           │
│  │         │   Border: 1px solid gray-200                                  │
│  │   ⚠     │   Border-radius: 12px                                         │
│  │         │   Shadow: shadow-card                                         │
│  └─────────┘                                                               │
│                                                                             │
│  Content:                                                                   │
│  • Icon: 24px, centered, gray-600                                          │
│  • Status badge: 16px, bottom-right position                               │
│    - Complete: success-500 checkmark                                       │
│    - Warning: warning-500 triangle with count                              │
│    - Error: error-500 X                                                    │
│    - Pending: gray-400 clock                                               │
│                                                                             │
│  Hover:                                                                     │
│  • Border: orange-300                                                       │
│  • Shadow: shadow-card-hover                                                │
│  • Cursor: pointer                                                          │
│                                                                             │
│  Active/Pressed:                                                            │
│  • Background: gray-50                                                      │
│  • Transform: scale(0.98)                                                   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SUMMARY STATE                                                              │
│  ─────────────                                                              │
│                                                                             │
│  ┌──────────────────┐                                                      │
│  │ 💰 Income        │   Dimensions: 180-220px × auto                       │
│  │                  │   Min-height: 120px                                   │
│  │  ₹10,27,000      │   Background: white                                  │
│  │  4 sources       │   Border: 1px solid gray-200                         │
│  │         ⚠ 1      │   Border-radius: 16px                                │
│  │                  │   Padding: 20px                                       │
│  └──────────────────┘   Shadow: shadow-card                                │
│                                                                             │
│  Layout:                                                                    │
│  ┌──────────────────────────────────────────┐                              │
│  │ [Icon 20px] [Title - heading-md]   [→]   │  Row 1: Header               │
│  ├──────────────────────────────────────────┤                              │
│  │                                          │                              │
│  │  [Primary Value - number-lg]             │  Row 2: Primary Value        │
│  │                                          │                              │
│  │  [Secondary Text - body-sm, gray-500]    │  Row 3: Secondary Info       │
│  │                                          │                              │
│  │                         [Status Badge]   │  Row 4: Status (right-align) │
│  └──────────────────────────────────────────┘                              │
│                                                                             │
│  Typography:                                                                │
│  • Title: heading-md (18px/600), gray-800                                  │
│  • Primary Value: number-lg (24px/600), black-950                          │
│    - Use tabular figures: font-variant-numeric: tabular-nums               │
│    - Format: Indian notation (₹10,27,000)                                  │
│  • Secondary: body-sm (13px/400), gray-500                                 │
│                                                                             │
│  Status Badge Specs:                                                        │
│  • Pill shape: padding 4px 8px, border-radius 12px                         │
│  • Font: label-sm (11px/500)                                               │
│  • Complete: success-100 bg, success-600 text, "✓" icon                    │
│  • Warning: warning-100 bg, warning-600 text, "⚠ {count}" text             │
│  • Error: error-100 bg, error-600 text, "✕ {count}" text                   │
│  • Pending: gray-100 bg, gray-600 text, "◷" icon                           │
│                                                                             │
│  Hover/Active: Same as Glance                                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DETAILED STATE                                                             │
│  ──────────────                                                             │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 💰 INCOME DETAILS                                      ₹10,27,000  │    │
│  │ ────────────────────────────────────────────────────────────────── │    │
│  │                                                                    │    │
│  │  SALARY INCOME                                        ₹6,00,000   │    │
│  │  ├─ Basic + DA                              ₹4,80,000             │    │
│  │  ├─ HRA                                        ₹72,000             │    │
│  │  ├─ Special Allowance                          ₹48,000             │    │
│  │  └─ [Auto-filled from Form 16]                      📄            │    │
│  │                                                                    │    │
│  │  HOUSE PROPERTY                                       ₹1,20,000   │    │
│  │  └─ [Click to expand details]                              ▶      │    │
│  │                                                                    │    │
│  │  CAPITAL GAINS                                          ₹85,000   │    │
│  │  ├─ Short Term (Equity)                        ₹35,000  ⚠        │    │
│  │  │  └─ Discrepancy: AIS shows ₹42,000                             │    │
│  │  │     [Use AIS] [Keep Mine] [Explain]                            │    │
│  │  └─ Long Term (Equity)                         ₹50,000            │    │
│  │                                                                    │    │
│  │  OTHER SOURCES                                          ₹22,000   │    │
│  │  ├─ Interest (Savings)                         ₹12,000            │    │
│  │  └─ Interest (FD)                              ₹10,000            │    │
│  │                                                                    │    │
│  │  [+ Add Income Source]                                             │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Dimensions:                                                                │
│  • Width: 100% of grid column (max 720px)                                  │
│  • Height: auto (content-based)                                            │
│  • Padding: 24px                                                            │
│                                                                             │
│  Visual Treatment:                                                          │
│  • Background: white                                                        │
│  • Border: 2px solid orange-500 (active indicator)                          │
│  • Border-radius: 20px                                                      │
│  • Shadow: shadow-elevated                                                  │
│                                                                             │
│  Header (Inside Expanded):                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ [Icon 24px] [Title - display-sm, uppercase tracking-wide]         │    │
│  │                                            [Total - number-lg]    │    │
│  │ ──────────────────────────────────────────────────────────────────│    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  • Title: display-sm (24px/600), gray-800, uppercase, letter-spacing 0.5px │
│  • Total value: number-lg (24px/600), right-aligned                        │
│  • Divider: 1px solid gray-200, full width, margin 16px 0                  │
│                                                                             │
│  Content Rows:                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ [Category Label - heading-sm]                    [Amount - number-md]│   │
│  │ ├─ [Sub-item - body-md]                         [Amount - number-sm]│   │
│  │ ├─ [Sub-item - body-md]                         [Amount - number-sm]│   │
│  │ └─ [Source indicator - label-sm]                         [Icon]    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  • Category: heading-sm (16px/600), gray-800                               │
│  • Category amount: number-md (18px/600), gray-800, right-aligned          │
│  • Sub-items: body-md (14px/400), gray-600                                 │
│  • Sub-item amounts: number-sm (14px/500), gray-600, right-aligned         │
│  • Tree lines: 1px solid gray-200, use CSS ::before pseudo-element         │
│  • Row spacing: 12px between categories, 8px between sub-items             │
│  • Hover on row: background gray-50, cursor pointer                        │
│                                                                             │
│  Add Button:                                                                │
│  • Position: bottom of content area                                         │
│  • Style: ghost button (no background)                                      │
│  • Icon: Plus (16px)                                                        │
│  • Text: label-lg (14px/500), orange-500                                   │
│  • Hover: orange-600, underline                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Section Card React Component

```tsx
// components/ui/SectionCard/SectionCard.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ChevronRight, Check, AlertTriangle, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/format';

type CardDensity = 'glance' | 'summary' | 'detailed';
type CardStatus = 'complete' | 'warning' | 'error' | 'pending';

interface SectionCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  primaryValue?: number;
  secondaryText?: string;
  status: CardStatus;
  statusCount?: number;
  density: CardDensity;
  onExpand: () => void;
  onCollapse: () => void;
  children?: React.ReactNode;
}

const statusConfig = {
  complete: {
    icon: Check,
    bgColor: 'bg-success-100',
    textColor: 'text-success-600',
    borderColor: 'border-success-200',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-600',
    borderColor: 'border-warning-200',
  },
  error: {
    icon: X,
    bgColor: 'bg-error-100',
    textColor: 'text-error-600',
    borderColor: 'border-error-200',
  },
  pending: {
    icon: Clock,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
  },
};

export function SectionCard({
  id,
  title,
  icon: Icon,
  primaryValue,
  secondaryText,
  status,
  statusCount,
  density,
  onExpand,
  onCollapse,
  children,
}: SectionCardProps) {
  const StatusIcon = statusConfig[status].icon;
  
  const handleClick = () => {
    if (density === 'detailed') {
      onCollapse();
    } else {
      onExpand();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
    if (e.key === 'Escape' && density === 'detailed') {
      onCollapse();
    }
  };

  return (
    <motion.article
      layout
      role="region"
      aria-label={`${title} Details`}
      aria-expanded={density === 'detailed'}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative bg-white rounded-2xl cursor-pointer transition-shadow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        {
          // Glance state
          'w-[72px] h-[72px] p-3 shadow-card hover:shadow-card-hover border border-gray-200 hover:border-orange-300':
            density === 'glance',
          // Summary state
          'min-w-[180px] max-w-[220px] min-h-[120px] p-5 shadow-card hover:shadow-card-hover border border-gray-200 hover:border-orange-300':
            density === 'summary',
          // Detailed state
          'w-full max-w-[720px] p-6 shadow-elevated border-2 border-orange-500':
            density === 'detailed',
        }
      )}
      initial={false}
      animate={{
        width: density === 'glance' ? 72 : density === 'summary' ? 'auto' : '100%',
      }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
    >
      <AnimatePresence mode="wait">
        {density === 'glance' && (
          <GlanceContent
            key="glance"
            icon={Icon}
            status={status}
            statusCount={statusCount}
          />
        )}
        
        {density === 'summary' && (
          <SummaryContent
            key="summary"
            title={title}
            icon={Icon}
            primaryValue={primaryValue}
            secondaryText={secondaryText}
            status={status}
            statusCount={statusCount}
          />
        )}
        
        {density === 'detailed' && (
          <DetailedContent
            key="detailed"
            title={title}
            icon={Icon}
            primaryValue={primaryValue}
            onCollapse={onCollapse}
          >
            {children}
          </DetailedContent>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// Glance Content Sub-component
function GlanceContent({
  icon: Icon,
  status,
  statusCount,
}: {
  icon: LucideIcon;
  status: CardStatus;
  statusCount?: number;
}) {
  const StatusIcon = statusConfig[status].icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <Icon className="w-6 h-6 text-gray-600" />
      <div className={cn(
        'absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
        statusConfig[status].bgColor
      )}>
        {status === 'warning' || status === 'error' ? (
          <span className={cn('text-[10px] font-medium', statusConfig[status].textColor)}>
            {statusCount || '!'}
          </span>
        ) : (
          <StatusIcon className={cn('w-3 h-3', statusConfig[status].textColor)} />
        )}
      </div>
    </motion.div>
  );
}

// Summary Content Sub-component
function SummaryContent({
  title,
  icon: Icon,
  primaryValue,
  secondaryText,
  status,
  statusCount,
}: {
  title: string;
  icon: LucideIcon;
  primaryValue?: number;
  secondaryText?: string;
  status: CardStatus;
  statusCount?: number;
}) {
  const StatusIcon = statusConfig[status].icon;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <h3 className="text-heading-md text-gray-800">{title}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Primary Value */}
      {primaryValue !== undefined && (
        <p className="text-number-lg text-black-950 font-semibold tabular-nums">
          {formatIndianCurrency(primaryValue)}
        </p>
      )}
      
      {/* Secondary Text */}
      {secondaryText && (
        <p className="text-body-sm text-gray-500 mt-1">{secondaryText}</p>
      )}
      
      {/* Status Badge */}
      <div className="mt-auto pt-3 flex justify-end">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-label-sm',
          statusConfig[status].bgColor,
          statusConfig[status].textColor
        )}>
          <StatusIcon className="w-3 h-3" />
          {(status === 'warning' || status === 'error') && statusCount && (
            <span>{statusCount}</span>
          )}
        </span>
      </div>
    </motion.div>
  );
}

// Detailed Content Sub-component
function DetailedContent({
  title,
  icon: Icon,
  primaryValue,
  onCollapse,
  children,
}: {
  title: string;
  icon: LucideIcon;
  primaryValue?: number;
  onCollapse: () => void;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-orange-500" />
          <h2 className="text-display-sm text-gray-800 uppercase tracking-wide">
            {title} Details
          </h2>
        </div>
        {primaryValue !== undefined && (
          <p className="text-number-lg text-black-950 font-semibold tabular-nums">
            {formatIndianCurrency(primaryValue)}
          </p>
        )}
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-200 mb-6" />
      
      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
```

---

## 3.2 Tax Computation Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TAX COMPUTATION BAR - COMPLETE SPECIFICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DESKTOP VERSION (Sticky Top)                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ₹10,27,000    →    ₹1,50,000    →    ₹8,77,000                    │   │
│  │  Gross Income       Deductions        Taxable Income                │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  OLD REGIME                    NEW REGIME                   │   │   │
│  │  │  ₹72,500                       ₹85,000                      │   │   │
│  │  │  ████████████████░░░░░░        ████████████████████░░░░     │   │   │
│  │  │                                                             │   │   │
│  │  │  ✓ REFUND: ₹22,500            REFUND: ₹10,000              │   │   │
│  │  │    RECOMMENDED                                              │   │   │
│  │  │    Save ₹12,500                                             │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  💡 Add ₹50,000 to 80C to save additional ₹15,600    [Review & File]│   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  ───────────────                                                            │
│  Position: sticky, top: 64px (below header)                                │
│  Height: auto (approximately 140-160px)                                    │
│  Background: white                                                          │
│  Border-bottom: 1px solid gray-200                                         │
│  Shadow: shadow-floating (when scrolled)                                   │
│  Padding: 20px 24px                                                        │
│  z-index: 40                                                               │
│                                                                             │
│  Flow Indicator (Top Row):                                                  │
│  • Three value blocks connected by arrows                                   │
│  • Value: number-lg (24px/600), black-950                                  │
│  • Label: label-sm (11px/500), gray-500, uppercase                         │
│  • Arrow: ChevronRight icon, 20px, gray-300                                │
│  • Spacing: 40px between blocks                                            │
│                                                                             │
│  Regime Comparison (Middle):                                                │
│  • Container: rounded-xl, bg gray-50, padding 16px                         │
│  • Two columns, equal width                                                 │
│  • Divider: 1px solid gray-200 (vertical)                                  │
│                                                                             │
│  Per Regime Column:                                                         │
│  • Title: heading-sm (16px/600)                                            │
│  • Tax Amount: number-lg (24px/600)                                        │
│  • Progress Bar:                                                            │
│    - Height: 8px, border-radius: 4px                                       │
│    - Background: gray-200                                                  │
│    - Fill: regime-old (#6366F1) or regime-new (#8B5CF6)                    │
│    - Animate width on value change                                         │
│  • Result (Refund/Payable): heading-md (18px/600)                          │
│    - Refund: success-600                                                   │
│    - Payable: error-600                                                    │
│                                                                             │
│  Recommended Badge:                                                         │
│  • Position: below result in winning regime                                │
│  • Style: burn-gradient background, white text                             │
│  • Text: "RECOMMENDED" + savings amount                                    │
│  • Padding: 6px 12px, border-radius: 6px                                   │
│  • Font: label-md (13px/500), uppercase                                    │
│                                                                             │
│  AI Tip Row (Bottom):                                                       │
│  • Icon: Sparkles, 16px, gold-500                                          │
│  • Text: body-md (14px/400), gray-600                                      │
│  • Dismissible with X button                                               │
│  • Background: gold-50, padding 12px, border-radius 8px                    │
│                                                                             │
│  Primary CTA:                                                               │
│  • Text: "Review & File"                                                   │
│  • Style: Primary button (see Button specs)                                │
│  • Position: right-aligned                                                  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  MOBILE VERSION (Fixed Bottom)                                              │
│  ─────────────────────────────                                              │
│                                                                             │
│  COLLAPSED STATE (80px):                                                    │
│  ┌─────────────────────────────────────────┐                               │
│  │  ═══════ (drag handle)                  │                               │
│  │                                         │                               │
│  │  Refund: ₹22,500      OLD ✓ SAVES ₹12.5K│                               │
│  │  ██████████████████░░░░░░░░░░░░░░░░░░░░ │                               │
│  │                                         │                               │
│  │            [Review & File →]            │                               │
│  └─────────────────────────────────────────┘                               │
│                                                                             │
│  • Position: fixed, bottom: 0                                               │
│  • Background: white                                                        │
│  • Border-top: 1px solid gray-200                                          │
│  • Border-radius: 20px 20px 0 0                                            │
│  • Shadow: 0 -4px 20px rgba(0,0,0,0.1)                                     │
│  • Safe area padding: env(safe-area-inset-bottom)                          │
│  • Drag handle: 40px × 4px, gray-300, border-radius 2px, centered          │
│                                                                             │
│  EXPANDED STATE (Swipe up - 280px):                                         │
│  ┌─────────────────────────────────────────┐                               │
│  │  ═══════ (drag handle)                  │                               │
│  │                                         │                               │
│  │  TAX COMPUTATION         AY 2024-25     │                               │
│  │  ─────────────────────────────────────  │                               │
│  │                                         │                               │
│  │              OLD        NEW             │                               │
│  │  ─────────────────────────────────────  │                               │
│  │  Gross      ₹10,27,000  ₹10,27,000     │                               │
│  │  Deductions  ₹1,50,000     ₹50,000     │                               │
│  │  Taxable     ₹8,77,000   ₹9,77,000     │                               │
│  │  Tax           ₹72,500     ₹85,000     │                               │
│  │  TDS           ₹95,000     ₹95,000     │                               │
│  │  ─────────────────────────────────────  │                               │
│  │  RESULT      ₹22,500✓     ₹10,000      │                               │
│  │              REFUND       REFUND        │                               │
│  │                                         │                               │
│  │  ✓ OLD REGIME SAVES ₹12,500            │                               │
│  │                                         │                               │
│  │            [Review & File →]            │                               │
│  └─────────────────────────────────────────┘                               │
│                                                                             │
│  Gesture: Swipe up to expand, swipe down to collapse                        │
│  Animation: Spring physics, 300ms                                           │
│                                                                             │
│  Table Specs:                                                               │
│  • Header row: label-sm (11px/500), gray-500, uppercase                    │
│  • Data rows: body-md (14px/400), gray-700                                 │
│  • Amount cells: number-sm (14px/500), right-aligned, tabular-nums         │
│  • Result row: heading-sm (16px/600)                                       │
│  • Winner highlight: success-500 text + checkmark                          │
│  • Row height: 36px                                                        │
│  • Horizontal padding: 16px                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tax Computation Bar React Component

```tsx
// components/ui/TaxComputationBar/TaxComputationBar.tsx

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronRight, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface TaxComputationBarProps {
  grossIncome: number;
  deductions: {
    old: number;
    new: number;
  };
  taxableIncome: {
    old: number;
    new: number;
  };
  taxPayable: {
    old: number;
    new: number;
  };
  tdsPaid: number;
  aiTip?: string;
  onDismissTip?: () => void;
  onFileClick: () => void;
}

export function TaxComputationBar({
  grossIncome,
  deductions,
  taxableIncome,
  taxPayable,
  tdsPaid,
  aiTip,
  onDismissTip,
  onFileClick,
}: TaxComputationBarProps) {
  const refundOld = tdsPaid - taxPayable.old;
  const refundNew = tdsPaid - taxPayable.new;
  const recommendedRegime = refundOld >= refundNew ? 'old' : 'new';
  const savings = Math.abs(refundOld - refundNew);

  return (
    <>
      {/* Desktop Version */}
      <DesktopTaxBar
        grossIncome={grossIncome}
        deductions={deductions}
        taxableIncome={taxableIncome}
        taxPayable={taxPayable}
        refundOld={refundOld}
        refundNew={refundNew}
        recommendedRegime={recommendedRegime}
        savings={savings}
        aiTip={aiTip}
        onDismissTip={onDismissTip}
        onFileClick={onFileClick}
      />

      {/* Mobile Version */}
      <MobileTaxBar
        grossIncome={grossIncome}
        deductions={deductions}
        taxableIncome={taxableIncome}
        taxPayable={taxPayable}
        tdsPaid={tdsPaid}
        refundOld={refundOld}
        refundNew={refundNew}
        recommendedRegime={recommendedRegime}
        savings={savings}
        onFileClick={onFileClick}
      />
    </>
  );
}

// Desktop Tax Bar Component
function DesktopTaxBar({
  grossIncome,
  deductions,
  taxableIncome,
  taxPayable,
  refundOld,
  refundNew,
  recommendedRegime,
  savings,
  aiTip,
  onDismissTip,
  onFileClick,
}: {
  grossIncome: number;
  deductions: { old: number; new: number };
  taxableIncome: { old: number; new: number };
  taxPayable: { old: number; new: number };
  refundOld: number;
  refundNew: number;
  recommendedRegime: 'old' | 'new';
  savings: number;
  aiTip?: string;
  onDismissTip?: () => void;
  onFileClick: () => void;
}) {
  const maxTax = Math.max(taxPayable.old, taxPayable.new);

  return (
    <aside
      className="hidden lg:block sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm"
      role="complementary"
      aria-label="Tax Computation Summary"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* Flow Indicator */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <FlowBlock
            label="Gross Income"
            value={grossIncome}
          />
          <ChevronRight className="w-5 h-5 text-gray-300" />
          <FlowBlock
            label="Deductions"
            value={deductions.old}
            subtext={`Old: ${formatIndianCurrency(deductions.old)} | New: ${formatIndianCurrency(deductions.new)}`}
          />
          <ChevronRight className="w-5 h-5 text-gray-300" />
          <FlowBlock
            label="Taxable Income"
            value={taxableIncome.old}
            subtext="(Old Regime)"
          />
        </div>

        {/* Regime Comparison */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Old Regime */}
            <RegimeColumn
              title="Old Regime"
              taxAmount={taxPayable.old}
              result={refundOld}
              maxTax={maxTax}
              isRecommended={recommendedRegime === 'old'}
              savings={recommendedRegime === 'old' ? savings : 0}
              color="regime-old"
            />

            {/* Divider */}
            <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-200" />

            {/* New Regime */}
            <RegimeColumn
              title="New Regime"
              taxAmount={taxPayable.new}
              result={refundNew}
              maxTax={maxTax}
              isRecommended={recommendedRegime === 'new'}
              savings={recommendedRegime === 'new' ? savings : 0}
              color="regime-new"
            />
          </div>
        </div>

        {/* AI Tip & CTA */}
        <div className="flex items-center justify-between">
          {aiTip ? (
            <div className="flex items-center gap-3 bg-gold-50 rounded-lg px-4 py-3 flex-1 mr-4">
              <Sparkles className="w-4 h-4 text-gold-500 flex-shrink-0" />
              <p className="text-body-md text-gray-600">{aiTip}</p>
              <button
                onClick={onDismissTip}
                className="ml-auto text-gray-400 hover:text-gray-600"
                aria-label="Dismiss tip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={onFileClick}
            className="px-6 py-3 bg-burn-gradient text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Review & File
          </button>
        </div>
      </div>
    </aside>
  );
}

// Flow Block Sub-component
function FlowBlock({
  label,
  value,
  subtext,
}: {
  label: string;
  value: number;
  subtext?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-label-sm text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-number-lg text-black-950 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      {subtext && (
        <p className="text-body-sm text-gray-400 mt-1">{subtext}</p>
      )}
    </div>
  );
}

// Regime Column Sub-component
function RegimeColumn({
  title,
  taxAmount,
  result,
  maxTax,
  isRecommended,
  savings,
  color,
}: {
  title: string;
  taxAmount: number;
  result: number;
  maxTax: number;
  isRecommended: boolean;
  savings: number;
  color: 'regime-old' | 'regime-new';
}) {
  const percentage = (taxAmount / maxTax) * 100;
  const isRefund = result > 0;

  return (
    <div className="text-center">
      <h3 className="text-heading-sm text-gray-700 mb-2">{title}</h3>
      
      <p className="text-number-lg text-black-950 tabular-nums mb-3">
        <AnimatedNumber value={taxAmount} />
      </p>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <motion.div
          className={cn('h-full rounded-full', {
            'bg-regime-old': color === 'regime-old',
            'bg-regime-new': color === 'regime-new',
          })}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Result */}
      <p className={cn('text-heading-md font-semibold', {
        'text-success-600': isRefund,
        'text-error-600': !isRefund,
      })}>
        {isRecommended && <span className="mr-1">✓</span>}
        {isRefund ? 'REFUND' : 'PAYABLE'}: <AnimatedNumber value={Math.abs(result)} />
      </p>

      {/* Recommended Badge */}
      {isRecommended && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 inline-block bg-burn-gradient text-white text-label-md uppercase px-3 py-1.5 rounded-md"
        >
          RECOMMENDED • Save {formatIndianCurrency(savings)}
        </motion.div>
      )}
    </div>
  );
}

// Mobile Tax Bar Component
function MobileTaxBar({
  grossIncome,
  deductions,
  taxableIncome,
  taxPayable,
  tdsPaid,
  refundOld,
  refundNew,
  recommendedRegime,
  savings,
  onFileClick,
}: {
  grossIncome: number;
  deductions: { old: number; new: number };
  taxableIncome: { old: number; new: number };
  taxPayable: { old: number; new: number };
  tdsPaid: number;
  refundOld: number;
  refundNew: number;
  recommendedRegime: 'old' | 'new';
  savings: number;
  onFileClick: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const y = useMotionValue(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -50) {
      setIsExpanded(true);
    } else if (info.offset.y > 50) {
      setIsExpanded(false);
    }
  };

  const winningRefund = recommendedRegime === 'old' ? refundOld : refundNew;

  return (
    <motion.aside
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      animate={{ height: isExpanded ? 280 : 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      role="complementary"
      aria-label="Tax Computation Summary"
    >
      {/* Drag Handle */}
      <div className="flex justify-center py-3">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Collapsed Content */}
      {!isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-heading-sm text-gray-800">
              Refund: <span className="text-success-600">{formatIndianCurrency(winningRefund)}</span>
            </p>
            <span className="text-label-sm text-orange-500 uppercase font-medium">
              {recommendedRegime.toUpperCase()} ✓ SAVES {formatIndianCurrency(savings)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-burn-gradient rounded-full"
              style={{ width: '75%' }}
            />
          </div>

          <button
            onClick={onFileClick}
            className="w-full py-3 bg-burn-gradient text-white font-semibold rounded-xl"
          >
            Review & File →
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading-md text-gray-800">Tax Computation</h3>
            <span className="text-label-sm text-gray-500">AY 2024-25</span>
          </div>

          {/* Comparison Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-body-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-label-sm text-gray-500 uppercase">
                    
                  </th>
                  <th className="text-right px-3 py-2 text-label-sm text-gray-500 uppercase">
                    Old
                  </th>
                  <th className="text-right px-3 py-2 text-label-sm text-gray-500 uppercase">
                    New
                  </th>
                </tr>
              </thead>
              <tbody>
                <TableRow label="Gross" oldVal={grossIncome} newVal={grossIncome} />
                <TableRow label="Deductions" oldVal={deductions.old} newVal={deductions.new} />
                <TableRow label="Taxable" oldVal={taxableIncome.old} newVal={taxableIncome.new} />
                <TableRow label="Tax" oldVal={taxPayable.old} newVal={taxPayable.new} />
                <TableRow label="TDS" oldVal={tdsPaid} newVal={tdsPaid} />
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-3 py-2 font-semibold">Result</td>
                  <td className={cn(
                    'px-3 py-2 text-right font-semibold tabular-nums',
                    refundOld > 0 ? 'text-success-600' : 'text-error-600',
                    recommendedRegime === 'old' && 'bg-success-50'
                  )}>
                    {recommendedRegime === 'old' && '✓ '}
                    {formatIndianCurrency(Math.abs(refundOld))}
                  </td>
                  <td className={cn(
                    'px-3 py-2 text-right font-semibold tabular-nums',
                    refundNew > 0 ? 'text-success-600' : 'text-error-600',
                    recommendedRegime === 'new' && 'bg-success-50'
                  )}>
                    {recommendedRegime === 'new' && '✓ '}
                    {formatIndianCurrency(Math.abs(refundNew))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommendation */}
          <p className="text-center text-label-md text-success-600 font-medium mb-4">
            ✓ {recommendedRegime.toUpperCase()} REGIME SAVES {formatIndianCurrency(savings)}
          </p>

          <button
            onClick={onFileClick}
            className="w-full py-3 bg-burn-gradient text-white font-semibold rounded-xl"
          >
            Review & File →
          </button>
        </div>
      )}
    </motion.aside>
  );
}

// Table Row Helper
function TableRow({ 
  label, 
  oldVal, 
  newVal 
}: { 
  label: string; 
  oldVal: number; 
  newVal: number;
}) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 text-gray-600">{label}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatIndianCurrency(oldVal)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatIndianCurrency(newVal)}</td>
    </tr>
  );
}
```

---

## 3.3 Form Controls

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FORM CONTROLS - COMPLETE SPECIFICATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TEXT INPUT                                                                 │
│  ──────────                                                                 │
│                                                                             │
│  STATES & SPECIFICATIONS                                                    │
│                                                                             │
│  Default State:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PAN Number                                                          │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ ABCDE1234F                                                      │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ 10-character alphanumeric                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Label: label-lg (14px/500), gray-700, margin-bottom 6px                 │
│  • Input height: 48px                                                       │
│  • Padding: 12px 16px                                                       │
│  • Border: 1px solid gray-300                                              │
│  • Border-radius: 10px                                                      │
│  • Background: white                                                        │
│  • Font: body-lg (16px/400), gray-800                                      │
│  • Placeholder: gray-400                                                    │
│  • Helper text: body-sm (13px/400), gray-500, margin-top 6px               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Focus State:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PAN Number                                                          │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ ABCDE1234F█                                                     │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Border: 2px solid orange-500                                            │
│  • Box-shadow: 0 0 0 3px orange-100                                        │
│  • Outline: none (custom focus ring replaces default)                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Error State:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PAN Number                                                          │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ ABCDE123                                              ⚠        │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ ⚠ PAN must be exactly 10 characters                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Border: 2px solid error-500                                             │
│  • Background: error-50                                                    │
│  • Error icon: AlertCircle, 20px, error-500, right side of input           │
│  • Error text: body-sm (13px/400), error-600, margin-top 6px               │
│  • aria-invalid="true"                                                     │
│  • aria-describedby points to error message                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Disabled State:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PAN Number                                                          │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ ABCDE1234F                                                      │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: gray-100                                                    │
│  • Border: 1px solid gray-200                                              │
│  • Text: gray-500                                                          │
│  • Cursor: not-allowed                                                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Auto-filled State (Data Provenance):                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Employer Name                                           [Form 16]   │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 📄 Acme Technologies Pvt Ltd                                    │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ Auto-filled from Form 16 • Click to edit                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: info-50                                                     │
│  • Border: 1px solid info-200                                              │
│  • Source chip: inline badge next to label                                 │
│    - Background: source color (see 1.2 Color System)                       │
│    - Text: label-sm (11px/500), white                                      │
│    - Padding: 2px 8px, border-radius: 4px                                  │
│  • Prefix icon: FileText, 16px, info-500                                   │
│  • Helper text indicates source and editability                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CURRENCY INPUT                                                             │
│  ──────────────                                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Basic Salary                                                        │   │
│  │ ┌────┬────────────────────────────────────────────────────────────┐ │   │
│  │ │ ₹  │ 4,80,000                                                   │ │   │
│  │ └────┴────────────────────────────────────────────────────────────┘ │   │
│  │ Annual amount                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Currency prefix: 40px width, gray-100 bg, border-right gray-300         │
│  • Symbol: ₹, body-lg (16px/500), gray-600, centered                       │
│  • Input: right-aligned, tabular-nums, font-mono                           │
│  • Format on blur: Indian notation (4,80,000 not 480,000)                  │
│  • Allow only numbers, handle paste with cleanup                           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SELECT / DROPDOWN                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  Closed State:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Assessment Year                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ AY 2024-25                                                  ▼  │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Open State:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Assessment Year                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ AY 2024-25                                                  ▲  │ │   │
│  │ ├─────────────────────────────────────────────────────────────────┤ │   │
│  │ │ AY 2024-25                                              ✓      │ │   │
│  │ │ AY 2023-24                                                     │ │   │
│  │ │ AY 2022-23                                                     │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Trigger: Same styling as text input                                     │
│  • Chevron: ChevronDown/ChevronUp, 20px, gray-500                          │
│  • Dropdown panel:                                                         │
│    - Background: white                                                     │
│    - Border: 1px solid gray-200                                            │
│    - Border-radius: 10px (connected to trigger)                            │
│    - Shadow: shadow-elevated                                               │
│    - Max-height: 240px, overflow-y: auto                                   │
│  • Option:                                                                 │
│    - Padding: 12px 16px                                                    │
│    - Font: body-lg (16px/400)                                              │
│    - Hover: gray-50 background                                             │
│    - Selected: orange-50 background, orange-600 text, checkmark            │
│  • Animation: fade + slide down, 150ms                                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CHECKBOX                                                                   │
│  ────────                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───┐                                                              │   │
│  │  │ ✓ │  I have income from house property                          │   │
│  │  └───┘                                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Box size: 20px × 20px                                                   │
│  • Border-radius: 4px                                                      │
│  • Unchecked: border 2px solid gray-400, white background                  │
│  • Checked: orange-500 background, white checkmark                         │
│  • Focus: 3px orange-100 ring                                              │
│  • Label: body-lg (16px/400), gray-700, 12px gap from box                  │
│  • Touch target: minimum 44px × 44px                                       │
│  • Checkmark animation: scale 0 → 1.1 → 1, 150ms                           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  RADIO BUTTON                                                               │
│  ────────────                                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Residential Status                                                 │   │
│  │                                                                     │   │
│  │  ◉ Resident                                                         │   │
│  │  ○ Non-Resident                                                     │   │
│  │  ○ Resident but Not Ordinarily Resident                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Circle size: 20px × 20px                                                │
│  • Unselected: border 2px solid gray-400                                   │
│  • Selected: border 2px solid orange-500, inner dot 10px orange-500        │
│  • Focus: 3px orange-100 ring                                              │
│  • Label: body-lg (16px/400), gray-700                                     │
│  • Option spacing: 12px vertical gap                                       │
│  • Inner dot animation: scale 0 → 1, 150ms                                 │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TOGGLE / SWITCH                                                            │
│  ──────────────                                                             │
│                                                                             │
│  Tax Regime Toggle (Special Component):                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │    OLD REGIME    │██████████████│    NEW REGIME              │  │   │
│  │  │    ₹72,500       │              │    ₹85,000                 │  │   │
│  │  │    ✓ Selected    │              │                            │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: pill shape, gray-100 background, padding 4px                 │
│  • Width: 320px (desktop), full width (mobile)                             │
│  • Height: 56px                                                            │
│  • Border-radius: 28px                                                     │
│  • Option areas: 50% each                                                  │
│  • Selected indicator:                                                     │
│    - Sliding pill, white background                                        │
│    - Shadow: shadow-card                                                   │
│    - Border-radius: 24px                                                   │
│    - Animation: translateX, 200ms ease-out                                 │
│  • Selected text: gray-800, font-semibold                                  │
│  • Unselected text: gray-500                                               │
│  • Tax amount: number-md (18px/600)                                        │
│                                                                             │
│  Standard Toggle:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Show advanced options                              ┌───────────┐  │   │
│  │                                                     │ ████░░░░░ │  │   │
│  │                                                     └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Track: 44px × 24px, border-radius 12px                                  │
│  • Off: gray-300 background                                                │
│  • On: orange-500 background                                               │
│  • Thumb: 20px × 20px circle, white, shadow-sm                             │
│  • Animation: translateX, 150ms                                            │
│  • Label: body-lg, positioned left of toggle                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  FILE UPLOAD                                                                │
│  ───────────                                                                │
│                                                                             │
│  Empty State:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                                                               │ │   │
│  │  │                         📄                                    │ │   │
│  │  │                                                               │ │   │
│  │  │           Drag and drop your Form 16 here                     │ │   │
│  │  │               or click to browse files                        │ │   │
│  │  │                                                               │ │   │
│  │  │              PDF, up to 10MB                                  │ │   │
│  │  │                                                               │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Border: 2px dashed gray-300                                             │
│  • Border-radius: 12px                                                     │
│  • Background: gray-50                                                     │
│  • Padding: 40px                                                           │
│  • Icon: Upload or FileText, 48px, gray-400                                │
│  • Primary text: body-lg (16px/500), gray-700                              │
│  • Secondary text: body-sm (13px/400), gray-500                            │
│  • Hover: border-color orange-300, background orange-50                    │
│  • Drag active: border-color orange-500, background orange-100             │
│                                                                             │
│  Uploading State:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  📄 Form16_2024.pdf                                     45%   │ │   │
│  │  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │ │   │
│  │  │  Uploading... 2.3 MB of 5.1 MB                                │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Progress bar: 4px height, orange-500 fill, gray-200 track               │
│  • Filename: body-md (14px/500), gray-800                                  │
│  • Progress text: body-sm, gray-500                                        │
│  • Cancel button: X icon, gray-400, hover gray-600                         │
│                                                                             │
│  Uploaded State:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ✓ Form16_2024.pdf                          [View] [Remove]   │ │   │
│  │  │    5.1 MB • Uploaded just now                                 │ │   │
│  │  │    ✓ 12 fields extracted successfully                         │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: success-50                                                  │
│  • Border: 1px solid success-200                                           │
│  • Checkmark: success-500                                                  │
│  • Actions: ghost buttons, gray-600 text                                   │
│  • Extraction status: body-sm, success-600                                 │
│                                                                             │
│  Error State:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ⚠ Invalid file format                           [Try Again] │ │   │
│  │  │    Please upload a PDF file                                   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: error-50                                                    │
│  • Border: 1px solid error-200                                             │
│  • Icon: AlertTriangle, error-500                                          │
│  • Text: error-600                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Form Controls React Components

```tsx
// components/ui/Input/Input.tsx

import { forwardRef, InputHTMLAttributes } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  source?: 'form16' | 'ais' | '26as' | 'broker' | 'manual' | 'ai';
  sourceLabel?: string;
}

const sourceConfig = {
  form16: { bg: 'bg-source-form16', label: 'Form 16' },
  ais: { bg: 'bg-source-ais', label: 'AIS' },
  '26as': { bg: 'bg-source-26as', label: '26AS' },
  broker: { bg: 'bg-source-broker', label: 'Broker' },
  manual: { bg: 'bg-source-manual', label: 'Manual' },
  ai: { bg: 'bg-burn-gradient', label: 'AI' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    source, 
    sourceLabel,
    className, 
    id,
    ...props 
  }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s/g, '-');
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasSource = source && source !== 'manual';

    return (
      <div className="w-full">
        {/* Label Row */}
        <div className="flex items-center justify-between mb-1.5">
          <label 
            htmlFor={inputId}
            className="text-label-lg text-gray-700"
          >
            {label}
          </label>
          
          {hasSource && (
            <span className={cn(
              'text-label-sm text-white px-2 py-0.5 rounded',
              sourceConfig[source].bg
            )}>
              {sourceLabel || sourceConfig[source].label}
            </span>
          )}
        </div>

        {/* Input Container */}
        <div className="relative">
          {/* Source Icon (if auto-filled) */}
          {hasSource && (
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-info-500" />
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 px-4 text-body-lg text-gray-800 rounded-[10px] border transition-all',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-0',
              {
                // Default state
                'border-gray-300 bg-white focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.1)]':
                  !error && !hasSource,
                // Error state
                'border-2 border-error-500 bg-error-50 pr-12':
                  error,
                // Auto-filled state
                'border-info-200 bg-info-50 pl-10':
                  hasSource && !error,
                // Disabled state
                'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed':
                  props.disabled,
              },
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />

          {/* Error Icon */}
          {error && (
            <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-error-500" />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={errorId} className="mt-1.5 text-body-sm text-error-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-body-sm text-gray-500">
            {hasSource ? `Auto-filled from ${sourceConfig[source].label} • Click to edit` : helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

```tsx
// components/ui/CurrencyInput/CurrencyInput.tsx

import { forwardRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatIndianNumber, parseIndianNumber } from '@/lib/format';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  source?: 'form16' | 'ais' | '26as' | 'broker' | 'manual' | 'ai';
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, value, onChange, error, helperText, disabled, source }, ref) => {
    const [displayValue, setDisplayValue] = useState(formatIndianNumber(value));
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
      // Show raw number on focus for easier editing
      setDisplayValue(value.toString());
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format on blur
      setDisplayValue(formatIndianNumber(value));
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const num = parseInt(raw, 10) || 0;
      onChange(num);
      setDisplayValue(raw);
    }, [onChange]);

    const inputId = label.toLowerCase().replace(/\s/g, '-');
    const hasSource = source && source !== 'manual';

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="block text-label-lg text-gray-700 mb-1.5">
          {label}
        </label>

        <div className={cn(
          'flex rounded-[10px] border overflow-hidden transition-all',
          {
            'border-gray-300': !error && !isFocused,
            'border-orange-500 shadow-[0_0_0_3px_rgba(255,107,0,0.1)]': isFocused && !error,
            'border-2 border-error-500 bg-error-50': error,
            'border-gray-200 bg-gray-100': disabled,
            'border-info-200 bg-info-50': hasSource && !error && !isFocused,
          }
        )}>
          {/* Currency Prefix */}
          <div className={cn(
            'flex items-center justify-center w-12 border-r text-body-lg font-medium',
            {
              'bg-gray-100 border-gray-300 text-gray-600': !error,
              'bg-error-100 border-error-300 text-error-600': error,
            }
          )}>
            ₹
          </div>

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              'flex-1 h-12 px-4 text-body-lg text-right font-mono tabular-nums',
              'bg-transparent focus:outline-none',
              {
                'text-gray-800': !disabled,
                'text-gray-500 cursor-not-allowed': disabled,
              }
            )}
            aria-invalid={error ? 'true' : undefined}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-body-sm text-error-600">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-body-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
```

```tsx
// components/ui/Select/Select.tsx

import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled,
}: SelectProps) {
  return (
    <div className="w-full">
      <label className="block text-label-lg text-gray-700 mb-1.5">
        {label}
      </label>

      <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            'w-full h-12 px-4 flex items-center justify-between rounded-[10px] border',
            'text-body-lg text-gray-800 bg-white transition-all',
            'focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.1)]',
            'data-[placeholder]:text-gray-400',
            {
              'border-gray-300': !error,
              'border-2 border-error-500 bg-error-50': error,
              'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
            }
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'bg-white rounded-[10px] border border-gray-200 shadow-elevated overflow-hidden',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-8 bg-white">
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1 max-h-60">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex items-center px-4 py-3 rounded-lg cursor-pointer',
                    'text-body-lg text-gray-700 outline-none',
                    'hover:bg-gray-50 focus:bg-gray-50',
                    'data-[state=checked]:bg-orange-50 data-[state=checked]:text-orange-600'
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-4">
                    <Check className="w-4 h-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-8 bg-white">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p className="mt-1.5 text-body-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
```

```tsx
// components/ui/Checkbox/Checkbox.tsx

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled,
  description,
}: CheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(
          'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-orange-100 focus:ring-offset-2',
          {
            'border-gray-400 bg-white hover:border-gray-500': !checked && !disabled,
            'border-orange-500 bg-orange-500': checked && !disabled,
            'border-gray-300 bg-gray-100 cursor-not-allowed': disabled,
          }
        )}
      >
        <AnimatePresence>
          {checked && (
            <CheckboxPrimitive.Indicator forceMount>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            </CheckboxPrimitive.Indicator>
          )}
        </AnimatePresence>
      </CheckboxPrimitive.Root>

      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className={cn(
            'text-body-lg cursor-pointer select-none',
            disabled ? 'text-gray-400' : 'text-gray-700'
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-body-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
```

```tsx
// components/ui/RegimeToggle/RegimeToggle.tsx

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/format';

interface RegimeToggleProps {
  value: 'old' | 'new';
  onChange: (value: 'old' | 'new') => void;
  oldTax: number;
  newTax: number;
  recommended: 'old' | 'new';
}

export function RegimeToggle({
  value,
  onChange,
  oldTax,
  newTax,
  recommended,
}: RegimeToggleProps) {
  return (
    <div 
      className="relative bg-gray-100 rounded-full p-1 w-full max-w-xs"
      role="radiogroup"
      aria-label="Tax Regime Selection"
    >
      {/* Sliding Background */}
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-card"
        initial={false}
        animate={{ x: value === 'old' ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      <div className="relative grid grid-cols-2 gap-1">
        {/* Old Regime Option */}
        <button
          role="radio"
          aria-checked={value === 'old'}
          onClick={() => onChange('old')}
          className={cn(
            'relative z-10 py-3 px-4 rounded-full text-center transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
            value === 'old' ? 'text-gray-800' : 'text-gray-500'
          )}
        >
          <span className={cn(
            'block text-label-md uppercase tracking-wide',
            value === 'old' ? 'font-semibold' : 'font-medium'
          )}>
            Old Regime
          </span>
          <span className="block text-number-md tabular-nums">
            {formatIndianCurrency(oldTax)}
          </span>
          {value === 'old' && recommended === 'old' && (
            <span className="block text-label-sm text-success-600 mt-0.5">
              ✓ Selected
            </span>
          )}
        </button>

        {/* New Regime Option */}
        <button
          role="radio"
          aria-checked={value === 'new'}
          onClick={() => onChange('new')}
          className={cn(
            'relative z-10 py-3 px-4 rounded-full text-center transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
            value === 'new' ? 'text-gray-800' : 'text-gray-500'
          )}
        >
          <span className={cn(
            'block text-label-md uppercase tracking-wide',
            value === 'new' ? 'font-semibold' : 'font-medium'
          )}>
            New Regime
          </span>
          <span className="block text-number-md tabular-nums">
            {formatIndianCurrency(newTax)}
          </span>
          {value === 'new' && recommended === 'new' && (
            <span className="block text-label-sm text-success-600 mt-0.5">
              ✓ Selected
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
```

```tsx
// components/ui/FileUpload/FileUpload.tsx

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadProps {
  label: string;
  accept: Record<string, string[]>;
  maxSize?: number;
  onUpload: (file: File) => Promise<void>;
  helperText?: string;
}

export function FileUpload({
  label,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  helperText,
}: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedFields, setExtractedFields] = useState<number | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress (replace with actual upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(file);

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
      setExtractedFields(12); // Replace with actual extracted field count
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: status === 'uploading',
  });

  const handleRemove = () => {
    setStatus('idle');
    setFileName(null);
    setFileSize(null);
    setError(null);
    setProgress(0);
    setExtractedFields(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <label className="block text-label-lg text-gray-700 mb-2">{label}</label>

      <AnimatePresence mode="wait">
        {/* Idle State - Dropzone */}
        {status === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
              {
                'border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50':
                  !isDragActive,
                'border-orange-500 bg-orange-100': isDragActive,
              }
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-body-lg text-gray-700 font-medium mb-1">
              {isDragActive ? 'Drop your file here' : `Drag and drop your ${label} here`}
            </p>
            <p className="text-body-sm text-gray-500">
              or click to browse files
            </p>
            {helperText && (
              <p className="text-body-sm text-gray-400 mt-2">{helperText}</p>
            )}
          </motion.div>
        )}

        {/* Uploading State */}
        {status === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-body-md text-gray-800 font-medium flex-1 truncate">
                {fileName}
              </span>
              <span className="text-body-sm text-gray-500">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>

            <p className="text-body-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading... {formatSize((fileSize || 0) * (progress / 100))} of {formatSize(fileSize || 0)}
            </p>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-success-200 bg-success-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-success-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md text-gray-800 font-medium truncate">
                  {fileName}
                </p>
                <p className="text-body-sm text-gray-500">
                  {formatSize(fileSize || 0)} • Uploaded just now
                </p>
                {extractedFields && (
                  <p className="text-body-sm text-success-600 mt-1">
                    ✓ {extractedFields} fields extracted successfully
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="text-body-sm text-gray-600 hover:text-gray-800">
                  View
                </button>
                <button
                  onClick={handleRemove}
                  className="text-body-sm text-gray-600 hover:text-error-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-error-200 bg-error-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-body-md text-error-700 font-medium">
                  {error || 'Upload failed'}
                </p>
                <p className="text-body-sm text-error-600">
                  Please try again with a valid file
                </p>
              </div>
              <button
                onClick={handleRemove}
                className="text-body-sm text-error-600 hover:text-error-700 font-medium"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 3.4 Data Display Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA DISPLAY COMPONENTS - SPECIFICATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BREAKDOWN LIST (For Income/Deduction Details)                              │
│  ──────────────────────────────────────────────                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SALARY INCOME                                          ₹6,00,000    │   │
│  │ ├─ Basic + DA                               ₹4,80,000              │   │
│  │ ├─ HRA                                         ₹72,000              │   │
│  │ ├─ Special Allowance                           ₹48,000              │   │
│  │ └─ [📄 Form 16]                                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ HOUSE PROPERTY                                         ₹1,20,000    │   │
│  │ ├─ Rental Income                            ₹2,40,000              │   │
│  │ ├─ Municipal Tax                             (₹24,000)              │   │
│  │ └─ Standard Deduction 30%                    (₹72,000)              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ CAPITAL GAINS                                            ₹85,000   ⚠│   │
│  │ ├─ Short Term (Equity)                         ₹35,000  ⚠          │   │
│  │ │   └─ ⚠ AIS shows ₹42,000 [Resolve]                               │   │
│  │ └─ Long Term (Equity)                          ₹50,000              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Category row:                                                            │
│    - Background: gray-50 on hover                                          │
│    - Padding: 16px                                                          │
│    - Font: heading-sm (16px/600), gray-800                                 │
│    - Amount: number-md (18px/600), right-aligned                           │
│    - Clickable to expand/collapse                                          │
│    - Chevron indicator: ChevronRight (collapsed) / ChevronDown (expanded)  │
│                                                                             │
│  • Sub-item row:                                                            │
│    - Padding: 12px 16px 12px 40px (indented)                               │
│    - Font: body-md (14px/400), gray-600                                    │
│    - Amount: number-sm (14px/500), gray-600                                │
│    - Tree line: 1px solid gray-200, vertical + horizontal                  │
│                                                                             │
│  • Negative values:                                                         │
│    - Format: (₹24,000) with parentheses                                    │
│    - Color: gray-500 (not error, as it's expected)                         │
│                                                                             │
│  • Source badge: inline at end of category                                  │
│  • Warning indicator: AlertTriangle icon, warning-500, right side          │
│  • Discrepancy row: warning-50 background, warning border-left 3px         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  COMPARISON TABLE (For Regime Comparison)                                   │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            │   OLD REGIME    │    NEW REGIME        │   │
│  │────────────────────────────┼─────────────────┼──────────────────────│   │
│  │ Gross Total Income         │    ₹10,27,000   │     ₹10,27,000       │   │
│  │ Less: Deductions           │     ₹1,50,000   │        ₹50,000       │   │
│  │   - Section 80C            │     ₹1,50,000   │             —        │   │
│  │   - Standard Deduction     │             —   │        ₹50,000       │   │
│  │────────────────────────────┼─────────────────┼──────────────────────│   │
│  │ Total Taxable Income       │     ₹8,77,000   │      ₹9,77,000       │   │
│  │────────────────────────────┼─────────────────┼──────────────────────│   │
│  │ Tax on Total Income        │       ₹72,500   │        ₹85,000       │   │
│  │ Add: Surcharge             │             —   │             —        │   │
│  │ Add: Cess (4%)             │        ₹2,900   │         ₹3,400       │   │
│  │────────────────────────────┼─────────────────┼──────────────────────│   │
│  │ TOTAL TAX LIABILITY        │       ₹75,400   │        ₹88,400       │   │
│  │ Less: TDS/Advance Tax      │       ₹95,000   │        ₹95,000       │   │
│  │════════════════════════════╪═════════════════╪══════════════════════│   │
│  │ REFUND / (PAYABLE)         │    ✓ ₹19,600    │        ₹6,600        │   │
│  │                            │   RECOMMENDED   │                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: border 1px solid gray-200, rounded-xl, overflow hidden       │
│  • Header row:                                                              │
│    - Background: gray-50                                                   │
│    - Font: label-sm (11px/500), gray-500, uppercase                        │
│    - Padding: 12px 16px                                                    │
│  • Data rows:                                                               │
│    - Border-bottom: 1px solid gray-100                                     │
│    - Padding: 12px 16px                                                    │
│    - Label: body-md (14px/400), gray-700                                   │
│    - Values: number-sm (14px/500), tabular-nums, right-aligned             │
│  • Sub-item rows (indented):                                                │
│    - Padding-left: 32px                                                    │
│    - Font: body-sm (13px/400), gray-500                                    │
│  • Section dividers: border-bottom 2px solid gray-200                      │
│  • Total row:                                                               │
│    - Background: gray-50                                                   │
│    - Font: heading-sm (16px/600)                                           │
│    - Border-top: 2px solid gray-300                                        │
│  • Result row:                                                              │
│    - Background: winner gets success-50                                    │
│    - Font: heading-md (18px/600)                                           │
│    - Refund: success-600                                                   │
│    - Payable: error-600                                                    │
│    - Recommended badge: burn-gradient background, white text               │
│  • Nil values: show "—" in gray-400                                        │
│  • Negative values: format with parentheses                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DATA ROW / LIST ITEM                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Icon] Label Text                               Value     [Action] │   │
│  │        Secondary text or metadata                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Standard Row:                                                              │
│  • Height: 56px minimum (can expand for multi-line)                        │
│  • Padding: 16px                                                            │
│  • Icon: 20px, gray-500, optional                                          │
│  • Label: body-lg (16px/400), gray-800                                     │
│  • Value: number-md (18px/600), gray-800, right-aligned                    │
│  • Secondary: body-sm (13px/400), gray-500                                 │
│  • Hover: gray-50 background                                               │
│  • Border-bottom: 1px solid gray-100 (except last)                         │
│                                                                             │
│  With Status:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [✓] Form 16 - Part A                            Verified    [View] │   │
│  │     Uploaded on 15 Jun 2024                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Status badge: See status badge specs from Section Card                  │
│  • Action button: ghost button, gray-600 text                              │
│                                                                             │
│  With Warning:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [⚠] Capital Gains - STCG                        ₹35,000   [Resolve]│   │
│  │     Mismatch with AIS data                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Warning variant: warning-50 background, warning-500 left border 3px     │
│  • Warning icon: AlertTriangle, warning-500                                │
│  • Action: orange-500 text, underline on hover                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  STAT CARD / KPI DISPLAY                                                    │
│  ───────────────────────                                                    │
│                                                                             │
│  ┌────────────────────────┐                                                │
│  │  Gross Total Income    │                                                │
│  │                        │                                                │
│  │  ₹10,27,000           │                                                │
│  │                        │                                                │
│  │  ↑ ₹1,20,000 from AIS │                                                │
│  └────────────────────────┘                                                │
│                                                                             │
│  Specifications:                                                            │
│  • Size: flexible, min-width 160px                                         │
│  • Padding: 20px                                                            │
│  • Background: white                                                        │
│  • Border: 1px solid gray-200                                              │
│  • Border-radius: 16px                                                      │
│  • Label: label-md (13px/500), gray-500, uppercase                         │
│  • Value: display-sm (24px/600) or display-md (30px/700) for hero          │
│  • Change indicator:                                                        │
│    - Increase: success-500, arrow-up icon                                  │
│    - Decrease: error-500, arrow-down icon                                  │
│    - Font: body-sm (13px/400)                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Display React Components

```tsx
// components/ui/BreakdownList/BreakdownList.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/format';

interface BreakdownItem {
  id: string;
  label: string;
  amount: number;
  source?: string;
  hasWarning?: boolean;
  warningMessage?: string;
  children?: BreakdownItem[];
}

interface BreakdownListProps {
  items: BreakdownItem[];
  onResolveWarning?: (itemId: string) => void;
  onItemClick?: (itemId: string) => void;
}

export function BreakdownList({ 
  items, 
  onResolveWarning,
  onItemClick 
}: BreakdownListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item) => (
        <BreakdownCategory
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggle={() => toggleExpand(item.id)}
          onResolveWarning={onResolveWarning}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

function BreakdownCategory({
  item,
  isExpanded,
  onToggle,
  onResolveWarning,
  onItemClick,
}: {
  item: BreakdownItem;
  isExpanded: boolean;
  onToggle: () => void;
  onResolveWarning?: (itemId: string) => void;
  onItemClick?: (itemId: string) => void;
}) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {/* Category Header */}
      <button
        onClick={() => hasChildren ? onToggle() : onItemClick?.(item.id)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50',
          item.hasWarning && 'bg-warning-50'
        )}
      >
        <div className="flex items-center gap-3">
          {hasChildren && (
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          )}
          <span className="text-heading-sm text-gray-800">{item.label}</span>
          {item.source && (
            <span className="text-label-sm text-info-600 bg-info-100 px-2 py-0.5 rounded">
              {item.source}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            'text-number-md tabular-nums',
            item.amount < 0 ? 'text-gray-500' : 'text-gray-800'
          )}>
            {item.amount < 0 
              ? `(${formatIndianCurrency(Math.abs(item.amount))})`
              : formatIndianCurrency(item.amount)
            }
          </span>
          {item.hasWarning && (
            <AlertTriangle className="w-4 h-4 text-warning-500" />
          )}
        </div>
      </button>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {item.children!.map((child, index) => (
              <div
                key={child.id}
                className={cn(
                  'relative pl-10 pr-4 py-3',
                  child.hasWarning && 'bg-warning-50 border-l-3 border-warning-500'
                )}
              >
                {/* Tree Lines */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
                <div className="absolute left-6 top-1/2 w-3 h-px bg-gray-200" />
                {index === item.children!.length - 1 && (
                  <div className="absolute left-6 top-1/2 bottom-0 w-px bg-white" />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-body-md text-gray-600">{child.label}</span>
                  <span className={cn(
                    'text-number-sm tabular-nums',
                    child.amount < 0 ? 'text-gray-500' : 'text-gray-600',
                    child.hasWarning && 'text-warning-600'
                  )}>
                    {child.amount < 0 
                      ? `(${formatIndianCurrency(Math.abs(child.amount))})`
                      : formatIndianCurrency(child.amount)
                    }
                    {child.hasWarning && ' ⚠'}
                  </span>
                </div>

                {/* Warning Message */}
                {child.hasWarning && child.warningMessage && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-body-sm text-warning-600">
                      ⚠ {child.warningMessage}
                    </span>
                    <button
                      onClick={() => onResolveWarning?.(child.id)}
                      className="text-body-sm text-orange-500 hover:underline"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

```tsx
// components/ui/ComparisonTable/ComparisonTable.tsx

import { cn } from '@/lib/utils';
import { formatIndianCurrency } from '@/lib/format';

interface ComparisonRow {
  label: string;
  oldValue: number | null;
  newValue: number | null;
  isSubItem?: boolean;
  isSectionTotal?: boolean;
  isFinalResult?: boolean;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  recommendedRegime: 'old' | 'new';
  savings: number;
}

export function ComparisonTable({
  rows,
  recommendedRegime,
  savings,
}: ComparisonTableProps) {
  const formatValue = (value: number | null, isResult = false) => {
    if (value === null) return '—';
    if (isResult) {
      return value >= 0 
        ? formatIndianCurrency(value)
        : `(${formatIndianCurrency(Math.abs(value))})`;
    }
    return formatIndianCurrency(value);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
        <div className="p-3 text-label-sm text-gray-500 uppercase" />
        <div className="p-3 text-label-sm text-gray-500 uppercase text-right">
          Old Regime
        </div>
        <div className="p-3 text-label-sm text-gray-500 uppercase text-right">
          New Regime
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <div
            key={index}
            className={cn(
              'grid grid-cols-3',
              {
                'pl-8': row.isSubItem,
                'bg-gray-50 border-y-2 border-gray-200': row.isSectionTotal,
                'bg-gray-50': row.isFinalResult,
              }
            )}
          >
            <div className={cn(
              'p-3',
              row.isSubItem ? 'text-body-sm text-gray-500' : 'text-body-md text-gray-700',
              row.isSectionTotal && 'text-heading-sm text-gray-800',
              row.isFinalResult && 'text-heading-md text-gray-800'
            )}>
              {row.label}
            </div>
            
            <div className={cn(
              'p-3 text-right tabular-nums',
              row.isSubItem ? 'text-body-sm text-gray-500' : 'text-number-sm',
              row.isSectionTotal && 'text-number-md font-semibold',
              row.isFinalResult && 'text-number-lg font-semibold',
              row.isFinalResult && row.oldValue !== null && row.oldValue >= 0 && 'text-success-600',
              row.isFinalResult && row.oldValue !== null && row.oldValue < 0 && 'text-error-600',
              row.isFinalResult && recommendedRegime === 'old' && 'bg-success-50',
              row.oldValue === null && 'text-gray-400'
            )}>
              {row.isFinalResult && recommendedRegime === 'old' && '✓ '}
              {formatValue(row.oldValue, row.isFinalResult)}
            </div>

            <div className={cn(
              'p-3 text-right tabular-nums',
              row.isSubItem ? 'text-body-sm text-gray-500' : 'text-number-sm',
              row.isSectionTotal && 'text-number-md font-semibold',
              row.isFinalResult && 'text-number-lg font-semibold',
              row.isFinalResult && row.newValue !== null && row.newValue >= 0 && 'text-success-600',
              row.isFinalResult && row.newValue !== null && row.newValue < 0 && 'text-error-600',
              row.isFinalResult && recommendedRegime === 'new' && 'bg-success-50',
              row.newValue === null && 'text-gray-400'
            )}>
              {row.isFinalResult && recommendedRegime === 'new' && '✓ '}
              {formatValue(row.newValue, row.isFinalResult)}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
        <span className="inline-block bg-burn-gradient text-white text-label-md uppercase px-4 py-2 rounded-lg">
          {recommendedRegime.toUpperCase()} REGIME RECOMMENDED • Save {formatIndianCurrency(savings)}
        </span>
      </div>
    </div>
  );
}
```

---

## 3.5 Feedback & Status Components

Continuing from 3.5 Feedback & Status Components...

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FEEDBACK & STATUS COMPONENTS - SPECIFICATION (Continued)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TOAST NOTIFICATIONS                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Success Toast:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✓  Changes saved successfully                                   ✕  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Error Toast:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✕  Failed to save. Please try again.                  [Retry]   ✕  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Warning Toast:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠  Discrepancy detected in capital gains data         [Review]  ✕  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Info Toast:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ  Form 16 data has been auto-filled                  [View]    ✕  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Position: Bottom-right (desktop), Bottom-center (mobile)                │
│  • Width: 400px max (desktop), full width - 32px margin (mobile)           │
│  • Padding: 16px                                                            │
│  • Border-radius: 12px                                                      │
│  • Shadow: shadow-floating                                                  │
│  • Z-index: 100                                                            │
│                                                                             │
│  Variants:                                                                  │
│  │ Type    │ Background  │ Border-left   │ Icon Color   │ Icon           │
│  ├─────────┼─────────────┼───────────────┼──────────────┼────────────────│
│  │ Success │ white       │ 4px success-500│ success-500 │ CheckCircle    │
│  │ Error   │ white       │ 4px error-500  │ error-500   │ XCircle        │
│  │ Warning │ white       │ 4px warning-500│ warning-500 │ AlertTriangle  │
│  │ Info    │ white       │ 4px info-500   │ info-500    │ Info           │
│  └─────────┴─────────────┴───────────────┴──────────────┴────────────────┘
│                                                                             │
│  Content Layout:                                                            │
│  • Icon: 20px, left-aligned                                                │
│  • Message: body-md (14px/400), gray-700, flex-1                           │
│  • Action button: ghost, colored to match variant                          │
│  • Dismiss: X icon, 16px, gray-400, hover gray-600                         │
│  • Gap between elements: 12px                                              │
│                                                                             │
│  Animation:                                                                 │
│  • Enter: translateY(100%) → 0, opacity 0 → 1, duration 200ms              │
│  • Exit: translateY(0) → -20px, opacity 1 → 0, duration 150ms              │
│  • Auto-dismiss: 5 seconds (success/info), 8 seconds (warning), never (error)│
│  • Progress bar: bottom, 2px height, same color as border                  │
│                                                                             │
│  Stacking: Max 3 visible, oldest dismissed, 8px gap between               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ALERT BANNERS (Inline)                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Info Banner:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ  Your Form 16 data has been auto-filled. Please verify all      │   │
│  │     values before proceeding.                            [Dismiss] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Warning Banner:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠  2 discrepancies found between your entries and AIS data.       │   │
│  │     Resolving these may avoid scrutiny.           [Review Now →]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Error Banner:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✕  PAN verification failed. Please check your PAN and try again.  │   │
│  │                                                    [Try Again]     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CA Required Banner:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👤 Based on your income sources, CA assistance is recommended.     │   │
│  │     Complex capital gains detected.            [Connect with CA →] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Width: 100% of container                                                │
│  • Padding: 16px                                                            │
│  • Border-radius: 12px                                                      │
│  • Margin-bottom: 16px (when above content)                                │
│                                                                             │
│  Variants:                                                                  │
│  │ Type     │ Background   │ Border        │ Icon Color   │               │
│  ├──────────┼──────────────┼───────────────┼──────────────┤               │
│  │ Info     │ info-50      │ 1px info-200  │ info-500     │               │
│  │ Warning  │ warning-50   │ 1px warning-200│ warning-500 │               │
│  │ Error    │ error-50     │ 1px error-200 │ error-500    │               │
│  │ CA/Pro   │ purple-50    │ 1px purple-200│ purple-500   │ (Use #8B5CF6) │
│  └──────────┴──────────────┴───────────────┴──────────────┘               │
│                                                                             │
│  Content Layout:                                                            │
│  • Icon: 20px, aligned with first line of text                             │
│  • Title (optional): heading-sm (16px/600), same color as icon             │
│  • Message: body-md (14px/400), gray-700                                   │
│  • Action: link style, colored to match variant, right-aligned or below    │
│  • Dismiss: X icon, only for dismissible banners                           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  STATUS BADGES                                                              │
│  ─────────────                                                              │
│                                                                             │
│  Pill Badges (Used in cards, lists):                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [✓ Complete]  [⚠ 2 Warnings]  [✕ Error]  [◷ Pending]  [● In Progress]│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Specifications:                                                            │
│  • Padding: 4px 10px                                                       │
│  • Border-radius: 12px (full pill)                                         │
│  • Font: label-sm (11px/500), uppercase optional                           │
│  • Icon: 12px, inline before text, 4px gap                                 │
│                                                                             │
│  │ Status      │ Background   │ Text Color    │ Icon           │          │
│  ├─────────────┼──────────────┼───────────────┼────────────────┤          │
│  │ Complete    │ success-100  │ success-700   │ Check          │          │
│  │ Verified    │ success-100  │ success-700   │ BadgeCheck     │          │
│  │ Warning     │ warning-100  │ warning-700   │ AlertTriangle  │          │
│  │ Error       │ error-100    │ error-700     │ XCircle        │          │
│  │ Pending     │ gray-100     │ gray-600      │ Clock          │          │
│  │ In Progress │ info-100     │ info-700      │ Loader (spin)  │          │
│  │ Auto-filled │ info-100     │ info-700      │ Sparkles       │          │
│  │ Manual      │ gray-100     │ gray-600      │ PenTool        │          │
│  │ Draft       │ gold-100     │ gold-700      │ FileEdit       │          │
│  └─────────────┴──────────────┴───────────────┴────────────────┘          │
│                                                                             │
│  Dot Indicators (Minimal status):                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ● Complete   ● Warning   ● Error   ○ Pending                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  • Dot size: 8px                                                           │
│  • With pulse animation for "In Progress": ring animation                  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  PROGRESS INDICATORS                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Linear Progress (Determinate):                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Filing Progress                                              75%   │   │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Track: height 8px, gray-200, border-radius 4px                          │
│  • Fill: burn-gradient or orange-500, border-radius 4px                    │
│  • Animation: width transition 300ms ease-out                              │
│  • Label: body-sm (13px/400), gray-600                                     │
│  • Percentage: body-sm (13px/500), gray-800                                │
│                                                                             │
│  Linear Progress (Indeterminate):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Animated gradient sweep, left to right, infinite                        │
│  • Duration: 1.5s                                                          │
│                                                                             │
│  Step Progress (Filing Steps):                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ●────────●────────●────────○────────○                             │   │
│  │  Personal  Income   Deduct.  Verify   File                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Step circle: 24px diameter                                              │
│  • Completed: orange-500 fill, white check icon                            │
│  • Current: orange-500 border, orange-500 center dot (12px)                │
│  • Upcoming: gray-300 border, empty                                        │
│  • Connector line: 2px height                                              │
│    - Completed: orange-500                                                 │
│    - Upcoming: gray-300                                                    │
│  • Labels: body-sm (13px/400), gray-500 (upcoming), gray-800 (current/done)│
│                                                                             │
│  Circular Progress (For loading):                                           │
│  • Size variants: 16px (inline), 24px (small), 40px (medium), 64px (large) │
│  • Stroke width: 2px (small), 3px (medium), 4px (large)                    │
│  • Track: gray-200                                                         │
│  • Fill: orange-500                                                        │
│  • Animation: rotate 1s linear infinite                                    │
│  • Dash offset animation for progress fill                                 │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SKELETON LOADERS                                                           │
│  ────────────────                                                           │
│                                                                             │
│  Text Skeleton:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                                │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Card Skeleton:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ░░░░░░░░  ░░░░░░░░░░░░░░░░░                                │   │   │
│  │  │                                                             │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │   │   │
│  │  │                                                             │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Table Skeleton:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ░░░░░░░░░░░░░   ░░░░░░░░░░   ░░░░░░░░                             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  ░░░░░░░░░░░░░   ░░░░░░░░░░   ░░░░░░░░                             │   │
│  │  ░░░░░░░░░░░░░   ░░░░░░░░░░   ░░░░░░░░                             │   │
│  │  ░░░░░░░░░░░░░   ░░░░░░░░░░   ░░░░░░░░                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Background: gray-200                                                    │
│  • Border-radius: 4px (text), 8px (cards), match component shape           │
│  • Animation: shimmer gradient sweep                                       │
│    - Gradient: gray-200 → gray-100 → gray-200                              │
│    - Direction: left to right, -45deg angle                                │
│    - Duration: 1.5s, infinite                                              │
│  • Height: match expected content height                                   │
│  • Width: vary to mimic real content (70%, 100%, 40%, etc.)                │
│                                                                             │
│  CSS Animation:                                                             │
│  @keyframes shimmer {                                                       │
│    0% { background-position: -200% 0; }                                    │
│    100% { background-position: 200% 0; }                                   │
│  }                                                                          │
│  .skeleton {                                                                │
│    background: linear-gradient(                                            │
│      90deg,                                                                │
│      #e5e5e5 25%,                                                          │
│      #f5f5f5 50%,                                                          │
│      #e5e5e5 75%                                                           │
│    );                                                                       │
│    background-size: 200% 100%;                                             │
│    animation: shimmer 1.5s infinite;                                       │
│  }                                                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  EMPTY STATES                                                               │
│  ────────────                                                               │
│                                                                             │
│  No Data:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           📄                                        │   │
│  │                                                                     │   │
│  │                   No income sources added                           │   │
│  │            Add your income details to calculate tax                 │   │
│  │                                                                     │   │
│  │                    [+ Add Income Source]                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Upload Required:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           📤                                        │   │
│  │                                                                     │   │
│  │                  Upload Form 16 to get started                      │   │
│  │        We'll auto-fill your salary details and deductions          │   │
│  │                                                                     │   │
│  │                      [Upload Form 16]                               │   │
│  │                                                                     │   │
│  │                  or enter details manually                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Error State:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           ⚠️                                        │   │
│  │                                                                     │   │
│  │                  Something went wrong                               │   │
│  │          We couldn't load your data. Please try again.             │   │
│  │                                                                     │   │
│  │                       [Try Again]                                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: centered content, padding 48px (desktop), 32px (mobile)      │
│  • Icon: 48px (standard) or 64px (hero), gray-300                          │
│  • Title: heading-md (18px/600), gray-800, margin-top 16px                 │
│  • Description: body-md (14px/400), gray-500, max-width 300px, centered    │
│  • Primary action: button (primary or secondary based on context)          │
│  • Secondary action: text link, gray-500                                   │
│  • Spacing between elements: 8px (title-desc), 24px (desc-action)          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CONFIRMATION DIALOGS                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  Standard Confirmation:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                         Confirm Deletion                            │   │
│  │                                                                     │   │
│  │   Are you sure you want to delete this income source?              │   │
│  │   This action cannot be undone.                                    │   │
│  │                                                                     │   │
│  │                              [Cancel]  [Delete]                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Critical Confirmation:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    ⚠️ Submit ITR Filing?                            │   │
│  │                                                                     │   │
│  │   You are about to submit your ITR-2 for AY 2024-25.               │   │
│  │                                                                     │   │
│  │   • Total Income: ₹10,27,000                                       │   │
│  │   • Tax Payable: ₹72,500 (Old Regime)                              │   │
│  │   • Refund Expected: ₹22,500                                       │   │
│  │                                                                     │   │
│  │   ☐ I confirm all details are correct                              │   │
│  │                                                                     │   │
│  │                           [Cancel]  [Submit ITR →]                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Overlay: black-950 at 50% opacity                                       │
│  • Modal: white background, shadow-overlay, border-radius 20px             │
│  • Width: 400px (small), 480px (medium), 560px (large)                     │
│  • Padding: 24px                                                            │
│  • Title: heading-lg (20px/600), gray-800, centered or left-aligned        │
│  • Icon (optional): 48px, above title, centered                            │
│  • Body: body-md (14px/400), gray-600                                      │
│  • Actions: right-aligned, 12px gap between buttons                        │
│  • Primary action on right, secondary on left                              │
│  • Destructive actions: error-500 colored primary button                   │
│                                                                             │
│  Animation:                                                                 │
│  • Overlay: opacity 0 → 0.5, duration 200ms                                │
│  • Modal: scale 0.95 → 1, opacity 0 → 1, duration 200ms, ease-out          │
│  • Exit: reverse of enter, duration 150ms                                  │
│                                                                             │
│  Accessibility:                                                             │
│  • role="dialog", aria-modal="true"                                        │
│  • aria-labelledby pointing to title                                       │
│  • Focus trapped within modal                                              │
│  • Initial focus on first interactive element (or cancel button)           │
│  • Escape key closes modal                                                 │
│  • Click outside closes (unless critical)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Feedback & Status React Components

```tsx
// components/ui/Toast/Toast.tsx

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onDismiss: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-success-500',
    iconColor: 'text-success-500',
    actionColor: 'text-success-600 hover:text-success-700',
    duration: 5000,
  },
  error: {
    icon: XCircle,
    borderColor: 'border-l-error-500',
    iconColor: 'text-error-500',
    actionColor: 'text-error-600 hover:text-error-700',
    duration: null, // Never auto-dismiss
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-warning-500',
    iconColor: 'text-warning-500',
    actionColor: 'text-warning-600 hover:text-warning-700',
    duration: 8000,
  },
  info: {
    icon: Info,
    borderColor: 'border-l-info-500',
    iconColor: 'text-info-500',
    actionColor: 'text-info-600 hover:text-info-700',
    duration: 5000,
  },
};

export function Toast({
  id,
  type,
  message,
  action,
  duration,
  onDismiss,
}: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;
  const autoDismiss = duration ?? config.duration;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoDismiss) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismiss) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onDismiss(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, autoDismiss, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative bg-white rounded-xl shadow-floating border-l-4 overflow-hidden',
        'w-full max-w-[400px]',
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        
        <p className="flex-1 text-body-md text-gray-700">{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className={cn('text-body-md font-medium', config.actionColor)}
          >
            {action.label}
          </button>
        )}

        <button
          onClick={() => onDismiss(id)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {autoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
          <motion.div
            className={cn('h-full', {
              'bg-success-500': type === 'success',
              'bg-error-500': type === 'error',
              'bg-warning-500': type === 'warning',
              'bg-info-500': type === 'info',
            })}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, onDismiss }: {
  toasts: Array<{
    id: string;
    type: ToastType;
    message: string;
    action?: { label: string; onClick: () => void };
  }>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[400px]">
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 3).map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

```tsx
// components/ui/Alert/Alert.tsx

import { ReactNode } from 'react';
import { AlertTriangle, Info, XCircle, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'warning' | 'error' | 'ca-required';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

const alertConfig = {
  info: {
    icon: Info,
    containerClass: 'bg-info-50 border-info-200',
    iconClass: 'text-info-500',
    titleClass: 'text-info-700',
    actionClass: 'text-info-600 hover:text-info-700',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-warning-50 border-warning-200',
    iconClass: 'text-warning-500',
    titleClass: 'text-warning-700',
    actionClass: 'text-warning-600 hover:text-warning-700',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-error-50 border-error-200',
    iconClass: 'text-error-500',
    titleClass: 'text-error-700',
    actionClass: 'text-error-600 hover:text-error-700',
  },
  'ca-required': {
    icon: User,
    containerClass: 'bg-purple-50 border-purple-200',
    iconClass: 'text-purple-500',
    titleClass: 'text-purple-700',
    actionClass: 'text-purple-600 hover:text-purple-700',
  },
};

export function Alert({
  variant,
  title,
  children,
  action,
  dismissible,
  onDismiss,
}: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border p-4',
      config.containerClass
    )}>
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-heading-sm mb-1', config.titleClass)}>
              {title}
            </h4>
          )}
          <div className="text-body-md text-gray-700">{children}</div>
          
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-2 text-body-md font-medium inline-flex items-center gap-1',
                config.actionClass
              )}
            >
              {action.label}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>

        {dismissible && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

```tsx
// components/ui/StatusBadge/StatusBadge.tsx

import { 
  Check, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Loader2, 
  Sparkles, 
  PenTool,
  BadgeCheck,
  FileEdit
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BadgeStatus = 
  | 'complete' 
  | 'verified' 
  | 'warning' 
  | 'error' 
  | 'pending' 
  | 'in-progress' 
  | 'auto-filled' 
  | 'manual' 
  | 'draft';

interface StatusBadgeProps {
  status: BadgeStatus;
  count?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const badgeConfig = {
  complete: {
    icon: Check,
    label: 'Complete',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  verified: {
    icon: BadgeCheck,
    label: 'Verified',
    bgClass: 'bg-success-100',
    textClass: 'text-success-700',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgClass: 'bg-warning-100',
    textClass: 'text-warning-700',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    bgClass: 'bg-error-100',
    textClass: 'text-error-700',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  'in-progress': {
    icon: Loader2,
    label: 'In Progress',
    bgClass: 'bg-info-100',
    textClass: 'text-info-700',
    animate: true,
  },
  'auto-filled': {
    icon: Sparkles,
    label: 'Auto-filled',
    bgClass: 'bg-info-100',
    textClass: 'text-info-700',
  },
  manual: {
    icon: PenTool,
    label: 'Manual',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    bgClass: 'bg-gold-100',
    textClass: 'text-gold-700',
  },
};

export function StatusBadge({ 
  status, 
  count, 
  showLabel = true,
  size = 'md' 
}: StatusBadgeProps) {
  const config = badgeConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      config.bgClass,
      config.textClass,
      {
        'px-2 py-0.5 text-label-sm': size === 'sm',
        'px-2.5 py-1 text-label-md': size === 'md',
      }
    )}>
      <Icon className={cn(
        'animate' in config && config.animate && 'animate-spin',
        size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
      )} />
      {showLabel && (
        <span>
          {config.label}
          {count !== undefined && count > 0 && ` (${count})`}
        </span>
      )}
      {!showLabel && count !== undefined && count > 0 && (
        <span>{count}</span>
      )}
    </span>
  );
}

// Dot Indicator (Minimal)
export function StatusDot({ 
  status, 
  pulse = false 
}: { 
  status: 'success' | 'warning' | 'error' | 'pending';
  pulse?: boolean;
}) {
  const colors = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    pending: 'bg-gray-300',
  };

  return (
    <span className="relative inline-flex">
      <span className={cn(
        'w-2 h-2 rounded-full',
        colors[status]
      )} />
      {pulse && (
        <span className={cn(
          'absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75',
          colors[status]
        )} />
      )}
    </span>
  );
}
```

```tsx
// components/ui/Progress/Progress.tsx

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Linear Progress Bar
interface LinearProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
}

export function LinearProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
}: LinearProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-body-sm text-gray-600">{label}</span>}
          {showPercentage && (
            <span className="text-body-sm font-medium text-gray-800">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heightClass[size])}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            variant === 'gradient' ? 'bg-burn-gradient' : 'bg-orange-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Indeterminate Progress
export function IndeterminateProgress() {
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full w-1/3 bg-orange-500 rounded-full"
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Step Progress
interface Step {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface StepProgressProps {
  steps: Step[];
}

export function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors',
              {
                'bg-orange-500 border-orange-500': step.status === 'complete',
                'border-orange-500 bg-white': step.status === 'current',
                'border-gray-300 bg-white': step.status === 'upcoming',
              }
            )}>
              {step.status === 'complete' ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : step.status === 'current' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              ) : null}
            </div>
            <span className={cn(
              'mt-2 text-body-sm',
              {
                'text-gray-800 font-medium': step.status === 'complete' || step.status === 'current',
                'text-gray-500': step.status === 'upcoming',
              }
            )}>
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-3 mt-[-24px]',
              {
                'bg-orange-500': step.status === 'complete',
                'bg-gray-300': step.status !== 'complete',
              }
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
```

```tsx
// components/ui/Skeleton/Skeleton.tsx

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        {
          'rounded': variant === 'text',
          'rounded-full': variant === 'circular',
          'rounded-lg': variant === 'rectangular',
        },
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['100%', '90%', '75%', '85%', '60%'];
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={widths[i % widths.length]}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={16} width="60%" />
          <Skeleton variant="text" height={14} width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <Skeleton variant="rectangular" height={40} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <Skeleton variant="text" height={14} width="30%" />
        <Skeleton variant="text" height={14} width="20%" />
        <Skeleton variant="text" height={14} width="20%" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 last:border-0">
          <Skeleton variant="text" height={16} width="30%" />
          <Skeleton variant="text" height={16} width="20%" />
          <Skeleton variant="text" height={16} width="20%" />
        </div>
      ))}
    </div>
  );
}
```

```tsx
// components/ui/EmptyState/EmptyState.tsx

import { ReactNode } from 'react';
import { LucideIcon, FileText, Upload, AlertTriangle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: EmptyStateProps) {
  const iconSize = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const padding = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      padding[size]
    )}>
      <div className={cn(
        'rounded-full bg-gray-100 p-4 mb-4',
        size === 'lg' && 'p-5'
      )}>
        <Icon className={cn('text-gray-400', iconSize[size])} />
      </div>

      <h3 className={cn(
        'text-gray-800 font-semibold',
        size === 'sm' ? 'text-heading-sm' : 'text-heading-md'
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-gray-500 mt-2 max-w-xs',
          size === 'sm' ? 'text-body-sm' : 'text-body-md'
        )}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-5 py-2.5 rounded-xl font-medium transition-colors',
                action.variant === 'secondary'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-body-md text-gray-500 hover:text-gray-700"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states
export function NoDataEmptyState({ 
  itemType = 'items',
  onAdd 
}: { 
  itemType?: string;
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      icon={FileText}
      title={`No ${itemType} added`}
      description={`Add your ${itemType} to get started with tax calculation`}
      action={onAdd ? {
        label: `+ Add ${itemType}`,
        onClick: onAdd,
      } : undefined}
    />
  );
}

export function UploadEmptyState({
  documentType = 'document',
  onUpload,
  onManualEntry,
}: {
  documentType?: string;
  onUpload: () => void;
  onManualEntry?: () => void;
}) {
  return (
    <EmptyState
      icon={Upload}
      title={`Upload ${documentType} to get started`}
      description={`We'll auto-fill your details from the ${documentType}`}
      action={{
        label: `Upload ${documentType}`,
        onClick: onUpload,
      }}
      secondaryAction={onManualEntry ? {
        label: 'or enter details manually',
        onClick: onManualEntry,
      } : undefined}
    />
  );
}

export function ErrorEmptyState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description="We couldn't load your data. Please try again."
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'secondary',
      }}
    />
  );
}

export function NoResultsEmptyState({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No matches for "${searchTerm}". Try a different search term.`}
      action={{
        label: 'Clear Search',
        onClick: onClear,
        variant: 'secondary',
      }}
    />
  );
}
```

```tsx
// components/ui/Dialog/ConfirmDialog.tsx

import { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive' | 'critical';
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black-950/50"
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'w-full max-w-md bg-white rounded-2xl shadow-overlay p-6',
                  'focus:outline-none'
                )}
              >
                {/* Close Button */}
                <DialogPrimitive.Close asChild>
                  <button
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </DialogPrimitive.Close>

                {/* Icon for critical/destructive */}
                {(variant === 'critical' || variant === 'destructive') && (
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      variant === 'destructive' ? 'bg-error-100' : 'bg-warning-100'
                    )}>
                      <AlertTriangle className={cn(
                        'w-6 h-6',
                        variant === 'destructive' ? 'text-error-500' : 'text-warning-500'
                      )} />
                    </div>
                  </div>
                )}

                {/* Title */}
                <DialogPrimitive.Title className={cn(
                  'text-heading-lg text-gray-800',
                  (variant === 'critical' || variant === 'destructive') && 'text-center'
                )}>
                  {title}
                </DialogPrimitive.Title>

                {/* Description */}
                {description && (
                  <DialogPrimitive.Description className={cn(
                    'mt-2 text-body-md text-gray-600',
                    (variant === 'critical' || variant === 'destructive') && 'text-center'
                  )}>
                    {description}
                  </DialogPrimitive.Description>
                )}

                {/* Custom Content */}
                {children && (
                  <div className="mt-4">
                    {children}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <DialogPrimitive.Close asChild>
                    <button className="px-4 py-2.5 rounded-xl text-body-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                      {cancelLabel}
                    </button>
                  </DialogPrimitive.Close>

                  <button
                    onClick={handleConfirm}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-body-md font-medium text-white transition-colors',
                      {
                        'bg-orange-500 hover:bg-orange-600': variant === 'default',
                        'bg-error-500 hover:bg-error-600': variant === 'destructive',
                        'bg-burn-gradient hover:opacity-90': variant === 'critical',
                      }
                    )}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

// Pre-built confirm dialogs
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Deletion"
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}

export function SubmitITRDialog({
  open,
  onOpenChange,
  itrType,
  assessmentYear,
  totalIncome,
  taxPayable,
  refund,
  regime,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itrType: string;
  assessmentYear: string;
  totalIncome: number;
  taxPayable: number;
  refund: number;
  regime: 'old' | 'new';
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Submit ${itrType} Filing?`}
      description={`You are about to submit your ${itrType} for ${assessmentYear}.`}
      confirmLabel="Submit ITR →"
      variant="critical"
      onConfirm={onConfirm}
    >
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-body-md text-gray-600">Total Income</span>
          <span className="text-body-md text-gray-800 font-medium tabular-nums">
            {formatIndianCurrency(totalIncome)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-body-md text-gray-600">Tax Payable ({regime === 'old' ? 'Old' : 'New'} Regime)</span>
          <span className="text-body-md text-gray-800 font-medium tabular-nums">
            {formatIndianCurrency(taxPayable)}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
          <span className="text-body-md text-gray-600">Refund Expected</span>
          <span className="text-body-md text-success-600 font-semibold tabular-nums">
            {formatIndianCurrency(refund)}
          </span>
        </div>
      </div>

      <label className="flex items-center gap-3 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-body-md text-gray-700">
          I confirm all details are correct
        </span>
      </label>
    </ConfirmDialog>
  );
}
```

---

## 3.6 Navigation Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAVIGATION COMPONENTS - SPECIFICATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HEADER (Global Navigation)                                                 │
│  ──────────────────────────                                                 │
│                                                                             │
│  Desktop Header:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔥 BURNBLACK    │  ITR-2  │  AY 2024-25 ▼  │         [Save Draft ▼] │   │
│  │                 │         │                │   [?]  [👤 Rahul K. ▼] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Height: 64px                                                            │
│  • Background: white                                                        │
│  • Border-bottom: 1px solid gray-200                                       │
│  • Position: fixed, top 0, z-index 50                                      │
│  • Padding: 0 24px (desktop), 0 16px (mobile)                              │
│                                                                             │
│  Left Section:                                                              │
│  • Logo: BurnBlack icon + wordmark, height 32px                            │
│  • ITR Type badge: label-md (13px/500), gray-100 bg, gray-700 text         │
│  • AY Selector: dropdown trigger, body-md, gray-700                        │
│                                                                             │
│  Right Section:                                                             │
│  • Save Draft: secondary button with dropdown for options                  │
│  • Help icon: CircleHelp, 20px, gray-500, hover gray-700                   │
│  • User menu: avatar circle (32px) + name + ChevronDown                    │
│                                                                             │
│  Mobile Header:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ←    ITR-2 • AY 2024-25                                        ⋮   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Height: 56px                                                            │
│  • Back button: ArrowLeft, 24px (if in sub-screen)                         │
│  • Title: centered, heading-md (18px/600)                                  │
│  • Menu: MoreVertical, 24px, opens bottom sheet                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  BREADCRUMB (For nested navigation)                                         │
│  ──────────────────────────────────                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Income  /  Capital Gains  /  Short Term Equity                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Font: body-md (14px/400)                                                │
│  • Separator: "/" or ChevronRight, gray-400                                │
│  • Links: gray-500, hover gray-700, hover underline                        │
│  • Current (last): gray-800, not clickable                                 │
│  • Max items visible: 3-4, then collapse with "..."                        │
│  • Mobile: horizontal scroll if needed                                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TABS (Section switching within a view)                                     │
│  ──────────────────────────────────────                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Details]  [Documents]  [History]                                  │   │
│  │  ════════                                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: border-bottom 1px solid gray-200                             │
│  • Tab padding: 16px horizontal, 12px vertical                             │
│  • Tab font: body-md (14px/500)                                            │
│  • Inactive: gray-500                                                      │
│  • Active: gray-800                                                        │
│  • Indicator: 2px bottom border, orange-500                                │
│  • Animation: indicator slides to active tab, 200ms                        │
│  • Mobile: horizontal scroll, snap to tab                                  │
│                                                                             │
│  With Counts:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Documents (3)]  [Discrepancies (2)]  [History]                    │   │
│  │                   ════════════════════                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Count badge: inline, gray-500 or warning-500 for attention              │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DROPDOWN MENU                                                              │
│  ─────────────                                                              │
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │  Save Draft             │                                               │
│  │  ──────────────────────│                                               │
│  │  📄 Save as Draft       │                                               │
│  │  💾 Save & Continue     │                                              │
│  │  📥 Export as JSON      │                                               │
│  │  ──────────────────────│                                               │
│  │  🗑️ Discard Changes     │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
│  Specifications:                                                            │
│  • Width: 200px min, auto-expand to content                                │
│  • Background: white                                                        │
│  • Border: 1px solid gray-200                                              │
│  • Border-radius: 12px                                                      │
│  • Shadow: shadow-elevated                                                  │
│  • Padding: 4px                                                            │
│                                                                             │
│  Menu Items:                                                                │
│  • Padding: 10px 12px                                                      │
│  • Border-radius: 8px                                                      │
│  • Font: body-md (14px/400), gray-700                                      │
│  • Icon: 16px, gray-500, 12px gap to text                                  │
│  • Hover: gray-50 background                                               │
│  • Destructive: error-600 text, error-50 on hover                          │
│                                                                             │
│  Divider:                                                                   │
│  • Height: 1px, gray-200                                                   │
│  • Margin: 4px 0                                                           │
│                                                                             │
│  Group Label (optional):                                                    │
│  • Font: label-sm (11px/500), gray-500, uppercase                          │
│  • Padding: 8px 12px 4px                                                   │
│                                                                             │
│  Animation:                                                                 │
│  • Enter: fade + scale from 0.95, duration 150ms                           │
│  • Exit: fade, duration 100ms                                              │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  BOTTOM SHEET (Mobile Navigation/Actions)                                   │
│  ────────────────────────────────────────                                   │
│                                                                             │
│  ┌─────────────────────────────────────────┐                               │
│  │  ═══════ (drag handle)                  │                               │
│  │                                         │                               │
│  │  Filing Options                         │                               │
│  │  ──────────────────────────────────────│                               │
│  │                                         │                               │
│  │  📄  Save as Draft                      │                               │
│  │  📥  Export as JSON                     │                               │
│  │  📤  Share with CA                      │                               │
│  │                                         │                               │
│  │  ──────────────────────────────────────│                               │
│  │                                         │                               │
│  │  🗑️  Discard Changes                    │                               │
│  │                                         │                               │
│  │        [Cancel]                         │                               │
│  │                                         │                               │
│  └─────────────────────────────────────────┘                               │
│                                                                             │
│  Specifications:                                                            │
│  • Position: fixed, bottom 0                                               │
│  • Background: white                                                        │
│  • Border-radius: 20px 20px 0 0                                            │
│  • Shadow: 0 -4px 20px rgba(0,0,0,0.1)                                     │
│  • Safe area: padding-bottom env(safe-area-inset-bottom)                   │
│  • Drag handle: 40px × 4px, gray-300, centered, 12px from top              │
│  • Overlay: black-950 at 50% opacity                                       │
│                                                                             │
│  Header:                                                                    │
│  • Title: heading-md (18px/600), gray-800                                  │
│  • Padding: 20px 24px 12px                                                 │
│  • Border-bottom: 1px solid gray-200                                       │
│                                                                             │
│  Content:                                                                   │
│  • Padding: 8px 16px                                                       │
│  • Max-height: 70vh                                                        │
│  • Overflow: auto                                                          │
│                                                                             │
│  Action Items:                                                              │
│  • Height: 56px                                                            │
│  • Padding: 0 16px                                                          │
│  • Font: body-lg (16px/400), gray-700                                      │
│  • Icon: 20px, gray-500                                                    │
│  • Border-radius: 12px                                                      │
│  • Hover: gray-50                                                          │
│                                                                             │
│  Animation:                                                                 │
│  • Enter: slide up from bottom, duration 300ms, spring physics             │
│  • Exit: slide down, duration 200ms                                        │
│  • Drag to dismiss: velocity-based                                         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TOOLTIP                                                                    │
│  ───────                                                                    │
│                                                                             │
│  Basic Tooltip:                                                             │
│  ┌─────────────────────────────────────────┐                               │
│  │  Section 80C allows deductions up to    │                               │
│  │  ₹1,50,000 for specified investments.   │                               │
│  └─────────────────────────────────────────┘                               │
│          ▼                                                                  │
│                                                                             │
│  Specifications:                                                            │
│  • Background: gray-900 (dark) or white (light variant)                    │
│  • Text: body-sm (13px/400), white (dark) or gray-700 (light)              │
│  • Padding: 8px 12px                                                       │
│  • Border-radius: 8px                                                      │
│  • Max-width: 280px                                                        │
│  • Shadow: shadow-elevated (for light variant)                             │
│  • Arrow: 8px, matches background                                          │
│                                                                             │
│  Rich Tooltip (with link):                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Section 80C                                                        │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │  Allows deductions up to ₹1,50,000 for investments in PPF, ELSS,   │   │
│  │  NSC, life insurance, etc.                                         │   │
│  │                                                                     │   │
│  │  [Learn more →]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           ▲                                                                 │
│                                                                             │
│  Specifications:                                                            │
│  • Title: label-md (13px/600), white or gray-800                           │
│  • Divider: 1px solid gray-700 (dark) or gray-200 (light)                  │
│  • Link: body-sm, orange-400 (dark) or orange-500 (light)                  │
│  • Max-width: 320px                                                        │
│                                                                             │
│  Help Tooltip (with icon trigger):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  HRA Exemption ⓘ  ←─── Hover/click triggers tooltip                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Trigger icon: HelpCircle or Info, 14px, gray-400                        │
│  • Hover: gray-600                                                         │
│  • Position: inline, 4px gap from text                                     │
│  • Click on mobile, hover on desktop                                       │
│                                                                             │
│  Animation:                                                                 │
│  • Delay: 300ms before showing (prevents accidental triggers)              │
│  • Enter: fade + scale from 0.95, duration 150ms                           │
│  • Exit: fade, duration 100ms                                              │
│                                                                             │
│  Positioning:                                                               │
│  • Preferred: top                                                          │
│  • Fallback: bottom, left, right (auto-flip to stay in viewport)           │
│  • Offset: 8px from trigger                                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  BUTTONS                                                                    │
│  ───────                                                                    │
│                                                                             │
│  Primary Button:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     [  Review & File →  ]                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: orange-500 (solid) or burn-gradient (premium CTAs)          │
│  • Text: white, label-lg (14px/600)                                        │
│  • Padding: 12px 20px (default), 10px 16px (small), 14px 24px (large)      │
│  • Border-radius: 12px                                                      │
│  • Height: 44px (default), 36px (small), 52px (large)                      │
│  • Hover: orange-600 or opacity 0.9 (gradient)                             │
│  • Active: orange-700, scale 0.98                                          │
│  • Focus: 3px orange-200 ring, 2px offset                                  │
│  • Disabled: opacity 0.5, cursor not-allowed                               │
│                                                                             │
│  Secondary Button:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        [  Save Draft  ]                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: white                                                        │
│  • Border: 1px solid gray-300                                              │
│  • Text: gray-700, label-lg (14px/600)                                     │
│  • Hover: gray-50 background, gray-400 border                              │
│  • Active: gray-100, scale 0.98                                            │
│                                                                             │
│  Ghost Button:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         [  Cancel  ]                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: transparent                                                  │
│  • Text: gray-600, label-lg (14px/500)                                     │
│  • Hover: gray-100 background                                              │
│  • No border                                                               │
│                                                                             │
│  Text Button / Link Button:                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       [+ Add Income]                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: transparent                                                  │
│  • Text: orange-500, label-lg (14px/500)                                   │
│  • Hover: orange-600, underline                                            │
│  • Padding: 8px 12px                                                       │
│                                                                             │
│  Destructive Button:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        [  Delete  ]                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Background: error-500                                                   │
│  • Text: white                                                             │
│  • Hover: error-600                                                        │
│  • Use sparingly, only for destructive actions                             │
│                                                                             │
│  Icon Button:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │    [ 🗑 ]  [ ✏ ]  [ ⋮ ]                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Size: 36px × 36px (default), 32px × 32px (small), 44px × 44px (large)   │
│  • Border-radius: 10px (default) or 50% (circular)                         │
│  • Icon: 18px (default), 16px (small), 20px (large)                        │
│  • Background: transparent                                                  │
│  • Hover: gray-100 background                                              │
│  • Must have aria-label for accessibility                                  │
│                                                                             │
│  Button with Loading State:                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   [ ◌ Submitting... ]                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Spinner: Loader2 icon, 16px, animate-spin                               │
│  • Text: changes to loading text                                           │
│  • Button disabled during loading                                          │
│  • Maintain button width (prevent layout shift)                            │
│                                                                             │
│  Button Group:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │       [ Option A ][ Option B ][ Option C ]                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Connected buttons, shared border                                        │
│  • First: border-radius left only                                          │
│  • Middle: no border-radius                                                │
│  • Last: border-radius right only                                          │
│  • Selected: orange-50 background, orange-500 border                       │
│  • Dividers: 1px solid gray-300                                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  PAGINATION                                                                 │
│  ──────────                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │    [ ← Previous ]   1   2   [3]   4   5   ...   12   [ Next → ]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: flex, centered, gap 4px                                      │
│  • Page number buttons: 36px × 36px, border-radius 8px                     │
│  • Current page: orange-500 background, white text                         │
│  • Other pages: transparent, gray-700 text, hover gray-100                 │
│  • Ellipsis: gray-400, non-interactive                                     │
│  • Prev/Next: secondary button style, include arrow icons                  │
│  • Disabled (first/last page): opacity 0.5                                 │
│                                                                             │
│  Mobile Pagination:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │         [ ← ]    Page 3 of 12    [ → ]                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Simplified: prev/next arrows + "Page X of Y" text                       │
│  • Touch-friendly: 44px min touch target                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Navigation React Components

```tsx
// components/ui/Header/Header.tsx

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  HelpCircle, 
  Menu, 
  ArrowLeft,
  Save,
  FileJson,
  Share2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface HeaderProps {
  itrType: string;
  assessmentYear: string;
  userName: string;
  userAvatar?: string;
  onSaveDraft: () => void;
  onExportJson: () => void;
  onShareWithCA?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({
  itrType,
  assessmentYear,
  userName,
  userAvatar,
  onSaveDraft,
  onExportJson,
  onShareWithCA,
  showBackButton,
  onBack,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const saveOptions = [
    { icon: Save, label: 'Save as Draft', onClick: onSaveDraft },
    { icon: FileJson, label: 'Export as JSON', onClick: onExportJson },
    ...(onShareWithCA ? [{ icon: Share2, label: 'Share with CA', onClick: onShareWithCA }] : []),
    { type: 'divider' as const },
    { icon: Trash2, label: 'Discard Changes', onClick: () => {}, variant: 'destructive' as const },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto px-6">
          {/* Left Section */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-burn-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-heading-md text-gray-800 font-semibold">
                BurnBlack
              </span>
            </Link>

            {/* ITR Type Badge */}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-label-md rounded-lg">
              {itrType}
            </span>

            {/* Assessment Year Selector */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-1 text-body-md text-gray-700 hover:text-gray-900">
                  {assessmentYear}
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              items={[
                { label: 'AY 2024-25', onClick: () => {} },
                { label: 'AY 2023-24', onClick: () => {} },
                { label: 'AY 2022-23', onClick: () => {} },
              ]}
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Save Draft Dropdown */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-body-md text-gray-700 hover:bg-gray-50">
                  <Save className="w-4 h-4" />
                  Save Draft
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              items={saveOptions}
            />

            {/* Help */}
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 pr-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-orange-600 text-label-md font-medium">
                        {userName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-body-md text-gray-700">{userName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              }
              items={[
                { label: 'My Profile', onClick: () => {} },
                { label: 'My Filings', onClick: () => {} },
                { label: 'Settings', onClick: () => {} },
                { type: 'divider' },
                { label: 'Sign Out', onClick: () => {} },
              ]}
              align="end"
            />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-4">
          {showBackButton ? (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <h1 className="text-heading-md text-gray-800">
            {itrType} • {assessmentYear}
          </h1>

          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-600"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Bottom Sheet */}
      <BottomSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        title="Options"
      >
        <div className="py-2">
          {saveOptions.map((option, index) => (
            option.type === 'divider' ? (
              <div key={index} className="h-px bg-gray-200 my-2" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  option.onClick?.();
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3.5 text-left rounded-xl',
                  option.variant === 'destructive' 
                    ? 'text-error-600 hover:bg-error-50' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {option.icon && <option.icon className="w-5 h-5" />}
                <span className="text-body-lg">{option.label}</span>
              </button>
            )
          ))}
        </div>
      </BottomSheet>

      {/* Spacer for fixed header */}
      <div className="h-14 lg:h-16" />
    </>
  );
}
```

```tsx
// components/ui/Breadcrumb/Breadcrumb.tsx

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
}

export function Breadcrumb({ items, maxItems = 4 }: BreadcrumbProps) {
  const shouldCollapse = items.length > maxItems;
  
  const visibleItems = shouldCollapse
    ? [
        items[0],
        { label: '...', href: undefined },
        ...items.slice(-2),
      ]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex items-center gap-1 text-body-md whitespace-nowrap">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              
              {isEllipsis ? (
                <span className="text-gray-400 px-1">...</span>
              ) : isLast ? (
                <span className="text-gray-800 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="text-gray-500 hover:text-gray-700 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

```tsx
// components/ui/Tabs/Tabs.tsx

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
  hasWarning?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeElement = tabRefs.current.get(activeTab);
    if (activeElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeElement.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  return (
    <div 
      ref={containerRef}
      className="relative border-b border-gray-200 overflow-x-auto"
      role="tablist"
    >
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-3 text-body-md font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:bg-gray-50',
              activeTab === tab.id
                ? 'text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5',
                tab.hasWarning ? 'text-warning-500' : 'text-gray-400'
              )}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Animated Indicator */}
      <motion.div
        className="absolute bottom-0 h-0.5 bg-orange-500"
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );
}

// Tab Panel Component
export function TabPanel({
  id,
  activeTab,
  children,
}: {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}) {
  if (activeTab !== id) return null;

  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={id}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
```

```tsx
// components/ui/DropdownMenu/DropdownMenu.tsx

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
} | {
  type: 'divider';
} | {
  type: 'label';
  label: string;
};

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenu({ trigger, items, align = 'start' }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <AnimatePresence>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align={align}
            sideOffset={4}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'min-w-[200px] bg-white rounded-xl border border-gray-200 shadow-elevated p-1',
                'z-50'
              )}
            >
              {items.map((item, index) => {
                if ('type' in item && item.type === 'divider') {
                  return (
                    <DropdownMenuPrimitive.Separator
                      key={index}
                      className="h-px bg-gray-200 my-1"
                    />
                  );
                }

                if ('type' in item && item.type === 'label') {
                  return (
                    <DropdownMenuPrimitive.Label
                      key={index}
                      className="px-3 py-2 text-label-sm text-gray-500 uppercase"
                    >
                      {item.label}
                    </DropdownMenuPrimitive.Label>
                  );
                }

                const menuItem = item as Exclude<MenuItem, { type: 'divider' | 'label' }>;

                return (
                  <DropdownMenuPrimitive.Item
                    key={index}
                    disabled={menuItem.disabled}
                    onClick={menuItem.onClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer outline-none',
                      'transition-colors',
                      {
                        'text-gray-700 hover:bg-gray-50 focus:bg-gray-50':
                          menuItem.variant !== 'destructive',
                        'text-error-600 hover:bg-error-50 focus:bg-error-50':
                          menuItem.variant === 'destructive',
                        'opacity-50 cursor-not-allowed': menuItem.disabled,
                      }
                    )}
                  >
                    {menuItem.icon && (
                      <menuItem.icon className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-body-md">{menuItem.label}</span>
                  </DropdownMenuPrimitive.Item>
                );
              })}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
}
```

```tsx
// components/ui/BottomSheet/BottomSheet.tsx

import { ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  showCloseButton = false,
}: BottomSheetProps) {
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 200) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black-950/50 lg:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px]',
              'shadow-[0_-4px_20px_rgba(0,0,0,0.1)]',
              'max-h-[85vh] overflow-hidden',
              'lg:hidden'
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                {title && (
                  <h2 className="text-heading-md text-gray-800">{title}</h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-4 pb-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

```tsx
// components/ui/Tooltip/Tooltip.tsx

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  variant?: 'dark' | 'light';
  delayDuration?: number;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  variant = 'dark',
  delayDuration = 300,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className={cn(
              'px-3 py-2 rounded-lg text-body-sm max-w-[280px] z-50',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              {
                'bg-gray-900 text-white': variant === 'dark',
                'bg-white text-gray-700 border border-gray-200 shadow-elevated': variant === 'light',
              }
            )}
          >
            {content}
            <TooltipPrimitive.Arrow
              className={cn({
                'fill-gray-900': variant === 'dark',
                'fill-white': variant === 'light',
              })}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Rich Tooltip with title and link
interface RichTooltipProps extends TooltipProps {
  title: string;
  description: string;
  link?: {
    label: string;
    href: string;
  };
}

export function RichTooltip({
  children,
  title,
  description,
  link,
  side = 'top',
  variant = 'dark',
}: RichTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <p className={cn(
            'text-label-md font-semibold',
            variant === 'dark' ? 'text-white' : 'text-gray-800'
          )}>
            {title}
          </p>
          <div className={cn(
            'h-px',
            variant === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <p className={variant === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {description}
          </p>
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-body-sm font-medium',
                variant === 'dark' ? 'text-orange-400 hover:text-orange-300' : 'text-orange-500 hover:text-orange-600'
              )}
            >
              {link.label}
              <span aria-hidden>→</span>
            </a>
          )}
        </div>
      }
      side={side}
      variant={variant}
    >
      {children}
    </Tooltip>
  );
}

// Help Icon with Tooltip
import { HelpCircle } from 'lucide-react';

export function HelpTooltip({
  content,
  title,
  description,
  link,
}: {
  content?: string;
  title?: string;
  description?: string;
  link?: { label: string; href: string };
}) {
  const tooltipContent = title ? (
    <RichTooltip title={title} description={description || ''} link={link}>
      <button className="inline-flex text-gray-400 hover:text-gray-600" aria-label="Help">
        <HelpCircle className="w-4 h-4" />
      </button>
    </RichTooltip>
  ) : (
    <Tooltip content={content}>
      <button className="inline-flex text-gray-400 hover:text-gray-600" aria-label="Help">
        <HelpCircle className="w-4 h-4" />
      </button>
    </Tooltip>
  );

  return tooltipContent;
}
```

```tsx
// components/ui/Button/Button.tsx

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  gradient?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      gradient = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          // Size variants
          {
            'h-9 px-4 text-body-sm': size === 'sm',
            'h-11 px-5 text-body-md': size === 'md',
            'h-13 px-6 text-body-lg': size === 'lg',
          },
          // Style variants
          {
            // Primary
            'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700':
              variant === 'primary' && !gradient,
            'bg-burn-gradient text-white hover:opacity-90':
              variant === 'primary' && gradient,
            // Secondary
            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400':
              variant === 'secondary',
            // Ghost
            'bg-transparent text-gray-600 hover:bg-gray-100':
              variant === 'ghost',
            // Text
            'bg-transparent text-orange-500 hover:text-orange-600 hover:underline px-3':
              variant === 'text',
            // Destructive
            'bg-error-500 text-white hover:bg-error-600':
              variant === 'destructive',
          },
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className={cn(
              'animate-spin',
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            )} />
            {loadingText || children}
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
            {children}
            {RightIcon && <RightIcon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon Button Component
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
  rounded?: boolean;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      size = 'md',
      variant = 'default',
      rounded = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'w-8 h-8': size === 'sm',
            'w-9 h-9': size === 'md',
            'w-11 h-11': size === 'lg',
          },
          rounded ? 'rounded-full' : 'rounded-lg',
          {
            'hover:bg-gray-100 text-gray-600 hover:text-gray-800': variant === 'default',
            'bg-transparent text-gray-500 hover:text-gray-700': variant === 'ghost',
          },
          className
        )}
        {...props}
      >
        <Icon className={cn({
          'w-4 h-4': size === 'sm',
          'w-5 h-5': size === 'md',
          'w-6 h-6': size === 'lg',
        })} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
```

---

# PART 4: PATTERN LIBRARY

## 4.1 Discrepancy Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DISCREPANCY HANDLING PATTERNS                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  Discrepancies between user data and government sources (AIS, 26AS, etc.)  │
│  must be surfaced clearly, explained simply, and resolved easily.           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  INLINE DISCREPANCY INDICATOR                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  Within data rows:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Short Term Capital Gains                    ₹35,000   ⚠ Mismatch  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Warning icon: AlertTriangle, 14px, warning-500                          │
│  • Label: "Mismatch" in warning-500, label-sm                              │
│  • Entire row clickable to expand details                                  │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  EXPANDED DISCREPANCY VIEW                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠ DISCREPANCY DETECTED                                             │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  Short Term Capital Gains (Equity) doesn't match AIS data.          │   │
│  │                                                                     │   │
│  │  ┌───────────────────┬───────────────────┬───────────────────────┐ │   │
│  │  │  YOUR ENTRY       │  AIS DATA         │  DIFFERENCE           │ │   │
│  │  ├───────────────────┼───────────────────┼───────────────────────┤ │   │
│  │  │  ₹35,000          │  ₹42,000          │  ₹7,000               │ │   │
│  │  └───────────────────┴───────────────────┴───────────────────────┘ │   │
│  │                                                                     │   │
│  │  What would you like to do?                                        │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ○  Use AIS value (₹42,000)                                 │   │   │
│  │  │     Recommended if you have no additional documentation     │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │  ○  Keep my value (₹35,000)                                 │   │   │
│  │  │     You may need to provide explanation during assessment   │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │  ○  Enter different value                                   │   │   │
│  │  │     ┌─────────────────────────────────────────────────────┐ │   │   │
│  │  │     │ ₹ │                                                 │ │   │   │
│  │  │     └─────────────────────────────────────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  Add explanation (optional):                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Difference is due to...                                     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │                              [Cancel]  [Resolve Discrepancy]        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Container: warning-50 background, warning-200 border, rounded-xl        │
│  • Header: AlertTriangle icon, heading-sm "DISCREPANCY DETECTED"           │
│  • Comparison table: 3 columns, centered values                            │
│  • Options: radio button group, card-style selection                       │
│  • Selected option: orange-100 background, orange-500 border               │
│  • Explanation field: optional textarea                                    │
│  • Primary CTA: "Resolve Discrepancy"                                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DISCREPANCY SUMMARY BANNER                                                 │
│  ──────────────────────────                                                 │
│                                                                             │
│  Shown at top of ITR screen when discrepancies exist:                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠  3 discrepancies found between your entries and AIS data.       │   │
│  │     Resolving these before filing can help avoid scrutiny.         │   │
│  │                                                      [Review All →] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Use Alert component with variant="warning"                              │
│  • Shows count of unresolved discrepancies                                 │
│  • Links to discrepancy review screen/modal                                │
│  • Dismissible but persists until all resolved                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  RESOLVED STATE                                                             │
│  ──────────────                                                             │
│                                                                             │
│  After resolution:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Short Term Capital Gains                    ₹42,000   ✓ Resolved  │   │
│  │    Using AIS value                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Status badge changes to success state                                   │
│  • Shows which value was used                                              │
│  • Can click to re-open and change resolution                              │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SEVERITY LEVELS                                                            │
│  ───────────────                                                            │
│                                                                             │
│  │ Level    │ Threshold      │ Visual          │ User Action             │
│  ├──────────┼────────────────┼─────────────────┼─────────────────────────│
│  │ Info     │ < ₹1,000       │ info-500 (blue) │ Optional, can ignore    │
│  │ Warning  │ ₹1,000-₹50,000 │ warning-500     │ Recommended to resolve  │
│  │ Critical │ > ₹50,000      │ error-500       │ Must resolve to proceed │
│  └──────────┴────────────────┴─────────────────┴─────────────────────────┘
│                                                                             │
│  Critical discrepancies block filing until resolved.                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Auto-fill & Data Provenance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTO-FILL & DATA PROVENANCE PATTERNS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  Users must always know WHERE their data came from and have full control   │
│  to edit it. Transparency builds trust.                                    │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SOURCE INDICATORS                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  Each data point shows its source via colored chip:                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  │ Source     │ Color   │ Chip Example        │ Icon              │ │   │
│  │  ├────────────┼─────────┼─────────────────────┼───────────────────│ │   │
│  │  │ Form 16    │ #3B82F6 │ [📄 Form 16]        │ FileText          │ │   │
│  │  │ AIS        │ #06B6D4 │ [📊 AIS]            │ FileSearch        │ │   │
│  │  │ 26AS       │ #14B8A6 │ [📋 26AS]           │ FileCheck         │ │   │
│  │  │ Broker     │ #8B5CF6 │ [📈 Zerodha]        │ FileSpreadsheet   │ │   │
│  │  │ Bank       │ #EC4899 │ [🏦 HDFC Bank]      │ Landmark          │ │   │
│  │  │ Manual     │ #737373 │ [✏️ Manual]         │ PenTool           │ │   │
│  │  │ AI/OCR     │ gradient│ [✨ AI Extracted]   │ Sparkles          │ │   │
│  │  └────────────┴─────────┴─────────────────────┴───────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  FIELD-LEVEL PROVENANCE                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Auto-filled field:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Employer Name                                         [📄 Form 16] │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ 📄 Acme Technologies Pvt Ltd                                    ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  Auto-filled from Form 16 uploaded on 15 Jun 2024                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Source chip: positioned inline with label, right-aligned               │
│  • Field background: info-50 (light blue tint)                            │
│  • Prefix icon in field: source icon, info-500                            │
│  • Helper text: mentions source and upload date                           │
│  • Editable: user can click and modify (becomes "Manual" source)          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SECTION-LEVEL PROVENANCE                                                   │
│  ────────────────────────                                                   │
│                                                                             │
│  When entire section is auto-filled:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 SALARY INCOME                                       [📄 Form 16]│   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  ℹ️ This section was auto-filled from your Form 16                  │   │
│  │                                                                     │   │
│  │  Basic + DA                                    ₹4,80,000  📄        │   │
│  │  HRA                                              ₹72,000  📄        │   │
│  │  Special Allowance                                ₹48,000  📄        │   │
│  │  Professional Tax                                 (₹2,400) 📄        │   │
│  │                                                                     │   │
│  │  ✓ All values verified against Form 16                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Section header shows primary source                                     │
│  • Info banner explains auto-fill                                          │
│  • Each row has small source indicator                                     │
│  • Footer confirms verification status                                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  MIXED SOURCES                                                              │
│  ─────────────                                                              │
│                                                                             │
│  When data comes from multiple sources:                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 INCOME                                                          │   │
│  │  Sources: [📄 Form 16] [📊 AIS] [📈 Zerodha] [✏️ Manual]            │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Salary                          ₹6,00,000  📄 Form 16              │   │
│  │  Interest Income                   ₹45,000  📊 AIS                  │   │
│  │  Capital Gains (STCG)              ₹35,000  📈 Zerodha              │   │
│  │  Other Income                      ₹12,000  ✏️ Manual               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  EDITING AUTO-FILLED DATA                                                   │
│  ────────────────────────                                                   │
│                                                                             │
│  When user edits auto-filled value:                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠ You're editing an auto-filled value                             │   │
│  │                                                                     │   │
│  │  Original (Form 16): ₹4,80,000                                      │   │
│  │  Your value: ₹4,50,000                                              │   │
│  │                                                                     │   │
│  │  Reason for change (recommended):                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Corrected as per actual salary slip                         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │               [Revert to Original]  [Save My Value]                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Shows original value for reference                                      │
│  • Prompts for reason (for audit trail)                                    │
│  • Option to revert to original                                            │
│  • Source changes to "Manual (edited)" after save                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  AUDIT TRAIL                                                                │
│  ───────────                                                                │
│                                                                             │
│  Track all data changes:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Data History - Basic Salary                                        │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Today, 3:45 PM                                                     │   │
│  │  Changed from ₹4,80,000 to ₹4,50,000                               │   │
│  │  By: You • Reason: Corrected as per actual salary slip              │   │
│  │                                                                     │   │
│  │  15 Jun 2024, 10:30 AM                                              │   │
│  │  Auto-filled: ₹4,80,000                                             │   │
│  │  Source: Form 16 (Form16_2024.pdf)                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.3 Verification States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VERIFICATION STATES PATTERN                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STATE DEFINITIONS                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  │ State       │ Visual              │ Meaning                            │
│  ├─────────────┼─────────────────────┼────────────────────────────────────│
│  │ Unverified  │ ○ Gray outline      │ Not yet checked/validated          │
│  │ Pending     │ ◷ Clock icon        │ Verification in progress           │
│  │ Verified    │ ✓ Green checkmark   │ Matched with source                │
│  │ Mismatch    │ ⚠ Warning icon      │ Doesn't match source               │
│  │ Failed      │ ✕ Red X             │ Verification failed                │
│  │ Manual      │ ✏️ Pen icon          │ User entered, not verifiable       │
│  └─────────────┴─────────────────────┴────────────────────────────────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  FIELD VERIFICATION INDICATOR                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  Verified:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAN Number                                               ✓ Verified│   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ABCPK1234F                                           ✓         ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  Verified with Income Tax Department                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Green checkmark inside input (right side)                               │
│  • Status label in header                                                  │
│  • Helper text confirms source of verification                             │
│                                                                             │
│  Pending Verification:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAN Number                                            ◷ Verifying  │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ABCPK1234F                                           ◌         ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  Checking with Income Tax Department...                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Spinner icon inside input                                               │
│  • Loading state label                                                     │
│  • Field may be disabled during verification                               │
│                                                                             │
│  Failed Verification:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAN Number                                             ✕ Failed    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ABCPK1234F                                           ✕         ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  ✕ PAN not found or inactive. Please check and re-enter.           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Error state styling (red border, error background)                      │
│  • Clear error message explaining issue                                    │
│  • Focus returns to field for correction                                   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SECTION VERIFICATION STATUS                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  Section card showing verification progress:                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👤 Personal Information                                            │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  ✓ PAN Verified     │  ✓ Aadhaar Linked  │  ◷ Bank Verifying│  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │  Verification: 2/3 complete                                        │   │
│  │  ████████████████████████████████████░░░░░░░░░░░░░░░  67%          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DOCUMENT VERIFICATION STATES                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Form 16 - Part A                                                   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  📄 Form16_PartA_2024.pdf                    ✓ Verified     │   │   │
│  │  │  ─────────────────────────────────────────────────────────  │   │   │
│  │  │  ✓ TAN matches employer record                              │   │   │
│  │  │  ✓ PAN matches your profile                                 │   │   │
│  │  │  ✓ Assessment year is 2024-25                               │   │   │
│  │  │  ✓ Digital signature valid                                  │   │   │
│  │  │  ─────────────────────────────────────────────────────────  │   │   │
│  │  │  12 fields extracted • Last updated today                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Verification checklist:                                                    │
│  • Each verification point shown as checklist item                         │
│  • Green checkmark for passed, red X for failed                            │
│  • Summary of extraction results                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.4 Error Prevention & Validation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ERROR PREVENTION & VALIDATION PATTERNS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  Prevent errors before they happen. When they do happen, help users        │
│  recover quickly with clear, actionable guidance.                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  INLINE VALIDATION                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  Validate as user types (debounced):                                        │
│                                                                             │
│  PAN Format (real-time):                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAN Number                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ABCP                                                            ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  Format: AAAAA0000A (5 letters, 4 numbers, 1 letter)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Show format hint while typing                                           │
│  • Don't show error until user has had chance to complete                  │
│  • Validate format on blur                                                 │
│                                                                             │
│  Error after blur:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PAN Number                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ABCP123                                                  ⚠     ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  ⚠ Invalid PAN format. Expected: AAAAA0000A                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  VALIDATION TIMING                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  │ Validation Type  │ When to Validate   │ Example                       │
│  ├──────────────────┼────────────────────┼───────────────────────────────│
│  │ Format           │ On blur            │ PAN, email, phone             │
│  │ Required         │ On blur + submit   │ Empty required fields         │
│  │ Range            │ On blur            │ Amount limits                 │
│  │ Cross-field      │ On submit          │ Total income = sum of parts   │
│  │ Async            │ On blur (debounced)│ PAN verification              │
│  │ Business logic   │ On submit          │ Deductions <= limits          │
│  └──────────────────┴────────────────────┴───────────────────────────────┘
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  SMART DEFAULTS & SUGGESTIONS                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  Pre-fill with intelligent defaults:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Assessment Year                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ AY 2024-25                                                  ▼  ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  💡 Selected based on current date                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Suggest corrections:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Section 80C Deduction                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ₹ │ 2,00,000                                             ⚠     ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  ⚠ Maximum limit is ₹1,50,000. Did you mean ₹1,50,000?              │   │
│  │  [Yes, use ₹1,50,000]                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  FORM-LEVEL VALIDATION SUMMARY                                              │
│  ─────────────────────────────                                              │
│                                                                             │
│  On submit with errors:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✕ Please fix the following errors before submitting:               │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  Personal Information                                               │   │
│  │    • PAN Number is required                        [Go to field →] │   │
│  │                                                                     │   │
│  │  Income                                                             │   │
│  │    • Salary income cannot be negative              [Go to field →] │   │
│  │    • Capital gains breakdown doesn't match total   [Go to field →] │   │
│  │                                                                     │   │
│  │  Deductions                                                         │   │
│  │    • 80C deduction exceeds limit of ₹1,50,000     [Go to field →] │   │
│  │                                                                     │   │
│  │  3 errors found • Scroll up to see highlighted fields               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Position: Top of form or in modal                                       │
│  • Background: error-50, border error-200                                  │
│  • Icon: XCircle, error-500                                                │
│  • Errors grouped by section                                               │
│  • Each error links to specific field                                      │
│  • Clicking link scrolls to field and focuses it                           │
│  • Field gets error highlight animation (brief pulse)                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CONFIRMATION BEFORE DESTRUCTIVE ACTIONS                                    │
│  ───────────────────────────────────────                                    │
│                                                                             │
│  Deleting data:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Delete Income Source?                       │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  You are about to delete:                                          │   │
│  │  "Salary Income - Acme Technologies"                               │   │
│  │  Amount: ₹6,00,000                                                 │   │
│  │                                                                     │   │
│  │  This will affect your tax calculation. This action cannot         │   │
│  │  be undone.                                                        │   │
│  │                                                                     │   │
│  │                              [Cancel]  [Delete]                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Overwriting auto-filled data:                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ⚠ Overwrite Auto-filled Data?                  │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  You're about to replace data that was automatically extracted     │   │
│  │  from your Form 16.                                                │   │
│  │                                                                     │   │
│  │  Original value: ₹4,80,000 (from Form 16)                          │   │
│  │  New value: ₹4,50,000 (your entry)                                 │   │
│  │                                                                     │   │
│  │  Are you sure this is correct?                                     │   │
│  │                                                                     │   │
│  │              [Keep Original]  [Use My Value]                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  PREVENTING COMMON MISTAKES                                                 │
│  ──────────────────────────                                                 │
│                                                                             │
│  1. Amount Format Assistance:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Salary Income                                                      │   │
│  │  ┌────┬────────────────────────────────────────────────────────────┐│   │
│  │  │ ₹  │ 600000                                                     ││   │
│  │  └────┴────────────────────────────────────────────────────────────┘│   │
│  │  Formatted: ₹6,00,000 (Six Lakh Rupees)                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Show formatted preview as user types                                    │
│  • Display amount in words for large numbers                               │
│  • Auto-format on blur                                                     │
│                                                                             │
│  2. Date Range Validation:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Employment Period                                                  │   │
│  │                                                                     │   │
│  │  From: [01/04/2023]     To: [31/03/2024]                           │   │
│  │                                                                     │   │
│  │  ✓ Valid period for AY 2024-25                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Employment Period                                                  │   │
│  │                                                                     │   │
│  │  From: [01/04/2024]     To: [31/03/2023]                           │   │
│  │                                                                     │   │
│  │  ⚠ End date cannot be before start date                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  3. Deduction Limit Warnings:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Section 80C Investments                                            │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  PPF                                             ₹80,000            │   │
│  │  ELSS                                            ₹50,000            │   │
│  │  Life Insurance                                  ₹30,000            │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Total 80C                                      ₹1,60,000           │   │
│  │  Maximum Allowed                                ₹1,50,000           │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  ⚠ You've exceeded the 80C limit by ₹10,000                        │   │
│  │  Only ₹1,50,000 will be allowed as deduction                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Real-time total calculation                                             │
│  • Warning when approaching limit                                          │
│  • Clear indication of what will actually be allowed                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ERROR RECOVERY                                                             │
│  ──────────────                                                             │
│                                                                             │
│  Undo capability for recent actions:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Income source deleted                                   [Undo]  │   │
│  │  ████████████████████████████████████░░░░░░░░░░░░                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Toast notification with undo button                                     │
│  • 10-second countdown before permanent deletion                           │
│  • Progress bar shows time remaining                                       │
│                                                                             │
│  Session recovery:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️ Unsaved Changes Recovered                                       │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  We found unsaved changes from your last session                   │   │
│  │  (15 Jun 2024, 3:45 PM)                                            │   │
│  │                                                                     │   │
│  │  Would you like to restore them?                                   │   │
│  │                                                                     │   │
│  │             [Discard]  [Restore Changes]                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Auto-save every 30 seconds to local storage                             │
│  • Prompt on return if unsaved changes exist                               │
│  • Show timestamp of recovered data                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.5 Empty & Loading States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EMPTY & LOADING STATES PATTERNS                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LOADING STATES                                                             │
│  ──────────────                                                             │
│                                                                             │
│  1. Initial Page Load:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ░░░░░░  ░░░░░░░░░░░░░░░░                                   │   │   │
│  │  │                                                             │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │   │   │
│  │  │                                                             │   │   │
│  │  │  ░░░░░░░░░░                                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                    │   │
│  │  │ ░░░░░░░░░░ │  │ ░░░░░░░░░░ │  │ ░░░░░░░░░░ │                    │   │
│  │  │ ░░░░░░░░   │  │ ░░░░░░░░   │  │ ░░░░░░░░   │                    │   │
│  │  │ ░░░░░      │  │ ░░░░░      │  │ ░░░░░      │                    │   │
│  │  └────────────┘  └────────────┘  └────────────┘                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Use skeleton loaders matching content layout                            │
│  • Shimmer animation left-to-right                                         │
│  • Maintain layout to prevent content shift                                │
│                                                                             │
│  2. Section Loading (Partial):                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 INCOME DETAILS                                                  │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  Loading income data...                                     │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │   │
│  │  │                                                             │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │   │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Section header visible immediately                                      │
│  • Content area shows skeleton                                             │
│  • Optional loading text                                                   │
│                                                                             │
│  3. Action Loading (Button):                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [ ◌ Saving... ]  →  [ ✓ Saved ]  →  [ Save Draft ]                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Replace button text with loading state                                  │
│  • Show spinner icon                                                       │
│  • Disable button during action                                            │
│  • Brief success state before returning to default                         │
│                                                                             │
│  4. Background Processing:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ✨ Processing Form 16                                      │   │   │
│  │  │  ─────────────────────────────────────────────────────────  │   │   │
│  │  │                                                             │   │   │
│  │  │  ✓ Uploading document                                       │   │   │
│  │  │  ✓ Extracting salary details                                │   │   │
│  │  │  ◌ Verifying TAN with employer records                      │   │   │
│  │  │  ○ Matching with AIS data                                   │   │   │
│  │  │                                                             │   │   │
│  │  │  ████████████████████████████████░░░░░░░░░░░░░░░  65%       │   │   │
│  │  │                                                             │   │   │
│  │  │  This may take a minute. You can continue working.          │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Step-by-step progress indicator                                         │
│  • Completed steps: green checkmark                                        │
│  • Current step: spinner                                                   │
│  • Upcoming steps: gray circle                                             │
│  • Overall progress bar                                                    │
│  • Reassuring message                                                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  EMPTY STATES                                                               │
│  ────────────                                                               │
│                                                                             │
│  1. First-time / No Data:                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           📄                                        │   │
│  │                                                                     │   │
│  │                   No income sources added yet                       │   │
│  │                                                                     │   │
│  │       Start by uploading your Form 16 or adding income manually    │   │
│  │                                                                     │   │
│  │       [📤 Upload Form 16]    or    [+ Add Manually]                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Friendly illustration/icon                                              │
│  • Clear title explaining the empty state                                  │
│  • Guidance on what to do next                                             │
│  • Multiple action paths when applicable                                   │
│                                                                             │
│  2. Search / Filter No Results:                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           🔍                                        │   │
│  │                                                                     │   │
│  │                   No results for "HDFC"                             │   │
│  │                                                                     │   │
│  │          Try a different search term or clear filters               │   │
│  │                                                                     │   │
│  │                       [Clear Search]                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Show the search term that produced no results                           │
│  • Suggest alternatives                                                    │
│  • Easy way to clear and try again                                         │
│                                                                             │
│  3. Section Not Applicable:                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           🏠                                        │   │
│  │                                                                     │   │
│  │              No house property income declared                      │   │
│  │                                                                     │   │
│  │        This section is optional. Add only if you have               │   │
│  │              income from house property.                            │   │
│  │                                                                     │   │
│  │                   [+ Add House Property]                            │   │
│  │                                                                     │   │
│  │                   [Skip this section →]                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Clarify that empty is OK                                                │
│  • Option to add if needed                                                 │
│  • Option to explicitly skip                                               │
│                                                                             │
│  4. Error State:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           ⚠️                                        │   │
│  │                                                                     │   │
│  │                   Unable to load income data                        │   │
│  │                                                                     │   │
│  │        Something went wrong while fetching your data.               │   │
│  │          Please check your connection and try again.                │   │
│  │                                                                     │   │
│  │                        [Try Again]                                  │   │
│  │                                                                     │   │
│  │            If the problem persists, contact support                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Clear error message                                                     │
│  • Actionable recovery option                                              │
│  • Fallback support link                                                   │
│                                                                             │
│  5. Coming Soon / Under Development:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                           🚀                                        │   │
│  │                                                                     │   │
│  │                  ITR-3 Coming Soon                                  │   │
│  │                                                                     │   │
│  │      We're working on support for business income filing.          │   │
│  │         Enter your email to be notified when it's ready.           │   │
│  │                                                                     │   │
│  │       ┌─────────────────────────────────────────────────────┐      │   │
│  │       │ your@email.com                           [Notify Me]│      │   │
│  │       └─────────────────────────────────────────────────────┘      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.6 Tooltips & Contextual Help

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOLTIPS & CONTEXTUAL HELP PATTERNS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  Help should be available exactly when needed, without cluttering the      │
│  interface. Use progressive disclosure - simple tooltips for basics,       │
│  expandable help for complex topics.                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  HELP ICON PLACEMENT                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Field-level help:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HRA Exemption ⓘ                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │ ₹ │ 72,000                                                     ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Help icon: inline with label, after text                                │
│  • Icon: HelpCircle, 14px, gray-400                                        │
│  • Hover/click reveals tooltip                                             │
│                                                                             │
│  Section-level help:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Section 80C Deductions                                     [? Help]│   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Help link: right side of section header                                 │
│  • Opens side panel or modal with detailed help                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  TOOLTIP TYPES                                                              │
│  ─────────────                                                              │
│                                                                             │
│  1. Simple Definition:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  House Rent Allowance - A component of salary given to        │ │   │
│  │  │  employees to meet rental expenses.                           │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │           ▼                                                        │   │
│  │  HRA ⓘ                                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Dark background, white text                                             │
│  • Max 2 lines / 100 characters                                            │
│  • Appears on hover (desktop) or tap (mobile)                              │
│                                                                             │
│  2. Rich Tooltip with Action:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  Section 80C                                                  │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  Allows deductions up to ₹1,50,000 for investments in:       │ │   │
│  │  │  • PPF, EPF                                                  │ │   │
│  │  │  • ELSS Mutual Funds                                         │ │   │
│  │  │  • Life Insurance Premium                                    │ │   │
│  │  │  • NSC, Tax Saving FD                                        │ │   │
│  │  │                                                              │ │   │
│  │  │  [Learn more about 80C →]                                    │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │           ▼                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Light background for complex content                                    │
│  • Title + body text                                                       │
│  • List format for multiple items                                          │
│  • Link to detailed documentation                                          │
│  • Stays open on hover (desktop) until dismissed                           │
│                                                                             │
│  3. Tax Term Glossary:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Your taxable income is ₹8,77,000 under the old regime.            │   │
│  │       ^^^^^^^^^^^^^ (underlined, clickable)                        │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  Taxable Income                                               │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  The portion of your total income on which tax is calculated │ │   │
│  │  │  after all deductions and exemptions are applied.            │ │   │
│  │  │                                                              │ │   │
│  │  │  Formula:                                                    │ │   │
│  │  │  Gross Income - Deductions = Taxable Income                  │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Terms in text underlined with dotted line                               │
│  • Clicking shows definition popover                                       │
│  • Consistent styling throughout app                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CONTEXTUAL HELP PANEL                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  Slide-out panel for detailed help:                                         │
│  ┌────────────────────────────────────────────┬────────────────────────┐   │
│  │                                            │  ✕ Help               │   │
│  │                                            │  ────────────────────│   │
│  │                                            │                      │   │
│  │  Main Content Area                         │  Understanding 80C   │   │
│  │                                            │  Deductions          │   │
│  │                                            │                      │   │
│  │                                            │  Section 80C allows  │   │
│  │                                            │  you to claim        │   │
│  │                                            │  deductions up to    │   │
│  │                                            │  ₹1,50,000...        │   │
│  │                                            │                      │   │
│  │                                            │  Eligible            │   │
│  │                                            │  Investments:        │   │
│  │                                            │  • PPF               │   │
│  │                                            │  • ELSS              │   │
│  │                                            │  • ...               │   │
│  │                                            │                      │   │
│  │                                            │  [📄 Download Guide] │   │
│  │                                            │                      │   │
│  └────────────────────────────────────────────┴────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Width: 320px (desktop)                                                  │
│  • Position: right side, overlays content                                  │
│  • Backdrop: slight dim on main content                                    │
│  • Animation: slide in from right, 200ms                                   │
│  • Close: X button, click outside, Escape key                              │
│                                                                             │
│  Mobile: Full-screen bottom sheet                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  AI-POWERED SUGGESTIONS                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Inline suggestion:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  💡 Tip from BurnBlack                                        │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  You could save ₹15,600 more by investing ₹50,000 in ELSS    │ │   │
│  │  │  under Section 80C. Your current 80C total is ₹1,00,000.     │ │   │
│  │  │                                                              │ │   │
│  │  │  [Add ELSS Investment]              [Dismiss]                │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Styled as card, not intrusive                                           │
│  • Clear value proposition (savings amount)                                │
│  • Action button to implement suggestion                                   │
│  • Dismissible                                                             │
│  • AI/Sparkles icon to indicate smart suggestion                           │
│                                                                             │
│  Regime comparison suggestion:                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ✨ BurnBlack Recommendation                                  │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  Based on your income and deductions, the OLD REGIME         │ │   │
│  │  │  will save you ₹12,500 compared to the new regime.           │ │   │
│  │  │                                                              │ │   │
│  │  │  Why?                                                        │ │   │
│  │  │  • Your 80C deductions (₹1,50,000) are significant           │ │   │
│  │  │  • HRA exemption (₹72,000) not available in new regime       │ │   │
│  │  │                                                              │ │   │
│  │  │  ✓ Old regime selected                    [See Comparison]   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Explains the "why" behind recommendation                                │
│  • Shows factors that influenced recommendation                            │
│  • Links to detailed comparison                                            │
│  • Confirmation of current selection                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  DISCLAIMER DISPLAY                                                         │
│  ─────────────────                                                          │
│                                                                             │
│  Legal disclaimers where required:                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️ Disclaimer: This calculation is for reference only and is      │   │
│  │  based on the information provided. Actual tax liability may vary. │   │
│  │  Consult a qualified CA for complex tax situations.                │   │
│  │                                                    [Find a CA →]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Gray background, subtle styling                                         │
│  • info icon prefix                                                        │
│  • Concise but complete                                                    │
│  • Link to professional help when appropriate                              │
│  • Never hidden or in small print                                          │
│                                                                             │
│  CA Required Warning:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ CA Assistance Recommended                                       │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │  Your tax situation includes:                                      │   │
│  │  • Capital gains from multiple sources                             │   │
│  │  • Foreign income                                                  │   │
│  │                                                                     │   │
│  │  We recommend consulting a Chartered Accountant for accurate       │   │
│  │  filing.                                                           │   │
│  │                                                                     │   │
│  │  [Continue Anyway]                [Connect with CA →]              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Warning styling (orange background)                                     │
│  • Lists specific reasons                                                  │
│  • Option to proceed with acknowledgment                                   │
│  • Prominent CA connection option                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 5: USER FLOW ADAPTATIONS

## 5.1 New User Experience

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEW USER EXPERIENCE PATTERNS                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  New users need guidance without feeling overwhelmed. Focus on progressive │
│  disclosure, smart defaults, and confidence-building at each step.         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ONBOARDING FLOW                                                            │
│  ───────────────                                                            │
│                                                                             │
│  Step 1: Welcome & ITR Type Selection                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🔥 Welcome to BurnBlack                                            │   │
│  │                                                                     │   │
│  │  Let's file your Income Tax Return in minutes.                     │   │
│  │  First, help us understand your income sources.                    │   │
│  │                                                                     │   │
│  │  Do you have... (select all that apply)                            │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ☑ Salary income                                            │   │   │
│  │  │  ☐ Rental income from property                              │   │   │
│  │  │  ☐ Capital gains (stocks, mutual funds, property)           │   │   │
│  │  │  ☐ Freelance / business income                              │   │   │
│  │  │  ☐ Foreign income or assets                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  Based on your selection: ITR-1 (Sahaj)                            │   │
│  │  💡 Simplest form for salaried individuals                          │   │
│  │                                                                     │   │
│  │                                       [Continue →]                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Simple checkbox selection                                               │
│  • Real-time ITR type recommendation                                       │
│  • Explanation of recommended form                                         │
│                                                                             │
│  Step 2: Quick Upload or Manual Entry                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  How would you like to start?                                      │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                        📤                                   │   │   │
│  │  │                                                             │   │   │
│  │  │              Upload Form 16 (Recommended)                   │   │   │
│  │  │                                                             │   │   │
│  │  │   We'll auto-fill 80% of your return in seconds            │   │   │
│  │  │                                                             │   │   │
│  │  │                  [Upload Form 16]                           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │                           or                                        │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                        ✏️                                   │   │   │
│  │  │                                                             │   │   │
│  │  │                   Enter Manually                            │   │   │
│  │  │                                                             │   │   │
│  │  │           I'll fill in my details step by step              │   │   │
│  │  │                                                             │   │   │
│  │  │                   [Start Manual Entry]                      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  [← Back]                                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Clear choice between paths                                              │
│  • Recommended path highlighted                                            │
│  • Value proposition for each option                                       │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  GUIDED MODE                                                                │
│  ───────────                                                                │
│                                                                             │
│  Progress indicator for new users:                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ●────────●────────○────────○────────○                             │   │
│  │  Personal  Income   Deduct.  Review   File                         │   │
│  │                                                                     │   │
│  │  Step 2 of 5: Income Details                                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Linear step progress                                                    │
│  • Current step highlighted                                                │
│  • Step name visible                                                       │
│                                                                             │
│  Guided section with explanations:                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  💰 Income Details                                                  │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  💡 What goes here?                                           │ │   │
│  │  │                                                               │ │   │
│  │  │  Enter all sources of income you received during FY 2023-24  │ │   │
│  │  │  (April 2023 to March 2024). Common sources include:         │ │   │
│  │  │                                                               │ │   │
│  │  │  • Salary from your employer                                 │ │   │
│  │  │  • Interest from savings accounts and FDs                    │ │   │
│  │  │  • Dividends from stocks and mutual funds                    │ │   │
│  │  │                                                               │ │   │
│  │  │  [Got it, let's start]                           [Show less] │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ... form fields ...                                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Expandable explanation at top of each section                           │
│  • Dismissible once user is comfortable                                    │
│  • Returns to compact view on subsequent visits                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  FIRST-TIME TOOLTIPS (Spotlight Tour)                                       │
│  ────────────────────────────────────                                       │
│                                                                             │
│  On first visit to ITR computation screen:                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    ┌────────────────────────────────┐               │   │
│  │  Tax Bar ──────────│ This bar shows your tax       │               │   │
│  │  ████████████      │ calculation in real-time.     │               │   │
│  │                    │ Watch it update as you add    │               │   │
│  │                    │ income and deductions.        │               │   │
│  │                    │                               │               │   │
│  │                    │      [1/4]        [Next →]    │               │   │
│  │                    └────────────────────────────────┘               │   │
│  │                                                                     │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                               │   │
│  │  │ dim  │ │ dim  │ │ dim  │ │ dim  │                               │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Specifications:                                                            │
│  • Highlighted element: normal brightness                                  │
│  • Rest of screen: dimmed overlay (50% opacity)                            │
│  • Tooltip: pointing to highlighted element                                │
│  • Progress: "1/4" indicator                                               │
│  • Navigation: Next, Back, Skip tour                                       │
│  • Persist: Don't show again after completion                              │
│                                                                             │
│  Tour stops:                                                                │
│  1. Tax Computation Bar (real-time calculation)                            │
│  2. Section Cards (click to expand)                                        │
│  3. Regime Toggle (compare old vs new)                                     │
│  4. Save Draft (auto-save + manual)                                        │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CELEBRATION & CONFIDENCE BUILDING                                          │
│  ─────────────────────────────────                                          │
│                                                                             │
│  Progress encouragement:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Personal details complete!                                      │   │
│  │    Your return is 20% complete. Let's add your income next.        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Section completion:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          🎉                                         │   │
│  │                                                                     │   │
│  │                  Income section complete!                           │   │
│  │                                                                     │   │
│  │    Gross Income: ₹10,27,000                                        │   │
│  │    Tax so far: ₹72,500                                             │   │
│  │                                                                     │   │
│  │    Next: Add deductions to reduce your tax                         │   │
│  │                                                                     │   │
│  │                    [Add Deductions →]                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Brief celebration moment                                                │
│  • Summary of what was accomplished                                        │
│  • Preview of tax impact                                                   │
│  • Clear next action                                                       │
│                                                                             │
│  Final submission success:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    🎊 ✓ 🎊                                         │   │
│  │                                                                     │   │
│  │              ITR Successfully Filed!                                │   │
│  │                                                                     │   │
│  │  Acknowledgment Number: ITR-ABC123456789                           │   │
│  │  Filed on: 15 Jun 2024, 4:30 PM                                    │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Expected Refund: ₹22,500                                          │   │
│  │  Regime: Old Regime                                                │   │
│  │  Processing time: 15-45 days                                       │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  [📄 Download ITR-V]    [📧 Email Confirmation]                    │   │
│  │                                                                     │   │
│  │                    [Go to Dashboard]                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.2 Experienced Filer Experience

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXPERIENCED FILER EXPERIENCE                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  Experienced users want speed and efficiency. Remove friction, show        │
│  relevant information upfront, and let them work non-linearly.             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  QUICK START OPTIONS                                                        │
│  ───────────────────                                                        │
│                                                                             │
│  Dashboard for returning users:                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Welcome back, Rahul                                                │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  📄 Continue Draft                                          │   │   │
│  │  │                                                             │   │   │
│  │  │  ITR-2 for AY 2024-25                                       │   │   │
│  │  │  Last edited: 2 hours ago • 60% complete                    │   │   │
│  │  │                                                             │   │   │
│  │  │  [Continue →]                                               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  🔄 Copy from Last Year                                     │   │   │
│  │  │                                                             │   │   │
│  │  │  Pre-fill with your AY 2023-24 data                         │   │   │
│  │  │  Review and update only what's changed                      │   │   │
│  │  │                                                             │   │   │
│  │  │  [Start with Last Year's Data]                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  ➕ Start Fresh                                             │   │   │
│  │  │                                                             │   │   │
│  │  │  Upload new documents or enter manually                     │   │   │
│  │  │                                                             │   │   │
│  │  │  [Start New Return]                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  NON-LINEAR NAVIGATION                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  Default to all-sections view (Breathing Grid):                             │
│  • No step-by-step wizard                                                  │
│  • All sections visible at Summary state                                   │
│  • Click any section to expand and edit                                    │
│  • Jump between sections freely                                            │
│                                                                             │
│  Quick section access:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Keyboard shortcuts (shown on hover):                               │   │
│  │                                                                     │   │
│  │  P - Personal Info    I - Income    D - Deductions                  │   │
│  │  T - TDS/Taxes        B - Bank      C - Computation                 │   │
│  │                                                                     │   │
│  │  Esc - Collapse current section                                     │   │
│  │  Ctrl+S - Save draft                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  YEAR-OVER-YEAR COMPARISON                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  Show changes from last year:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 INCOME                                    vs Last Year          │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Salary Income           ₹6,00,000     ↑ ₹50,000 (+9%)             │   │
│  │  Interest Income           ₹45,000     ↑ ₹12,000 (+36%)            │   │
│  │  Capital Gains             ₹85,000     NEW                          │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Total                  ₹10,30,000     ↑ ₹1,47,000                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Change indicators (↑↓) with percentage                                  │
│  • "NEW" badge for items not in last year                                  │
│  • "REMOVED" badge for items no longer present                             │
│  • Toggle to show/hide comparison                                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  BULK OPERATIONS                                                            │
│  ───────────────                                                            │
│                                                                             │
│  Import multiple documents at once:                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📤 Bulk Upload                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Drag and drop all your documents:                                 │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │     Drop Form 16, AIS, 26AS, Broker Statements here         │   │   │
│  │  │                                                             │   │   │
│  │  │     We'll automatically detect and process each one         │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  Uploaded:                                                          │   │
│  │  ✓ Form16_2024.pdf                          Processed              │   │
│  │  ✓ AIS_2024.pdf                             Processed              │   │
│  │  ◌ Zerodha_PnL.xlsx                         Processing...          │   │
│  │  ○ HDFC_Statement.pdf                       Queued                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ADVANCED FEATURES VISIBLE                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  Show advanced options by default:                                          │
│  • JSON import/export visible                                              │
│  • Version history accessible                                              │
│  • Detailed computation breakdown                                          │
│  • Regime optimizer with what-if analysis                                  │
│                                                                             │
│  What-if analysis:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔮 Tax Optimizer                                                   │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Simulate changes to see tax impact:                               │   │
│  │                                                                     │   │
│  │  If I increase 80C by:  [₹ 50,000        ]                         │   │
│  │                                                                     │   │
│  │  Current Tax:          ₹72,500                                      │   │
│  │  New Tax:              ₹57,000                                      │   │
│  │  ─────────────────────                                             │   │
│  │  You'd save:           ₹15,500                                      │   │
│  │                                                                     │   │
│  │  [Apply this change]   [Try another scenario]                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  MINIMAL HAND-HOLDING                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  For experienced users:                                                     │
│  • Skip onboarding tour                                                    │
│  • Collapse explanation boxes by default                                   │
│  • Show compact tooltips only on hover                                     │
│  • Use terminology without excessive explanation                           │
│  • Provide "Expert mode" toggle if needed                                  │
│                                                                             │
│  Settings preference:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Filing Preferences                                                 │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ☑ Skip guided tour on new returns                                  │   │
│  │  ☑ Start with all sections expanded                                 │   │
│  │  ☑ Show year-over-year comparison                                   │   │
│  │  ☐ Enable keyboard shortcuts                                        │   │
│  │  ☑ Auto-copy from previous year                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.3 CA/Professional Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CA/PROFESSIONAL WORKFLOW                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  CAs handle multiple clients, need efficiency tools, client management,    │
│  and professional features. They value accuracy, audit trails, and         │
│  collaboration features.                                                   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CA DASHBOARD                                                               │
│  ────────────                                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔥 BurnBlack Professional                          [CA: Rajesh K.] │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Quick Stats                                        AY 2024-25      │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │     47     │ │     12     │ │      8     │ │     27     │       │   │
│  │  │   Total    │ │  Pending   │ │ In Review  │ │   Filed    │       │   │
│  │  │  Clients   │ │  Documents │ │            │ │            │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Clients Requiring Attention                         [View All →]   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  Priya Sharma                         ITR-2    ⚠ 2 issues   │   │   │
│  │  │  ABCPS1234F                           ₹15,40,000             │   │   │
│  │  │  Missing: Broker statement, Rent receipts                   │   │   │
│  │  │                                        [Request Docs] [Open] │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │  Amit Patel                           ITR-3    ◷ Pending    │   │   │
│  │  │  AMTPP5678G                           ₹28,60,000             │   │   │
│  │  │  Awaiting client approval                                   │   │   │
│  │  │                                        [Send Reminder] [Open]│   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Recent Activity                                                    │   │
│  │                                                                     │   │
│  │  • Rahul Kumar's ITR filed successfully           2 hours ago      │   │
│  │  • Priya Sharma uploaded Form 16                  5 hours ago      │   │
│  │  • New client request from Suresh Reddy           1 day ago        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CLIENT LIST VIEW                                                           │
│  ────────────────                                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Clients                                    [+ Add Client] [Import] │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  [Search clients...]     [ITR Type ▼] [Status ▼] [Sort: Name ▼]    │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ ☐ │ Client Name      │ PAN        │ ITR │ Income    │Status │   │   │
│  │  ├───┼──────────────────┼────────────┼─────┼───────────┼───────┤   │   │
│  │  │ ☐ │ Rahul Kumar      │ ABCRK1234F │ 2   │ ₹10.27L   │ ✓Filed│   │   │
│  │  │ ☐ │ Priya Sharma     │ ABCPS1234F │ 2   │ ₹15.40L   │ ⚠Issue│   │   │
│  │  │ ☐ │ Amit Patel       │ AMTPP5678G │ 3   │ ₹28.60L   │ ◷Wait │   │   │
│  │  │ ☐ │ Sneha Gupta      │ SNGPT9012H │ 1   │ ₹6.50L    │ Draft │   │   │
│  │  └───┴──────────────────┴────────────┴─────┴───────────┴───────┘   │   │
│  │                                                                     │   │
│  │  Showing 1-20 of 47 clients                    [← Previous] [Next →]│   │
│  │                                                                     │   │
│  │  Bulk Actions: [Request Documents] [Send Reminders] [Export]        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CLIENT FILING VIEW (CA Mode)                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  Additional features visible to CAs:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Filing: Priya Sharma (ABCPS1234F)          [Switch Client ▼]       │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  📋 Document Checklist                               [Expand] │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  ✓ Form 16 Part A & B                      Uploaded          │ │   │
│  │  │  ✓ AIS                                     Fetched           │ │   │
│  │  │  ○ Broker P&L Statement                    MISSING           │ │   │
│  │  │  ○ Rent Receipts                           MISSING           │ │   │
│  │  │  ✓ 80C Proofs                              3 documents       │ │   │
│  │  │                                                              │ │   │
│  │  │  [Request Missing from Client]                               │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  📝 CA Notes (Private)                              [Expand] │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  • Client has foreign assets - verify FEMA compliance        │ │   │
│  │  │  • Rental income TDS not matching - follow up with tenant    │ │   │
│  │  │  • [+ Add Note]                                              │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ... standard Breathing Grid layout ...                            │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  Client Actions                                               │ │   │
│  │  │  ─────────────────────────────────────────────────────────── │ │   │
│  │  │  [Send for Review] [Request Signature] [Mark as Ready]       │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  CLIENT COMMUNICATION                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  Document request to client:                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Request Documents from Priya Sharma                                │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Missing documents:                                                 │   │
│  │  ☑ Broker P&L Statement (for capital gains)                        │   │
│  │  ☑ Rent Receipts (for HRA exemption)                               │   │
│  │  ☐ Bank Statements (optional)                                       │   │
│  │                                                                     │   │
│  │  Message to client            


# PART 5: USER FLOW ADAPTATIONS (Continued)

## 5.3 CA/Professional Workflow (Continued)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CA/PROFESSIONAL WORKFLOW (Continued)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT COMMUNICATION                                                       │
│  • In-app messaging with document requests                                 │
│  • Email notifications with secure upload links                            │
│  • Status updates visible to both CA and client                            │
│  • Audit trail of all communications                                       │
│                                                                             │
│  CLIENT APPROVAL FLOW                                                       │
│  • CA prepares return → Sends for client review                            │
│  • Client views read-only summary → Approves or requests changes           │
│  • E-signature capture before final submission                             │
│  • Confirmation sent to both parties                                       │
│                                                                             │
│  BULK OPERATIONS                                                            │
│  • Multi-select clients for batch actions                                  │
│  • Bulk document requests                                                  │
│  • Bulk status updates                                                     │
│  • Export client list to CSV/Excel                                         │
│                                                                             │
│  CA-SPECIFIC FEATURES                                                       │
│  • Private notes (not visible to client)                                   │
│  • Document checklist per ITR type                                         │
│  • Fee tracking and invoicing integration                                  │
│  • UDIN generation support                                                 │
│  • Multi-CA firm support with role permissions                             │
│                                                                             │
│  HANDOFF INDICATORS                                                         │
│  │ Status          │ Owner    │ Next Action                               │
│  ├─────────────────┼──────────┼───────────────────────────────────────────│
│  │ Draft           │ CA       │ CA preparing return                       │
│  │ Pending Docs    │ Client   │ Waiting for client documents              │
│  │ In Review       │ Client   │ Client reviewing CA's work                │
│  │ Ready to File   │ CA       │ Awaiting CA to submit                     │
│  │ Filed           │ Complete │ ITR submitted                             │
│  └─────────────────┴──────────┴───────────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 6: CURSOR IMPLEMENTATION RULES

## 6.1 File & Folder Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROJECT STRUCTURE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/                                                                       │
│  ├── app/                          # Next.js app router                     │
│  │   ├── (auth)/                   # Auth routes group                      │
│  │   ├── (dashboard)/              # Dashboard routes group                 │
│  │   ├── (filing)/                 # ITR filing routes                      │
│  │   │   └── itr/[type]/[year]/    # Dynamic ITR route                     │
│  │   └── layout.tsx                                                        │
│  │                                                                          │
│  ├── components/                                                            │
│  │   ├── ui/                       # Base UI components                     │
│  │   │   ├── Button/                                                       │
│  │   │   │   ├── Button.tsx                                                │
│  │   │   │   ├── Button.test.tsx                                           │
│  │   │   │   └── index.ts                                                  │
│  │   │   ├── Input/                                                        │
│  │   │   ├── Select/                                                       │
│  │   │   ├── Card/                                                         │
│  │   │   ├── Toast/                                                        │
│  │   │   ├── Tooltip/                                                      │
│  │   │   ├── Dialog/                                                       │
│  │   │   ├── Skeleton/                                                     │
│  │   │   └── ...                                                           │
│  │   │                                                                      │
│  │   ├── layout/                   # Layout components                      │
│  │   │   ├── Header/                                                       │
│  │   │   ├── BreathingGrid/                                                │
│  │   │   ├── TaxComputationBar/                                            │
│  │   │   └── BottomSheet/                                                  │
│  │   │                                                                      │
│  │   ├── sections/                 # ITR section components                 │
│  │   │   ├── PersonalInfo/                                                 │
│  │   │   ├── Income/                                                       │
│  │   │   ├── Deductions/                                                   │
│  │   │   ├── TaxesPaid/                                                    │
│  │   │   ├── BankDetails/                                                  │
│  │   │   └── SectionCard/          # Generic section card wrapper          │
│  │   │                                                                      │
│  │   ├── features/                 # Feature-specific components            │
│  │   │   ├── DocumentUpload/                                               │
│  │   │   ├── DiscrepancyResolver/                                          │
│  │   │   ├── RegimeComparison/                                             │
│  │   │   └── DataProvenance/                                               │
│  │   │                                                                      │
│  │   └── shared/                   # Shared/common components               │
│  │       ├── StatusBadge/                                                  │
│  │       ├── CurrencyDisplay/                                              │
│  │       └── SourceChip/                                                   │
│  │                                                                          │
│  ├── hooks/                        # Custom React hooks                     │
│  │   ├── useBreathingGrid.ts                                               │
│  │   ├── useTaxComputation.ts                                              │
│  │   ├── useAutoSave.ts                                                    │
│  │   └── useDiscrepancies.ts                                               │
│  │                                                                          │
│  ├── lib/                          # Utilities and helpers                  │
│  │   ├── utils.ts                  # cn() and general utils                │
│  │   ├── format.ts                 # Number/currency formatting            │
│  │   ├── validation.ts             # Form validation schemas               │
│  │   ├── motion.ts                 # Framer Motion variants                │
│  │   └── tax-calculator.ts         # Tax computation logic                 │
│  │                                                                          │
│  ├── styles/                                                               │
│  │   ├── globals.css               # Global styles + Tailwind              │
│  │   └── animations.css            # Custom animations                     │
│  │                                                                          │
│  ├── types/                        # TypeScript types                       │
│  │   ├── itr.ts                                                            │
│  │   ├── user.ts                                                           │
│  │   └── api.ts                                                            │
│  │                                                                          │
│  └── store/                        # State management (Zustand)             │
│      ├── useITRStore.ts                                                    │
│      └── useUIStore.ts                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPONENT PATTERNS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COMPONENT FILE STRUCTURE                                                   │
│  ────────────────────────                                                   │
│  Each component folder contains:                                            │
│  ComponentName/                                                             │
│  ├── ComponentName.tsx       # Main component                              │
│  ├── ComponentName.test.tsx  # Tests                                       │
│  ├── ComponentName.stories.tsx # Storybook (optional)                      │
│  └── index.ts                # Re-export                                   │
│                                                                             │
│  COMPONENT TEMPLATE                                                         │
│  ──────────────────                                                         │
│                                                                             │
│  // components/ui/ComponentName/ComponentName.tsx                           │
│                                                                             │
│  import { forwardRef } from 'react';                                        │
│  import { cn } from '@/lib/utils';                                         │
│                                                                             │
│  interface ComponentNameProps {                                             │
│    // Props with JSDoc comments                                            │
│    /** Description of prop */                                              │
│    variant?: 'default' | 'secondary';                                      │
│    // ... other props                                                      │
│  }                                                                          │
│                                                                             │
│  export const ComponentName = forwardRef<HTMLElement, ComponentNameProps>( │
│    ({ variant = 'default', className, ...props }, ref) => {                │
│      return (                                                              │
│        <element                                                            │
│          ref={ref}                                                         │
│          className={cn(                                                    │
│            // Base styles                                                  │
│            'base-classes',                                                 │
│            // Variant styles                                               │
│            {                                                               │
│              'variant-default': variant === 'default',                     │
│              'variant-secondary': variant === 'secondary',                 │
│            },                                                              │
│            className                                                       │
│          )}                                                                │
│          {...props}                                                        │
│        />                                                                  │
│      );                                                                    │
│    }                                                                       │
│  );                                                                        │
│                                                                             │
│  ComponentName.displayName = 'ComponentName';                              │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  COMPOSITION PATTERNS                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  Compound Components (for complex UI):                                      │
│  <Card>                                                                    │
│    <Card.Header>                                                           │
│      <Card.Title>Income Details</Card.Title>                               │
│      <Card.Action onClick={...}>Edit</Card.Action>                         │
│    </Card.Header>                                                          │
│    <Card.Content>...</Card.Content>                                        │
│    <Card.Footer>...</Card.Footer>                                          │
│  </Card>                                                                   │
│                                                                             │
│  Render Props (for flexible rendering):                                     │
│  <DataList                                                                 │
│    items={incomeItems}                                                     │
│    renderItem={(item) => <IncomeRow {...item} />}                          │
│    renderEmpty={() => <EmptyState />}                                      │
│  />                                                                        │
│                                                                             │
│  Controlled vs Uncontrolled:                                                │
│  • Form inputs: Support both (value + onChange OR defaultValue)            │
│  • Use react-hook-form for form state management                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.3 Naming Conventions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAMING CONVENTIONS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FILES & FOLDERS                                                            │
│  ───────────────                                                            │
│  • Components: PascalCase (Button.tsx, SectionCard.tsx)                    │
│  • Hooks: camelCase with 'use' prefix (useAutoSave.ts)                     │
│  • Utils: camelCase (formatCurrency.ts)                                    │
│  • Types: camelCase (itr.ts, user.ts)                                      │
│  • Constants: SCREAMING_SNAKE_CASE in camelCase file                       │
│                                                                             │
│  COMPONENTS                                                                 │
│  ──────────                                                                 │
│  • Component names: PascalCase (TaxComputationBar)                         │
│  • Props interfaces: ComponentNameProps                                    │
│  • Event handlers: onEventName (onClick, onExpand)                         │
│  • Boolean props: isX, hasX, shouldX (isLoading, hasError)                 │
│                                                                             │
│  CSS / TAILWIND                                                             │
│  ─────────────                                                              │
│  • Custom classes: kebab-case (breathing-grid, section-card)               │
│  • CSS variables: --prefix-name (--color-orange-500)                       │
│  • Data attributes: data-state, data-density                               │
│                                                                             │
│  TYPESCRIPT                                                                 │
│  ──────────                                                                 │
│  • Interfaces: PascalCase (ITRData, UserProfile)                           │
│  • Types: PascalCase (CardDensity, ToastType)                              │
│  • Enums: PascalCase with PascalCase members                               │
│  • Generics: Single uppercase or descriptive (T, TItem, TValue)            │
│                                                                             │
│  STATE & VARIABLES                                                          │
│  ─────────────────                                                          │
│  • State: camelCase (isExpanded, selectedRegime)                           │
│  • Refs: camelCase with Ref suffix (inputRef, containerRef)                │
│  • Constants: SCREAMING_SNAKE_CASE (MAX_FILE_SIZE, TAX_SLABS)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.4 Tailwind Configuration

```typescript
// tailwind.config.ts - COMPLETE CONFIGURATION

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // COLORS (from Section 1.2)
      colors: {
        orange: {
          50: '#FFF8F2',
          100: '#FFF0E5',
          400: '#FF8533',
          500: '#FF6B00',
          600: '#E55F00',
          700: '#CC5500',
        },
        gold: {
          50: '#FFFCF2',
          100: '#FFF9E5',
          400: '#FFC933',
          500: '#FFB800',
          600: '#E5A600',
        },
        black: {
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        regime: {
          old: '#6366F1',
          new: '#8B5CF6',
        },
        source: {
          form16: '#3B82F6',
          ais: '#06B6D4',
          '26as': '#14B8A6',
          broker: '#8B5CF6',
          manual: '#737373',
        },
      },

      // TYPOGRAPHY (from Section 1.3)
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'display-md': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'display-sm': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'heading-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'heading-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', fontWeight: '500' }],
        'number-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'number-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'number-sm': ['14px', { lineHeight: '22px', fontWeight: '500' }],
      },

      // SHADOWS (from Section 1.5)
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'elevated': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'floating': '0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)',
        'overlay': '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
      },

      // GRADIENTS
      backgroundImage: {
        'burn-gradient': 'linear-gradient(135deg, #FF6B00 0%, #FFB800 100%)',
      },

      // ANIMATIONS
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      // SPACING (8px grid)
      spacing: {
        '13': '3.25rem', // 52px
        '15': '3.75rem', // 60px
        '18': '4.5rem',  // 72px
      },

      // BORDER RADIUS
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};

export default config;
```

---

## 6.5 Quality Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  QUALITY CHECKLIST - FOR EVERY COMPONENT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FUNCTIONALITY                                                              │
│  ☐ Works in all 3 density states (if applicable)                           │
│  ☐ Handles loading state                                                   │
│  ☐ Handles error state                                                     │
│  ☐ Handles empty state                                                     │
│  ☐ Form validation works correctly                                         │
│  ☐ Data flows correctly (props in, events out)                             │
│                                                                             │
│  VISUAL                                                                     │
│  ☐ Matches design system colors                                            │
│  ☐ Correct typography scale used                                           │
│  ☐ Proper spacing (8px grid)                                               │
│  ☐ Correct shadows and elevation                                           │
│  ☐ Hover/focus/active states implemented                                   │
│  ☐ Animations smooth and purposeful                                        │
│                                                                             │
│  RESPONSIVE                                                                 │
│  ☐ Desktop (≥1280px) - full layout                                         │
│  ☐ Tablet (768-1279px) - adapted layout                                    │
│  ☐ Mobile (<768px) - mobile-first layout                                   │
│  ☐ Touch targets ≥44px on mobile                                           │
│  ☐ No horizontal scroll                                                    │
│                                                                             │
│  ACCESSIBILITY (WCAG 2.1 AA)                                                │
│  ☐ Color contrast ≥4.5:1 for text                                          │
│  ☐ Focus visible on all interactive elements                               │
│  ☐ Keyboard navigable (Tab, Enter, Escape)                                 │
│  ☐ ARIA labels on icons/buttons without text                               │
│  ☐ aria-expanded on expandable elements                                    │
│  ☐ aria-live on dynamic content                                            │
│  ☐ role attributes where needed                                            │
│  ☐ Reduced motion respected                                                │
│                                                                             │
│  PERFORMANCE                                                                │
│  ☐ No unnecessary re-renders (React.memo where needed)                     │
│  ☐ Images optimized and lazy-loaded                                        │
│  ☐ Animations use transform/opacity only                                   │
│  ☐ Large lists virtualized                                                 │
│                                                                             │
│  CODE QUALITY                                                               │
│  ☐ TypeScript types complete (no 'any')                                    │
│  ☐ Props documented with JSDoc                                             │
│  ☐ Error boundaries where needed                                           │
│  ☐ No console errors or warnings                                           │
│  ☐ Follows naming conventions                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.6 Key Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// lib/format.ts
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function parseIndianNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

export function numberToWords(num: number): string {
  // Implementation for Indian number system (Lakh, Crore)
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero';
  if (num >= 10000000) return `${numberToWords(Math.floor(num / 10000000))} Crore ${numberToWords(num % 10000000)}`.trim();
  if (num >= 100000) return `${numberToWords(Math.floor(num / 100000))} Lakh ${numberToWords(num % 100000)}`.trim();
  if (num >= 1000) return `${numberToWords(Math.floor(num / 1000))} Thousand ${numberToWords(num % 1000)}`.trim();
  if (num >= 100) return `${ones[Math.floor(num / 100)]} Hundred ${numberToWords(num % 100)}`.trim();
  if (num >= 20) return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
  if (num >= 10) return teens[num - 10];
  return ones[num];
}

// lib/motion.ts
export const transitions = {
  fast: { duration: 0.1 },
  normal: { duration: 0.2 },
  relaxed: { duration: 0.3 },
  slow: { duration: 0.5 },
  breathing: { duration: 0.4, ease: [0, 0, 0.2, 1] },
};

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  staggerChildren: {
    visible: { transition: { staggerChildren: 0.03 } },
  },
};
```

---

# QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BURNBLACK DESIGN SYSTEM - QUICK REFERENCE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COLORS                                                                     │
│  Primary: orange-500 (#FF6B00)    Success: success-500 (#22C55E)           │
│  Gold: gold-500 (#FFB800)         Error: error-500 (#EF4444)               │
│  Black: black-950 (#0A0A0A)       Warning: warning-500 (#F59E0B)           │
│  Gradient: burn-gradient          Info: info-500 (#3B82F6)                 │
│                                                                             │
│  TYPOGRAPHY                                                                 │
│  Display: display-lg/md/sm        Labels: label-lg/md/sm                   │
│  Headings: heading-lg/md/sm       Numbers: number-lg/md/sm                 │
│  Body: body-lg/md/sm              Font: Inter (sans), JetBrains (mono)     │
│                                                                             │
│  SPACING (8px grid)                                                        │
│  4px (1), 8px (2), 12px (3), 16px (4), 20px (5), 24px (6), 32px (8)        │
│                                                                             │
│  SHADOWS                                                                    │
│  shadow-card → shadow-card-hover → shadow-elevated → shadow-floating       │
│                                                                             │
│  BORDER RADIUS                                                              │
│  Small: 8px | Default: 10px | Large: 12px | XL: 16px | 2XL: 20px           │
│                                                                             │
│  BREAKPOINTS                                                                │
│  Mobile: <768px | Tablet: 768-1279px | Desktop: ≥1280px                    │
│                                                                             │
│  ANIMATION DURATIONS                                                        │
│  Fast: 100ms | Normal: 200ms | Relaxed: 300ms | Breathing: 400ms           │
│                                                                             │
│  BREATHING GRID STATES                                                      │
│  Glance: 72px | Summary: 180-220px | Detailed: max 720px                   │
│                                                                             │
│  KEY COMPONENTS                                                             │
│  SectionCard, TaxComputationBar, BreakdownList, RegimeToggle               │
│  StatusBadge, SourceChip, Toast, Alert, Tooltip, Button                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# END OF BURNBLACK DESIGN SYSTEM v1.0

---

## Final Notes for Cursor Implementation

**When implementing:**

1. **Start with `tailwind.config.ts`** - Copy the complete config first
2. **Set up utility functions** - `lib/utils.ts`, `lib/format.ts`, `lib/motion.ts`
3. **Build base components** - Button, Input, Select, Card, Toast, Tooltip
4. **Build layout components** - Header, BreathingGrid, TaxComputationBar
5. **Build section components** - Use SectionCard as wrapper
6. **Implement patterns** - Discrepancy handling, data provenance, validation

**Always reference:**
- Color tokens from the palette
- Typography scale for all text
- Spacing using 8px grid
- Animation timing from motion system
- Accessibility checklist for every component

**The Breathing Grid is the core innovation** - prioritize getting this right. Everything else builds on top of it.

---

This design system should give Cursor everything needed to implement BurnBlack's UI/UX consistently. Want me to dive deeper into any specific section or create additional implementation examples? 🔥






Ultra-Grade Modern UI Design System
ITR Filing Platform — Complete Design Specification

1.0 DESIGN PHILOSOPHY
1.1 Core Principles
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   "EFFORTLESS PRECISION"                                                    │
│                                                                             │
│   Filing taxes should feel like a premium banking experience —              │
│   sophisticated, trustworthy, and surprisingly simple.                      │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │             │  │             │  │             │  │             │       │
│   │  DENSITY    │  │  CLARITY    │  │  DELIGHT    │  │  TRUST      │       │
│   │             │  │             │  │             │  │             │       │
│   │ Maximum     │  │ Zero        │  │ Micro-      │  │ Professional│       │
│   │ information │  │ ambiguity   │  │ moments     │  │ confidence  │       │
│   │ minimal     │  │ in every    │  │ of joy      │  │ at every    │       │
│   │ space       │  │ interaction │  │ throughout  │  │ step        │       │
│   │             │  │             │  │             │  │             │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
1.2 Design DNA
Attribute
Approach
Density
High-density layouts, no wasted space, every pixel earns its place
Typography
Strong hierarchy, condensed where needed, generous where it aids scanning
Color
Sophisticated restraint with gold accents for premium feel
Motion
Purposeful, physics-based, never decorative-only
Interaction
Immediate feedback, predictable patterns, zero learning curve


2.0 COLOR SYSTEM
2.1 Primary Palette
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PRIMARY BRAND COLORS                                                       │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │                  │  │                  │  │                  │          │
│  │   ██████████     │  │   ██████████     │  │   ██████████     │          │
│  │   ██████████     │  │   ██████████     │  │   ██████████     │          │
│  │   ██████████     │  │   ██████████     │  │   ██████████     │          │
│  │                  │  │                  │  │                  │          │
│  │  GOLD PRIMARY    │  │  GOLD LIGHT      │  │  GOLD DARK       │          │
│  │  #D4A847         │  │  #F2D274         │  │  #B8860B         │          │
│  │                  │  │                  │  │                  │          │
│  │  Primary CTAs    │  │  Hover states    │  │  Active/Pressed  │          │
│  │  Key highlights  │  │  Backgrounds     │  │  Emphasis        │          │
│  │  Progress        │  │  Subtle accents  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                                │
│  │                  │  │                  │                                │
│  │   ██████████     │  │   ▓▓▓▓▓▓▓▓▓▓     │                                │
│  │   ██████████     │  │   ▓▓▓▓▓▓▓▓▓▓     │                                │
│  │   ██████████     │  │   ▓▓▓▓▓▓▓▓▓▓     │                                │
│  │                  │  │                  │                                │
│  │  CHARCOAL        │  │  WARM BLACK      │                                │
│  │  #1A1A1A         │  │  #0D0D0D         │                                │
│  │                  │  │                  │                                │
│  │  Primary text    │  │  Headers         │                                │
│  │  Card borders    │  │  Sidebars        │                                │
│  │  Icons           │  │  Overlays        │                                │
│  └──────────────────┘  └──────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
2.2 Neutral Palette
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  NEUTRALS (Warm-tinted for premium feel)                                    │
│                                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │████████│ │████████│ │▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│ │        │         │
│  │████████│ │████████│ │▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│ │        │         │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                                             │
│  Gray 900   Gray 700   Gray 500   Gray 300   Gray 100   Gray 50            │
│  #1F1F1F    #3D3D3D    #6B6B6B    #A3A3A3    #E5E5E5    #FAFAF9            │
│                                                                             │
│  Headings   Secondary  Tertiary   Disabled   Borders    Background         │
│  Icons      text       text       states     Dividers   Cards              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
2.3 Semantic Colors
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  SEMANTIC PALETTE                                                           │
│                                                                             │
│  SUCCESS                    WARNING                    ERROR                │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │  Base: #10B981   │      │  Base: #F59E0B   │      │  Base: #EF4444   │  │
│  │  Light: #D1FAE5  │      │  Light: #FEF3C7  │      │  Light: #FEE2E2  │  │
│  │  Dark: #047857   │      │  Dark: #B45309   │      │  Dark: #B91C1C   │  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘  │
│                                                                             │
│  • Filed successfully      • Review needed           • Validation error    │
│  • Data matched            • AIS mismatch            • Missing required    │
│  • Verified                • Deadline approaching    • Blocked action      │
│                                                                             │
│  INFO                      HIGHLIGHT                 NEUTRAL ACTION        │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │  Base: #3B82F6   │      │  Base: #8B5CF6   │      │  Base: #6B7280   │  │
│  │  Light: #DBEAFE  │      │  Light: #EDE9FE  │      │  Light: #F3F4F6  │  │
│  │  Dark: #1D4ED8   │      │  Dark: #6D28D9   │      │  Dark: #374151   │  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘  │
│                                                                             │
│  • Educational tips        • Tax savings found       • Secondary actions   │
│  • Help content            • Optimization hints      • Cancel/Back         │
│  • Links                   • Comparisons             • Dismiss             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
2.4 Color Application Matrix
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ELEMENT                          LIGHT MODE          DARK MODE             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Page Background                  #FAFAF9             #0D0D0D              │
│  Card Background                  #FFFFFF             #1A1A1A              │
│  Card Border                      #E5E5E5             #3D3D3D              │
│  Card Hover                       #F5F5F4             #262626              │
│                                                                             │
│  Primary Text                     #1A1A1A             #FAFAF9              │
│  Secondary Text                   #6B6B6B             #A3A3A3              │
│  Tertiary Text                    #A3A3A3             #6B6B6B              │
│                                                                             │
│  Primary Button BG                #D4A847             #D4A847              │
│  Primary Button Text              #0D0D0D             #0D0D0D              │
│  Primary Button Hover             #F2D274             #F2D274              │
│                                                                             │
│  Secondary Button BG              transparent         transparent          │
│  Secondary Button Border          #1A1A1A             #FAFAF9              │
│  Secondary Button Text            #1A1A1A             #FAFAF9              │
│                                                                             │
│  Input Background                 #FFFFFF             #1F1F1F              │
│  Input Border                     #E5E5E5             #3D3D3D              │
│  Input Focus Border               #D4A847             #D4A847              │
│  Input Label                      #6B6B6B             #A3A3A3              │
│                                                                             │
│  Regime Selected Card             #FEF9E7             #2D2510              │
│  Regime Selected Border           #D4A847             #D4A847              │
│                                                                             │
│  Success Background               #D1FAE5             #064E3B              │
│  Warning Background               #FEF3C7             #78350F              │
│  Error Background                 #FEE2E2             #7F1D1D              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
2.5 Gradient System
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PREMIUM GRADIENTS                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████████████████│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  GOLD SHIMMER: linear-gradient(135deg, #F2D274 0%, #D4A847 50%, #B8860B)   │
│  Use: Primary CTA buttons, Progress bars, Selected states                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │████████████████████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  CHARCOAL DEPTH: linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)        │
│  Use: Header, Sidebar, Modal overlays                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  SUBTLE SURFACE: linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)        │
│  Use: Card backgrounds, Hover states                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

3.0 TYPOGRAPHY SYSTEM
3.1 Font Stack
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PRIMARY TYPEFACE: Inter                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Why Inter?                                                                 │
│  • Designed for screens with excellent legibility at small sizes           │
│  • Tabular numbers for financial data alignment                            │
│  • Wide range of weights for clear hierarchy                               │
│  • Free, open-source, Google Fonts available                               │
│                                                                             │
│  SECONDARY TYPEFACE: JetBrains Mono                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Use for:                                                                   │
│  • PAN numbers, Aadhaar (masked)                                           │
│  • Acknowledgement numbers                                                  │
│  • JSON/Code display                                                        │
│  • Amounts in tables (tabular alignment)                                   │
│                                                                             │
│  FALLBACK STACK                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',      │
│               Roboto, Oxygen, Ubuntu, sans-serif;                           │
│                                                                             │
│  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas,          │
│               monospace;                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
3.2 Type Scale
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TYPOGRAPHY SCALE (1.200 — Minor Third)                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Display                                                            │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  48px / 52px / -0.02em / 600                                        │   │
│  │  Use: Hero headlines, Empty states                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  H1 — Page Title                                                    │   │
│  │  ══════════════════════════════════════════════════════             │   │
│  │  28px / 34px / -0.01em / 600                                        │   │
│  │  Use: Main page headings                                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  H2 — Section Header                                                │   │
│  │  ═══════════════════════════════════════════════                    │   │
│  │  22px / 28px / -0.01em / 600                                        │   │
│  │  Use: Card group headers, Modal titles                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  H3 — Card Title                                                    │   │
│  │  ══════════════════════════════════════                             │   │
│  │  17px / 24px / 0 / 600                                              │   │
│  │  Use: Card headers, Subsections                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Body Large — Primary Content                                       │   │
│  │  ═══════════════════════════════                                    │   │
│  │  15px / 24px / 0 / 400                                              │   │
│  │  Use: Primary body text, Descriptions                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Body — Standard Content                                            │   │
│  │  ════════════════════════════                                       │   │
│  │  14px / 22px / 0 / 400                                              │   │
│  │  Use: Table content, Form labels, General UI                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Body Small — Secondary Content                                     │   │
│  │  ═══════════════════════════                                        │   │
│  │  13px / 20px / 0 / 400                                              │   │
│  │  Use: Helper text, Captions, Metadata                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Caption — Tertiary                                                 │   │
│  │  ══════════════════                                                 │   │
│  │  12px / 16px / 0.01em / 400                                         │   │
│  │  Use: Timestamps, Footnotes, Status labels                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  OVERLINE                                                           │   │
│  │  ════════                                                           │   │
│  │  11px / 14px / 0.08em / 500 / UPPERCASE                             │   │
│  │  Use: Section labels, Category tags                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ₹24,80,000   AMOUNT DISPLAY                                        │   │
│  │  ════════════════════════════                                       │   │
│  │  JetBrains Mono / 20px / 28px / 500                                 │   │
│  │  Use: Primary amounts, Totals, Key figures                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
3.3 Type Tokens (CSS Custom Properties)
CSS
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* Font Sizes */
  --text-display: 48px;
  --text-h1: 28px;
  --text-h2: 22px;
  --text-h3: 17px;
  --text-body-lg: 15px;
  --text-body: 14px;
  --text-body-sm: 13px;
  --text-caption: 12px;
  --text-overline: 11px;
  --text-amount: 20px;
  
  /* Line Heights */
  --leading-display: 52px;
  --leading-h1: 34px;
  --leading-h2: 28px;
  --leading-h3: 24px;
  --leading-body-lg: 24px;
  --leading-body: 22px;
  --leading-body-sm: 20px;
  --leading-caption: 16px;
  --leading-overline: 14px;
  
  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;
  --tracking-wider: 0.08em;
}

4.0 SPACING & LAYOUT SYSTEM
4.1 Spacing Scale (4px Base)
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  SPACING TOKENS                                                             │
│                                                                             │
│  ┌────┐                                                                     │
│  │ 4  │  --space-1   Micro gaps (icon to text in badges)                   │
│  └────┘                                                                     │
│  ┌────────┐                                                                 │
│  │   8    │  --space-2   Tight gaps (between related elements)             │
│  └────────┘                                                                 │
│  ┌────────────┐                                                             │
│  │     12     │  --space-3   Compact gaps (form field internal padding)    │
│  └────────────┘                                                             │
│  ┌────────────────┐                                                         │
│  │       16       │  --space-4   Standard gaps (card internal padding)     │
│  └────────────────┘                                                         │
│  ┌────────────────────┐                                                     │
│  │         20         │  --space-5   Comfortable gaps (between cards)      │
│  └────────────────────┘                                                     │
│  ┌────────────────────────┐                                                 │
│  │           24           │  --space-6   Generous gaps (section spacing)   │
│  └────────────────────────┘                                                 │
│  ┌────────────────────────────┐                                             │
│  │             32             │  --space-8   Large gaps (major sections)   │
│  └────────────────────────────┘                                             │
│  ┌────────────────────────────────┐                                         │
│  │               40               │  --space-10  XL gaps (page margins)    │
│  └────────────────────────────────┘                                         │
│  ┌────────────────────────────────────┐                                     │
│  │                 48                 │  --space-12  XXL (section breaks)  │
│  └────────────────────────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
4.2 Reducing Cognitive Load
4.2.1 Information Hierarchy Matrix
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  COGNITIVE LOAD REDUCTION FRAMEWORK                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 1 — GLANCEABLE (< 0.5 sec)                                   │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  • Total income: ₹24.8L                                             │   │
│  │  • Tax due: ₹1.15L                                                  │   │
│  │  • Regime: New (saves ₹31K)                                         │   │
│  │  • Status: 2 items need review                                      │   │
│  │                                                                     │   │
│  │  Visual: Largest typography, Gold highlights, Top of viewport       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 2 — SCANNABLE (2-5 sec)                                      │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  • Card-level summaries                                             │   │
│  │  • Status indicators on each card                                   │   │
│  │  • Income breakdown by head                                         │   │
│  │  • Deduction totals by section                                      │   │
│  │                                                                     │   │
│  │  Visual: Medium typography, Icons, Color-coded status               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 3 — DETAILED (On-demand)                                     │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  • Individual transaction rows                                      │   │
│  │  • Field-level inputs                                               │   │
│  │  • AIS source data                                                  │   │
│  │  • Educational content                                              │   │
│  │                                                                     │   │
│  │  Visual: Revealed on card expansion, smaller typography             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
4.2.2 Progressive Disclosure Pattern
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  COLLAPSED CARD STATE                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💰 Salary Income          ₹18,60,000       ⚠️ Review    [▼ Expand] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Information visible: 4 data points                                         │
│  User action required: None (unless warning)                               │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  PARTIALLY EXPANDED STATE (Summary View)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💰 Salary Income                                       [▲ Collapse] │   │
│  │ ───────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Infosys Ltd           ₹12,40,000    TDS: ₹1,85,000    ✓           │   │
│  │  TCS Ltd               ₹6,20,000     TDS: ₹78,000      ✓           │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │  TOTAL                 ₹18,60,000    TDS: ₹2,63,000                │   │
│  │                                                                     │   │
│  │  ⚠️ AIS shows additional income from ABC Corp — ₹45,000            │   │
│  │                                                    [Review Issue]   │   │
│  │                                                                     │   │
│  │  [+ Add Employer]                            [View Full Details →] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Information visible: ~12 data points                                       │
│  User action required: Only if mismatch exists                             │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  FULLY EXPANDED STATE (Detail View)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💰 Salary Income                                       [▲ Collapse] │   │
│  │ ═══════════════════════════════════════════════════════════════     │   │
│  │                                                                     │   │
│  │  EMPLOYER 1: Infosys Ltd (Apr 24 - Nov 24)                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Gross Salary (17(1))              ₹12,40,000    Form 16 ✓   │   │   │
│  │  │ Perquisites (17(2))               ₹0            Form 16 ✓   │   │   │
│  │  │ Profits in lieu (17(3))           ₹0            Form 16 ✓   │   │   │
│  │  │ ─────────────────────────────────────────────────────────── │   │   │
│  │  │ GROSS                             ₹12,40,000                │   │   │
│  │  │ TDS Deducted                      ₹1,85,000     26AS ✓      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  [...more details...]                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Information visible: All fields for this section                          │
│  User action required: Edit/Verify as needed                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
4.2.3 Cognitive Load Reduction Techniques
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TECHNIQUE 1: SMART DEFAULTS                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Pre-fill everything possible:                                              │
│  • Standard deduction auto-applied                                          │
│  • 80TTA calculated from AIS interest data                                  │
│  • Professional tax from Form 16                                            │
│  • Regime recommendation pre-selected                                       │
│                                                                             │
│  User only needs to verify, not enter                                       │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  TECHNIQUE 2: INLINE VALIDATION                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  80C Investment                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 1,91,000                                                   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  ✓ ₹1,50,000 eligible (max limit)  ⚠️ ₹41,000 exceeds limit      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • No "Submit" to see errors                                               │
│  • Real-time feedback                                                       │
│  • Clear what's used vs what's entered                                     │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  TECHNIQUE 3: CONTEXTUAL ACTIONS                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Show only relevant actions:                                                │
│  • "Add employer" only in Salary card                                       │
│  • "Claim exemption" only when capital gains exist                         │
│  • "Switch regime" only when comparison differs                            │
│                                                                             │
│  Hide until needed:                                                         │
│  • Schedule AL appears only when income > ₹50L                             │
│  • Foreign assets schedule only for residents                              │
│  • Loss carry-forward only if previous losses exist                        │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  TECHNIQUE 4: CHUNKING                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Group related items:                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  INCOME CARDS    │  DEDUCTION CARDS  │  TAX & FILING CARDS           │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  Salary          │  Chapter VI-A     │  Taxes Paid                   │ │
│  │  House Property  │  Exemptions       │  Bank Account                 │ │
│  │  Capital Gains   │  Losses           │  Verification                 │ │
│  │  Other Sources   │                   │                               │ │
│  │  Business        │                   │                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Visual grouping with section headers reduces search time                   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  TECHNIQUE 5: RECOGNITION OVER RECALL                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  What type of capital gain?                                         │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │ 📈              │  │ 🏠              │  │ 🏢              │     │   │
│  │  │ Stocks &        │  │ Property        │  │ Unlisted        │     │   │
│  │  │ Mutual Funds    │  │ Sale            │  │ Shares/ESOP     │     │   │
│  │  │                 │  │                 │  │                 │     │   │
│  │  │ Equity, Debt    │  │ House, Land,    │  │ Startup equity  │     │   │
│  │  │ ETFs, Index     │  │ Plot            │  │ Pre-IPO shares  │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  User picks visually, doesn't need to know "Section 112A vs 112"           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
4.3 Layout Grid System
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  MASTER GRID: 12-Column with Sidebar                                        │
│                                                                             │
│  ┌────┬────────────────────────────────────────────────────────────────┐   │
│  │    │                                                                │   │
│  │ S  │                      MAIN CONTENT AREA                         │   │
│  │ I  │                                                                │   │
│  │ D  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │   │
│  │ E  │   │  Col 1  │ │  Col 2  │ │  Col 3  │ │  Col 4  │             │   │
│  │ B  │   │  (3)    │ │  (3)    │ │  (3)    │ │  (3)    │             │   │
│  │ A  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘             │   │
│  │ R  │                                                                │   │
│  │    │   Gap: 20px (--space-5)                                        │   │
│  │ 64 │                                                                │   │
│  │ px │   Content max-width: 1440px                                    │   │
│  │    │   Content padding: 32px                                        │   │
│  │    │                                                                │   │
│  └────┴────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BREAKPOINTS                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Desktop XL:   ≥1440px   4-column cards, full sidebar                      │
│  Desktop:      ≥1280px   3-column cards, full sidebar                      │
│  Desktop SM:   ≥1024px   2-column cards, collapsed sidebar                 │
│  Tablet:       ≥768px    2-column cards, no sidebar (bottom nav)           │
│  Mobile:       <768px    1-column cards, bottom nav                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
4.4 Density Modes
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  DENSITY TOGGLE (User Preference)                                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Display Density:   ○ Comfortable    ◉ Compact    ○ Expert           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  COMFORTABLE (Default for new users)                                │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  • Card padding: 24px                                               │   │
│  │  • Row height: 48px                                                 │   │
│  │  • More educational content visible                                 │   │
│  │  • Generous touch targets                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  COMPACT (Default after first filing)                               │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  • Card padding: 16px                                               │   │
│  │  • Row height: 40px                                                 │   │
│  │  • Tips collapsed by default                                        │   │
│  │  • More cards visible per viewport                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EXPERT (For CAs and power users)                                   │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  • Card padding: 12px                                               │   │
│  │  • Row height: 36px                                                 │   │
│  │  • All sections visible, minimal tooltips                           │   │
│  │  • Keyboard shortcuts enabled                                       │   │
│  │  • ITR section codes displayed                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

5.0 COMPONENT SPECIFICATIONS
5.1 Cards — The Core Building Block
5.1.1 Card Anatomy
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  CARD STRUCTURE — COLLAPSED                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────┐  ┌────────────────────────┐  ┌─────────────┐  ┌───────┐  │   │
│  │  │ ICON │  │ TITLE                  │  │ AMOUNT      │  │STATUS │  │   │
│  │  │      │  │ subtitle               │  │             │  │       │  │   │
│  │  └──────┘  └────────────────────────┘  └─────────────┘  └───────┘  │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────┐ ┌──────┐ │   │
│  │  │ SUMMARY LINE (e.g., "2 employers, TDS: ₹2.63L")      │ │[Edit]│ │   │
│  │  └──────────────────────────────────────────────────────┘ └──────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Dimensions (Compact Mode):                                                 │
│  • Min height: 88px                                                        │
│  • Padding: 16px                                                           │
│  • Border: 1px solid Gray-100                                              │
│  • Border radius: 12px                                                     │
│  • Background: White                                                       │
│  • Shadow: 0 1px 3px rgba(0,0,0,0.04)                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.1.2 Card States
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  STATE: DEFAULT                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Background: #FFFFFF                                                │   │
│  │  Border: 1px solid #E5E5E5                                          │   │
│  │  Shadow: 0 1px 3px rgba(0,0,0,0.04)                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: HOVER                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Background: #FAFAF9                                                │   │
│  │  Border: 1px solid #D4A847 (gold tint)                              │   │
│  │  Shadow: 0 4px 12px rgba(212,168,71,0.12)                           │   │
│  │  Cursor: pointer                                                    │   │
│  │  Transform: translateY(-1px)                                        │   │
│  │  Transition: all 150ms ease-out                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: EXPANDED                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Background: #FFFFFF                                                │   │
│  │  Border: 1px solid #D4A847                                          │   │
│  │  Border-left: 4px solid #D4A847                                     │   │
│  │  Shadow: 0 8px 24px rgba(0,0,0,0.08)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: HAS WARNING                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Border-left: 4px solid #F59E0B                                     │   │
│  │  Background: linear-gradient(90deg, #FEF3C7 0%, #FFFFFF 8px)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: HAS ERROR                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Border-left: 4px solid #EF4444                                     │   │
│  │  Background: linear-gradient(90deg, #FEE2E2 0%, #FFFFFF 8px)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: COMPLETE                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Status badge: Green checkmark                                      │   │
│  │  Optional: subtle green left border                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE: DISABLED / NOT APPLICABLE                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Background: #FAFAF9                                                │   │
│  │  Opacity: 0.7                                                       │   │
│  │  Pointer-events: none (or show "N/A" reason)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.1.3 Card Expansion Animation
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  EXPANSION SEQUENCE (Total: 300ms)                                          │
│                                                                             │
│  Frame 0ms — Collapsed                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Salary Income        ₹18,60,000        ✓          ▼             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Frame 0-150ms — Height expansion (ease-out)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Salary Income        ₹18,60,000        ✓          ▲             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (content fading in)     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Frame 150-300ms — Content fade-in (ease-in)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Salary Income        ₹18,60,000        ✓          ▲             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  EMPLOYER 1: Infosys Ltd                                            │   │
│  │  Gross Salary: ₹12,40,000                                           │   │
│  │  [...full content...]                                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CSS:                                                                       │
│  .card-content {                                                            │
│    max-height: 0;                                                          │
│    opacity: 0;                                                             │
│    overflow: hidden;                                                       │
│    transition: max-height 150ms ease-out, opacity 150ms ease-in 150ms;     │
│  }                                                                          │
│  .card-content.expanded {                                                   │
│    max-height: 1000px; /* or measured height */                            │
│    opacity: 1;                                                             │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.2 Buttons
5.2.1 Button Hierarchy
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PRIMARY BUTTON — Main CTA (File Return, Proceed, Confirm)                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     ┌───────────────────────────────────────────────────────┐      │   │
│  │     │                                                       │      │   │
│  │     │              FILE RETURN  →                           │      │   │
│  │     │                                                       │      │   │
│  │     └───────────────────────────────────────────────────────┘      │   │
│  │                                                                     │   │
│  │     Background: linear-gradient(135deg, #F2D274, #D4A847, #B8860B) │   │
│  │     Text: #0D0D0D                                                   │   │
│  │     Font: 15px / 600                                                │   │
│  │     Height: 48px                                                    │   │
│  │     Padding: 0 32px                                                 │   │
│  │     Border-radius: 8px                                              │   │
│  │     Shadow: 0 2px 8px rgba(212,168,71,0.3)                          │   │
│  │                                                                     │   │
│  │     Hover: brightness(1.05), shadow increases                       │   │
│  │     Active: brightness(0.95), translateY(1px)                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  SECONDARY BUTTON — Alternative Actions                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     ┌───────────────────────────────────────────────────────┐      │   │
│  │     │                                                       │      │   │
│  │     │              Download JSON                            │      │   │
│  │     │                                                       │      │   │
│  │     └───────────────────────────────────────────────────────┘      │   │
│  │                                                                     │   │
│  │     Background: transparent                                         │   │
│  │     Border: 1.5px solid #1A1A1A                                     │   │
│  │     Text: #1A1A1A                                                   │   │
│  │     Font: 14px / 500                                                │   │
│  │     Height: 44px                                                    │   │
│  │                                                                     │   │
│  │     Hover: Background #1A1A1A, Text #FFFFFF                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  TERTIARY BUTTON — Inline Actions                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     ┌───────────────────────────────────────────────────────┐      │   │
│  │     │  + Add another employer                               │      │   │
│  │     └───────────────────────────────────────────────────────┘      │   │
│  │                                                                     │   │
│  │     Background: transparent                                         │   │
│  │     Border: 1px dashed #A3A3A3                                      │   │
│  │     Text: #6B6B6B                                                   │   │
│  │     Font: 14px / 500                                                │   │
│  │     Height: 40px                                                    │   │
│  │                                                                     │   │
│  │     Hover: Border solid #D4A847, Text #D4A847                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  GHOST BUTTON — Minimal Emphasis                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     Learn more →                                                    │   │
│  │                                                                     │   │
│  │     Background: transparent                                         │   │
│  │     Border: none                                                    │   │
│  │     Text: #D4A847                                                   │   │
│  │     Font: 14px / 500                                                │   │
│  │     Text-decoration: underline on hover                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ICON BUTTON — Compact Actions                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     ┌────┐  ┌────┐  ┌────┐  ┌────┐                                 │   │
│  │     │ ✎ │  │ 🗑 │  │ ↻ │  │ ? │                                 │   │
│  │     └────┘  └────┘  └────┘  └────┘                                 │   │
│  │                                                                     │   │
│  │     Size: 36px × 36px                                               │   │
│  │     Border-radius: 8px                                              │   │
│  │     Background: transparent                                         │   │
│  │     Hover: Background #F5F5F4                                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.2.2 Button Loading States
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  LOADING STATE                                                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │     ┌───────────────────────────────────────────────────────┐        │ │
│  │     │                                                       │        │ │
│  │     │        ◠ Filing Return...                            │        │ │
│  │     │                                                       │        │ │
│  │     └───────────────────────────────────────────────────────┘        │ │
│  │                                                                       │ │
│  │     • Spinner replaces icon (if any)                                 │ │
│  │     • Text changes to action + "..."                                 │ │
│  │     • Button disabled, cursor: wait                                  │ │
│  │     • Opacity: 0.8                                                   │ │
│  │                                                                       │ │
│  │     Spinner animation:                                                │ │
│  │     @keyframes spin {                                                 │ │
│  │       from { transform: rotate(0deg); }                               │ │
│  │       to { transform: rotate(360deg); }                               │ │
│  │     }                                                                 │ │
│  │     animation: spin 1s linear infinite;                               │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SUCCESS STATE (Momentary — 1.5s)                                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │     ┌───────────────────────────────────────────────────────┐        │ │
│  │     │                                                       │        │ │
│  │     │            ✓ Filed Successfully                       │        │ │
│  │     │                                                       │        │ │
│  │     └───────────────────────────────────────────────────────┘        │ │
│  │                                                                       │ │
│  │     Background: #10B981 (success green)                               │ │
│  │     Checkmark scales in with spring animation                         │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.3 Form Inputs
5.3.1 Text Input
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  INPUT STATES                                                               │
│                                                                             │
│  DEFAULT                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Gross Salary (Section 17(1))                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 12,40,000                                                  │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  Source: Form 16                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Height: 44px                                                               │
│  Border: 1px solid #E5E5E5                                                  │
│  Border-radius: 8px                                                         │
│  Background: #FFFFFF                                                        │
│  Padding: 12px 16px                                                         │
│  Font: JetBrains Mono 15px (for amounts)                                   │
│  Label: 13px / 500 / #6B6B6B                                               │
│  Helper: 12px / 400 / #A3A3A3                                              │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  FOCUSED                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Gross Salary (Section 17(1))                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 12,40,000|                                                 │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Border: 2px solid #D4A847                                                  │
│  Shadow: 0 0 0 3px rgba(212,168,71,0.15)                                   │
│  Label: moves up, scales to 11px, color #D4A847                            │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  WITH VALIDATION ERROR                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  80C Investment                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 2,50,000                                                   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  ⚠️ Maximum limit is ₹1,50,000. Only ₹1,50,000 will be considered. │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Border: 1px solid #F59E0B (warning, not error — data is valid)            │
│  Helper: #B45309                                                            │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  READ-ONLY (Pre-filled)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Standard Deduction (auto-applied)                            🔒   │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 75,000                                                     │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Background: #FAFAF9                                                        │
│  Border: 1px solid #E5E5E5                                                  │
│  Cursor: not-allowed                                                        │
│  Lock icon indicates why                                                    │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  WITH AIS COMPARISON                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Interest Income                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹ 38,200                                                     │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  AIS shows: ₹42,580 (Δ ₹4,380)                      [Use AIS Value] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Border: 1px solid #F59E0B                                                  │
│  Inline action to resolve mismatch                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.3.2 Amount Input — Special Handling
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  AMOUNT INPUT COMPONENT                                                     │
│                                                                             │
│  Features:                                                                  │
│  • Indian number formatting (12,40,000)                                     │
│  • Rupee symbol prefix                                                      │
│  • Real-time formatting as user types                                       │
│  • Accepts: 1240000 → displays ₹12,40,000                                  │
│  • Keyboard: Only numbers, backspace, delete, arrows                       │
│  • Tabular figures (monospace numbers)                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────┬────────────────────────────────────────────────────────┐ │   │
│  │  │  ₹   │  12,40,000                                             │ │   │
│  │  └──────┴────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  Prefix box: Background #F5F5F4, Border-right none                  │   │
│  │  Input: Border-left none                                            │   │
│  │  Font: JetBrains Mono 15px                                          │   │
│  │  Text-align: right                                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  QUICK SHORTCUTS                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  ₹ |                                                         │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │  Quick: [Max ₹1.5L] [50K] [1L] [Clear]                             │   │
│  │                                                                     │   │
│  │  Shown below empty fields for common deduction limits               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.3.3 Select / Dropdown
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  SELECT — CLOSED                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Assessment Year                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  2025-26 (FY 2024-25)                                     ▼  │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SELECT — OPEN                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Assessment Year                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  2025-26 (FY 2024-25)                                     ▲  │ │   │
│  │  ├───────────────────────────────────────────────────────────────┤ │   │
│  │  │  ◉ 2025-26 (FY 2024-25)                              Current │ │   │
│  │  │  ○ 2024-25 (FY 2023-24)                               Filed  │ │   │
│  │  │  ○ 2023-24 (FY 2022-23)                               Filed  │ │   │
│  │  │  ○ 2022-23 (FY 2021-22)                               Filed  │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Dropdown animation:                                                        │
│  • Origin: top                                                              │
│  • Scale: 0.95 → 1                                                          │
│  • Opacity: 0 → 1                                                           │
│  • Duration: 150ms ease-out                                                 │
│                                                                             │
│  Max-height: 280px (scrollable)                                             │
│  Shadow: 0 10px 40px rgba(0,0,0,0.15)                                       │
│  Border-radius: 8px                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.4 Data Tables
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TABLE DESIGN — DENSE, SCANNABLE                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CAPITAL GAINS TRANSACTIONS                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Scrip          Buy        Sell       Cost        Sale      Gain   │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │  HDFC Bank      12-Jan-22  15-Aug-24  ₹1,20,000  ₹1,85,000  ↑65K  │   │
│  │  Axis MF        03-Mar-21  22-Nov-24  ₹2,00,000  ₹3,15,000  ↑1.15L │   │
│  │  Tata Motors    18-Sep-24  02-Jan-25  ₹80,000    ₹1,12,000  ↑32K  │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │  TOTAL                                 ₹4,00,000  ₹6,12,000  ↑2.12L │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SPECIFICATIONS                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Header Row:                                                                │
│  • Background: #FAFAF9                                                      │
│  • Font: 12px / 500 / #6B6B6B / UPPERCASE                                  │
│  • Height: 36px                                                            │
│  • Border-bottom: 1px solid #E5E5E5                                        │
│  • Position: sticky                                                         │
│                                                                             │
│  Data Row:                                                                  │
│  • Height: 44px                                                            │
│  • Font: 14px / 400                                                        │
│  • Border-bottom: 1px solid #F5F5F4                                        │
│  • Hover: Background #FAFAF9                                               │
│  • Amounts: JetBrains Mono, right-aligned                                  │
│                                                                             │
│  Total Row:                                                                 │
│  • Background: #FEF9E7 (light gold)                                        │
│  • Font: 14px / 600                                                        │
│  • Border-top: 2px solid #D4A847                                           │
│                                                                             │
│  Gain/Loss Indicators:                                                      │
│  • Gain: #10B981 (green) with ↑                                            │
│  • Loss: #EF4444 (red) with ↓                                              │
│                                                                             │
│  Zebra striping: OFF (cleaner look, hover state sufficient)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.5 Status Badges
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  STATUS BADGE SYSTEM                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌────────────┐  Complete                                           │   │
│  │  │   ✓       │  Background: #D1FAE5                                │   │
│  │  │           │  Text: #047857                                       │   │
│  │  └────────────┘  Icon: Checkmark                                    │   │
│  │                                                                     │   │
│  │  ┌────────────┐  Review Needed                                      │   │
│  │  │   ⚠️      │  Background: #FEF3C7                                │   │
│  │  │           │  Text: #B45309                                       │   │
│  │  └────────────┘  Icon: Warning triangle                             │   │
│  │                                                                     │   │
│  │  ┌────────────┐  Error                                              │   │
│  │  │   ✕       │  Background: #FEE2E2                                │   │
│  │  │           │  Text: #B91C1C                                       │   │
│  │  └────────────┘  Icon: X mark                                       │   │
│  │                                                                     │   │
│  │  ┌────────────┐  In Progress                                        │   │
│  │  │   ◐       │  Background: #DBEAFE                                │   │
│  │  │           │  Text: #1D4ED8                                       │   │
│  │  └────────────┘  Icon: Half-filled circle                           │   │
│  │                                                                     │   │
│  │  ┌────────────┐  Not Applicable                                     │   │
│  │  │   —       │  Background: #F3F4F6                                │   │
│  │  │           │  Text: #6B7280                                       │   │
│  │  └────────────┘  Icon: Dash                                         │   │
│  │                                                                     │   │
│  │  ┌────────────┐  Pre-filled                                         │   │
│  │  │   ⚡      │  Background: #EDE9FE                                │   │
│  │  │           │  Text: #6D28D9                                       │   │
│  │  └────────────┘  Icon: Lightning                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Dimensions:                                                                │
│  • Height: 24px                                                            │
│  • Padding: 4px 8px                                                        │
│  • Border-radius: 6px                                                      │
│  • Font: 12px / 500                                                        │
│  • Icon size: 14px                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.6 Tooltips & Popovers
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TOOLTIP — Brief Hints                                                      │
│                                                                             │
│                    ┌───────────────────────────────────────┐                │
│                    │ Section 80C allows deductions up to   │                │
│                    │ ₹1.5 lakh on specified investments.   │                │
│                    └───────────────────────────────────────┘                │
│                                   ▼                                         │
│                                  ⓘ                                          │
│                                                                             │
│  Trigger: Hover (desktop) / Tap (mobile)                                    │
│  Delay: 300ms (prevents accidental triggers)                                │
│  Max-width: 280px                                                           │
│  Background: #1A1A1A                                                        │
│  Text: #FFFFFF, 13px                                                        │
│  Padding: 8px 12px                                                          │
│  Border-radius: 6px                                                         │
│  Arrow: 6px                                                                 │
│  Animation: fade + scale from 0.95                                          │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  POPOVER — Rich Content                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  📘 Long-Term Capital Gains (LTCG)                           [✕]   │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                     │   │
│  │  Gains from equity held > 12 months.                                │   │
│  │                                                                     │   │
│  │  Tax Rate: 12.5% (above ₹1.25L exemption)                           │   │
│  │                                                                     │   │
│  │  Grandfathering applies for shares bought before 31-Jan-2018.       │   │
│  │                                                                     │   │
│  │  [📄 Read full guide]   [🎬 Watch video]                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Trigger: Click                                                             │
│  Width: 320px                                                               │
│  Background: #FFFFFF                                                        │
│  Shadow: 0 10px 40px rgba(0,0,0,0.15)                                       │
│  Border-radius: 12px                                                        │
│  Padding: 16px                                                              │
│  Dismiss: Click outside, X button, Escape key                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
5.7 Modal System
Modal Hierarchy
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  MODAL SIZE VARIANTS                                                                                │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │   SMALL (400px)          MEDIUM (560px)          LARGE (720px)         FULL (90vw/90vh)    │   │
│  │   ─────────────          ──────────────          ─────────────         ────────────────    │   │
│  │   • Confirmations        • Form inputs           • Complex forms       • Document viewer   │   │
│  │   • Alerts               • Single-task           • Data tables         • Multi-step flow   │   │
│  │   • Quick actions        • File upload           • Comparisons         • Report preview    │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Modal Anatomy — Detailed Spec
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  BACKDROP                                                                                           │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│  Background: rgba(0, 0, 0, 0.65)                                                                    │
│  Backdrop-filter: blur(8px)                                                                         │
│  Animation: fade-in 200ms ease-out                                                                  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  MODAL CONTAINER                                                                            │   │
│  │  ════════════════════════════════════════════════════════════════════════════════════════  │   │
│  │                                                                                             │   │
│  │  Background: #FFFFFF                                                                        │   │
│  │  Border-radius: 16px                                                                        │   │
│  │  Box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),                                         │   │
│  │              0 0 0 1px rgba(212, 175, 55, 0.1)                                              │   │
│  │  Animation: scale(0.95) → scale(1) + translateY(20px) → translateY(0)                      │   │
│  │  Duration: 300ms cubic-bezier(0.16, 1, 0.3, 1)                                              │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  HEADER                                                     Height: 64px            │   │   │
│  │  │  ───────────────────────────────────────────────────────────────────────────────────│   │   │
│  │  │                                                                                     │   │   │
│  │  │  Padding: 0 24px                                                                    │   │   │
│  │  │  Border-bottom: 1px solid #F1F1F1                                                   │   │   │
│  │  │  Display: flex; align-items: center; justify-content: space-between                 │   │   │
│  │  │                                                                                     │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐  ┌─────────────────┐   │   │   │
│  │  │  │  ⚠️ Resolve Data Mismatch                               │  │      ✕          │   │   │   │
│  │  │  │                                                         │  │                 │   │   │   │
│  │  │  │  Icon: 24px, mr: 12px                                   │  │  40×40px        │   │   │   │
│  │  │  │  Title: Inter SemiBold 18px #1A1A1A                     │  │  Border-radius: │   │   │   │
│  │  │  │                                                         │  │  8px            │   │   │   │
│  │  │  │                                                         │  │  Hover: #F5F5F5 │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘  └─────────────────┘   │   │   │
│  │  │                                                                                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  BODY                                                       Flexible height        │   │   │
│  │  │  ───────────────────────────────────────────────────────────────────────────────────│   │   │
│  │  │                                                                                     │   │   │
│  │  │  Padding: 24px                                                                      │   │   │
│  │  │  Max-height: calc(90vh - 64px - 72px)                                               │   │   │
│  │  │  Overflow-y: auto (custom scrollbar)                                                │   │   │
│  │  │                                                                                     │   │   │
│  │  │  Custom Scrollbar:                                                                  │   │   │
│  │  │    Width: 6px                                                                       │   │   │
│  │  │    Track: transparent                                                               │   │   │
│  │  │    Thumb: #E0E0E0, hover: #BDBDBD                                                   │   │   │
│  │  │    Border-radius: 3px                                                               │   │   │
│  │  │                                                                                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  FOOTER                                                     Height: 72px            │   │   │
│  │  │  ───────────────────────────────────────────────────────────────────────────────────│   │   │
│  │  │                                                                                     │   │   │
│  │  │  Padding: 0 24px                                                                    │   │   │
│  │  │  Border-top: 1px solid #F1F1F1                                                      │   │   │
│  │  │  Background: #FAFAFA                                                                │   │   │
│  │  │  Border-radius: 0 0 16px 16px                                                       │   │   │
│  │  │  Display: flex; align-items: center; justify-content: flex-end; gap: 12px           │   │   │
│  │  │                                                                                     │   │   │
│  │  │                                            ┌─────────────┐  ┌─────────────────────┐ │   │   │
│  │  │                                            │   Cancel    │  │  Confirm & Update   │ │   │   │
│  │  │                                            │  Secondary  │  │      Primary        │ │   │   │
│  │  │                                            └─────────────┘  └─────────────────────┘ │   │   │
│  │  │                                                                                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Modal Types — Visual Examples
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TYPE 1: CONFIRMATION MODAL (Small)                                                                 │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌───────────────────────────────────────────────────────────┐                                     │
│  │                                                           │                                     │
│  │            ┌──────────────────────────────┐               │                                     │
│  │            │         ⚠️                   │               │                                     │
│  │            │                              │               │                                     │
│  │            │    Switch Tax Regime?        │               │                                     │
│  │            │                              │               │                                     │
│  │            │  You're about to switch from │               │                                     │
│  │            │  New Regime to Old Regime.   │               │                                     │
│  │            │  All calculations will be    │               │                                     │
│  │            │  updated.                    │               │                                     │
│  │            │                              │               │                                     │
│  │            │  ┌─────────┐ ┌─────────────┐ │               │                                     │
│  │            │  │ Cancel  │ │   Switch    │ │               │                                     │
│  │            │  └─────────┘ └─────────────┘ │               │                                     │
│  │            │                              │               │                                     │
│  │            └──────────────────────────────┘               │                                     │
│  │                                                           │                                     │
│  └───────────────────────────────────────────────────────────┘                                     │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Width: 400px                                                                                     │
│  • Icon: 48px, centered, color matches type (warning: #F59E0B)                                      │
│  • Title: Inter SemiBold 20px, centered, mb: 8px                                                    │
│  • Body: Inter Regular 15px, #666666, centered, mb: 24px                                            │
│  • Buttons: centered, gap: 12px                                                                     │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TYPE 2: FORM MODAL (Medium)                                                                        │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                       ✕     │   │
│  │  ➕ Add Employer Details                                                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                                             │   │
│  │  Employer Name *                                                                            │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Infosys Limited                                                                    │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  Employer TAN *                                          Employment Period                  │   │
│  │  ┌───────────────────────────────────────┐   ┌─────────────────┐ ┌─────────────────────┐   │   │
│  │  │  BLRI12345E                           │   │  Apr 2024   ▾   │ │  Nov 2024       ▾   │   │   │
│  │  └───────────────────────────────────────┘   └─────────────────┘ └─────────────────────┘   │   │
│  │                                               From                 To                       │   │
│  │                                                                                             │   │
│  │  Gross Salary (17(1)) *                      TDS Deducted *                                 │   │
│  │  ┌───────────────────────────────────────┐   ┌─────────────────────────────────────────┐   │   │
│  │  │  ₹  12,40,000                         │   │  ₹  1,85,000                            │   │   │
│  │  └───────────────────────────────────────┘   └─────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                          ┌──────────┐  ┌────────────────┐  │   │
│  │                                                          │  Cancel  │  │  Add Employer  │  │   │
│  │                                                          └──────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Width: 560px                                                                                     │
│  • Form grid: 2 columns with 16px gap                                                               │
│  • Field labels: Inter Medium 13px #666666, mb: 6px                                                 │
│  • Required indicator: * in #D4AF37                                                                 │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TYPE 3: DATA/COMPARISON MODAL (Large)                                                              │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ Resolve Data Mismatch                                                             ✕     │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                                             │   │
│  │  Interest Income from HDFC Bank                                                             │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐       │   │
│  │  │  AS PER AIS                         │     │  AS PER YOUR ENTRY                  │       │   │
│  │  │  ───────────────────────────────────│     │  ───────────────────────────────────│       │   │
│  │  │                                     │     │                                     │       │   │
│  │  │  Savings Account Interest           │     │  Savings Account Interest           │       │   │
│  │  │  ₹42,580                            │ VS  │  ₹38,200                            │       │   │
│  │  │                                     │     │                                     │       │   │
│  │  │  Source: Form 26AS / AIS            │     │  Source: User Entry                 │       │   │
│  │  │                                     │     │                                     │       │   │
│  │  │  ○ Select this                      │     │  ○ Select this                      │       │   │
│  │  └─────────────────────────────────────┘     └─────────────────────────────────────┘       │   │
│  │                                                                                             │   │
│  │  Difference: ₹4,380                                                                         │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  💡 Why might this happen?                                                          │   │   │
│  │  │  • Interest accrued vs credited timing • Joint account attribution • FD maturity   │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  ○ Enter different value:  ┌──────────────────────────────────────────────────────┐ │   │   │
│  │  │                            │  ₹                                                   │ │   │   │
│  │  │                            └──────────────────────────────────────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                        [File AIS Feedback ↗]   [Cancel]  [Confirm & Update] │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Width: 720px                                                                                     │
│  • Comparison cards: equal width, 16px gap, border: 2px solid #E5E5E5                               │
│  • Selected card: border: 2px solid #D4AF37, background: #FFFEF5                                    │
│  • "VS" badge: 32px circle, #F5F5F5 bg, Inter Bold 12px                                             │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

5.8 Data Tables
Table Design System
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TABLE ANATOMY                                                                                      │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  TABLE HEADER                                                                               │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Background: #FAFAFA                                                                        │   │
│  │  Height: 48px                                                                               │   │
│  │  Border-bottom: 2px solid #E5E5E5                                                           │   │
│  │  Font: Inter SemiBold 12px, #666666, text-transform: uppercase, letter-spacing: 0.5px      │   │
│  │  Padding: 0 16px                                                                            │   │
│  │                                                                                             │   │
│  │  ┌───────────────────┬───────────┬───────────┬────────────┬────────────┬─────────────────┐ │   │
│  │  │ SCRIP / FUND  ↕   │ BUY DATE  │ SELL DATE │ BUY VALUE  │ SELL VALUE │ GAIN/LOSS       │ │   │
│  │  └───────────────────┴───────────┴───────────┴────────────┴────────────┴─────────────────┘ │   │
│  │                                                                                             │   │
│  │  Sort indicator: ↕ (neutral), ↑ (asc), ↓ (desc)                                            │   │
│  │  Sort active: color #D4AF37                                                                 │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  TABLE ROWS                                                                                 │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                                             │   │
│  │  Height: 56px                                                                               │   │
│  │  Font: Inter Regular 14px, #1A1A1A                                                          │   │
│  │  Padding: 0 16px                                                                            │   │
│  │  Border-bottom: 1px solid #F1F1F1                                                           │   │
│  │                                                                                             │   │
│  │  States:                                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  DEFAULT         Background: #FFFFFF                                                │   │   │
│  │  │  HOVER           Background: #FAFAFA, cursor: pointer                               │   │   │
│  │  │  SELECTED        Background: #FFFEF5, border-left: 3px solid #D4AF37                │   │   │
│  │  │  ALTERNATE       Background: #FCFCFC (zebra striping - optional)                    │   │   │
│  │  │  ERROR           Background: #FEF2F2, border-left: 3px solid #EF4444                │   │   │
│  │  │  SUCCESS         Background: #F0FDF4, border-left: 3px solid #22C55E                │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  NUMBER FORMATTING                                                                          │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                                             │   │
│  │  Currency:     ₹12,40,000       (Indian format, no decimals for whole numbers)             │   │
│  │  Decimals:     ₹12,40,000.50    (2 decimal places when needed)                             │   │
│  │  Percentages:  12.5%            (1 decimal place)                                          │   │
│  │  Dates:        15-Aug-2024      (DD-MMM-YYYY)                                              │   │
│  │                                                                                             │   │
│  │  Positive:     +₹65,000         Color: #22C55E                                             │   │
│  │  Negative:     -₹12,000         Color: #EF4444                                             │   │
│  │  Alignment:    Numbers right-aligned, Text left-aligned                                    │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Compact Table Example (Capital Gains)
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  📊 Listed Equity & Equity Mutual Funds                                          [+ Add Entry]     │
│                                                                                                     │
│  ┌────────────────────┬───────────┬───────────┬────────────┬────────────┬────────────┬──────────┐  │
│  │ SCRIP / FUND       │ BUY DATE  │ SELL DATE │  BUY VALUE │ SELL VALUE │  GAIN/LOSS │ TYPE     │  │
│  ├────────────────────┼───────────┼───────────┼────────────┼────────────┼────────────┼──────────┤  │
│  │ ▣ HDFC Bank Ltd    │ 12-Jan-22 │ 15-Aug-24 │ ₹1,20,000  │ ₹1,85,000  │ +₹65,000   │ LTCG ⓘ  │  │
│  │   BSE: 500180      │           │           │            │            │            │ 12.5%    │  │
│  ├────────────────────┼───────────┼───────────┼────────────┼────────────┼────────────┼──────────┤  │
│  │ ▣ Axis Bluechip MF │ 03-Mar-21 │ 22-Nov-24 │ ₹2,00,000  │ ₹3,15,000  │ +₹1,15,000 │ LTCG     │  │
│  │   ISIN: INF123     │           │           │            │            │            │ 12.5%    │  │
│  ├────────────────────┼───────────┼───────────┼────────────┼────────────┼────────────┼──────────┤  │
│  │ ▣ Tata Motors Ltd  │ 18-Sep-24 │ 02-Jan-25 │ ₹80,000    │ ₹1,12,000  │ +₹32,000   │ STCG ⓘ  │  │
│  │   BSE: 500570      │           │           │            │            │            │ 20%      │  │
│  ├────────────────────┼───────────┼───────────┼────────────┼────────────┼────────────┼──────────┤  │
│  │ ☐ Parag Parikh MF  │ 05-May-24 │ 10-Feb-25 │ ₹1,50,000  │ ₹1,80,000  │ +₹30,000   │ STCG     │  │
│  │   ISIN: INF879     │           │           │            │            │    ⚠️      │ 20%      │  │
│  └────────────────────┴───────────┴───────────┴────────────┴────────────┴────────────┴──────────┘  │
│                                                                                                     │
│  ⚠️ 1 transaction needs review: AIS shows different sale value                [Review Now]         │
│                                                                                                     │
│  Showing 4 of 12 transactions                                           [Load More] or [View All]  │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

  Specs:
  • Row height: 56px (2-line content) or 48px (single line)
  • Checkbox column: 48px fixed width
  • Primary column (Scrip name): flex: 2, includes sub-label
  • Sub-label: Inter Regular 12px, #999999
  • Numeric columns: fixed width 100-120px, right-aligned
  • Type column: includes tax badge
  • Tax badge: 10px font, uppercase, #666666



5.9 Progress Indicators
Filing Progress Bar (Top of Computation Screen)
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  PROGRESS BAR ANATOMY                                                                               │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  Filing Progress                                                        78% Complete       │   │
│  │                                                                                             │   │
│  │  ┌────────────────────────────────────────────────────────────────────┬────────────────┐   │   │
│  │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│░░░░░░░░░░░░░░░░│   │   │
│  │  └────────────────────────────────────────────────────────────────────┴────────────────┘   │   │
│  │                                                                                             │   │
│  │  7 of 9 sections complete  •  2 items need review                                          │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Container: Height 64px, Background: #FAFAFA, border-radius: 12px                                 │
│  • Progress track: Height 8px, Background: #E5E5E5, border-radius: 4px                              │
│  • Progress fill: Background: linear-gradient(90deg, #D4AF37, #F5D76E)                              │
│  • Animation: width transition 500ms ease-out                                                       │
│  • Label top: Inter Medium 14px #1A1A1A                                                             │
│  • Percentage: Inter Bold 14px #D4AF37                                                              │
│  • Label bottom: Inter Regular 13px #666666                                                         │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Section Status Indicators
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  STATUS BADGE SYSTEM                                                                                │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ✓ Complete      │   Background: #F0FDF4, Border: 1px solid #22C55E                     │   │
│  │  │                  │   Icon: 16px #22C55E, Text: Inter Medium 12px #166534                │   │
│  │  └──────────────────┘   Height: 28px, Padding: 0 12px, Border-radius: 14px                 │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ⚠️ Review       │   Background: #FFFBEB, Border: 1px solid #F59E0B                     │   │
│  │  │                  │   Icon: 16px #F59E0B, Text: Inter Medium 12px #92400E                │   │
│  │  └──────────────────┘                                                                       │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ○ Incomplete    │   Background: #F5F5F5, Border: 1px solid #D4D4D4                     │   │
│  │  │                  │   Icon: 16px #9CA3AF, Text: Inter Medium 12px #666666                │   │
│  │  └──────────────────┘                                                                       │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ✓ N/A           │   Background: #FAFAFA, Border: 1px solid #E5E5E5                     │   │
│  │  │                  │   Icon: 16px #9CA3AF, Text: Inter Medium 12px #9CA3AF                │   │
│  │  └──────────────────┘                                                                       │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ✕ Error         │   Background: #FEF2F2, Border: 1px solid #EF4444                     │   │
│  │  │                  │   Icon: 16px #EF4444, Text: Inter Medium 12px #991B1B                │   │
│  │  └──────────────────┘                                                                       │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐                                                                       │   │
│  │  │  ⟳ Processing    │   Background: #EFF6FF, Border: 1px solid #3B82F6                     │   │
│  │  │                  │   Icon: 16px #3B82F6 (animated spin), Text: #1E40AF                  │   │
│  │  └──────────────────┘                                                                       │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

5.10 Loading States
Skeleton Screens
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  SKELETON PATTERN — CARD LOADING                                                                    │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  ████████████████████████                                    ░░░░░░░░░░░░░░░░░░░░░  │  │   │
│  │  │  ████████████████                                                                   │  │   │
│  │  │                                                                                      │  │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │   │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                                       │  │   │
│  │  │                                                                                      │  │   │
│  │  │  ████████████                              ████████████                              │  │   │
│  │  └──────────────────────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                                             │   │
│  │  ████ = Shimmer element (animated)                                                          │   │
│  │  ░░░░ = Static skeleton                                                                     │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Base color: #F1F1F1                                                                              │
│  • Shimmer gradient: linear-gradient(90deg, #F1F1F1 0%, #E5E5E5 50%, #F1F1F1 100%)                  │
│  • Animation: translateX(-100%) → translateX(100%), 1.5s infinite                                   │
│  • Border-radius: 4px (text), 8px (images), matches actual element                                  │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Inline Loading Spinner
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  SPINNER VARIANTS                                                                                   │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │   BUTTON LOADING              INLINE LOADING              FULL SCREEN LOADING              │   │
│  │   ─────────────────           ──────────────              ────────────────────             │   │
│  │                                                                                             │   │
│  │   ┌─────────────────────┐     Fetching AIS data ◠        ┌─────────────────────┐           │   │
│  │   │  ◠  Filing...       │                                │                     │           │   │
│  │   └─────────────────────┘     Spinner: 16px              │         ◠           │           │   │
│  │                               Right of text              │                     │           │   │
│  │   Spinner: 18px                                          │  Fetching your      │           │   │
│  │   Replaces button text                                   │  tax data...        │           │   │
│  │   Button disabled                                        │                     │           │   │
│  │                                                          │  This may take      │           │   │
│  │                                                          │  up to 30 seconds   │           │   │
│  │                                                          │                     │           │   │
│  │                                                          └─────────────────────┘           │   │
│  │                                                           Spinner: 48px                    │   │
│  │                                                           Backdrop: blur                   │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Spinner Animation:                                                                                 │
│  • SVG circle with stroke-dasharray animation                                                       │
│  • Duration: 1.4s                                                                                   │
│  • Easing: linear                                                                                   │
│  • Color: #D4AF37 (primary), #1A1A1A (on light bg), #FFFFFF (on dark bg)                           │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

5.11 Empty States
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  EMPTY STATE PATTERN                                                                                │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │                              ┌───────────────────────────────┐                              │   │
│  │                              │                               │                              │   │
│  │                              │        ┌─────────────┐        │                              │   │
│  │                              │        │   📊        │        │                              │   │
│  │                              │        │             │        │                              │   │
│  │                              │        └─────────────┘        │                              │   │
│  │                              │                               │                              │   │
│  │                              │   No capital gains found      │                              │   │
│  │                              │                               │                              │   │
│  │                              │   We didn't find any capital  │                              │   │
│  │                              │   gains transactions in your  │                              │   │
│  │                              │   AIS data. You can add them  │                              │   │
│  │                              │   manually if you have any.   │                              │   │
│  │                              │                               │                              │   │
│  │                              │      [+ Add Transaction]      │                              │   │
│  │                              │                               │                              │   │
│  │                              └───────────────────────────────┘                              │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Specs:                                                                                             │
│  • Container: centered, max-width 400px, padding 48px                                               │
│  • Illustration/Icon: 64px, color #D4D4D4, mb: 24px                                                 │
│  • Title: Inter SemiBold 18px #1A1A1A, mb: 8px                                                      │
│  • Description: Inter Regular 14px #666666, text-align center, mb: 24px                             │
│  • CTA: Primary or Secondary button                                                                 │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

5.12 Notification & Alert System
Toast Notifications
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TOAST NOTIFICATION TYPES                                                                           │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  Position: Top-right, 24px from edges                                                               │
│  Max-width: 400px                                                                                   │
│  Animation: slideIn from right + fadeIn, 300ms                                                      │
│  Auto-dismiss: 5s (info/success), manual (error/warning)                                            │
│  Stack: max 3 visible, newest on top                                                                │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  SUCCESS                                                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │ ✓  Form 16 uploaded successfully                                              ✕      │ │   │
│  │  │    Extracted: ₹12,40,000 income, ₹1,85,000 TDS                                       │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFFFF, Border-left: 4px solid #22C55E                                       │   │
│  │  Icon: #22C55E                                                                             │   │
│  │                                                                                             │   │
│  │  ERROR                                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │ ✕  Unable to fetch AIS data                                                   ✕      │ │   │
│  │  │    Income tax portal is currently unavailable. Try again later.   [Retry]           │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFFFF, Border-left: 4px solid #EF4444                                       │   │
│  │  Icon: #EF4444                                                                             │   │
│  │                                                                                             │   │
│  │  WARNING                                                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │ ⚠  Mismatch detected in salary income                                        ✕      │ │   │
│  │  │    AIS shows ₹45,000 more than Form 16.                           [Review Now]       │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFFFF, Border-left: 4px solid #F59E0B                                       │   │
│  │  Icon: #F59E0B                                                                             │   │
│  │                                                                                             │   │
│  │  INFO                                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │ ℹ  Draft saved automatically                                                  ✕      │ │   │
│  │  │    Your progress has been saved. You can continue later.                             │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFFFF, Border-left: 4px solid #3B82F6                                       │   │
│  │  Icon: #3B82F6                                                                             │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Toast Anatomy:                                                                                     │
│  • Height: auto (min 56px)                                                                          │
│  • Padding: 16px                                                                                    │
│  • Border-radius: 12px                                                                              │
│  • Box-shadow: 0 10px 40px rgba(0,0,0,0.12)                                                         │
│  • Icon: 20px, mr: 12px                                                                             │
│  • Title: Inter Medium 14px #1A1A1A                                                                 │
│  • Description: Inter Regular 13px #666666                                                          │
│  • Action button: Ghost style, 13px                                                                 │
│  • Close: 20×20px, top-right, hover: #F5F5F5 bg                                                     │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Inline Alerts (Within Cards)
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  INLINE ALERT TYPES                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  INFO CALLOUT                                                                               │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │  💡 LTCG on equity above ₹1.25 lakh is taxable at 12.5%                               │ │   │
│  │  │     Grandfathering applies for shares held before 31-Jan-2018.      [Learn More →]   │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFEF5 (gold tint)                                                            │   │
│  │  Border: 1px solid #F5D76E                                                                  │   │
│  │  Border-radius: 8px                                                                         │   │
│  │  Padding: 12px 16px                                                                         │   │
│  │  Icon: 20px #D4AF37                                                                         │   │
│  │  Text: Inter Regular 13px #7C6A2F                                                           │   │
│  │                                                                                             │   │
│  │  WARNING CALLOUT                                                                            │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │  ⚠️ AIS shows additional income not in your Form 16                                   │ │   │
│  │  │     Salary from "ABC Consultants" — ₹45,000 (TDS: ₹4,500)           [Add Income]      │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FFFBEB                                                                        │   │
│  │  Border: 1px solid #FCD34D                                                                  │   │
│  │  Icon: 20px #F59E0B                                                                         │   │
│  │  Text: Inter Regular 13px #92400E                                                           │   │
│  │                                                                                             │   │
│  │  ERROR CALLOUT                                                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │  ✕  Bank account not pre-validated                                                    │ │   │
│  │  │     Refund cannot be processed to unvalidated accounts.       [Validate Now →]       │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #FEF2F2                                                                        │   │
│  │  Border: 1px solid #FECACA                                                                  │   │
│  │  Icon: 20px #EF4444                                                                         │   │
│  │  Text: Inter Regular 13px #991B1B                                                           │   │
│  │                                                                                             │   │
│  │  SUCCESS CALLOUT                                                                            │   │
│  │  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │  ✓  All income sources verified against AIS                                          │ │   │
│  │  │     No mismatches found. You're good to proceed!                                      │ │   │
│  │  └───────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  │  Background: #F0FDF4                                                                        │   │
│  │  Border: 1px solid #BBF7D0                                                                  │   │
│  │  Icon: 20px #22C55E                                                                         │   │
│  │  Text: Inter Regular 13px #166534                                                           │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

6.0 ANIMATION & MOTION SYSTEM
6.1 Core Animation Principles
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  MOTION PHILOSOPHY                                                                                  │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  1. PURPOSEFUL                                                                              │   │
│  │     Every animation serves a function — guiding attention, showing relationships,          │   │
│  │     or providing feedback. No decorative-only animations.                                  │   │
│  │                                                                                             │   │
│  │  2. FAST & RESPONSIVE                                                                       │   │
│  │     UI should feel snappy. Most interactions complete within 200-300ms.                    │   │
│  │     Users should never wait for animations.                                                │   │
│  │                                                                                             │   │
│  │  3. NATURAL & SMOOTH                                                                        │   │
│  │     Use easing curves that mimic real-world physics.                                       │   │
│  │     Elements accelerate and decelerate naturally.                                          │   │
│  │                                                                                             │   │
│  │  4. CONSISTENT                                                                              │   │
│  │     Same type of action = same type of animation across the platform.                      │   │
│  │     Users learn the visual language.                                                       │   │
│  │                                                                                             │   │
│  │  5. ACCESSIBLE                                                                              │   │
│  │     Respect prefers-reduced-motion. Critical information never hidden behind animation.   │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
6.2 Timing & Easing Tokens
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  DURATION TOKENS                                                                                    │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  --duration-instant:    100ms    // Micro-interactions (button press, toggle)                      │
│  --duration-fast:       150ms    // Small UI changes (hover states, focus)                         │
│  --duration-normal:     200ms    // Standard transitions (dropdowns, tooltips)                     │
│  --duration-moderate:   300ms    // Medium complexity (modal open, card expand)                    │
│  --duration-slow:       400ms    // Large transitions (page change, complex reveals)               │
│  --duration-slower:     500ms    // Emphasis animations (success celebrations)                     │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  EASING TOKENS                                                                                      │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  --ease-default:        cubic-bezier(0.4, 0, 0.2, 1)      // Standard ease-in-out                  │
│  --ease-in:             cubic-bezier(0.4, 0, 1, 1)        // Accelerate (exit)                     │
│  --ease-out:            cubic-bezier(0, 0, 0.2, 1)        // Decelerate (enter)                    │
│  --ease-spring:         cubic-bezier(0.16, 1, 0.3, 1)     // Bouncy, natural (modals, cards)       │
│  --ease-bounce:         cubic-bezier(0.34, 1.56, 0.64, 1) // Playful overshoot (success)           │
│  --ease-linear:         linear                             // Continuous (loading spinners)         │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  USAGE MATRIX                                                                                       │
│                                                                                                     │
│  ┌─────────────────────────────────────┬─────────────────┬────────────────────────────────────────┐│
│  │ Interaction Type                    │ Duration        │ Easing                                 ││
│  ├─────────────────────────────────────┼─────────────────┼────────────────────────────────────────┤│
│  │ Button hover/press                  │ instant (100ms) │ ease-out                               ││
│  │ Checkbox/toggle                     │ fast (150ms)    │ ease-spring                            ││
│  │ Dropdown open                       │ normal (200ms)  │ ease-out                               ││
│  │ Dropdown close                      │ fast (150ms)    │ ease-in                                ││
│  │ Tooltip appear                      │ normal (200ms)  │ ease-out                               ││
│  │ Card expand                         │ moderate (300ms)│ ease-spring                            ││
│  │ Card collapse                       │ normal (200ms)  │ ease-default                           ││
│  │ Modal open                          │ moderate (300ms)│ ease-spring                            ││
│  │ Modal close                         │ normal (200ms)  │ ease-in                                ││
│  │ Page transition                     │ slow (400ms)    │ ease-default                           ││
│  │ Toast enter                         │ moderate (300ms)│ ease-spring                            ││
│  │ Toast exit                          │ normal (200ms)  │ ease-in                                ││
│  │ Success celebration                 │ slower (500ms)  │ ease-bounce                            ││
│  │ Loading spinner                     │ 1400ms          │ linear (infinite)                      ││
│  │ Skeleton shimmer                    │ 1500ms          │ linear (infinite)                      ││
│  │ Progress bar                        │ slow (400ms)    │ ease-out                               ││
│  │ Number counter                      │ slower (500ms)  │ ease-out                               ││
│  └─────────────────────────────────────┴─────────────────┴────────────────────────────────────────┘│
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
6.3 Specific Animation Definitions
Card Expand/Collapse Animation
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  CARD EXPAND ANIMATION                                                                              │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  COLLAPSED STATE                           EXPANDED STATE                                           │
│  ┌──────────────────────────────────┐      ┌──────────────────────────────────┐                    │
│  │ 💰 Salary Income                 │      │ 💰 Salary Income           ▲     │                    │
│  │                                  │  →   │ ════════════════════════════════ │                    │
│  │ ₹18,60,000                       │      │                                  │                    │
│  │ from 2 employers                 │      │ EMPLOYER 1: Infosys Ltd          │                    │
│  │ ✓ Complete           [Edit]      │      │ ┌────────────────────────────┐   │                    │
│  └──────────────────────────────────┘      │ │ Gross Salary   ₹12,40,000 │   │                    │
│                                            │ │ TDS Deducted   ₹1,85,000  │   │                    │
│  Height: 140px                             │ └────────────────────────────┘   │                    │
│                                            │                                  │                    │
│                                            │ EMPLOYER 2: TCS Ltd              │                    │
│                                            │ ┌────────────────────────────┐   │                    │
│                                            │ │ Gross Salary   ₹6,20,000  │   │                    │
│                                            │ │ TDS Deducted   ₹78,000    │   │                    │
│                                            │ └────────────────────────────┘   │                    │
│                                            │                                  │                    │
│                                            │            [Save & Close Card]   │                    │
│                                            └──────────────────────────────────┘                    │
│                                            Height: 480px (variable)                                │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  ANIMATION BREAKDOWN (Expand):                                                                      │
│                                                                                                     │
│  Frame 0ms:                                                                                         │
│    • Card height: 140px                                                                             │
│    • Content opacity: 0, translateY: -20px                                                          │
│    • Chevron rotation: 0deg                                                                         │
│                                                                                                     │
│  Frame 0-300ms (ease-spring):                                                                       │
│    • Card height animates: 140px → 480px                                                            │
│    • Border color: #E5E5E5 → #D4AF37                                                                │
│    • Shadow: default → elevated                                                                     │
│    • Chevron rotates: 0deg → 180deg                                                                 │
│                                                                                                     │
│  Frame 150-350ms (ease-out, staggered):                                                             │
│    • Content fades in: opacity 0 → 1                                                                │
│    • Content slides: translateY -20px → 0                                                           │
│    • Each section staggers by 50ms                                                                  │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  CSS Implementation:                                                                                │
│                                                                                                     │
│  .card {                                                                                            │
│    transition: height 300ms cubic-bezier(0.16, 1, 0.3, 1),                                          │
│                border-color 200ms ease-out,                                                         │
│                box-shadow 200ms ease-out;                                                           │
│  }                                                                                                  │
│                                                                                                     │
│  .card-content {                                                                                    │
│    opacity: 0;                                                                                      │
│    transform: translateY(-20px);                                                                    │
│    transition: opacity 200ms ease-out, transform 200ms ease-out;                                    │
│    transition-delay: 100ms;                                                                         │
│  }                                                                                                  │
│                                                                                                     │
│  .card.expanded .card-content {                                                                     │
│    opacity: 1;                                                                                      │
│    transform: translateY(0);                                                                        │
│  }                                                                                                  │
│                                                                                                     │
│  .card-content > *:nth-child(1) { transition-delay: 100ms; }                                        │
│  .card-content > *:nth-child(2) { transition-delay: 150ms; }                                        │
│  .card-content > *:nth-child(3) { transition-delay: 200ms; }                                        │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Modal Animation
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  MODAL OPEN ANIMATION                                                                               │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  BACKDROP (Layer 1):                                                                                │
│  Frame 0ms:      opacity: 0, backdrop-filter: blur(0px)                                             │
│  Frame 200ms:    opacity: 1, backdrop-filter: blur(8px)                                             │
│  Easing:         ease-out                                                                           │
│                                                                                                     │
│  MODAL CONTAINER (Layer 2):                                                                         │
│  Frame 0ms:      opacity: 0, scale: 0.95, translateY: 20px                                          │
│  Frame 300ms:    opacity: 1, scale: 1, translateY: 0                                                │
│  Easing:         cubic-bezier(0.16, 1, 0.3, 1) — spring                                             │
│  Delay:          50ms (waits for backdrop to start)                                                 │
│                                                                                                     │
│  MODAL CONTENT (Layer 3):                                                                           │
│  Frame 0ms:      opacity: 0                                                                         │
│  Frame 200ms:    opacity: 1                                                                         │
│  Easing:         ease-out                                                                           │
│  Delay:          150ms                                                                              │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  MODAL CLOSE ANIMATION                                                                              │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  MODAL CONTAINER (closes first):                                                                    │
│  Frame 0ms:      opacity: 1, scale: 1, translateY: 0                                                │
│  Frame 150ms:    opacity: 0, scale: 0.95, translateY: 10px                                          │
│  Easing:         ease-in                                                                            │
│                                                                                                     │
│  BACKDROP (closes after):                                                                           │
│  Frame 0ms:      opacity: 1, backdrop-filter: blur(8px)                                             │
│  Frame 150ms:    opacity: 0, backdrop-filter: blur(0px)                                             │
│  Easing:         ease-in                                                                            │
│  Delay:          50ms                                                                               │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Regime Comparison Toggle Animation
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  TAX REGIME SWITCH ANIMATION                                                                        │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  When user switches from New Regime to Old Regime:                                                  │
│                                                                                                     │
│  PHASE 1: Highlight Shift (0-200ms)                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  ┌──────────────────────────┐    ┌──────────────────────────┐                              │   │
│  │  │     OLD REGIME           │ ←─ │     NEW REGIME          │                              │   │
│  │  │  ○ Select                │    │  ◉ SELECTED ✓           │                              │   │
│  │  └──────────────────────────┘    └──────────────────────────┘                              │   │
│  │           ↓                                   ↓                                            │   │
│  │  ┌──────────────────────────┐    ┌──────────────────────────┐                              │   │
│  │  │     OLD REGIME           │    │     NEW REGIME          │                              │   │
│  │  │  ◉ SELECTED ✓            │    │  ○ Select               │                              │   │
│  │  │  border: 2px #D4AF37     │    │  border: 2px #E5E5E5    │                              │   │
│  │  └──────────────────────────┘    └──────────────────────────┘                              │   │
│  │                                                                                             │   │
│  │  Animation: border-color 200ms ease-out, background 200ms ease-out                         │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  PHASE 2: Number Counter (200-700ms)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  Tax values animate from old to new:                                                        │   │
│  │                                                                                             │   │
│  │  ₹4,81,000 → ₹5,11,500                                                                      │   │
│  │                                                                                             │   │
│  │  Animation: Count-up with odometer effect                                                   │   │
│  │  Duration: 500ms                                                                            │   │
│  │  Easing: ease-out                                                                           │   │
│  │                                                                                             │   │
│  │  Each digit rolls independently (slot machine effect)                                       │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  PHASE 3: Savings Banner (700-900ms)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │  Old banner fades out → New banner fades in                                                 │   │
│  │                                                                                             │   │
│  │  "Saving ₹31,720 with New Regime" → "Saving ₹X with Old Regime" (or vice versa)            │   │
│  │                                                                                             │   │
│  │  If old regime is more expensive:                                                           │   │
│  │  Show: "⚠️ Old Regime costs ₹31,720 more"                                                  │   │
│  │  Color: warning orange instead of success green                                             │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Page/Screen Transitions
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  SCREEN TRANSITION: Starting Screen → Computation Sheet                                             │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  CROSSFADE + SLIDE PATTERN                                                                          │
│                                                                                                     │
│  Outgoing Screen (Starting Screen):                                                                 │
│  Frame 0ms:      opacity: 1, translateX: 0                                                          │
│  Frame 300ms:    opacity: 0, translateX: -50px                                                      │
│  Easing:         ease-in                                                                            │
│                                                                                                     │
│  Incoming Screen (Computation Sheet):                                                               │
│  Frame 0ms:      opacity: 0, translateX: 50px                                                       │
│  Frame 400ms:    opacity: 1, translateX: 0                                                          │
│  Easing:         ease-out                                                                           │
│  Delay:          100ms (overlap for smooth crossfade)                                               │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  LOADING INTERSTITIAL (If data fetching needed)                                                     │
│                                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │                           ┌─────────────────────────────────┐                               │   │
│  │                           │                                 │                               │   │
│  │                           │            ◠                    │                               │   │
│  │                           │                                 │                               │   │
│  │                           │   Preparing your tax sheet...   │                               │   │
│  │                           │                                 │                               │   │
│  │                           │   ✓ Form 16 processed           │                               │   │
│  │                           │   ✓ AIS data fetched            │                               │   │
│  │                           │   ◠ Calculating tax...          │                               │   │
│  │                           │   ○ Checking for mismatches     │                               │   │
│  │                           │                                 │                               │   │
│  │                           └─────────────────────────────────┘                               │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Each checklist item animates in with:                                                              │
│  • Fade + slideUp, stagger: 200ms                                                                   │
│  • Spinner → Checkmark: scale 0 → 1 with bounce easing                                              │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
Success/Celebration Animation
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  FILING SUCCESS ANIMATION                                                                           │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  After clicking "FILE RETURN" and successful submission:                                            │
│                                                                                                     │
│  PHASE 1: Button Loading (0-2000ms)                                                                 │
│  ┌────────────────────────────────┐                                                                │
│  │   ◠  Filing your return...    │   Spinner + text, button disabled                              │
│  └────────────────────────────────┘                                                                │
│                                                                                                     │
│  PHASE 2: Success Burst (2000-2500ms)                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │                              ✓                                                              │   │
│  │                        (large checkmark)                                                    │   │
│  │                                                                                             │   │
│  │  Animation:                                                                                 │   │
│  │  • Circle draws in (stroke-dashoffset animation)                                           │   │
│  │  • Checkmark draws in (stroke-dashoffset, delayed 200ms)                                   │   │
│  │  • Subtle confetti particles burst from center                                             │   │
│  │  • Circle + check scale up with bounce easing                                              │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  PHASE 3: Content Reveal (2500-3200ms)                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                             │   │
│  │                              ✓                                                              │   │
│  │                                                                                             │   │
│  │              Return Filed Successfully!                                                     │   │
│  │         Acknowledgement: 123456789012345                                                    │   │
│  │                                                                                             │   │
│  │              [E-Verify Now]  [Download]                                                     │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  Text elements fade in with stagger: 100ms each                                                     │
│  Buttons slide up + fade in, delay: 300ms                                                           │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  CONFETTI SPECS:                                                                                    │
│  • Particle count: 30-50                                                                            │
│  • Colors: #D4AF37, #F5D76E, #1A1A1A, #22C55E                                                       │
│  • Shapes: squares, circles, rectangles (4:1 ratio)                                                 │
│  • Animation: burst from center, gravity fall, slight rotation                                      │
│  • Duration: 1500ms                                                                                 │
│  • Particle size: 6-12px                                                                            │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
6.4 Micro-Interactions
text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  BUTTON INTERACTIONS                                                                                │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  HOVER STATE                                                                                        │
│  Duration: 150ms                                                                                    │
│  Properties: background-color, box-shadow, transform                                                │
│                                                                                                     │
│  Primary Button:                                                                                    │
│  • Background: #D4AF37 → #C9A432 (5% darker)                                                        │
│  • Box-shadow: add 0 4px 12px rgba(212, 175, 55, 0.25)                                              │
│  • Transform: translateY(-1px)                                                                      │
│                                                                                                     │
│  ACTIVE/PRESS STATE                                                                                 │
│  Duration: 100ms                                                                                    │
│                                                                                                     │
│  Primary Button:                                                                                    │
│  • Background: #B8982D (10% darker)                                                                 │
│  • Transform: translateY(0) scale(0.98)                                                             │
│  • Box-shadow: 0 2px 4px rgba(212, 175, 55, 0.2)                                                    │
│                                                                                                     │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  INPUT FOCUS ANIMATION                                                                              │
│  ════════════════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                                     │
│  Frame 0ms (blur):                                                                                  │
│    Border: 1px solid #E5E5E5                                                                        │
│    Box-shadow: none                                                                                 │
│    Label:

