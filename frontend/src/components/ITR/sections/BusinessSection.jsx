
import React from 'react';
import { IndianRupee } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import {
    BusinessIncomeForm,
    ProfessionalIncomeForm,
    PresumptiveIncomeForm,
    Section44AEForm,
} from '../../../features/income';
import BalanceSheetForm from '../BalanceSheetForm';
import AuditInformationForm from '../AuditInformationForm';

const BusinessSection = ({
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
    readOnly,
}) => {
    // Map specific IDs to content
    const renderContent = () => {
        switch (id) {
            case 'businessIncome':
                if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
                    return (
                        <BusinessIncomeForm
                            filingId={fullFormData?.filingId || fullFormData?.id}
                            data={formData?.income?.businessIncome || formData?.businessIncome || {}}
                            onUpdate={(updates) => {
                                const currentIncome = formData.income || {};
                                onUpdate({
                                    income: {
                                        ...currentIncome,
                                        businessIncome: { ...(currentIncome.businessIncome || formData.businessIncome || {}), ...updates },
                                    },
                                });
                            }}
                            selectedITR={selectedITR}
                            onDataUploaded={onDataUploaded}
                        />
                    );
                }
                return null;

            case 'professionalIncome':
                if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
                    return (
                        <ProfessionalIncomeForm
                            filingId={fullFormData?.filingId || fullFormData?.id}
                            data={formData?.income?.professionalIncome || formData?.professionalIncome || {}}
                            onUpdate={(updates) => {
                                const currentIncome = formData.income || {};
                                onUpdate({
                                    income: {
                                        ...currentIncome,
                                        professionalIncome: { ...(currentIncome.professionalIncome || formData.professionalIncome || {}), ...updates },
                                    },
                                });
                            }}
                            selectedITR={selectedITR}
                            onDataUploaded={onDataUploaded}
                        />
                    );
                }
                return null;

            case 'presumptiveIncome':
                if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
                    return (
                        <PresumptiveIncomeForm
                            data={formData?.presumptiveBusiness || formData?.presumptiveProfessional || {}}
                            onChange={(data) => {
                                onUpdate({
                                    presumptiveBusiness: data.presumptiveBusiness || formData?.presumptiveBusiness,
                                    presumptiveProfessional: data.presumptiveProfessional || formData?.presumptiveProfessional,
                                });
                            }}
                            selectedITR={selectedITR}
                        />
                    );
                }
                return null;

            case 'goodsCarriage':
                if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
                    return (
                        <Section44AEForm
                            data={formData?.goodsCarriage || {}}
                            onUpdate={(data) => onUpdate({ goodsCarriage: data })}
                            filingId={fullFormData?.filingId || fullFormData?.id}
                        />
                    );
                }
                return null;

            case 'balanceSheet':
                // Not strictly "Income" but usually grouped in business context
                return (
                    <BalanceSheetForm
                        filingId={fullFormData?.filingId || fullFormData?.id}
                        selectedITR={selectedITR}
                        onUpdate={onUpdate}
                    />
                );

            case 'auditInfo':
                return (
                    <AuditInformationForm
                        filingId={fullFormData?.filingId || fullFormData?.id}
                        selectedITR={selectedITR}
                        onUpdate={onUpdate}
                    />
                );

            default:
                return <div className="p-4 text-center text-slate-500">Section content not found.</div>;
        }
    };

    return (
        <SectionWrapper
            title={title}
            description={description}
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={false} // Todo: Implement logic
        >
            {renderContent()}
        </SectionWrapper>
    );
};

export default BusinessSection;
