// =====================================================
// SECTION 80C FORM - DEDUCTION TYPE DETECTION
// Enhanced 80C deductions with OCR-based type detection
// =====================================================

import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import Card from '../common/Card';
import { Upload, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { enterpriseLogger } from '../../utils/logger';
import '../../styles/itr-forms.css';

const Section80CForm = ({ data = {}, onChange, onNext, onPrevious }) => {
  const [formData, setFormData] = useState({
    lifeInsurance: data.lifeInsurance || '',
    providentFund: data.providentFund || '',
    elss: data.elss || '',
    nsc: data.nsc || '',
    sukanyaSamriddhi: data.sukanyaSamriddhi || '',
    ppf: data.ppf || '',
    homeLoanPrincipal: data.homeLoanPrincipal || '',
    tuitionFees: data.tuitionFees || '',
    other: data.other || '',
  });

  const [deductionTypes, setDeductionTypes] = useState({
    lifeInsurance: { type: 'LIC_PREMIUM', proof: null, verified: false, confidence: 0 },
    providentFund: { type: 'EPF_CONTRIBUTION', proof: null, verified: false, confidence: 0 },
    elss: { type: 'ELSS_MUTUAL_FUND', proof: null, verified: false, confidence: 0 },
    nsc: { type: 'NSC', proof: null, verified: false, confidence: 0 },
    sukanyaSamriddhi: { type: 'SUKANYA_SAMRIDDHI', proof: null, verified: false, confidence: 0 },
    ppf: { type: 'PPF_INVESTMENT', proof: null, verified: false, confidence: 0 },
    homeLoanPrincipal: { type: 'HOME_LOAN_PRINCIPAL', proof: null, verified: false, confidence: 0 },
    tuitionFees: { type: 'TUITION_FEES', proof: null, verified: false, confidence: 0 },
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const deductionCategories = [
    {
      key: 'lifeInsurance',
      label: 'Life Insurance Premium',
      maxAmount: 150000,
      description: 'LIC or other life insurance premium payments',
      icon: '🛡️',
    },
    {
      key: 'providentFund',
      label: 'Employee Provident Fund',
      maxAmount: 150000,
      description: 'EPF contributions from salary',
      icon: '🏦',
    },
    {
      key: 'elss',
      label: 'ELSS Mutual Funds',
      maxAmount: 150000,
      description: 'Equity Linked Savings Scheme investments',
      icon: '📈',
    },
    {
      key: 'nsc',
      label: 'National Savings Certificate',
      maxAmount: 150000,
      description: 'NSC investments',
      icon: '📜',
    },
    {
      key: 'sukanyaSamriddhi',
      label: 'Sukanya Samriddhi',
      maxAmount: 150000,
      description: 'Girl child savings scheme',
      icon: '👧',
    },
    {
      key: 'ppf',
      label: 'Public Provident Fund',
      maxAmount: 150000,
      description: 'PPF account contributions',
      icon: '💰',
    },
    {
      key: 'homeLoanPrincipal',
      label: 'Home Loan Principal',
      maxAmount: 150000,
      description: 'Principal repayment of home loan',
      icon: '🏠',
    },
    {
      key: 'tuitionFees',
      label: 'Tuition Fees',
      maxAmount: 150000,
      description: 'Children\'s education fees',
      icon: '🎓',
    },
  ];

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (field, file) => {
    try {
      setIsProcessing(prev => ({ ...prev, [field]: true }));
      setErrors(prev => ({ ...prev, [field]: null }));

      // Import the deduction OCR service
      const { DeductionOCRService } = await import('../../services/DeductionOCRService');
      const ocrService = new DeductionOCRService();

      const result = await ocrService.detectDeductionType(file);

      setDeductionTypes(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          type: result.type,
          proof: file,
          verified: result.confidence > 0.7,
          confidence: result.confidence,
          extractedData: result.extractedData,
        },
      }));

      // Auto-fill amount if extracted
      if (result.extractedData.amount) {
        handleInputChange(field, result.extractedData.amount);
      }

      setSuccessMessage(`✅ Document processed! Detected: ${result.type} (${Math.round(result.confidence * 100)}% confidence)`);
      setTimeout(() => setSuccessMessage(''), 5000);

      enterpriseLogger.info('Deduction type detected', {
        field,
        type: result.type,
        confidence: result.confidence,
      });

    } catch (error) {
      enterpriseLogger.error('Deduction type detection failed', {
        field,
        error: error.message,
      });

      setErrors(prev => ({
        ...prev,
        [field]: `Failed to process document: ${error.message}`,
      }));
    } finally {
      setIsProcessing(prev => ({ ...prev, [field]: false }));
    }
  };

  const removeProof = (field) => {
    setDeductionTypes(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        proof: null,
        verified: false,
        confidence: 0,
        extractedData: null,
      },
    }));
  };

  const calculateTotal80C = () => {
    const total = Object.values(formData).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);

    return Math.min(total, 150000); // 80C limit
  };

  const validateForm = () => {
    const newErrors = {};
    const total = calculateTotal80C();

    // Check 80C limit
    if (total > 150000) {
      newErrors.total = 'Total 80C deductions cannot exceed ₹1,50,000';
    }

    // Validate individual amounts
    Object.entries(formData).forEach(([field, value]) => {
      if (value && parseFloat(value) < 0) {
        newErrors[field] = 'Amount cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const total80C = calculateTotal80C();
  const excessAmount = total80C > 150000 ? total80C - 150000 : 0;

  return (
    <div className="section-80c-form">
      <Card>
        <div className="form-header">
          <h2>Section 80C Deductions</h2>
          <p>Maximum deduction: ₹1,50,000</p>
        </div>

        <div className="deductions-grid">
          {deductionCategories.map(category => (
            <div key={category.key} className="deduction-item">
              <div className="deduction-header">
                <div className="deduction-info">
                  <span className="deduction-icon">{category.icon}</span>
                  <div>
                    <h4>{category.label}</h4>
                    <p>{category.description}</p>
                  </div>
                </div>

                <div className="deduction-status">
                  {deductionTypes[category.key].verified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {deductionTypes[category.key].proof && !deductionTypes[category.key].verified && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              </div>

              <div className="deduction-input">
                <input
                  type="number"
                  value={formData[category.key]}
                  onChange={(e) => handleInputChange(category.key, e.target.value)}
                  placeholder="Enter amount"
                  className="form-input"
                  max={category.maxAmount}
                />
                <span className="input-suffix">₹</span>
              </div>

              <div className="deduction-proof">
                <label className="upload-button">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFileUpload(category.key, e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                    disabled={isProcessing[category.key]}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isProcessing[category.key]}
                    as="span"
                  >
                    <Upload className="w-4 h-4" />
                    {isProcessing[category.key] ? 'Processing...' : 'Upload Proof'}
                  </Button>
                </label>

                {deductionTypes[category.key].proof && (
                  <div className="proof-info">
                    <span className="proof-name">
                      {deductionTypes[category.key].proof.name}
                    </span>
                    <div className="proof-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeProof(category.key)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {deductionTypes[category.key].extractedData && (
                <div className="extracted-data">
                  <h5>Extracted Information:</h5>
                  <div className="extracted-details">
                    {deductionTypes[category.key].extractedData.amount && (
                      <span>Amount: ₹{deductionTypes[category.key].extractedData.amount}</span>
                    )}
                    {deductionTypes[category.key].extractedData.date && (
                      <span>Date: {deductionTypes[category.key].extractedData.date}</span>
                    )}
                    {deductionTypes[category.key].extractedData.reference && (
                      <span>Ref: {deductionTypes[category.key].extractedData.reference}</span>
                    )}
                  </div>
                  <div className="confidence-score">
                    Confidence: {Math.round(deductionTypes[category.key].confidence * 100)}%
                  </div>
                </div>
              )}

              {errors[category.key] && (
                <div className="error-message">
                  {errors[category.key]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Other Deductions */}
        <div className="other-deductions">
          <h3>Other 80C Deductions</h3>
          <div className="deduction-item">
            <div className="deduction-header">
              <div className="deduction-info">
                <span className="deduction-icon">📋</span>
                <div>
                  <h4>Other Deductions</h4>
                  <p>Any other eligible 80C deductions</p>
                </div>
              </div>
            </div>
            <div className="deduction-input">
              <input
                type="number"
                value={formData.other}
                onChange={(e) => handleInputChange('other', e.target.value)}
                placeholder="Enter amount"
                className="form-input"
              />
              <span className="input-suffix">₹</span>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <h3>80C Deduction Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Total 80C Deductions:</label>
              <span>₹{total80C.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <label>Maximum Allowed:</label>
              <span>₹1,50,000</span>
            </div>
            {excessAmount > 0 && (
              <div className="summary-item warning">
                <label>Excess Amount:</label>
                <span>₹{excessAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-item">
              <label>Remaining Limit:</label>
              <span>₹{Math.max(0, 150000 - total80C).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="error-section">
            {Object.entries(errors).map(([key, error]) => (
              <div key={key} className="error-message">
                <strong>⚠️ Error:</strong> {error}
              </div>
            ))}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="success-message" style={{
            padding: '12px 16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            marginBottom: '20px',
          }}>
            {successMessage}
          </div>
        )}

        {/* Processing Status */}
        {Object.values(isProcessing).some(processing => processing) && (
          <div className="upload-progress">
            <span>🔄 Processing documents...</span>
          </div>
        )}

        {/* Navigation */}
        <div className="form-navigation">
          <Button variant="secondary" onClick={onPrevious}>
            Previous
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Section80CForm;
