# BurnBlack UI Design Guide

> Living document. Updated with each iteration.
> Last updated: 2026-05-10

---

## 1. Design Philosophy

**"A CA's desk, digitized."**

- Left = Where am I? (navigation, progress)
- Center = What's the data? (numbers, forms, charts)
- Right = What should I do? (tips, optimization, actions)

### Core Principles

| # | Principle | Implementation |
|---|-----------|---------------|
| 1 | **Precision over decoration** | Monospace numbers, tabular alignment, no ornamental elements |
| 2 | **Progressive disclosure** | Show only what's relevant. Collapse completed sections. |
| 3 | **One action per context** | Each screen has ONE primary CTA. Secondary actions are muted. |
| 4 | **Numbers are king** | ₹ amounts get the highest visual weight on any screen. |
| 5 | **Guided, not overwhelming** | Left panel = progress. Right panel = next steps. Center = current task. |
| 6 | **Collapse after completion** | Saved sections auto-collapse. Computation bar rises. |

---

## 2. Layout System

### Dashboard (3-Column)
```
┌─────────┬──────────────────┬──────────┐
│  LEFT   │     CENTER       │  RIGHT   │
│  220px  │     flex         │  280px   │
│         │                  │          │
│ Progress│  Data + Charts   │ Tips +   │
│ Nav     │  Forms           │ Actions  │
│ Actions │                  │ Optimize │
└─────────┴──────────────────┴──────────┘
```

### Filing Editor (Split Panel)
```
┌─────────┬──────────────────────────────┐
│  LEFT   │          RIGHT               │
│  260px  │          flex                 │
│         │                              │
│ Story   │  Active Editor               │
│ Flow    │  (expands/collapses)         │
│ Cards   │                              │
│         ├──────────────────────────────┤
│         │  COMPUTATION BAR (sticky)    │
│         │  ₹Tax: 0 | Regime: New | ▲  │
└─────────┴──────────────────────────────┘
```

### Responsive Breakpoints
| Viewport | Behavior |
|----------|----------|
| >1200px | Full 3-column |
| 768-1200px | 2-column (left collapses to top bar) |
| <768px | Single column, stacked, collapsible sections |

---

## 3. Typography

| Role | Size | Weight | Font | Usage |
|------|------|--------|------|-------|
| Page title | 24px | 700 | Satoshi | Dashboard heading |
| Section title | 14px | 700 | Satoshi | Card headers, editor sections |
| Body | 14px | 400 | Satoshi | Descriptions, paragraphs |
| Label | 13px | 600 | Satoshi | Form field labels |
| Input text | 14px | 400 | Satoshi | User-entered data |
| Hint | 11px | 400 | Satoshi | Helper text below fields |
| Amount (sm) | 13px | 500 | DM Mono | Inline totals |
| Amount (md) | 15px | 600 | DM Mono | Card amounts, summaries |
| Amount (lg) | 20px | 700 | DM Mono | Hero numbers, result card |
| Mono data | 14px | 400 | DM Mono | PAN, IFSC, account numbers |

### Rules
- `font-variant-numeric: tabular-nums` on ALL numbers
- `letter-spacing: -0.02em` on amounts
- Never use more than 3 font sizes on one screen

---

## 4. Color System

| Token | Hex | Usage | Contrast |
|-------|-----|-------|----------|
| `--text-primary` | #111111 | Headings, amounts | 18.9:1 ✅ |
| `--text-secondary` | #4B5563 | Body, labels | 7.5:1 ✅ |
| `--text-muted` | #6B7280 | Descriptions | 4.6:1 ✅ |
| `--text-light` | #9CA3AF | Hints, timestamps | 3.0:1 (large text only) |
| `--brand-primary` | #D4AF37 | Buttons, accents | Use on dark bg only |
| `--brand-text` | #A68B2A | Text links | 4.8:1 ✅ |
| `--color-success` | #16A34A | Verified, refund | |
| `--color-error` | #DC2626 | Errors, payable | |
| `--color-warning` | #CA8A04 | Deadlines, caution | |
| `--border-light` | #E5E7EB | Card borders, dividers | |
| `--bg-page` | #FAFAF8 | Page background | |
| `--bg-muted` | #F3F4F6 | Disabled, secondary bg | |

### Semantic Money Colors
- **Refund (money coming back)**: `--color-success` green
- **Payable (money owed)**: `--color-error` red
- **Neutral amounts**: `--text-primary` black

---

## 5. Components

### Inputs
- Height: 36px (padding: 8px 12px)
- Font: 14px
- Border: 1px solid `--border-light`
- Focus: 2px gold ring (subtle)
- Disabled: gray bg, muted text

### Buttons
| Variant | Style | When to use |
|---------|-------|-------------|
| Primary | Gold bg, black text | ONE per screen. The main action. |
| Outline/Secondary | Gray bg, dark text, light border | Secondary actions (Back, Cancel) |
| Ghost | No bg, gold text, underline on hover | Tertiary (links disguised as buttons) |
| Danger | Red bg, red text, red border | Destructive (Delete, Revoke) |

