import React from 'react';
import { typography, spacing } from '../../styles/designTokens';

/**
 * PageHeader - Consistent page title section
 */
export const PageHeader = ({
    title,
    subtitle,
    actions,
}) => {
    return (
        <div className={`${spacing.section} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
            <div>
                <h1 className={typography.pageTitle}>{title}</h1>
                {subtitle && (
                    <p className={`${typography.bodySmall} mt-1`}>{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
