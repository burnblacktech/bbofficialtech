// =====================================================
// COMPUTATION SECTION COMPONENT (POLISHED)
// Reusable expandable section for ITR computation
// Enhanced with better visual hierarchy and animations
// =====================================================

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, AlertCircle, IndianRupee, Info } from 'lucide-react';
import { cn } from '../../utils';
import { springs, variants } from '../../lib/motion';
import TaxCalculator from './TaxCalculator';
import DeductionBreakdown from './DeductionBreakdown';
import { DeductionsManager } from '../../features/deductions';
import BalanceSheetForm from '../../features/income/business/components/balance-sheet-form';
import AuditInformationForm from '../../features/income/business/components/audit-information-form';
import {
  SalaryForm,
  HousePropertyForm,
  CapitalGainsForm,
  BusinessIncomeForm,
  ProfessionalIncomeForm,
  ForeignIncomeForm,
  DirectorPartnerIncomeForm,
  ITR4IncomeForm,
  PresumptiveIncomeForm,
  Section44AEForm,
  ExemptIncomeForm,
  AgriculturalIncomeForm,
  OtherSourcesForm,
} from '../../features/income';
import { ScheduleFA } from '../../features/foreign-assets';
import { PersonalInfoForm } from '../../features/personal-info';
import { TaxesPaidForm } from '../../features/taxes-paid';
import { BankDetailsForm } from '../../features/bank-details';

// =====================================================
// STYLED SUB-SECTION WRAPPER
// =====================================================
const SubSection = ({ title, icon: Icon, children, defaultOpen = true, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      'rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden',
      'transition-all duration-200',
      'hover:border-slate-300',
      className,
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-transparent hover:from-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.snappy}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.gentle}
          >
            <div className="p-4 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================
// STYLED INPUT FIELD (Quick inline styling)
// =====================================================
const StyledCurrencyField = ({ label, value, onChange, hint, max, className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isOverMax = max && value > max;

  return (
    <div className={className}>
      <label className="block text-body-regular font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className={cn(
          'absolute left-0 top-0 bottom-0 flex items-center justify-center w-10',
          'bg-slate-100 rounded-l-xl border-2 border-r-0 transition-colors',
          isFocused ? 'border-primary-500 bg-primary-50' : 'border-slate-200',
          isOverMax && 'border-error-400 bg-error-50',
        )}>
          <IndianRupee className={cn(
            'w-4 h-4 transition-colors',
            isFocused ? 'text-primary-600' : 'text-slate-500',
            isOverMax && 'text-error-500',
          )} />
        </div>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border-2 transition-all duration-200',
            'text-slate-900 text-right tabular-nums font-medium',
            'focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500',
            isOverMax ? 'border-red-400 focus:border-error-500' : 'border-slate-200',
          )}
        />
      </div>
      {hint && (
        <p className={cn(
          'text-xs mt-1.5',
          isOverMax ? 'text-error-500' : 'text-slate-500',
        )}>
          {hint}
        </p>
      )}
    </div>
  );
};