### Cards
- Padding: 16px 20px
- Border: 1px solid `--border-light`
- Radius: 12px
- Hover: subtle shadow
- Active: gold border + gold shadow

### Money Display
```
.ds-money--sm  → 13px/500 (inline, secondary)
.ds-money--md  → 15px/600 (card totals)
.ds-money--lg  → 20px/700 (hero numbers, result)
```

---

## 6. Interaction Patterns

### Editor Collapse Behavior
1. User opens a section (e.g., Salary) → editor expands in right panel
2. User fills data → clicks "Save"
3. Section auto-collapses → shows summary (e.g., "₹8L · TCS · 1 employer")
4. Computation bar scrolls up from bottom showing updated tax
5. User clicks next section → computation bar scrolls back down

### Computation Bar (Sticky Bottom)
```
┌──────────────────────────────────────────────────────┐
│ ₹0 tax (New Regime) │ Refund: ₹40,000 │ ▲ Details  │
└──────────────────────────────────────────────────────┘
```
- Always visible at bottom of editor panel
- Shows: tax liability, refund/payable, regime
- "▲ Details" expands full computation breakdown
- Scrolls up (expands) when no editor is active
- Scrolls down (collapses to bar) when editor opens

### Navigation Indicators
- Active section: gold left bar (3px)
- Complete: green dot with checkmark
- Partial: amber ring
- Not started: gray dot

---

## 7. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 4px | Micro | Icon-to-text gap |
| 8px | Tight | Between related items |
| 10px | Field | Between form fields |
| 12px | Card gap | Between cards in a grid |
| 16px | Section | Between sections |
| 20px | Card padding | Inside cards |
| 24px | Page padding | Page margins |

---

## 8. Responsive Rules

| Rule | Implementation |
|------|---------------|
| Touch targets | Min 36px height on mobile |
| Readable text | Never below 11px |
| Scrollable rows | Horizontal scroll on tablet for sidebar items |
| Collapsible | Accordion pattern on mobile for stacked panels |
| No horizontal scroll | Main content never overflows horizontally |

---

## 9. Iteration Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-10 | Initial guide created | Anchor design decisions |
| 2026-05-10 | Fintech density applied | Compact inputs, precise spacing |
| 2026-05-10 | WCAG AA colors | Contrast compliance |
| 2026-05-10 | 3-column layout | CA desk metaphor |
| 2026-05-10 | Editor collapse + computation bar | Progressive disclosure |

---

## 10. Anti-Patterns (Don't Do)

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Make inputs taller than 36px | Keep compact, increase font weight for readability |
| Use gold text on white bg | Use `--brand-text` (#A68B2A) for AA compliance |
| Show all sections expanded | Collapse completed, expand current |
| Multiple primary buttons | ONE gold button per screen |
| Spinner for loading | Skeleton placeholders |
| Alert/confirm dialogs | Inline confirmation with undo |
| Decorative icons | Functional icons only (status, navigation) |

---

## 11. Viewport-First Design Rules (MANDATORY)

> Every section must fit in a single viewport. No scrolling to reveal content.

### The Rule
**Target viewport: 1280×720px.** If a section doesn't fit at this resolution, redesign it — don't add scroll.

### How to Design a Section (Top-Down)

1. **Start with the viewport budget:**
   - Total height: 720px
   - Minus top bar: -48px
   - Minus editor header: -36px
   - Minus editor footer: -40px
   - **Available for content: 596px**

2. **Calculate field rows needed:**
   - Each field row: ~44px (label 14px + input 32px + gap 8px)
   - Available rows: 596 / 44 = **13 rows max**

3. **If section has >13 fields:**
   - Use 3-column grid → 13 rows × 3 cols = 39 fields
   - Or use 2×2 card grid → 13 rows × 2 cols = 26 cards
   - Or group into collapsible sub-sections

4. **If it still doesn't fit:** The section has too many fields. Split into sub-sections in the left nav.

### Field Density Rules

| Columns | Max field width | Use when |
|---------|----------------|----------|
| 3 cols | 220px | Personal info, address, metadata |
| 2 cols | 240px | Salary, income amounts |
| 2×2 cards | 50% each | Other income, deductions |
| 1 col | 480px | Only for tables (capital gains transactions) |

### Component Height Budget

| Component | Max Height | Notes |
|-----------|-----------|-------|
| Top bar | 48px | Fixed |
| Left nav | 100vh - 48px | Scrolls only if >12 items |
| Editor header | 36px | Section title only |
| Editor body | calc(100vh - 132px) | THE content area |
| Editor footer | 40px | Prev/Next + inline tax |
| Right sidebar | 100vh - 48px | Computation + actions, scrolls if needed |
| Sidebar actions | ~80px | Submit + PDF/JSON, always visible |

### Anti-Scroll Checklist

Before shipping any section, verify:
- [ ] Submit button visible without scroll at 1280×720
- [ ] All fields visible without scroll (or in 2nd column)
- [ ] Right sidebar computation fully visible
- [ ] Left nav progress bar visible
- [ ] No horizontal overflow on any element
