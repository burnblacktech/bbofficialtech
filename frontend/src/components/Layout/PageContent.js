import React from 'react';
import { layout } from '../../styles/designTokens';

/**
 * PageContent - Main content area with consistent vertical rhythm
 */
export const PageContent = ({
    children,
    spacing = 'section',
}) => {
    const spacingClass = spacing === 'section'
        ? layout.sectionGap
        : spacing === 'block'
            ? layout.blockGap
            : '';

    return (
        <div className={spacingClass}>
            {children}
        </div>
    );
};
