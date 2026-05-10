# BurnBlack UI Design Guide v2

> Living document. The single source of truth for all UI decisions.
> Last updated: 2026-05-10 (v2 — complete rewrite)

---

## 1. Design Philosophy

**"A CA's desk, digitized. Bold, precise, zero-scroll."**

| Principle | Rule |
|-----------|------|
| **Bold statement** | We handle money. Typography is confident (700 weight labels, 900 titles). |
| **Zero scroll** | Every section fits in 1280×720 viewport. If it doesn't fit, redesign it. |
| **Unit grid** | All forms use a 3×N grid. Each cell is 200px × 56px. No exceptions. |
| **Eye flow** | Left→right per row, top→bottom per section. Predictable always. |
| **Numbers are king** | ₹ amounts get the highest visual weight. Mono, bold, tabular-nums. |
| **One CTA per context** | One gold button per screen. Everything else is secondary. |
| **Progressive disclosure** | Collapse completed sections. Show only what's active. |

---

## 2. Layout System

### Filing Editor (3-Panel, Viewport-Contained)
```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR (48px)                                                  │
├──────────┬──────────────────────────────┬───────────────────────┤
│ LEFT NAV │     EDITOR PANEL             │  RIGHT SIDEBAR        │
│ (220px)  │     (flex, scrolls only if   │  (280px, fixed)       │
│          │      section > viewport)     │                       │
│ Sections │     Unit Grid forms          │  Tax computation      │
│ Progress │     3 cols × N rows          │  Regime toggle        │
│          │     Prev/Next footer         │  Submit + Downloads   │
└──────────┴──────────────────────────────┴───────────────────────┘
```

### Dashboard (2-Column + App Sidebar)
```
[App Sidebar 220px] + [Main Content (flex)] + [Right Sidebar 280px]
```

### Height Budget (1280×720 target)
```
720px total
 -48px top bar
 -36px editor header
 -40px editor footer
═══════════════════
596px for content = 10 rows × 56px + 36px breathing room
```

---

## 3. Unit Grid System (MANDATORY for all forms)

```css
.unit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 200px));
  gap: 4px 14px;
}
```

| Rule | Value |
|------|-------|
| Cell width | 200px max |
| Cell height | 56px (label 16px + input 36px + gap 4px) |
| Columns | 3 (default), 2 for simple sections |
| Row gap | 4px |
| Column gap | 14px |
| Max fields per viewport | 30 (10 rows × 3 cols) |

### Layout Patterns

**Contact + Address (3×3):**
```
CONTACT              ADDRESS              ADDRESS
[Email_____]         [Flat/Door___]       [City_______]
[Phone_____]         [Road/Street_]       [State______]
[Aadhaar___]         [Area/Locality]      [Pincode____]
```

**Salary (2×4):**
```
[Employer Name________________]  (span-2)
[Gross Salary__]  [TDS Deducted_]
[HRA Received__]  [Rent Paid____]
[Prof. Tax_____]  [LTA Claimed__]
```

**Other Income (2×2 cards):**
```
┌─ SAVINGS INT ─┐  ┌─ FD INTEREST ─┐
│ ₹[________]   │  │ ₹[________]   │
└────────────────┘  └────────────────┘
┌─ DIVIDENDS ───┐  ┌─ FAMILY PENS ─┐
│ ₹[________]   │  │ ₹[________]   │
└────────────────┘  └────────────────┘
```

**Deductions (2×2 cards):**
```
┌─ 80C · PPF ───┐  ┌─ 80C · ELSS ──┐
│ ₹[________]   │  │ ₹[________]   │
└────────────────┘  └────────────────┘
┌─ 80D · HEALTH ┐  ┌─ 80CCD · NPS ─┐
│ ₹[________]   │  │ ₹[________]   │
└────────────────┘  └────────────────┘
```

---

## 4. Typography (Option B — Bold Statement)

| Role | Size | Weight | Font | Letter-spacing |
|------|------|--------|------|----------------|
| Page title | 24px | 900 | Satoshi | -0.03em |
| Section title | 18px | 900 | Satoshi | -0.02em |
| Sub-section label | 11px | 700 | Satoshi | 0.04em (uppercase) |
| Field label | 13px | 700 | Satoshi | — |
| Input text | 15px | 500 | Satoshi | — |
| Hint text | 11px | 400 | Satoshi | — |
| Amount (inline) | 13px | 600 | DM Mono | -0.02em |
| Amount (card) | 16px | 700 | DM Mono | -0.02em |
| Amount (hero) | 20px | 700 | DM Mono | -0.03em |
| Nav item | 12px | 400/600 | Satoshi | — |
| Button | 13px | 600 | Satoshi | — |

