// =====================================================
// ITR COMPUTATION CONTENT
// Main content area with section rendering
// Responsive: Desktop shows active section, Mobile shows all sections with progressive disclosure
// =====================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ComputationSection from './ComputationSection';
import AutoPopulationActions from './AutoPopulationActions';
import { ScheduleFA } from '../../features/foreign-assets';
import { TaxOptimizer } from '../../features/tax-optimizer';
import ResponsiveSection from '../DesignSystem/ResponsiveSection';
import { useResponsiveBreakpoint } from '../../utils/responsive';

const ITRComputationContent = ({
  activeSectionId,
  sections,
  autoFilledFields,
  setAutoFilledFields,
  formData,
  updateFormData,
  selectedITR,
  taxComputation,
  setTaxComputation,
  taxRegime,
  assessmentYear,
  handleDataUploaded,
  handleComputeTax,
  isReadOnly,
  validationErrors,
  prefetchSources,
  fieldVerificationStatuses,
  fieldSources,
  filingId,
  draftId,
}) => {
  const { isMobile, isTablet } = useResponsiveBreakpoint();
  const [expandedSections, setExpandedSections] = useState({});
  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const Icon = activeSection?.icon;

  // Helper to get section total for display
  const getSectionTotal = (sectionId) => {
    const sectionData = formData[sectionId] || {};
    if (sectionId === 'income') {
      return (parseFloat(sectionData.salary) || 0) +
        (parseFloat(sectionData.otherIncome) || 0);
    }
    if (sectionId === 'deductions') {
      return (parseFloat(sectionData.section80C) || 0) +
        (parseFloat(sectionData.section80D) || 0);
    }
    return 0;
  };

  // Desktop: Show only active section
  if (!isMobile && !isTablet) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {/* Auto-Population Actions */}
        {Object.keys(autoFilledFields).some(section => autoFilledFields[section]?.length > 0) && (
          <div className="mb-4">
            <AutoPopulationActions
              autoFilledFields={autoFilledFields}
              onAcceptAll={() => {
                toast.success('All auto-filled values accepted');
              }}
              onOverrideAll={() => {
                toast('You can now manually edit all fields', { icon: 'ℹ️' });
                setAutoFilledFields({});
              }}
            />
          </div>
        )}

        {/* Section Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div>
              <h2 className="text-heading-3 font-bold text-slate-900">
                {activeSection?.title || 'Section'}
              </h2>
              {activeSection?.description && (
                <p className="text-body-regular text-slate-600 mt-1">
                  {activeSection.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section Content */}
        <motion.div
          key={activeSectionId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-xl border border-slate-200 shadow-elevation-1 p-6"
        >
          {activeSection?.id === 'scheduleFA' ? (
            <ScheduleFA
              key={activeSection.id}
              filingId={filingId || draftId}
              onUpdate={() => { }}
            />
          ) : activeSection?.id === 'taxOptimizer' ? (
            <TaxOptimizer
              key={activeSection.id}
              filingId={filingId || draftId}
              currentTaxComputation={taxComputation}
              onUpdate={() => {
                if (filingId || draftId) {
                  handleComputeTax();
                }
              }}
            />
          ) : (
            <ComputationSection
              key={activeSection?.id}
              id={activeSection?.id}
              title={activeSection?.title}
              icon={Icon}
              description={activeSection?.description}
              isExpanded={true}
              onToggle={() => { }}
              formData={formData[activeSection?.id] || {}}
              fullFormData={formData || {}}
              readOnly={isReadOnly}
              onUpdate={(data) => updateFormData(activeSection?.id, data)}
              selectedITR={selectedITR}
              taxComputation={taxComputation}
              onTaxComputed={setTaxComputation}
              regime={taxRegime}
              assessmentYear={assessmentYear}
              onDataUploaded={handleDataUploaded}
              renderContentOnly={true}
              validationErrors={validationErrors[activeSection?.id] || {}}
              autoFilledFields={autoFilledFields}
              prefetchSources={prefetchSources}
              fieldVerificationStatuses={fieldVerificationStatuses}
              fieldSources={fieldSources}
            />
          )}
        </motion.div>
      </div>
    );
  }

  // Mobile/Tablet: Show all sections with progressive disclosure
  return (
    <div className="max-w-full mx-auto px-4 py-4 space-y-4">
      {/* Auto-Population Actions */}
      {Object.keys(autoFilledFields).some(section => autoFilledFields[section]?.length > 0) && (
        <div className="mb-4">
          <AutoPopulationActions
            autoFilledFields={autoFilledFields}
            onAcceptAll={() => {
              toast.success('All auto-filled values accepted');
            }}
            onOverrideAll={() => {
              toast('You can now manually edit all fields', { icon: 'ℹ️' });
              setAutoFilledFields({});
            }}
          />
        </div>
      )}

      {/* All Sections with Progressive Disclosure */}
      {sections.map((section) => {
        const sectionIcon = section.icon;
        const isExpanded = expandedSections[section.id] || false;
        const sectionTotal = getSectionTotal(section.id);

        return (
          <ResponsiveSection
            key={section.id}
            id={section.id}
            title={section.title}
            icon={sectionIcon}
            description={section.description}
            isExpanded={isExpanded}
            onToggle={(expanded) => {
              setExpandedSections(prev => ({
                ...prev,
                [section.id]: expanded,
              }));
            }}
            showTotal={section.id === 'income' || section.id === 'deductions'}
            totalValue={sectionTotal}
            totalLabel={section.id === 'income' ? 'Total Income' : 'Total Deductions'}
          >
            {section.id === 'scheduleFA' ? (
              <ScheduleFA
                filingId={filingId || draftId}
                onUpdate={() => { }}
              />
            ) : section.id === 'taxOptimizer' ? (
              <TaxOptimizer
                filingId={filingId || draftId}
                currentTaxComputation={taxComputation}
                onUpdate={() => {
                  if (filingId || draftId) {
                    handleComputeTax();
                  }
                }}
              />
            ) : (
              <ComputationSection
                id={section.id}
                title={section.title}
                icon={sectionIcon}
                description={section.description}
                isExpanded={true}
                onToggle={() => { }}
                formData={formData[section.id] || {}}
                fullFormData={formData || {}}
                readOnly={isReadOnly}
                onUpdate={(data) => updateFormData(section.id, data)}
                selectedITR={selectedITR}
                taxComputation={taxComputation}
                onTaxComputed={setTaxComputation}
                regime={taxRegime}
                assessmentYear={assessmentYear}
                onDataUploaded={handleDataUploaded}
                renderContentOnly={true}
                validationErrors={validationErrors[section.id] || {}}
                autoFilledFields={autoFilledFields}
                prefetchSources={prefetchSources}
                fieldVerificationStatuses={fieldVerificationStatuses}
                fieldSources={fieldSources}
              />
            )}
          </ResponsiveSection>
        );
      })}

      {/* Read-only notice */}
      {isReadOnly && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-info-100 text-info-800 px-4 py-2 rounded-full text-body-regular shadow-elevation-2 z-40">
          <Info className="h-4 w-4 inline mr-2" />
          Read-only mode
        </div>
      )}
    </div>
  );
};

export default React.memo(ITRComputationContent);

