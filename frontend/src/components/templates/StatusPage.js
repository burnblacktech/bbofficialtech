import React from 'react';
import { AppShell } from '../Layout/AppShell';
import { PageContainer } from '../Layout/PageContainer';
import { PageHeader } from '../Layout/PageHeader';
import { PageContent } from '../Layout/PageContent';

/**
 * Status Page Template
 *
 * Archetype D: Show state, minimal actions
 */
export const StatusPage = ({
    title,
    subtitle,
    children,
    recoveryAction,
}) => {
    return (
        <AppShell>
            <PageContainer>
                <PageHeader title={title} subtitle={subtitle} />
                <PageContent spacing="section">
                    <div className="flex flex-col items-center text-center">
                        {children}
                    </div>
                    {recoveryAction && (
                        <div className="mt-8 flex justify-center">
                            {recoveryAction}
                        </div>
                    )}
                </PageContent>
            </PageContainer>
        </AppShell>
    );
};
