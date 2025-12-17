// =====================================================
// HELP ICON COMPONENT
// Inline help icon with tooltip trigger
// Per UI.md specifications (lines 7863-7876, 5988-5999)
// =====================================================

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, RichTooltip } from '../Tooltip';
import { cn } from '../../../lib/utils';

/**
 * HelpIcon Component
 * Displays a help icon that triggers a tooltip on hover/click
 */
export const HelpIcon = ({
  content,
  title,
  description,
  link,
  variant = 'simple', // 'simple' | 'rich'
  placement = 'top',
  className = '',
  ...props
}) => {
  const iconClasses = cn(
    'inline-flex text-slate-400 hover:text-slate-600 transition-colors cursor-help',
    'ml-1', // 4px gap from text
    className,
  );

  const icon = (
    <HelpCircle
      className={iconClasses}
      style={{ width: '14px', height: '14px' }}
      aria-label="Help"
      {...props}
    />
  );

  if (variant === 'rich' && title) {
    return (
      <RichTooltip
        title={title}
        description={description || ''}
        link={link}
        side={placement}
      >
        {icon}
      </RichTooltip>
    );
  }

  return (
    <Tooltip content={content} side={placement}>
      {icon}
    </Tooltip>
  );
};

/**
 * FieldLabelWithHelp Component
 * Combines a label with an inline help icon
 * Usage: <FieldLabelWithHelp label="HRA Exemption" helpContent="..." />
 */
export const FieldLabelWithHelp = ({
  label,
  helpContent,
  helpTitle,
  helpDescription,
  helpLink,
  variant = 'simple',
  className = '',
  ...props
}) => {
  return (
    <label className={cn('flex items-center', className)} {...props}>
      <span>{label}</span>
      <HelpIcon
        content={helpContent}
        title={helpTitle}
        description={helpDescription}
        link={helpLink}
        variant={variant}
      />
    </label>
  );
};

export default HelpIcon;

