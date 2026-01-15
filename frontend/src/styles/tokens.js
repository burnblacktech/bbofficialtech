/**
 * Design Tokens
 * Single source of truth for all design decisions
 * Following Atomic Design methodology
 */

export const tokens = {
    // =====================================================
    // COLORS
    // =====================================================
    colors: {
        // Primary - Trust & Professionalism
        primary: {
            900: '#0F172A', // Deep slate - serious, professional
            800: '#1E293B',
            700: '#334155',
            600: '#475569',
            500: '#64748B',
            400: '#94A3B8',
            300: '#CBD5E1',
            200: '#E2E8F0',
            100: '#F1F5F9',
            50: '#F8FAFC',
        },

        // Accent - Premium & Action (BurnBlack Gold)
        accent: {
            700: '#B8941F', // Darker gold
            600: '#D4AF37', // Primary gold
            500: '#E5C158', // Lighter gold
            400: '#F3E5AB', // Very light gold
            300: '#F9F3DC', // Pale gold
        },

        // Semantic Colors
        success: {
            700: '#047857',
            600: '#10B981', // Primary success
            500: '#34D399',
            400: '#6EE7B7',
            100: '#D1FAE5',
            50: '#ECFDF5',
        },

        info: {
            700: '#1D4ED8',
            600: '#3B82F6', // Primary info
            500: '#60A5FA',
            400: '#93C5FD',
            100: '#DBEAFE',
            50: '#EFF6FF',
        },

        warning: {
            700: '#B45309',
            600: '#F59E0B', // Primary warning
            500: '#FBBF24',
            400: '#FCD34D',
            100: '#FEF3C7',
            50: '#FFFBEB',
        },

        error: {
            700: '#B91C1C',
            600: '#EF4444', // Primary error
            500: '#F87171',
            400: '#FCA5A5',
            100: '#FEE2E2',
            50: '#FEF2F2',
        },

        // Neutrals (Grayscale)
        neutral: {
            900: '#111827',
            800: '#1F2937',
            700: '#374151',
            600: '#4B5563',
            500: '#6B7280',
            400: '#9CA3AF',
            300: '#D1D5DB',
            200: '#E5E7EB',
            100: '#F3F4F6',
            50: '#F9FAFB',
            white: '#FFFFFF',
        },
    },

    // =====================================================
    // TYPOGRAPHY
    // =====================================================
    typography: {
        fontFamily: {
            primary: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        },

        fontSize: {
            xs: '12px',    // 0.75rem
            sm: '14px',    // 0.875rem
            base: '16px',  // 1rem
            lg: '18px',    // 1.125rem
            xl: '20px',    // 1.25rem
            '2xl': '24px', // 1.5rem
            '3xl': '30px', // 1.875rem
            '4xl': '36px', // 2.25rem
            '5xl': '48px', // 3rem
        },

        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },

        lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
        },

        letterSpacing: {
            tight: '-0.025em',
            normal: '0',
            wide: '0.025em',
        },
    },

    // =====================================================
    // SPACING
    // =====================================================
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
    },

    // =====================================================
    // BORDER RADIUS
    // =====================================================
    borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
    },

    // =====================================================
    // SHADOWS
    // =====================================================
    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    },

    // =====================================================
    // TRANSITIONS
    // =====================================================
    transitions: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // =====================================================
    // Z-INDEX
    // =====================================================
    zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modalBackdrop: 1040,
        modal: 1050,
        popover: 1060,
        tooltip: 1070,
    },

    // =====================================================
    // BREAKPOINTS
    // =====================================================
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },
};

export default tokens;
