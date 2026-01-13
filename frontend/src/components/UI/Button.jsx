import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button Component - Standardized button following S29 design system
 *
 * @param {string} variant - Button style variant (primary, secondary, danger)
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disabled state
 * @param {React.ReactNode} children - Button content
 * @param {React.ReactNode} icon - Optional icon (Lucide React component)
 * @param {string} iconPosition - Icon position (left, right)
 */
export const Button = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    children,
    icon: Icon,
    iconPosition = 'right',
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        ghost: 'text-slate-700 hover:bg-slate-100 border border-transparent',
        link: 'text-primary-500 hover:text-primary-600 underline-offset-4 hover:underline',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm rounded-lg',
        md: 'px-5 py-2.5 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-xl',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {Icon && iconPosition === 'left' && !loading && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && !loading && <Icon className="w-4 h-4" />}
        </button>
    );
};

Button.propTypes = {
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'link']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    fullWidth: PropTypes.bool,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    className: PropTypes.string,
};
