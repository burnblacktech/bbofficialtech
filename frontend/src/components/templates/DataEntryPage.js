import React from 'react';
import { AppShell } from '../Layout/AppShell';
import { PageContainer } from '../Layout/PageContainer';
import { PageHeader } from '../Layout/PageHeader';
import { PageContent } from '../Layout/PageContent';

/**
 * Data Entry Page Template
 *
 * Archetype B: Capture data progressively
 */
export const DataEntryPage = ({
    title,
    subtitle,
    children,
    actions,
}) => {
    return (
        <AppShell>
            <PageContainer>
                <PageHeader title={title} subtitle={subtitle} actions={actions} />
                <PageContent spacing="block">
                    {children}
                </PageContent>
            </PageContainer>
        </AppShell>
    );
};
