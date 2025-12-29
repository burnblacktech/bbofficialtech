
import React from 'react';
import { IndianRupee } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { CapitalGainsForm } from '../../../features/income';

const CapitalGainsSection = ({
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
    onDataUploaded,
}) => {
    const handleCapitalGainsUpdate = (updates) => {
        onUpdate({ capitalGains: { ...formData, ...updates } });
    };

    return (
        <SectionWrapper
            title={title}
            description={description}
            icon={icon || IndianRupee}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={false}
        >
            <CapitalGainsForm
                filingId={fullFormData?.filingId || fullFormData?.id}
                data={formData || {}}
                onUpdate={handleCapitalGainsUpdate}
                selectedITR={selectedITR}
                onDataUploaded={onDataUploaded}
            />
        </SectionWrapper>
    );
};

export default CapitalGainsSection;
