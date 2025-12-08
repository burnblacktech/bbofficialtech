# Apple-Like Fixed Viewport Redesign

## Core Design Principles

1. **Fixed Viewport**: No scrolling until absolutely necessary
2. **Slide-Based Transitions**: Content slides into fixed frames, not full page changes  
3. **Fixed Display Frame**: Content expands/collapses within specific viewport area
4. **Key Data Highlighting**: Total Income, Net Tax Due prominently visible
5. **Mobile Optimization**: Icons and minimal data, swipe gestures

## Implementation Strategy

### Fixed Viewport Pattern
- All pages use `height: calc(100vh - header-height)`
- No `overflow-y-auto` on main container
- Content slides/zooms into fixed frame
- Internal scroll only when content truly exceeds frame

### Slide Transitions
- Horizontal/vertical slides between sections
- Zoom/focus transitions for card expansion
- Smooth spring physics (Apple-like)

### Collapsed Card Enhancement
- Income Card: Large "Total Income" (28-32px, bold)
- Minimal other data
- Clear status indicators
