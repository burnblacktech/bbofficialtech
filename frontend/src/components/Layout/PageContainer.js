import React from 'react';
import { layout } from '../../styles/designTokens';

/**
 * PageContainer - Constrains page width and applies horizontal padding
 */
export const PageContainer = ({
    children,
    maxWidth = layout.pageMaxWidth,
}) => {
    return (
        <div className={`${maxWidth} ${layout.container} ${layout.pagePadding}`}>
            {children}
        </div>
    );
};
