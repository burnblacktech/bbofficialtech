import React from 'react';
import { AppShell } from '../Layout/AppShell';
import { PageContainer } from '../Layout/PageContainer';
import { PageHeader } from '../Layout/PageHeader';
import { PageContent } from '../Layout/PageContent';

/**
 * Orientation Page Template
 *
 * Archetype A: Orient, reassure, guide
 */
export const OrientationPage = ({
    title,
    subtitle,
    children,
    primaryAction,
    secondaryAction,
}) => {
    return (
        <AppShell>
            <PageContainer>
                <PageHeader title={title} subtitle={subtitle} />
                <PageContent spacing="section">
                    {children}
                </PageContent>
                {(primaryAction || secondaryAction) && (
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                        {primaryAction}
                        {secondaryAction}
                    </div>
                )}
            </PageContainer>
        </AppShell>
    );
};
