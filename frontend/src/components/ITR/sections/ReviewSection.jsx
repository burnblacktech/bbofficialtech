import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { TaxesPaidForm } from '../../../features/taxes-paid';
import { BankDetailsForm } from '../../../features/bank-details';
import TaxCalculator from '../../../components/ITR/TaxCalculator';
import CAAssistNudge from '../intelligence/CAAssistNudge';
import { useAuth } from '../../../contexts/AuthContext';
// import { canSubmitFiling } from '../../../utils/submissionGate';

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
    // const { user } = useAuth();
    // const submissionStatus = canSubmitFiling(user, fullFormData || formData); // unused for now

    const renderContent = () => {
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
            {/* V2.4: CA Assist Nudge */}
            <CAAssistNudge computation={taxComputation} />
            {renderContent()}
        </SectionWrapper>
    );
};

export default ReviewSection;
