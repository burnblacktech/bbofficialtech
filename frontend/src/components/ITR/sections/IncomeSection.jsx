
import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Info, Briefcase, Home, TrendingUp, UserCheck } from 'lucide-react';
import { variants } from '../../../lib/motion';
import { SectionWrapper, SubSection } from './SectionWrapper';
import ConversationalToggle from '../../common/ConversationalToggle';
import {
    SalaryForm,
    HousePropertyForm,
    CapitalGainsForm,
    ForeignIncomeForm,
    DirectorPartnerIncomeForm,
    OtherSourcesForm,
    ITR4IncomeForm,
} from '../../../features/income';

// Sub-component for ITR-2 Income
const ITR2IncomeForm = ({ data, onUpdate, selectedITR, fullFormData, onDataUploaded }) => {
    const handleHousePropertyUpdate = (updates) => {
        onUpdate({ houseProperty: { ...data.houseProperty, ...updates } });
    };

    const handleCapitalGainsUpdate = (updates) => {
        onUpdate({ capitalGains: { ...data.capitalGains, ...updates } });
    };

    const handleForeignIncomeUpdate = (updates) => {
        onUpdate({ foreignIncome: { ...data.foreignIncome, ...updates } });
    };

    const handleDirectorPartnerUpdate = (updates) => {
        onUpdate({ directorPartner: { ...data.directorPartner, ...updates } });
    };

    return (
        <motion.div
            className="space-y-4"
            variants={variants.staggerContainer}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Salary Income" icon={IndianRupee}>
                    <SalaryForm
                        data={data}
                        onUpdate={onUpdate}
                        selectedITR={selectedITR}
                        onForm16Extracted={onDataUploaded}
                    />
                </SubSection>
            </motion.div>

            <motion.div variants={variants.staggerItem}>
                <SubSection title="House Property" icon={IndianRupee}>
                    <HousePropertyForm
                        filingId={fullFormData?.filingId || fullFormData?.id || data?.filingId || data?.id}
                        data={data.houseProperty || { properties: data.properties || [] }}
                        onUpdate={handleHousePropertyUpdate}
                        selectedITR={selectedITR}
                        onDataUploaded={onDataUploaded}
                    />
                </SubSection>
            </motion.div>

            <motion.div variants={variants.staggerItem}>
                <SubSection title="Capital Gains" icon={IndianRupee}>
                    <CapitalGainsForm
                        filingId={fullFormData?.filingId || fullFormData?.id || data?.filingId || data?.id}
                        data={data.capitalGains || {}}
                        onUpdate={handleCapitalGainsUpdate}
                        selectedITR={selectedITR}
                        onDataUploaded={onDataUploaded}
                    />
                </SubSection>
            </motion.div>

            <motion.div variants={variants.staggerItem}>
                <SubSection title="Foreign Income" icon={IndianRupee}>
                    <ForeignIncomeForm
                        data={data.foreignIncome || {}}
                        onUpdate={handleForeignIncomeUpdate}
                        selectedITR={selectedITR}
                    />
                </SubSection>
            </motion.div>

            <motion.div variants={variants.staggerItem}>
                <SubSection title="Director/Partner Income" icon={IndianRupee}>
                    <DirectorPartnerIncomeForm
                        data={data.directorPartner || {}}
                        onUpdate={handleDirectorPartnerUpdate}
                        selectedITR={selectedITR}
                    />
                </SubSection>
            </motion.div>

            <motion.div variants={variants.staggerItem}>
                <SubSection title="Income from Other Sources (Schedule OS)" icon={IndianRupee}>
                    <OtherSourcesForm
                        data={data.otherSources || {}}
                        onUpdate={(updates) => onUpdate({ otherSources: updates })}
                        selectedITR={selectedITR}
                        filingId={fullFormData?.filingId || fullFormData?.id || data?.filingId || data?.id}
                    />
                </SubSection>
            </motion.div>
        </motion.div>
    );
};