// =====================================================
// MAIN COMPUTATION SECTION
// =====================================================
const ComputationSection = ({
  id,
  title,
  icon: Icon,
  description,
  isExpanded,
  onToggle,
  formData,
  fullFormData,
  onUpdate,
  selectedITR,
  taxComputation,
  onTaxComputed,
  regime,
  assessmentYear,
  onDataUploaded,
  renderContentOnly = false,
  readOnly = false,
  validationErrors = {},
  autoFilledFields = {},
  prefetchSources = {},
  fieldVerificationStatuses = {},
  fieldSources = {},
}) => {
  const renderSectionContent = () => {
    switch (id) {
      case 'personalInfo':
        return (
          <PersonalInfoForm
            data={formData}
            onUpdate={onUpdate}
            autoFilledFields={autoFilledFields}
            sources={prefetchSources}
            fieldVerificationStatuses={fieldVerificationStatuses}
            fieldSources={fieldSources}
            readOnly={readOnly}
          />
        );

      case 'income':
        // For ITR-2
        if (selectedITR === 'ITR-2' || selectedITR === 'ITR2') {
          return (
            <ITR2IncomeForm
              data={formData}
              onUpdate={onUpdate}
              selectedITR={selectedITR}
              fullFormData={fullFormData}
              formData={formData}
              onDataUploaded={onDataUploaded}
            />
          );
        }
        // For ITR-3
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          return (
            <ITR3IncomeForm
              data={formData}
              onUpdate={onUpdate}
              selectedITR={selectedITR}
              fullFormData={fullFormData}
              formData={formData}
              onDataUploaded={onDataUploaded}
            />
          );
        }
        // For ITR-4
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
        // For ITR-1 (Sahaj) - Complete income sources
        return (
          <motion.div
            className="space-y-4"
            variants={variants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Salary/Pension Income */}
            <motion.div variants={variants.staggerItem}>
              <SubSection title="Salary / Pension Income" icon={IndianRupee}>
                <SalaryForm
                  data={formData}
                  onUpdate={onUpdate}
                  selectedITR={selectedITR}
                  onForm16Extracted={onDataUploaded}
                />
              </SubSection>
            </motion.div>

            {/* House Property (1 property for ITR-1) */}
            <motion.div variants={variants.staggerItem}>
              <SubSection title="House Property Income" icon={IndianRupee} defaultOpen={false}>
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
                  />
                </div>
              </SubSection>
            </motion.div>

            {/* Other Sources (Interest, Dividends, etc.) */}
            <motion.div variants={variants.staggerItem}>
              <SubSection title="Income from Other Sources" icon={IndianRupee}>
                <OtherSourcesForm
                  data={formData?.otherSources || {}}
                  onUpdate={(data) => onUpdate({ otherSources: data })}
                  selectedITR={selectedITR}
                  filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
                />
              </SubSection>
            </motion.div>
          </motion.div>
        );

      case 'businessIncome':
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          return (
            <BusinessIncomeForm
              data={formData}
              onUpdate={onUpdate}
              selectedITR={selectedITR}
            />
          );
        }
        return null;

      case 'professionalIncome':
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          return (
            <ProfessionalIncomeForm
              data={formData}
              onUpdate={onUpdate}
              selectedITR={selectedITR}
            />
          );
        }
        return null;

      case 'balanceSheet':
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          return (
            <BalanceSheetForm
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
              selectedITR={selectedITR}
              onUpdate={onUpdate}
            />
          );
        }
        return null;

      case 'auditInfo':
        if (selectedITR === 'ITR-3' || selectedITR === 'ITR3') {
          return (
            <AuditInformationForm
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
              selectedITR={selectedITR}
              onUpdate={onUpdate}
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

      case 'scheduleFA':
        if (['ITR-2', 'ITR2', 'ITR-3', 'ITR3'].includes(selectedITR)) {
          return (
            <ScheduleFA
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
              onUpdate={() => onUpdate?.({})}
            />
          );
        }
        return null;

      case 'goodsCarriage':
        if (['ITR-4', 'ITR4'].includes(selectedITR)) {
          return (
            <Section44AEForm
              data={formData?.goodsCarriage || {}}
              onUpdate={(data) => onUpdate({ goodsCarriage: data })}
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
            />
          );
        }
        return null;

      case 'exemptIncome':
        return (
          <div className="space-y-6">
            {/* Agricultural Income */}
            <AgriculturalIncomeForm
              data={formData?.agriculturalIncome || {}}
              onUpdate={(data) => {
                onUpdate({
                  agriculturalIncome: data,
                });
              }}
              selectedITR={selectedITR}
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
              readOnly={readOnly}
            />

            {/* Other Exempt Income */}
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
        );

      case 'deductions':
        return (
          <div className="space-y-4">
            <DeductionsManager
              filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
              formData={formData}
              onUpdate={onUpdate}
            />
            <DeductionBreakdown
              formData={{ deductions: formData }}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'taxesPaid':
        return (
          <TaxesPaidForm
            data={formData}
            onUpdate={onUpdate}
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
          />
        );

      default:
        return null;
    }
  };

  const isComplete = () => {
    if (!formData) return false;
    if (id === 'personalInfo') {
      return formData.pan && formData.name;
    }
    return true;
  };

  // Render content only (used within SectionCard)
  if (renderContentOnly) {
    const content = renderSectionContent();

    // Ensure we always return a valid React element
    if (!content || content === null) {
      return (
        <motion.div
          key={id}
          className="section-card-content flex items-center justify-center py-8 text-neutral-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <Info className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-body-regular">This section is not applicable for {selectedITR || 'your selected ITR form'}.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={id}
        className="section-card-content"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {content}
      </motion.div>
    );
  }

  // Full card with header (legacy mode)
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-body-regular text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            initial={false}
            animate={isComplete() ? { scale: [0, 1.2, 1] } : {}}
            transition={springs.bouncy}
          >
            {isComplete() ? (
              <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            )}
          </motion.div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={springs.snappy}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.gentle}
          >
            <div className="border-t border-slate-100 p-4">
              {renderSectionContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================
// ITR-2 INCOME FORM
// =====================================================
const ITR2IncomeForm = ({ data, onUpdate, selectedITR, fullFormData, formData, onDataUploaded }) => {
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
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
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
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
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
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
          />
        </SubSection>
      </motion.div>
    </motion.div>
  );
};

// =====================================================
// ITR-3 INCOME FORM
// =====================================================
const ITR3IncomeForm = ({ data, onUpdate, selectedITR, fullFormData, formData, onDataUploaded }) => {
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

  const handleBusinessIncomeUpdate = (updates) => {
    // Update income.businessIncome structure
    const currentIncome = data.income || {};
    onUpdate({
      income: {
        ...currentIncome,
        businessIncome: { ...(currentIncome.businessIncome || data.businessIncome || {}), ...updates },
      },
    });
  };

  const handleProfessionalIncomeUpdate = (updates) => {
    // Update income.professionalIncome structure
    const currentIncome = data.income || {};
    onUpdate({
      income: {
        ...currentIncome,
        professionalIncome: { ...(currentIncome.professionalIncome || data.professionalIncome || {}), ...updates },
      },
    });
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
        <SubSection title="Business Income" icon={IndianRupee}>
          <BusinessIncomeForm
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
            data={data.income?.businessIncome || data.businessIncome || {}}
            onUpdate={handleBusinessIncomeUpdate}
            selectedITR={selectedITR}
            onDataUploaded={onDataUploaded}
          />
        </SubSection>
      </motion.div>

      <motion.div variants={variants.staggerItem}>
        <SubSection title="Professional Income" icon={IndianRupee}>
          <ProfessionalIncomeForm
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
            data={data.income?.professionalIncome || data.professionalIncome || {}}
            onUpdate={handleProfessionalIncomeUpdate}
            selectedITR={selectedITR}
            onDataUploaded={onDataUploaded}
          />
        </SubSection>
      </motion.div>

      <motion.div variants={variants.staggerItem}>
        <SubSection title="House Property" icon={IndianRupee}>
          <HousePropertyForm
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
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
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
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
            filingId={fullFormData?.filingId || fullFormData?.id || formData?.filingId || formData?.id}
          />
        </SubSection>
      </motion.div>
    </motion.div>
  );
};

export default memo(ComputationSection);
