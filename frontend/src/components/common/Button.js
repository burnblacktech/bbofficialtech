// =====================================================
// BUTTON COMPONENT - CANONICAL DESIGN SYSTEM
// Unified button component with consistent styling and behavior
// =====================================================

import React from 'react';
// import { enterpriseLogger } from '../../utils/logger';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  // Base classes
  const baseClasses = 'btn';

  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    light: 'btn-light',
    dark: 'btn-dark',
    outline: 'btn-outline-primary',
    ghost: 'btn-ghost',
    link: 'btn-link',
  };

  // Size classes
  const sizeClasses = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg',
    xlarge: 'btn-xl',
  };

  // State classes
  const stateClasses = {
    disabled: disabled ? 'btn-disabled' : '',
    loading: loading ? 'btn-loading' : '',
    fullWidth: fullWidth ? 'btn-full-width' : '',
  };

  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses.disabled,
    stateClasses.loading,
    stateClasses.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;

    const iconElement = React.cloneElement(icon, {
      className: `btn-icon ${icon.props.className || ''}`,
      size: size === 'small' ? 16 : size === 'large' ? 24 : 20,
    });

    return (
      <span className={`btn-icon-wrapper ${iconPosition === 'right' ? 'btn-icon-right' : 'btn-icon-left'}`}>
        {iconElement}
      </span>
    );
  };

  // Render loading spinner
  const renderLoadingSpinner = () => {
    if (!loading) return null;

    return (
      <span className="btn-spinner">
        <svg
          className="spinner"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
          >
            <animate
              attributeName="stroke-dasharray"
              dur="2s"
              values="0 31.416;15.708 15.708;0 31.416"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              dur="2s"
              values="0;-15.708;-31.416"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </span>
    );
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && renderLoadingSpinner()}
      {icon && iconPosition === 'left' && renderIcon()}
      <span className="btn-content">
        {children}
      </span>
      {icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

// Button variants for easy access
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const InfoButton = (props) => <Button variant="info" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const LinkButton = (props) => <Button variant="link" {...props} />;

// Button sizes for easy access
export const SmallButton = (props) => <Button size="small" {...props} />;
export const MediumButton = (props) => <Button size="medium" {...props} />;
export const LargeButton = (props) => <Button size="large" {...props} />;
export const XLargeButton = (props) => <Button size="xlarge" {...props} />;

// Icon button variants
export const IconButton = ({ icon, ...props }) => (
  <Button icon={icon} {...props}>
    {props.children}
  </Button>
);

// Loading button variant
export const LoadingButton = ({ loading, ...props }) => (
  <Button loading={loading} {...props}>
    {props.children}
  </Button>
);

// Full width button variant
export const FullWidthButton = (props) => <Button fullWidth {...props} />;

export default Button;
