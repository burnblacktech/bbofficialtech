
import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { ExemptIncomeForm, AgriculturalIncomeForm } from '../../../features/income';

const ExemptIncomeSection = ({
    id,
    title,
    description,
    icon,
    isExpanded,
    onToggle,
    formData,
    fullFormData,
    onUpdate,
    selectedITR,
    readOnly,
}) => {
    return (
        <SectionWrapper
            title={title}
            description={description}
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={false}
        >
            <div className="space-y-6">
                <AgriculturalIncomeForm
                    data={formData?.agriculturalIncome || {}}
                    onUpdate={(data) => {
                        onUpdate({
                            agriculturalIncome: data,
                        });
                    }}
                    selectedITR={selectedITR}
                    filingId={fullFormData?.filingId || fullFormData?.id}
                    readOnly={readOnly}
                />

                <ExemptIncomeForm
                    data={formData?.exemptIncomes || []}
                    onUpdate={(data) => {
                        onUpdate({
                            exemptIncomes: data,
                            hasExemptIncome: data?.length > 0,
                        });
                    }}
                />
            </div>
        </SectionWrapper>
    );
};

export default ExemptIncomeSection;
