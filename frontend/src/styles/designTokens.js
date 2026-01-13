/**
 * Design Tokens - Frontend Spine
 * Single source of truth for all layout and styling
 * NO DEVIATIONS ALLOWED
 */

export const layout = {
    // Page constraints
    pageMaxWidth: 'max-w-5xl',
    pagePadding: 'px-4 md:px-6 lg:px-8',

    // Vertical rhythm
    sectionGap: 'space-y-6',
    blockGap: 'space-y-4',
    elementGap: 'space-y-2',

    // Container
    container: 'mx-auto',
};

export const components = {
    // Card (always full width, auto height)
    card: 'w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',

    // Buttons (fixed height, inline-flex)
    button: {
        primary: 'inline-flex h-10 px-4 items-center justify-center rounded-lg bg-gold-500 text-white font-medium hover:bg-gold-600 transition-colors',
        secondary: 'inline-flex h-10 px-4 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors',
        ghost: 'inline-flex h-10 px-4 items-center justify-center rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors',
        danger: 'inline-flex h-10 px-4 items-center justify-center rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors',
    },

    // Input (always full width, fixed height)
    input: 'w-full h-10 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all',

    // Modal (max width, centered)
    modal: 'max-w-lg w-full mx-4 rounded-xl bg-white shadow-xl',
};

export const spacing = {
    // Vertical spacing
    section: 'mb-6',
    block: 'mb-4',
    element: 'mb-2',

    // Padding
    cardPadding: 'p-6',
    modalPadding: 'p-6',
};

export const typography = {
    // Page titles
    pageTitle: 'text-2xl md:text-3xl font-bold text-slate-900',

    // Section titles
    sectionTitle: 'text-xl font-semibold text-slate-900',

    // Card titles
    cardTitle: 'text-lg font-semibold text-slate-900',

    // Body text
    body: 'text-base text-slate-700',
    bodySmall: 'text-sm text-slate-600',

    // Labels
    label: 'text-sm font-medium text-slate-700',

    // Helper text
    helper: 'text-sm text-slate-500',
};

export const colors = {
    // Primary
    gold: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308', // Primary
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
    },

    // Status
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
};

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
};

// Responsive utilities
export const responsive = {
    // Mobile-first stack, desktop row
    stack: 'flex flex-col md:flex-row gap-4',

    // Full width on mobile, auto on desktop
    mobileFullWidth: 'w-full md:w-auto',

    // Hide on mobile
    hideMobile: 'hidden md:block',

    // Show only on mobile
    showMobile: 'block md:hidden',
};
