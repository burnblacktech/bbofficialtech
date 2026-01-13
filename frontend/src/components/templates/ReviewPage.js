import React from 'react';
import { AppShell } from '../Layout/AppShell';
import { PageContainer } from '../Layout/PageContainer';
import { PageHeader } from '../Layout/PageHeader';
import { PageContent } from '../Layout/PageContent';

/**
 * Review Page Template
 *
 * Archetype C: Read-only review
 */
export const ReviewPage = ({
    title,
    subtitle,
    children,
    actions,
}) => {
    return (
        <AppShell>
            <PageContainer>
                <PageHeader title={title} subtitle={subtitle} actions={actions} />
                <PageContent spacing="section">
                    {children}
                </PageContent>
            </PageContainer>
        </AppShell>
    );
};