### Rules
- `font-variant-numeric: tabular-nums` on ALL numbers
- Never use regular (400) weight for labels — minimum 600
- Titles use 900 (black) — commands attention
- Only 3 font sizes visible on any single screen

---

## 5. Color System (WCAG AA)

| Token | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `--text-primary` | #111111 | 18.9:1 | Headings, amounts, input text |
| `--text-secondary` | #4B5563 | 7.5:1 | Labels, body text |
| `--text-muted` | #6B7280 | 4.6:1 | Descriptions |
| `--text-light` | #9CA3AF | 3.0:1 | Hints (large text only) |
| `--brand-primary` | #D4AF37 | — | Buttons (on dark bg only) |
| `--brand-text` | #A68B2A | 4.8:1 | Text links |
| `--color-success` | #16A34A | — | Verified, refund |
| `--color-error` | #DC2626 | — | Errors, tax payable |
| `--border-light` | #E5E7EB | — | Borders, dividers |

### Semantic Money Colors
- **Refund** → green (`--color-success`)
- **Payable** → red (`--color-error`)
- **Neutral** → black (`--text-primary`)

---

## 6. Components

### Inputs
```
Height: 36px (padding: 9px 12px)
Font: 15px medium (500)
Border: 1px solid --border-light
Focus: 2px gold ring
Max-width: 200px (in unit-grid)
```

### Buttons
| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary | Gold | Black | None | ONE per screen |
| Secondary | #F3F4F6 | #111 | #E5E7EB | Back, Cancel |
| Ghost | None | Gold | None | Tertiary links |
| Danger | #FEF2F2 | Red | #FECACA | Delete, Revoke |

### Cards
```
Padding: 12px 14px (inside editor)
Border: 1px solid --border-light
Radius: 8px
Active: gold border
```

### Amount Cards (2×2 grid)
```
Background: white
Border: 1px solid --border-light
Padding: 12px 14px
Label: 11px uppercase bold
Input: 16px bold mono, no border, transparent bg
Focus: gold border on card
```

---

## 7. Spacing

| Value | Usage |
|-------|-------|
| 4px | Row gap in unit-grid, icon-to-text |
| 6px | Between related items |
| 8px | Card margin-bottom |
| 12px | Card padding, section gap |
| 14px | Column gap in unit-grid |
| 16px | Between sections |
| 20px | Page padding |

---

## 8. Interaction Patterns

### Save → Auto-Advance
1. User fills section → clicks Save
2. If section complete → auto-advance to next section
3. If last section → collapse, show full computation
4. If incomplete → stay (show validation errors)

### Left Nav Click
- Click section → editor shows that section
- Click "+" → shows add picker (income sources / deductions)
- Active item: gold left bar + light gold bg
- Complete: green dot
- Partial: amber ring
- Empty: gray ring

### Right Sidebar
- Always visible (never scrolls away)
- Tax computation updates live after each save
- Submit button: disabled until all sections ✓
- PDF/JSON: secondary buttons below submit

---

## 9. Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1280px | Full 3-panel |
| 1024-1279px | Left nav collapses to 180px |
| <1024px | Horizontal nav + slide-over sidebar |
| <768px | Single column, stacked |

---

## 10. Anti-Patterns

| ❌ Never | ✅ Always |
|----------|----------|
| Full-width inputs | Max 200px in unit-grid |
| Page scroll for a section | Redesign to fit viewport |
| Multiple primary buttons | ONE gold button per screen |
| Spinners | Skeleton placeholders |
| Ad-hoc Grid cols | Use .unit-grid class |
| Font size < 11px | Minimum 11px for any text |
| Regular weight labels | Labels are always bold (700) |
| Decorative elements | Every pixel earns its place |
| Double headings | Outer header only, hide inner |
| Full-width save buttons | Max 200px, right-aligned |

---

## 11. Viewport-First Checklist

Before shipping ANY section:
- [ ] Fits in 1280×720 without scroll
- [ ] Submit button visible without scroll
- [ ] Uses .unit-grid (not ad-hoc Grid)
- [ ] Labels are 13px bold
- [ ] Inputs are 15px medium
- [ ] Amounts use mono + tabular-nums
- [ ] Max 3 font sizes on screen
- [ ] One primary CTA only
- [ ] Eye flow: left→right, top→bottom
- [ ] No full-width inputs

---

## 12. Iteration Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-10 | v1 | Initial guide |
| 2026-05-10 | v2 | Complete rewrite: unit grid, Option B typography, viewport-first rules, anti-patterns, component specs |
