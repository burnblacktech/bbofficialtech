// =====================================================
// ITR COMPUTATION CONTENT
// Main content area with section rendering
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ComputationSection from './ComputationSection';
import AutoPopulationActions from './AutoPopulationActions';
import { ScheduleFA } from '../../features/foreign-assets';
import { TaxOptimizer } from '../../features/tax-optimizer';

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
  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const Icon = activeSection?.icon;

  return (
    <div className="max-w-[1200px] mx-auto px-3 py-3">
      {/* Auto-Population Actions - Compact */}
      {Object.keys(autoFilledFields).some(section => autoFilledFields[section]?.length > 0) && (
        <div className="mb-3">
          <AutoPopulationActions
            autoFilledFields={autoFilledFields}
            onAcceptAll={() => {
              toast.success('All auto-filled values accepted');
              // Values are already in formData, just acknowledge
            }}
            onOverrideAll={() => {
              toast.info('You can now manually edit all fields');
              // Clear auto-filled tracking to allow manual edits
              setAutoFilledFields({});
            }}
          />
        </div>
      )}

      {/* Section Header - Compact */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gold-700" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold font-display text-neutral-900">
              {activeSection?.title || 'Section'}
            </h2>
            {activeSection?.description && (
              <p className="text-xs text-neutral-600 mt-0.5">
                {activeSection.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section Content Card - Compact */}
      <motion.div
        key={activeSectionId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      >
        {activeSection?.id === 'scheduleFA' ? (
          <ScheduleFA
            key={activeSection.id}
            filingId={filingId || draftId}
            onUpdate={() => {
              if (filingId || draftId) {
                // Trigger refetch if needed
              }
            }}
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
            onToggle={() => {}}
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

      {/* Read-only notice (minimal) */}
      {isReadOnly && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-info-100 text-info-800 px-4 py-2 rounded-full text-sm shadow-md z-40">
          <Info className="h-4 w-4 inline mr-2" />
          Read-only mode
        </div>
      )}
    </div>
  );
};

export default React.memo(ITRComputationContent);