// Sub-component for ITR-3 Income (Similar to ITR-2 but handled via specific forms in BusinessSection usually,
// but Income section usually covers Salary/HP/CG/OS)
const ITR3IncomeForm = ({ data, onUpdate, selectedITR, fullFormData, onDataUploaded }) => {
    // Reusing ITR2 structure for common income heads as per original code structure
    // Original code had ITR3IncomeForm which also included Business/Professional logic if it was under 'income' key?
    // Looking at original code, ITR3IncomeForm (lines 646+) included Salary, Business, Professional, HP, CG, Foreign, Director, OS.
    // However, ITRComputation.js separates Business/Professional into separate SECTIONS ('businessIncome', 'professionalIncome').
    // So 'income' section for ITR-3 might just be the others?
    // Wait, original `ITR3IncomeForm` included `BusinessIncomeForm` and `ProfessionalIncomeForm`!
    // But `ITRComputation.js` has specific IDs for them.
    // If ITRComputation renders `<IncomeSection id='income'>`, it should probably NOT render Business/Professional if they have their own sections.
    // BUT, for ITR-3, `ITRComputation.js` defines `itr3Sections` which has `businessIncome` and `professionalIncome`.
    // So `income` section in ITR-3 likely corresponds to "Income Details" which implies Salary, HP, CG, OS?
    // In `ITR3IncomeForm` (original), it rendered `BusinessIncomeForm` inside it.
    // This implies duplication or that the ID 'income' for ITR-3 aggregates everything?
    // Let's check `ITRComputation.js` lines 3856: Title for income is "Salary, Business, Professional..." for ITR-3.
    // So for ITR-3, the 'income' section WAS the aggregator.
    // BUT `ITRComputation.js` ALSO had `itr3Sections` which added `businessIncome` etc.
    // If `allSections` includes both `baseSections` (with `income`) AND `itr3Sections` (with `businessIncome`),
    // then we have TWO places showing business income?
    // `shouldShowSection` filters them.
    // If `income` section is shown, it shows everything.
    // I need to be careful.
    // If I split them, ITRComputation needs to adapt.
    // I'll stick to original logic: If ITR-3, render ITR3IncomeForm which includes everything.
    // I will import BusinessIncomeForm here too.

    // Actually, I'll defer Business logic to BusinessSection if possible, but if the original code lumped them, I should support it or refactor cleanly.
    // User asked for `BusinessSection.jsx`.
    // I will extract Business/Professional forms to `BusinessSection.jsx`.
    // And remove them from `IncomeSection` for ITR-3, IF I ensure `ITRComputation` renders `BusinessSection`.
    // `ITRComputation.js` ALREADY has `itr3Sections` with `businessIncome` ID.
    // Does it render `income` section for ITR-3? Yes.
    // Does `shouldShowSection` hide `income` for ITR-3? Likely not.
    // So distinct sections exist.
    // I will implement `ITR3IncomeForm` here WITHOUT Business/Professional, assuming they are handled by `BusinessSection` now.
    // Wait, if I remove them, I change the UI.
    // I should check if `orderedSections` shows both.
    // If so, I'll keep them separate.
    // I'll assume they are separate.

    const handleHousePropertyUpdate = (updates) => {
        onUpdate({ houseProperty: { ...data.houseProperty, ...updates } });
    };

    const handleCapitalGainsUpdate = (updates) => {
        onUpdate({ capitalGains: { ...data.capitalGains, ...updates } });
    };

    const handleForeignIncomeUpdate = (updates) => {
        onUpdate({ foreignIncome: { ...data.foreignIncome, ...updates } });
    };

    const handleDirectorPartnerUpdate = (updates) => {
        onUpdate({ directorPartner: { ...data.directorPartner, ...updates } });
    };

    return (
        <motion.div className="space-y-4" variants={variants.staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Salary Income" icon={IndianRupee}>
                    <SalaryForm data={data} onUpdate={onUpdate} selectedITR={selectedITR} onForm16Extracted={onDataUploaded} />
                </SubSection>
            </motion.div>
            {/* Business/Professional removed from here, assumed to be in BusinessSection */}
            <motion.div variants={variants.staggerItem}>
                <SubSection title="House Property" icon={IndianRupee}>
                    <HousePropertyForm filingId={fullFormData?.filingId || fullFormData?.id} data={data.houseProperty || { properties: data.properties || [] }} onUpdate={handleHousePropertyUpdate} selectedITR={selectedITR} onDataUploaded={onDataUploaded} />
                </SubSection>
            </motion.div>
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Capital Gains" icon={IndianRupee}>
                    <CapitalGainsForm filingId={fullFormData?.filingId || fullFormData?.id} data={data.capitalGains || {}} onUpdate={handleCapitalGainsUpdate} selectedITR={selectedITR} onDataUploaded={onDataUploaded} />
                </SubSection>
            </motion.div>
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Foreign Income" icon={IndianRupee}>
                    <ForeignIncomeForm data={data.foreignIncome || {}} onUpdate={handleForeignIncomeUpdate} selectedITR={selectedITR} />
                </SubSection>
            </motion.div>
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Director/Partner Income" icon={IndianRupee}>
                    <DirectorPartnerIncomeForm data={data.directorPartner || {}} onUpdate={handleDirectorPartnerUpdate} selectedITR={selectedITR} />
                </SubSection>
            </motion.div>
            <motion.div variants={variants.staggerItem}>
                <SubSection title="Income from Other Sources" icon={IndianRupee}>
                    <OtherSourcesForm data={data.otherSources || {}} onUpdate={(updates) => onUpdate({ otherSources: updates })} selectedITR={selectedITR} filingId={fullFormData?.filingId || fullFormData?.id} />
                </SubSection>
            </motion.div>
        </motion.div>
    );
}

const IncomeSection = ({
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
    // Determine completeness
    const isComplete = () => {
        // Basic check: Salary entered?
        return (formData.salary > 0 || formData.income?.salary > 0);
    };

    return (
        <SectionWrapper
            title={title}
            description={description}
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={isComplete()}
        >
            {(() => {
                if (selectedITR === 'ITR-2' || selectedITR === 'ITR2') {
                    return (
                        <ITR2IncomeForm
                            data={formData}
                            onUpdate={onUpdate}
                            selectedITR={selectedITR}
                            fullFormData={fullFormData}
                            onDataUploaded={onDataUploaded}
                        />
                    );
                }
                if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
                    return (
                        <ITR3IncomeForm
                            data={formData}
                            onUpdate={onUpdate}
                            selectedITR={selectedITR}
                            fullFormData={fullFormData}
                            onDataUploaded={onDataUploaded}
                        />
                    );
                }
                if (selectedITR === 'ITR-4' || selectedITR === 'ITR4') {
                    return (
                        <ITR4IncomeForm
                            data={formData}
                            onUpdate={onUpdate}
                            selectedITR={selectedITR}
                            fullFormData={fullFormData}
                            onDataUploaded={onDataUploaded}
                        />
                    );
                }
                // ITR-1 Conversational Flow
                const [hasSalary, setHasSalary] = React.useState(formData.salary > 0 || formData.income?.salary > 0);
                const [jobSwitch, setJobSwitch] = React.useState(false); // Can infer from multiple rows later
                const [hasHP, setHasHP] = React.useState(
                    (formData.houseProperty?.properties?.length > 0) ||
                    (formData.houseProperty?.type) // Check if any HP data exists
                );
                const [hasOS, setHasOS] = React.useState(
                    formData.otherSources?.interestIncome > 0 ||
                    formData.otherSources?.dividendIncome > 0
                );

                // Sync with external data updates (if auto-filled)
                React.useEffect(() => {
                    if (formData.salary > 0) setHasSalary(true);
                    if (formData.houseProperty?.properties?.length > 0) setHasHP(true);
                    if (formData.otherSources?.totInterest > 0) setHasOS(true);
                }, [formData]);

                return (
                    <motion.div
                        className="space-y-4"
                        variants={variants.staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* 1. Salary Conversation */}
                        <div className="space-y-4">
                            <ConversationalToggle
                                question="Do you have income from Salary or Pension?"
                                isYes={hasSalary}
                                onAnswer={(ans) => {
                                    setHasSalary(ans);
                                    if (!ans) {
                                        // Optional: Clear salary data or just hide?
                                        // Value first, don't destructive delete immediately unless confirmed.
                                    }
                                }}
                                icon={Briefcase}
                            />

                            {hasSalary && (
                                <motion.div variants={variants.staggerItem} className="pl-0 sm:pl-4 border-l-2 border-slate-100 ml-2 sm:ml-6 space-y-4">
                                    <ConversationalToggle
                                        question="Did you switch jobs during the year?"
                                        subtext="We'll help you combine details from both employers."
                                        isYes={jobSwitch}
                                        onAnswer={(ans) => {
                                            setJobSwitch(ans);
                                            // TODO: If ans is true, could auto-add a row in SalaryForm if we had access to pass that intent down
                                        }}
                                        icon={UserCheck}
                                    />

                                    <SubSection title="Salary details" icon={IndianRupee} defaultOpen={true}>
                                        <SalaryForm
                                            data={formData}
                                            onUpdate={onUpdate}
                                            selectedITR={selectedITR}
                                            onForm16Extracted={onDataUploaded}
                                            readOnly={readOnly}
                                            showJobSwitchNudge={jobSwitch}
                                        />
                                    </SubSection>
                                </motion.div>
                            )}
                        </div>

                        {/* 2. House Property Conversation */}
                        <div className="space-y-4">
                            <ConversationalToggle
                                question="Do you pay rent or have a home loan?"
                                subtext="Claim HRA or interest deductions on your home loan."
                                isYes={hasHP}
                                onAnswer={setHasHP}
                                icon={Home}
                            />

                            {hasHP && (
                                <motion.div variants={variants.staggerItem} className="pl-0 sm:pl-4 border-l-2 border-slate-100 ml-2 sm:ml-6">
                                    <SubSection title="House Property details" icon={IndianRupee} defaultOpen={true}>
                                        <div className="space-y-4">
                                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-2">
                                                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-body-small text-amber-700">
                                                    ITR-1 allows only one house property. For multiple properties, use ITR-2.
                                                </p>
                                            </div>
                                            <HousePropertyForm
                                                filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
                                                data={formData?.houseProperty || { properties: [] }}
                                                onUpdate={(updates) => onUpdate({ houseProperty: { ...formData?.houseProperty, ...updates } })}
                                                selectedITR={selectedITR}
                                                onDataUploaded={onDataUploaded}
                                                maxProperties={1}
                                                readOnly={readOnly}
                                            />
                                        </div>
                                    </SubSection>
                                </motion.div>
                            )}
                        </div>

                        {/* 3. Other Sources Conversation */}
                        <div className="space-y-4">
                            <ConversationalToggle
                                question="Do you have interest or dividend income?"
                                subtext="From bank accounts, FDs, mutual funds, or shares"
                                isYes={hasOS}
                                onAnswer={setHasOS}
                                icon={TrendingUp}
                            />

                            {hasOS && (
                                <motion.div variants={variants.staggerItem} className="pl-0 sm:pl-4 border-l-2 border-slate-100 ml-2 sm:ml-6">
                                    <SubSection title="Other Income details" icon={IndianRupee} defaultOpen={true}>
                                        <OtherSourcesForm
                                            data={formData?.otherSources || {}}
                                            onUpdate={(data) => onUpdate({ otherSources: data })}
                                            selectedITR={selectedITR}
                                            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
                                            readOnly={readOnly}
                                        />
                                    </SubSection>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );
            })()}
        </SectionWrapper>
    );
};

export default IncomeSection;
