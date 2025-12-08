/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // =====================================================
      // ENTERPRISE COLOR SYSTEM - PIXEL PERFECT CONSISTENCY
      // =====================================================
      colors: {
        // =====================================================
        // NEW PRIMARY BRAND FAMILY (THE AURORA) - Solar Gold + Ember Amber
        // =====================================================
        
        // GOLD (Primary Brand) - newUI.md Section 5.1
        primary: {
          50: '#FFF8E7',   // Gold-100
          100: '#FFF8E7',  // Gold-100
          200: '#FFE4A0',  // Gold-300 (approximate)
          300: '#FFE4A0',  // Gold-300
          400: '#E5C158',  // Gold-400 (dark mode)
          500: '#D4AF37',  // ← MAIN: Gold-500 (newUI.md primary)
          600: '#B8960C',  // Gold-700 (hover)
          700: '#B8960C',  // Gold-700
          800: '#7A6508',  // Gold-900
          900: '#7A6508',  // Gold-900
        },
        // GOLD (explicit) - newUI.md Section 5.1
        gold: {
          100: '#FFF8E7',
          300: '#FFE4A0',
          400: '#E5C158',  // For dark mode
          500: '#D4AF37',  // Main primary color
          700: '#B8960C',
          900: '#7A6508',
        },
        
        // EMBER AMBER (Secondary accent, hover states, warm highlights)
        ember: {
          50: '#FFF6ED',   // Subtle background
          100: '#FFE8CC',  // Light background
          200: '#FFD699',  // Light variant
          300: '#FFC466',  // Medium light
          400: '#FFB347',  // Medium
          500: '#FF9800',  // ← MAIN: Warm amber (secondary accent)
          600: '#DB7C00',  // Hover state
          700: '#B36200',  // Active/pressed
          800: '#8C4D00',  // Dark variant
          900: '#663800',  // Darkest variant
        },
        
        // Legacy orange (keeping for backward compatibility)
        orange: {
          50: '#FFF8F2',
          100: '#FFF0E5',
          400: '#FF8533',
          500: '#FF6B00',
          600: '#E55F00',
          700: '#CC5500',
        },
        
        // Legacy gold (keeping for backward compatibility)
        gold: {
          50: '#FFFCF2',
          100: '#FFF9E5',
          400: '#FFC933',
          500: '#FFB800',
          600: '#E5A600',
        },
        
        // =====================================================
        // SUPPORTING BRAND COLORS
        // =====================================================
        
        // SLATE CHARCOAL (Primary text/surfaces)
        slate: {
          50: '#F8FAFC',   // Page background
          100: '#F1F5F9',  // Alternate rows
          200: '#E2E8F0',  // Soft dividers
          300: '#CBD5E1',  // Borders
          400: '#94A3B8',  // Muted text
          500: '#64748B',  // Labels/borders
          600: '#475569',  // Secondary text
          700: '#334155',  // Primary body text
          800: '#1E293B',  // Panels (dark mode)
          900: '#0F172A',  // Headings, dark cards
          950: '#020617',  // True black
        },
        
        // PORCELAIN WHITE (Light-mode foundation)
        porcelain: {
          50: '#FCFCFD',   // Page base
          100: '#F7F7F9',  // Elevated cards
          200: '#EFEFF2',  // Muted panels
          300: '#E0E0E7',  // Borders, table stripes
        },
        
        // CONTRAST INK (Dark-mode foundation)
        ink: {
          700: '#1D1D28',
          800: '#12121A',
          900: '#0B0B0F',
        },
        
        // BurnBlack Legacy (keeping for backward compatibility)
        burnblack: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#b3b3b3',
          300: '#4d4d4d',
          400: '#2c2c2c',
          500: '#0b0b0b',
          600: '#080808',
          700: '#050505',
          800: '#030303',
          900: '#000000',
        },
        
        // Legacy colors (keeping for backward compatibility)
        emerald: {
          50: '#e8f8f5',
          100: '#d1f2eb',
          200: '#a3e4d7',
          300: '#76d7c4',
          400: '#48c9b0',
          500: '#2ecc71',
          600: '#28b463',
          700: '#229954',
          800: '#1d7e45',
          900: '#176336',
        },
        sunset: {
          50: '#fef5e7',
          100: '#fdebd0',
          200: '#fad7a0',
          300: '#f8c471',
          400: '#f5b041',
          500: '#e67e22',
          600: '#d68910',
          700: '#c77c0e',
          800: '#b86f0c',
          900: '#a9620a',
        },
        crimson: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d1d1',
          300: '#f5bbbb',
          400: '#f1a5a5',
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
          800: '#7b241c',
          900: '#641d17',
        },
        royal: {
          50: '#ebf3fd',
          100: '#d6e7fa',
          200: '#adcff5',
          300: '#84b7f0',
          400: '#5b9feb',
          500: '#2980b9',
          600: '#2471a3',
          700: '#1f618d',
          800: '#1a5177',
          900: '#154360',
        },
        
        // NEUTRAL (Black to White) - newUI.md Section 5.1
        neutral: {
          50: '#FAFAFA',
          100: '#E5E5E5',
          300: '#A6A6A6',
          500: '#737373',
          700: '#404040',
          900: '#0D0D0D',
        },
        // BLACK SCALE (legacy alias)
        black: {
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#0D0D0D',  // Updated to match newUI.md
          950: '#0A0A0A',
        },
        // DARK MODE - newUI.md Section 5.4
        dark: {
          base: '#0D0D0D',    // Page background
          level1: '#171717',   // Card background
          level2: '#262626',   // Hover state
          level3: '#363636',   // Modal background
        },
        
        // =====================================================
        // SEMANTIC COLORS (Functional)
        // =====================================================
        // SUCCESS - newUI.md Section 5.2
        success: {
          50: '#ECFDF5',   // Success-Light
          100: '#ECFDF5',  // Success-Light
          200: '#10B981',  // Success-Base
          300: '#10B981',  // Success-Base
          400: '#10B981',  // Success-Base
          500: '#10B981',  // ← Icons, checkmarks (Success-Base)
          600: '#065F46',  // Success-Dark
          700: '#065F46',  // Success-Dark
          800: '#065F46',  // Success-Dark
          900: '#065F46',  // Success-Dark
        },
        // ERROR - newUI.md Section 5.2
        error: {
          50: '#FEF2F2',   // Error-Light
          100: '#FEF2F2',  // Error-Light
          200: '#EF4444',  // Error-Base
          300: '#EF4444',  // Error-Base
          400: '#EF4444',  // Error-Base
          500: '#EF4444',  // ← Icons, error text (Error-Base)
          600: '#991B1B',  // Error-Dark
          700: '#991B1B',  // Error-Dark
          800: '#991B1B',  // Error-Dark
          900: '#991B1B',  // Error-Dark
        },
        // YELLOW (Accent/Warning) - newUI.md Section 5.1
        yellow: {
          100: '#FFFDE7',
          300: '#FFF59D',
          500: '#FFEB3B',
          700: '#FBC02D',
          900: '#F57F17',
        },
        // WARNING - newUI.md Section 5.2 (Uses Gold, brand-aligned)
        warning: {
          50: '#FFF8E7',   // Warning-Light (Gold-100)
          100: '#FFF8E7',  // Warning-Light (Gold-100)
          200: '#D4AF37',  // Warning-Base (Gold-500)
          300: '#D4AF37',  // Warning-Base (Gold-500)
          400: '#D4AF37',  // Warning-Base (Gold-500)
          500: '#D4AF37',  // ← Icons, warning text (Gold-500)
          600: '#92750C',  // Warning-Dark
          700: '#92750C',  // Warning-Dark
          800: '#92750C',  // Warning-Dark
          900: '#92750C',  // Warning-Dark
        },
        // INFO - newUI.md Section 5.2
        info: {
          50: '#EFF6FF',   // Info-Light
          100: '#EFF6FF',  // Info-Light
          200: '#3B82F6',  // Info-Base
          300: '#3B82F6',  // Info-Base
          400: '#3B82F6',  // Info-Base
          500: '#3B82F6',  // ← Icons, info badges (Info-Base)
          600: '#1E40AF',  // Info-Dark
          700: '#1E40AF',  // Info-Dark
          800: '#1E40AF',  // Info-Dark
          900: '#1E40AF',  // Info-Dark
        },
        
        // REGIME COMPARISON COLORS
        regime: {
          old: '#6366F1',   // Indigo
          new: '#8B5CF6',   // Violet
        },
        
        // DATA PROVENANCE COLORS
        source: {
          form16: '#3B82F6',
          ais: '#06B6D4',
          '26as': '#14B8A6',
          broker: '#8B5CF6',
          manual: '#737373',
        },
        
        // Legacy neutral (keeping for backward compatibility)
        neutral: {
          50: '#ffffff',
          100: '#f5f5f5',
          200: '#b3b3b3',
          300: '#4d4d4d',
          400: '#2c2c2c',
          500: '#1a1a1a',
          600: '#141414',
          700: '#0f0f0f',
          800: '#0a0a0a',
          900: '#050505',
        },
        
        // Legacy secondary (keeping for backward compatibility)
        secondary: {
          50: '#fffdf7',
          100: '#fff9e6',
          200: '#fff2cc',
          300: '#ffe699',
          400: '#ffd966',
          500: '#d4af37',
          600: '#b8941f',
          700: '#9c7a17',
          800: '#80600f',
          900: '#644607',
        },
      },
      fontFamily: {
        // Primary font - newUI.md Section 6.1
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Display font - newUI.md Section 6.1
        display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Monospace font - newUI.md Section 6.1
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        // newUI.md Section 6.2 - Type Scale (1.250 Major Third)
        // Display sizes (Plus Jakarta Sans 600)
        'display-1': ['48px', { lineHeight: '56px', fontWeight: '600' }],
        'display-2': ['36px', { lineHeight: '44px', fontWeight: '600' }],
        // Headings (Inter 600)
        'heading-1': ['28px', { lineHeight: '36px', fontWeight: '600', letterSpacing: '-0.02em' }], // H1
        'heading-2': ['24px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.01em' }], // H2
        'heading-3': ['20px', { lineHeight: '28px', fontWeight: '600' }], // H3
        'heading-4': ['16px', { lineHeight: '24px', fontWeight: '600' }], // H4
        // Body text (Inter 400)
        'body-large': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-regular': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        // Special (newUI.md Section 6.2)
        'label': ['12px', { lineHeight: '16px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }],
        'amount': ['20px', { lineHeight: '28px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
        'code': ['14px', { lineHeight: '20px', fontWeight: '400' }], // JetBrains Mono
        // Legacy aliases (backward compatibility)
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
        // Legacy sizes (keeping for backward compatibility)
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        // newUI.md Section 7.1 - 4px base unit
        0: '0px',
        1: '4px',    // 0.25 (base unit)
        2: '8px',    // 0.5
        3: '12px',   // 0.75
        4: '16px',   // 1
        5: '20px',   // 1.25
        6: '24px',   // 1.5
        8: '32px',   // 2
        10: '40px',  // 2.5
        12: '48px',  // 3
        16: '64px',  // 4
        20: '80px',  // 5
        24: '96px',  // 6
        // Legacy tokens (backward compatibility)
        '13': '3.25rem', // 52px
        '15': '3.75rem', // 60px
        '18': '4.5rem',  // 72px
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        // UI.md Border Radius Tokens
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        // Legacy tokens (keeping for backward compatibility)
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // newUI.md Section 8.0 - 5-level Elevation System
        // Level 0: flat/default surface
        'elevation-0': 'none',
        // Level 1: cards at rest
        'elevation-1': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        // Level 2: cards hover/expanded
        'elevation-2': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        // Level 3: dropdowns, popovers
        'elevation-3': '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.08)',
        // Level 4: modals, dialogs
        'elevation-4': '0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.10)',
        // Gold Accent Shadow - newUI.md Section 8.0
        'gold-accent': '0 4px 14px rgba(212, 175, 55, 0.4)', // Primary CTAs, selected states
        // Legacy aliases (backward compatibility)
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'elevated': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'floating': '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.08)',
        'overlay': '0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.10)',
        // Legacy shadows (keeping for backward compatibility)
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-warning': '0 0 20px rgba(212, 175, 55, 0.3)', // Updated to Gold
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
        // Primary brand glows (Gold)
        'primary-glow': '0 0 25px rgba(212, 175, 55, 0.4)', // Updated to Gold-500
        'ember-glow': '0 0 25px rgba(255, 152, 0, 0.4)',
        'aurora-glow': '0 0 30px rgba(212, 175, 55, 0.3), 0 0 60px rgba(255, 152, 0, 0.2)',
        // BurnBlack specific shadows (legacy)
        'burnblack-glow': '0 0 30px rgba(11, 11, 11, 0.4)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.4)',
        'emerald-glow': '0 0 25px rgba(16, 185, 129, 0.4)',
        'sunset-glow': '0 0 25px rgba(230, 126, 34, 0.4)',
        'crimson-glow': '0 0 25px rgba(192, 57, 43, 0.4)',
        'royal-glow': '0 0 25px rgba(41, 128, 185, 0.4)',
      },
      backgroundImage: {
        // NEW: Aurora Gradient (Gold → Ember → Flame) - Updated to use Gold-500
        'aurora-gradient': 'linear-gradient(135deg, #D4AF37 0%, #FF9800 65%, #FF6B00 100%)',
        // Legacy burn gradient (keeping for backward compatibility)
        'burn-gradient': 'linear-gradient(135deg, #FF6B00 0%, #D4AF37 100%)',
        // Additional gradients - Updated to use Gold-500
        'primary-gradient': 'linear-gradient(135deg, #D4AF37 0%, #FF9800 100%)',
        'ember-gradient': 'linear-gradient(135deg, #FF9800 0%, #FF6B00 100%)',
        // Legacy gradients (keeping for backward compatibility)
        'gradient-burnblack-gold': 'linear-gradient(135deg, #0b0b0b 0%, #d4af37 100%)',
        'gradient-gold-emerald': 'linear-gradient(135deg, #d4af37 0%, #2ecc71 100%)',
        'gradient-burnblack-emerald': 'linear-gradient(135deg, #0b0b0b 0%, #2ecc71 100%)',
        'gradient-burnblack-royal': 'linear-gradient(135deg, #0b0b0b 0%, #2980b9 100%)',
        'gradient-sunset-crimson': 'linear-gradient(135deg, #e67e22 0%, #c0392b 100%)',
      },
      animation: {
        // UI.md Motion System - Core Animations
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        // newUI.md Section 9.3 - Component Animations
        'breathing-expand': 'breathingExpand 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'breathing-collapse': 'breathingCollapse 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'content-fade-in': 'contentFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1) 100ms',
        'card-expand': 'cardExpand 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'card-collapse': 'cardCollapse 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'value-update': 'valueUpdate 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        'regime-toggle': 'regimeToggle 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'success-check': 'successCheck 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'success-celebration': 'successCelebration 2000ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-enter': 'toastEnter 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'toast-exit': 'toastExit 200ms cubic-bezier(0.4, 0, 1, 1)',
        // Legacy animations (keeping for backward compatibility)
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        // UI.md Motion System - Core Keyframes
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
        // newUI.md Section 9.3 - Component Keyframes
        breathingExpand: {
          '0%': { width: 'var(--card-summary-width)', opacity: '1' },
          '100%': { width: 'var(--card-expanded-width)', opacity: '1' },
        },
        breathingCollapse: {
          '0%': { width: 'var(--card-summary-width)', opacity: '1' },
          '100%': { width: 'var(--card-glance-width)', opacity: '1' },
        },
        cardExpand: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: 'auto', opacity: '1' },
        },
        cardCollapse: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: 'auto', opacity: '1' },
        },
        contentFadeIn: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        valueUpdate: {
          '0%': { opacity: '1', filter: 'blur(0px)' },
          '50%': { opacity: '0.7', filter: 'blur(2px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        regimeToggle: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        successCelebration: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '20%': { transform: 'scale(1.2)', opacity: '1' },
          '40%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        successCheck: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        toastEnter: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        toastExit: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        // Legacy keyframes (keeping for backward compatibility)
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionDuration: {
        // newUI.md Section 9.1 - Animation Durations
        'instant': '0ms',
        'small': '150ms',        // Button state changes
        'fast': '150ms',
        'medium': '250ms',       // Card expand
        'normal': '200ms',
        'card-expand': '300ms',  // Card expand/collapse
        'relaxed': '300ms',
        'value-update': '400ms', // Value update animations
        'regime-switch': '500ms', // Regime toggle
        'large': '350ms',        // Page transitions
        'slow': '500ms',
        'slower': '700ms',
        'breathing': '400ms',
      },
      transitionTimingFunction: {
        // newUI.md Section 9.2 - Easing Curves
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',        // Most UI transitions
        'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Success states, celebrations
        'ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Modals, popups
        // Legacy aliases (backward compatibility)
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-both': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '24px',
        xl: '40px',
      },
    },
  },
  plugins: [
    // Custom utility plugin for micro-interactions
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Smooth transitions
        '.transition-smooth': {
          transitionProperty: 'all',
          transitionDuration: '200ms',
          transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        },
        '.transition-snappy': {
          transitionProperty: 'all',
          transitionDuration: '150ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-spring': {
          transitionProperty: 'all',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        
        // Hover effects
        '.hover-lift': {
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
          },
        },
        '.hover-glow': {
          transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)', // Updated to Gold-500
          },
        },
        '.hover-scale': {
          transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        '.hover-scale-sm': {
          transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'scale(1.01)',
          },
        },
        
        // Active/Press effects
        '.active-press': {
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        '.active-shrink': {
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        
        // Focus effects - Updated to use Gold-500
        '.focus-ring': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.4)', // Gold-500
          },
        },
        '.focus-glow': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.2)', // Gold-500
          },
        },
        
        // Glassmorphism
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
        '.glass-dark': {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
        '.glass-subtle': {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        },
        
        // Hide scrollbar
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Smooth scrolling
        '.scroll-smooth': {
          scrollBehavior: 'smooth',
        },
        
        // Scroll snap
        '.scroll-snap-x': {
          scrollSnapType: 'x mandatory',
        },
        '.scroll-snap-center': {
          scrollSnapAlign: 'center',
        },
        '.scroll-snap-start': {
          scrollSnapAlign: 'start',
        },
        
        // Tabular numbers
        '.tabular-nums': {
          fontVariantNumeric: 'tabular-nums',
        },
        
        // Text balance
        '.text-balance': {
          textWrap: 'balance',
        },
        
        // Skeleton loading
        '.skeleton': {
          backgroundColor: theme('colors.slate.200'),
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        },
        
        // Pulse dot
        '.pulse-dot': {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            right: '0',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: theme('colors.primary.500'),
            animation: 'pulseSoft 2s ease-in-out infinite',
          },
        },
      };
      
      addUtilities(newUtilities, ['responsive', 'hover', 'focus']);
    },
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
  ],
}
