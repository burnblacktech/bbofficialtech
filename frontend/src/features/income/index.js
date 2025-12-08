// Barrel exports for income feature
export { default as SalaryForm } from './salary/components/SalaryForm';
export { default as HousePropertyForm } from './house-property/components/HousePropertyForm';
// Import CapitalGainsForm directly to avoid circular dependency with capital-gains barrel export
export { default as CapitalGainsForm } from './capital-gains/components/CapitalGainsForm';
export { default as BusinessIncomeForm } from './business/components/BusinessIncomeForm';
export { default as ProfessionalIncomeForm } from './professional/components/ProfessionalIncomeForm';
export { default as ForeignIncomeForm } from './foreign/components/ForeignIncomeForm';
export { default as DirectorPartnerIncomeForm } from './director-partner/components/DirectorPartnerIncomeForm';
export { default as ITR4IncomeForm } from './presumptive/components/ITR4IncomeForm';
export { default as PresumptiveIncomeForm } from './presumptive/components/PresumptiveIncomeForm';
export { default as Section44AEForm } from './presumptive/components/Section44AEForm';

// Exempt and Agricultural Income
export { default as ExemptIncomeForm } from './exempt-income/components/exempt-income-form';
export { default as AgriculturalIncomeForm } from './agricultural/components/AgriculturalIncomeForm';

// Other Sources Income (Interest, Dividends, etc.)
export { default as OtherSourcesForm } from './other-sources/components/OtherSourcesForm';

