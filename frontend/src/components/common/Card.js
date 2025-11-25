// =====================================================
// CARD COMPONENT - CANONICAL DESIGN SYSTEM
// Unified card component with consistent styling and behavior
// =====================================================

import React from 'react';
// import { enterpriseLogger } from '../../utils/logger';

const Card = ({
  children,
  variant = 'default',
  size = 'medium',
  padding = 'medium',
  shadow = 'medium',
  border = true,
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  // Base classes
  const baseClasses = 'card';

  // Variant classes
  const variantClasses = {
    default: 'card-default',
    primary: 'card-primary',
    secondary: 'card-secondary',
    success: 'card-success',
    danger: 'card-danger',
    warning: 'card-warning',
    info: 'card-info',
    light: 'card-light',
    dark: 'card-dark',
    outline: 'card-outline',
    ghost: 'card-ghost',
  };

  // Size classes
  const sizeClasses = {
    small: 'card-sm',
    medium: 'card-md',
    large: 'card-lg',
    xlarge: 'card-xl',
  };

  // Padding classes
  const paddingClasses = {
    none: 'card-padding-none',
    small: 'card-padding-sm',
    medium: 'card-padding-md',
    large: 'card-padding-lg',
    xlarge: 'card-padding-xl',
  };

  // Shadow classes
  const shadowClasses = {
    none: 'card-shadow-none',
    small: 'card-shadow-sm',
    medium: 'card-shadow-md',
    large: 'card-shadow-lg',
    xlarge: 'card-shadow-xl',
  };

  // State classes
  const stateClasses = {
    border: border ? 'card-border' : 'card-no-border',
    hover: hover ? 'card-hover' : '',
    clickable: onClick ? 'card-clickable' : '',
  };

  // Combine all classes
  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    paddingClasses[padding],
    shadowClasses[shadow],
    stateClasses.border,
    stateClasses.hover,
    stateClasses.clickable,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header Component
export const CardHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Body Component
export const CardBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle = ({
  children,
  level = 3,
  className = '',
  ...props
}) => {
  const Tag = `h${level}`;
  return (
    <Tag className={`card-title ${className}`} {...props}>
      {children}
    </Tag>
  );
};

// Card Subtitle Component
export const CardSubtitle = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`card-subtitle ${className}`} {...props}>
      {children}
    </p>
  );
};

// Card Text Component
export const CardText = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`card-text ${className}`} {...props}>
      {children}
    </p>
  );
};

// Card Image Component
export const CardImage = ({
  src,
  alt,
  className = '',
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`card-image ${className}`}
      {...props}
    />
  );
};

// Card Actions Component
export const CardActions = ({
  children,
  className = '',
  align = 'right',
  ...props
}) => {
  const alignClass = `card-actions-${align}`;
  return (
    <div className={`card-actions ${alignClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Pre-built card variants
export const PrimaryCard = (props) => <Card variant="primary" {...props} />;
export const SuccessCard = (props) => <Card variant="success" {...props} />;
export const DangerCard = (props) => <Card variant="danger" {...props} />;
export const WarningCard = (props) => <Card variant="warning" {...props} />;
export const InfoCard = (props) => <Card variant="info" {...props} />;
export const OutlineCard = (props) => <Card variant="outline" {...props} />;
export const GhostCard = (props) => <Card variant="ghost" {...props} />;

// Pre-built card sizes
export const SmallCard = (props) => <Card size="small" {...props} />;
export const MediumCard = (props) => <Card size="medium" {...props} />;
export const LargeCard = (props) => <Card size="large" {...props} />;
export const XLargeCard = (props) => <Card size="xlarge" {...props} />;

// Hover card variant
export const HoverCard = (props) => <Card hover {...props} />;

// Clickable card variant
export const ClickableCard = (props) => <Card onClick={props.onClick} {...props} />;

// Stat card for displaying metrics
export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = '',
  ...props
}) => {
  return (
    <Card className={`stat-card ${className}`} {...props}>
      <CardHeader>
        {icon && <div className="stat-card-icon">{icon}</div>}
        <CardTitle level={6}>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="stat-card-value">{value}</div>
        {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        {trend && (
          <div className={`stat-card-trend trend-${trend}`}>
            {trendValue}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Card;
