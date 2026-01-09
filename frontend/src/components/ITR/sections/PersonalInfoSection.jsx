
import React, { useState } from 'react';
import { PersonalInfoForm } from '../../../features/personal-info';
import { SectionWrapper } from './SectionWrapper';
import { BankDetailsForm } from '../../../features/bank-details'; // Ensure this path is correct
import IdentityGateStatus from './IdentityGateStatus';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const PersonalInfoSection = ({
    id,
    title,
    description,
    icon,
    isExpanded,
    onToggle,
    formData,
    onUpdate,
    autoFilledFields,
    prefetchSources,
    fieldVerificationStatuses,
    fieldSources,
    readOnly,
}) => {
    const { user } = useAuth();
    const [activeEditor, setActiveEditor] = useState(null); // 'personal', 'address', 'bank'

    // determine completeness (optional, can be passed to wrapper)
    const isComplete = () => {
        return formData?.pan && formData?.name; // Simplified, real check is in submissionGate
    };

    const handleEdit = (mode) => {
        setActiveEditor(mode);
    };

    const closeEditor = () => {
        setActiveEditor(null);
    };

    return (
        <SectionWrapper
            title={activeEditor ? (activeEditor === 'bank' ? 'Add Bank Account' : 'Edit Personal Details') : title}
            description={description}
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={isComplete()}
            rightElement={activeEditor && (
                <button
                    onClick={(e) => { e.stopPropagation(); closeEditor(); }}
                    className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                    <ArrowLeft size={14} /> Back
                </button>
            )}
        >
            {/* View Mode: Status Chips */}
            {!activeEditor && (
                <IdentityGateStatus
                    user={user}
                    formData={formData}
                    onEdit={handleEdit}
                />
            )}

            {/* Edit Mode: Inline Forms */}
            {activeEditor === 'personal' && (
                <div className="animate-fadeIn">
                    <p className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        Editing PAN or Name may require re-verification.
                    </p>
                    <PersonalInfoForm
                        data={formData}
                        onUpdate={onUpdate}
                        autoFilledFields={autoFilledFields}
                        sources={prefetchSources}
                        fieldVerificationStatuses={fieldVerificationStatuses}
                        fieldSources={fieldSources}
                        readOnly={readOnly}
                    // We might want to limit to Personal fields only
                    />
                </div>
            )}

            {activeEditor === 'address' && (
                <div className="animate-fadeIn">
                    <PersonalInfoForm
                        data={formData}
                        onUpdate={onUpdate}
                        readOnly={readOnly}
                        section="address" // Assuming PersonalInfoForm supports section prop or we just show all.
                    // If PersonalInfoForm is monolithic, we might need to scroll or just show it.
                    // For V1.5, assuming it shows address fields.
                    />
                </div>
            )}

            {activeEditor === 'bank' && (
                <div className="animate-fadeIn">
                    <BankDetailsForm
                        data={formData}
                        onUpdate={onUpdate}
                        readOnly={readOnly}
                    />
                </div>
            )}
        </SectionWrapper>
    );
};

export default PersonalInfoSection;
