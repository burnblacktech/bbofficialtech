
import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { TaxesPaidForm } from '../../../features/taxes-paid';
import { BankDetailsForm } from '../../../features/bank-details';
import TaxCalculator from '../../../components/ITR/TaxCalculator';
import { canSubmitFiling } from '../../../utils/submissionGate';

const ReviewSection = ({
    id,
    title,
    description,
    icon,
    isExpanded,
    onToggle,
    formData,
    fullFormData,
    onUpdate,
    taxComputation,
    onTaxComputed,
    regime,
    assessmentYear,
    readOnly,
}) => {
    // We need user context to check the gate
    const { user } = require('../../../contexts/AuthContext').useAuth();
    const submissionStatus = canSubmitFiling(user, fullFormData || formData);

    switch (id) {
        case 'taxesPaid':
            return (
                <TaxesPaidForm
                    data={formData}
                    onUpdate={onUpdate}
                    readOnly={readOnly}
                />
            );
        case 'taxComputation':
            return (
                <TaxCalculator
                    formData={fullFormData || formData}
                    onComputed={onTaxComputed}
                    regime={regime}
                    assessmentYear={assessmentYear}
                />
            );
        case 'bankDetails':
            return (
                <BankDetailsForm
                    data={formData}
                    onUpdate={onUpdate}
                    readOnly={readOnly}
                />
            );
        default:
            return null;
    }
};

return (
    <SectionWrapper
        title={title}
        description={description}
        icon={icon}
        isExpanded={isExpanded}
        onToggle={onToggle}
        isComplete={false}
    >
        isComplete={false}
    >
        {/* V2.4: CA Assist Nudge */}
        <CAAssistNudge computation={taxComputation} />

        {renderContent()}
    </SectionWrapper>
);
};

import CAAssistNudge from '../intelligence/CAAssistNudge';
import CARequestCard from '../intelligence/CARequestCard';

export default ReviewSection;
