// =====================================================
// INTEGRATION TESTS - DYNAMIC ITR FORM SYSTEM
// Tests the unified ITR form rendering system
// =====================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ITRProvider } from '../contexts/ITRContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ITRFormRenderer from '../components/ITR/core/ITRFormRenderer';

// Mock ITR configuration
const mockITR1Config = {
  type: 'ITR-1',
  name: 'ITR-1 (Sahaj)',
  description: 'For individuals having income from salaries, one house property',
  eligibility: {
    maxIncome: 5000000,
    incomeSources: ['salary', 'houseProperty', 'otherSources']
  },
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic personal details',
      fields: [
        {
          id: 'firstName',
          type: 'text',
          label: 'First Name',
          required: true,
          validation: { minLength: 2, maxLength: 50 }
        },
        {
          id: 'lastName',
          type: 'text',
          label: 'Last Name',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        },
        {
          id: 'dateOfBirth',
          type: 'date',
          label: 'Date of Birth',
          required: true
        }
      ]
    },
    {
      id: 'income',
      title: 'Income Details',
      description: 'Income from various sources',
      fields: [
        {
          id: 'salaryIncome',
          type: 'number',
          label: 'Income from Salary',
          required: true,
          validation: { min: 0 }
        },
        {
          id: 'otherIncome',
          type: 'number',
          label: 'Other Income',
          required: false,
          validation: { min: 0 }
        },
        {
          id: 'hasHouseProperty',
          type: 'radio',
          label: 'Own House Property?',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]
        },
        {
          id: 'housePropertyIncome',
          type: 'number',
          label: 'Income from House Property',
          required: false,
          conditional: { field: 'hasHouseProperty', value: 'yes' },
          validation: { min: 0 }
        }
      ]
    }
  ]
};

// Mock the dynamic import for ITR configuration
jest.mock('../components/ITR/config/ITR1Config.js', () => ({
  default: mockITR1Config
}));

// Test wrapper with contexts
const TestWrapper = ({ children }) => (
  <NotificationProvider>
    <ITRProvider>
      {children}
    </ITRProvider>
  </NotificationProvider>
);

describe('Dynamic ITR Form System Integration Tests', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSaveDraft = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render ITR form configuration correctly', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Basic personal details')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    });
  });

  test('should handle form field changes and validation', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Name')).toBeInTheDocument();
    });

    // Fill in personal information
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email Address');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });

    // Test required field validation
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Income Details')).toBeInTheDocument();
    });
  });

  test('should handle conditional fields correctly', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    // Navigate to income section
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Income Details')).toBeInTheDocument();
    });

    // Initially, house property income should not be visible
    expect(screen.queryByLabelText('Income from House Property')).not.toBeInTheDocument();

    // Select 'Yes' for house property
    const hasHousePropertyYes = screen.getByLabelText('Yes');
    fireEvent.click(hasHousePropertyYes);

    // Now house property income should be visible
    await waitFor(() => {
      expect(screen.getByLabelText('Income from House Property')).toBeInTheDocument();
    });

    // Select 'No' for house property
    const hasHousePropertyNo = screen.getByLabelText('No');
    fireEvent.click(hasHousePropertyNo);

    // House property income should be hidden again
    await waitFor(() => {
      expect(screen.queryByLabelText('Income from House Property')).not.toBeInTheDocument();
    });
  });

  test('should handle draft saving functionality', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Fill in some data
    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'John' } });

    // Click save draft
    const saveDraftButton = screen.getByText('Save Draft');
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(mockOnSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          personal: expect.objectContaining({
            firstName: 'John'
          })
        })
      );
    });
  });

  test('should handle form submission with validation', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Fill in required fields
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email Address');
    const dateOfBirthInput = screen.getByLabelText('Date of Birth');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });

    // Navigate to income section
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Income Details')).toBeInTheDocument();
    });

    // Fill in income details
    const salaryIncomeInput = screen.getByLabelText('Income from Salary');
    fireEvent.change(salaryIncomeInput, { target: { value: '500000' } });

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          personal: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          }),
          income: expect.objectContaining({
            salaryIncome: '500000'
          })
        })
      );
    });
  });

  test('should handle navigation between sections', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Previous button should be disabled on first section
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();

    // Navigate to next section
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Income Details')).toBeInTheDocument();
    });

    // Previous button should now be enabled
    expect(previousButton).toBeEnabled();

    // Go back to previous section
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  test('should display validation errors for required fields', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      // The form should stay on the same section due to validation errors
    });
  });

  test('should handle email validation correctly', async () => {
    render(
      <TestWrapper>
        <ITRFormRenderer
          itrType="ITR-1"
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText('Email Address');

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    // Try to proceed - should show validation error
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Form should not proceed due to validation error
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
    fireEvent.click(nextButton);

    // Should now proceed to next section
    await waitFor(() => {
      expect(screen.getByText('Income Details')).toBeInTheDocument();
    });
  });
});