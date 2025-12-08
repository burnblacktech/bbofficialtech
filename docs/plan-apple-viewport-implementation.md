# Apple-Like Fixed Viewport Implementation Plan

## User Requirements

1. **No Scrolling**: Pages should not be scrollable until absolutely necessary
2. **Slide-Based Transitions**: Content should slide into view, not full page layout changes
3. **Fixed Display Frame**: Content expands/collapses within a specific viewport area
4. **Key Data Highlighting**: "Total Income" and other key metrics prominently displayed
5. **Mobile Optimization**: Icons and minimal data, swipe-friendly

## Implementation Approach

### Phase 1: Fixed Viewport Infrastructure
- Create/update FixedViewportContainer component
- Add slide/zoom transition variants
- Remove all `min-h-screen` and unnecessary scrolling

### Phase 2: Computation Page (Priority)
- Convert to fixed viewport (calc(100vh - header - regime))
- Enhance income card to show "Total Income" prominently (28-32px, bold)
- Implement zoom transitions for card expansion
- Remove page scrolling

### Phase 3: Person Selector Page
- Fixed viewport container
- Slide transitions for family panel
- No page scrolling

### Phase 4: Data Source Selector Page
- Fixed viewport layout
- Slide-based sub-views
- No page scrolling

## Key Changes

### Income Card Collapsed State
- Large "Total Income" amount: 28-32px font size, bold, prominent
- Minimal other data
- Clear status indicator
- Mobile: Icon + key number

### Fixed Viewport Pattern
- `height: calc(100vh - header-height)`
- `overflow: hidden` on main container
- Content slides/zooms within frame
- Internal scroll only when content truly exceeds

