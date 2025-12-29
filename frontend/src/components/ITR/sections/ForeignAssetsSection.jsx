
import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { ScheduleFA } from '../../../features/foreign-assets';

const ForeignAssetsSection = ({
    id,
    title,
    description,
    icon,
    isExpanded,
    onToggle,
    filingId,
    onUpdate,
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
            <ScheduleFA
                filingId={filingId}
                onUpdate={onUpdate}
            />
        </SectionWrapper>
    );
};

export default ForeignAssetsSection;
