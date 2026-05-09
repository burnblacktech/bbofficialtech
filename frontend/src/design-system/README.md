# BurnBlack Design System — Central Control

## Architecture

```
frontend/src/design-system/
├── tokens.css          ← Single source of truth for ALL colors, spacing, fonts, radii
├── components.css      ← All component styles (buttons, cards, inputs, etc.)
├── index.js            ← All React components exported from one place
└── README.md           ← This file
```

## Rules

1. **ALL colors come from CSS variables in `tokens.css`** — no hardcoded hex anywhere
2. **ALL components are exported from `design-system/index.js`** — pages import from here only
3. **ALL spacing uses the 4px grid** — 4, 8, 12, 16, 20, 24, 32, 40, 48
4. **ALL font sizes use the type scale** — 11, 12, 13, 14, 16, 20, 24, 32
5. **ALL border-radius uses tokens** — sm(4px), md(6px), lg(8px), xl(12px)
6. **Theme switching** — change `[data-theme]` attribute on `<html>` to switch dark/light

## Token Categories

- `--bb-bg-*` — backgrounds (page, card, input, elevated)
- `--bb-fg-*` — foregrounds (primary, secondary, muted, inverse)
- `--bb-brand-*` — brand colors (gold, gold-dim)
- `--bb-status-*` — semantic (success, error, warning, info)
- `--bb-border-*` — borders (default, light, strong)
- `--bb-font-*` — font families (sans, mono)
- `--bb-fs-*` — font sizes
- `--bb-radius-*` — border radii
- `--bb-space-*` — spacing scale

## Component Library

All components accept a `className` prop for composition. No inline styles.

### Primitives
- `Button` — variants: primary, secondary, ghost, danger. sizes: sm, md, lg
- `Card` — variants: default, elevated, bordered
- `Input` — with label, error, hint support
- `Select` — same as Input
- `Badge` — variants: default, success, warning, error, info
- `Spinner` — sizes: sm, md, lg

### Layout
- `Stack` — vertical flex with gap
- `Row` — horizontal flex with gap
- `Grid` — responsive grid (1-4 cols)
- `Page` — max-width container with padding
- `Divider` — horizontal rule

### Feedback
- `Alert` — variants: info, success, warning, error
- `Toast` — via react-hot-toast (configured centrally)

### Data Display
- `Money` — formatted currency with mono font
- `Progress` — bar with label
- `Stat` — label + value + trend

## Migration Plan

1. Create `design-system/tokens.css` with ALL variables
2. Create `design-system/components.css` with ALL component classes
3. Create `design-system/index.js` exporting ALL React components
4. Update `App.js` to import `design-system/tokens.css`
5. Gradually migrate pages to use the new system
