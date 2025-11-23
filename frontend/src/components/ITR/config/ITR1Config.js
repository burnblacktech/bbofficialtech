// =====================================================
// ITR-1 CONFIGURATION
// Dynamic form field definitions for ITR-1 (Sahaj)
// For individuals with income from salary, one house property, and other sources
// =====================================================

export const ITR1_CONFIG = {
  type: 'ITR-1',
  name: 'ITR-1 (Sahaj)',
  description: 'For individuals having income from salaries, one house property, other sources and total income up to ₹50 lakh',
  eligibility: {
    minAge: 18,
    maxAge: null,
    incomeSources: ['salary', 'house_property', 'other_sources'],
    maxTotalIncome: 5000000,
    applicableFor: ['individual', 'huf']
  },

  sections: [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Basic details about the taxpayer',
      required: true,
      fields: [
        {
          id: 'full_name',
          label: 'Full Name',
          type: 'text',
          required: true,
          validation: {
            minLength: 3,
            pattern: '^[a-zA-Z\\s]+$',
            message: 'Please enter a valid name (letters only, min 3 characters)'
          }
        },
        {
          id: 'pan',
          label: 'PAN Card Number',
          type: 'text',
          required: true,
          validation: {
            pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
            message: 'Please enter a valid PAN number'
          }
        },
        {
          id: 'aadhaar',
          label: 'Aadhaar Number',
          type: 'text',
          required: false,
          validation: {
            pattern: '^\\d{12}$',
            message: 'Please enter a valid 12-digit Aadhaar number'
          }
        },
        {
          id: 'dob',
          label: 'Date of Birth',
          type: 'date',
          required: true,
          validation: {
            maxAge: 120,
            minAge: 18
          }
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          validation: {
            pattern: '[^@]+@[^@]+\\.[^@]+',
            message: 'Please enter a valid email address'
          }
        },
        {
          id: 'phone',
          label: 'Mobile Number',
          type: 'tel',
          required: true,
          validation: {
            pattern: '[6-9]\\d{9}',
            message: 'Please enter a valid 10-digit mobile number'
          }
        },
        {
          id: 'address',
          label: 'Residential Address',
          type: 'textarea',
          required: true,
          validation: {
            minLength: 10,
            message: 'Please enter complete address (min 10 characters)'
          }
        },
        {
          id: 'residential_status',
          label: 'Residential Status',
          type: 'select',
          required: true,
          options: [
            { value: 'resident', label: 'Resident' },
            { value: 'non_resident', label: 'Non-Resident' },
            { value: 'not_ordinarily_resident', label: 'Not Ordinarily Resident' }
          ]
        }
      ]
    },

    {
      id: 'salary_income',
      title: 'Income from Salary',
      description: 'Details about salary income from employment',
      required: false,
      fields: [
        {
          id: 'has_salary_income',
          label: 'Do you have income from salary?',
          type: 'radio',
          required: true,
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ]
        },
        {
          id: 'employer_name',
          label: 'Employer Name',
          type: 'text',
          required: true,
          conditional: { field: 'has_salary_income', value: true },
          validation: {
            minLength: 2,
            message: 'Please enter employer name'
          }
        },
        {
          id: 'employer_pan',
          label: 'Employer PAN (TAN)',
          type: 'text',
          required: false,
          conditional: { field: 'has_salary_income', value: true },
          validation: {
            pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
            message: 'Please enter valid TAN'
          }
        },
        {
          id: 'gross_salary',
          label: 'Gross Salary',
          type: 'number',
          required: true,
          conditional: { field: 'has_salary_income', value: true },
          validation: {
            min: 0,
            message: 'Gross salary must be positive'
          }
        },
        {
          id: 'perquisites',
          label: 'Value of Perquisites',
          type: 'number',
          required: false,
          conditional: { field: 'has_salary_income', value: true },
          validation: {
            min: 0,
            message: 'Perquisites value must be positive'
          }
        },
        {
          id: 'profits_in_lieu_of_salary',
          label: 'Profits in Lieu of Salary',
          type: 'number',
          required: false,
          conditional: { field: 'has_salary_income', value: true },
          validation: {
            min: 0,
            message: 'Profits must be positive'
          }
        }
      ]
    },

    {
      id: 'house_property',
      title: 'Income from House Property',
      description: 'Details about rental income from house property',
      required: false,
      fields: [
        {
          id: 'has_house_property',
          label: 'Do you own a house property?',
          type: 'radio',
          required: true,
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ]
        },
        {
          id: 'property_type',
          label: 'Property Type',
          type: 'select',
          required: true,
          conditional: { field: 'has_house_property', value: true },
          options: [
            { value: 'self_occupied', label: 'Self Occupied' },
            { value: 'let_out', label: 'Let Out' },
            { value: 'deemed_let_out', label: 'Deemed Let Out' }
          ]
        },
        {
          id: 'annual_rental_income',
          label: 'Annual Rental Income',
          type: 'number',
          required: true,
          conditional: { field: 'has_house_property', value: true },
          validation: {
            min: 0,
            message: 'Rental income must be positive'
          }
        },
        {
          id: 'municipal_taxes',
          label: 'Municipal Taxes Paid',
          type: 'number',
          required: false,
          conditional: { field: 'has_house_property', value: true },
          validation: {
            min: 0,
            message: 'Taxes must be positive'
          }
        },
        {
          id: 'interest_on_loan',
          label: 'Interest on Housing Loan',
          type: 'number',
          required: false,
          conditional: { field: 'has_house_property', value: true },
          validation: {
            min: 0,
            message: 'Interest must be positive'
          }
        },
        {
          id: 'pre_construction_interest',
          label: 'Pre-construction Interest',
          type: 'number',
          required: false,
          conditional: { field: 'has_house_property', value: true },
          validation: {
            min: 0,
            message: 'Pre-construction interest must be positive'
          }
        }
      ]
    },

    {
      id: 'other_income',
      title: 'Other Income',
      description: 'Income from other sources like interest, dividends, etc.',
      required: false,
      fields: [
        {
          id: 'interest_income',
          label: 'Interest Income',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Interest income must be positive'
          }
        },
        {
          id: 'dividend_income',
          label: 'Dividend Income',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Dividend income must be positive'
          }
        },
        {
          id: 'capital_gains',
          label: 'Capital Gains',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Capital gains must be positive'
          }
        },
        {
          id: 'other_sources',
          label: 'Income from Other Sources',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Other income must be positive'
          }
        }
      ]
    },

    {
      id: 'deductions',
      title: 'Deductions under Chapter VI-A',
      description: 'Tax deductions available under various sections',
      required: false,
      fields: [
        {
          id: 'section_80c',
          label: 'Section 80C (PPF, EPF, Life Insurance, etc.)',
          type: 'number',
          required: false,
          max: 150000,
          validation: {
            min: 0,
            max: 150000,
            message: '80C deduction must be between 0 and ₹1.5 lakh'
          }
        },
        {
          id: 'section_80d',
          label: 'Section 80D (Health Insurance)',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: '80D deduction must be positive'
          }
        },
        {
          id: 'section_80e',
          label: 'Section 80E (Education Loan Interest)',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: '80E deduction must be positive'
          }
        },
        {
          id: 'section_80g',
          label: 'Section 80G (Donations)',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: '80G deduction must be positive'
          }
        },
        {
          id: 'other_deductions',
          label: 'Other Deductions',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Other deductions must be positive'
          }
        }
      ]
    },

    {
      id: 'taxes_paid',
      title: 'Taxes Paid',
      description: 'Details of advance tax and self-assessment tax paid',
      required: false,
      fields: [
        {
          id: 'advance_tax',
          label: 'Advance Tax Paid',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Advance tax must be positive'
          }
        },
        {
          id: 'tds_tcs',
          label: 'TDS/TCS',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'TDS/TCS must be positive'
          }
        },
        {
          id: 'self_assessment_tax',
          label: 'Self Assessment Tax',
          type: 'number',
          required: false,
          validation: {
            min: 0,
            message: 'Self assessment tax must be positive'
          }
        }
      ]
    }
  ],

  validation: {
    required_sections: ['personal_info'],
    conditional_rules: [
      {
        condition: 'salary_income.has_salary_income === true',
        required_fields: ['salary_income.employer_name', 'salary_income.gross_salary']
      },
      {
        condition: 'house_property.has_house_property === true',
        required_fields: ['house_property.property_type']
      }
    ]
  }
};

export default ITR1_CONFIG;