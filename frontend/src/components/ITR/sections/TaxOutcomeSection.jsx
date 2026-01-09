import React from 'react';
import SectionCard from '../../DesignSystem/SectionCard';
import { IndianRupee } from 'lucide-react';

const TaxOutcomeSection = ({
    taxComputation,
    ...props
}) => {
    return (
        <SectionCard
            {...props}
            title="Here's how your tax looks"
            description="Based on your income and savings."
            icon={IndianRupee}
        >
            <div className="p-4">
                Tax Outcome Placeholder
            </div>
        </SectionCard>
    );
};

export default TaxOutcomeSection;
