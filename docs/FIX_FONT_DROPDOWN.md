# Fix: Font Size + Dropdown Cutoff — Instructions

## Problem 1: Font sizes not applying
The `filing-editor.css` overrides target `.ds-input` and `.ds-label` but these
may be overridden by the `ds.css` styles (same specificity, loaded later).

### Fix: Use higher specificity selector
Change from:
```css
.filing-editor__body .ds-input { font-size: 16px; }
.filing-editor__body .ds-label { font-size: 14px; }
```
To:
```css
.filing-editor__body .ds-field .ds-input { font-size: 16px !important; }
.filing-editor__body .ds-field .ds-label { font-size: 14px !important; font-weight: 700 !important; }
```

## Problem 2: Dropdown text cutoff
The `.ds-select` has `max-width` but the text inside is being clipped because
the select element also has `text-overflow: ellipsis` or the container is too narrow.

### Fix: Remove max-width constraint on selects inside editor, let them fill their grid cell
```css
.filing-editor__body .ds-select {
  max-width: none !important;
  width: 100% !important;
  font-size: 16px !important;
}
```

## Execution Steps
1. Open `frontend/src/pages/Filing/ITR1/filing-editor.css`
2. Find the section "Inputs never stretch full width"
3. Replace with the !important overrides above
4. Build and verify
