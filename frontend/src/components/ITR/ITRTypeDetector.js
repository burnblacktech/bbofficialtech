// =====================================================
// ITR TYPE AUTO-DETECTOR (HYBRID APPROACH)
// =====================================================

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { enterpriseLogger } from '../../utils/logger';

const ITRTypeDetector = ({
  onITRTypeSelected,
  memberData,
  isOpen = false,
  onClose,
}) => {
  const [detectedType, setDetectedType] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [detectionReasons, setDetectionReasons] = useState([]);
  const [userOverride, setUserOverride] = useState(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [loading, setLoading] = useState(false);

  // ITR Type detection rules (CA-like logic)
  const detectionRules = {
    'ITR-1': {
      name: 'ITR-1 (Sahaj)',
      description: 'For individuals with salary income, one house property, and other sources',
      conditions: [
        'Has salary income',
        'Has only one house property or no house property',
        'No business/profession income',
        'No capital gains from shares/mutual funds',
        'Total income from all sources ≤ ₹50 lakhs',
      ],
      incomeSources: ['salary', 'house_property', 'other_income'],
      exclusions: ['business_income', 'capital_gains_shares', 'capital_gains_property'],
    },
    'ITR-2': {
      name: 'ITR-2',
      description: 'For individuals with capital gains, foreign income, or multiple house properties',
      conditions: [
        'Has capital gains from shares/mutual funds',
        'Has capital gains from property',
        'Has foreign income',
        'Has more than one house property',
        'Total income from all sources ≤ ₹50 lakhs',
      ],
      incomeSources: ['salary', 'house_property', 'capital_gains', 'foreign_income', 'other_income'],
      exclusions: ['business_income'],
    },
    'ITR-3': {
      name: 'ITR-3',
      description: 'For individuals with business/profession income',
      conditions: [
        'Has business income',
        'Has profession income',
        'Has presumptive income under section 44AD/44ADA',
        'Total income from all sources ≤ ₹50 lakhs',
      ],
      incomeSources: ['salary', 'house_property', 'business_income', 'capital_gains', 'other_income'],
      exclusions: [],
    },
    'ITR-4': {
      name: 'ITR-4 (Sugam)',
      description: 'For individuals with presumptive business income',
      conditions: [
        'Has presumptive business income under section 44AD',
        'Has presumptive profession income under section 44ADA',
        'Total income from all sources ≤ ₹50 lakhs',
        'No capital gains from shares/mutual funds',
      ],
      incomeSources: ['salary', 'house_property', 'presumptive_income', 'other_income'],
      exclusions: ['capital_gains_shares', 'foreign_income'],
    },
  };

  useEffect(() => {
    if (isOpen && memberData) {
      detectITRType();
    }
  }, [isOpen, memberData]);

  const detectITRType = async () => {
    try {
      setLoading(true);

      // Simulate AI-like detection process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const detection = await performITRDetection(memberData);

      setDetectedType(detection.type);
      setConfidence(detection.confidence);
      setDetectionReasons(detection.reasons);

      enterpriseLogger.info('ITR type detected', {
        memberId: memberData.id,
        detectedType: detection.type,
        confidence: detection.confidence,
        reasons: detection.reasons,
      });

    } catch (error) {
      enterpriseLogger.error('ITR type detection failed', {
        error: error.message,
        memberData: memberData.id,
      });
    } finally {
      setLoading(false);
    }
  };

  const performITRDetection = async (memberData) => {
    // Mock income data - in real implementation, this would come from user input
    const mockIncomeData = {
      salary: memberData.hasSalary || false,
      houseProperty: memberData.housePropertyCount || 0,
      capitalGains: memberData.hasCapitalGains || false,
      businessIncome: memberData.hasBusinessIncome || false,
      foreignIncome: memberData.hasForeignIncome || false,
      presumptiveIncome: memberData.hasPresumptiveIncome || false,
      totalIncome: memberData.estimatedIncome || 0,
    };

    const scores = {};
    const reasons = {};

    // Score each ITR type based on income sources
    Object.keys(detectionRules).forEach(itrType => {
      const rule = detectionRules[itrType];
      let score = 0;
      const typeReasons = [];

      // Check income sources
      rule.incomeSources.forEach(source => {
        if (mockIncomeData[source] || (source === 'house_property' && mockIncomeData.houseProperty > 0)) {
          score += 20;
          typeReasons.push(`Has ${source.replace('_', ' ')} income`);
        }
      });

      // Check exclusions
      rule.exclusions.forEach(exclusion => {
        if (mockIncomeData[exclusion]) {
          score -= 30; // Heavy penalty for exclusions
          typeReasons.push(`Cannot use ${itrType} - has ${exclusion.replace('_', ' ')} income`);
        }
      });

      // Check income limits
      if (mockIncomeData.totalIncome > 5000000) {
        score -= 20;
        typeReasons.push('Income exceeds ₹50 lakhs limit');
      }

      scores[itrType] = score;
      reasons[itrType] = typeReasons;
    });

    // Find best match
    const bestMatch = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const confidence = Math.min(100, Math.max(0, scores[bestMatch]));

    return {
      type: bestMatch,
      confidence: confidence,
      reasons: reasons[bestMatch],
      allScores: scores,
    };
  };

  const handleAutoDetectionAccept = () => {
    const finalType = userOverride || detectedType;
    onITRTypeSelected(finalType, {
      detectionMethod: 'auto',
      confidence: confidence,
      reasons: detectionReasons,
      userOverride: !!userOverride,
    });

    enterpriseLogger.info('ITR type selected via auto-detection', {
      selectedType: finalType,
      confidence: confidence,
      userOverride: !!userOverride,
    });
  };

  const handleManualSelection = (selectedType) => {
    setUserOverride(selectedType);
    setShowManualSelection(false);

    enterpriseLogger.info('ITR type manually overridden', {
      originalType: detectedType,
      overrideType: selectedType,
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'yellow';
    return 'red';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 ITR Type Detection"
      size="large"
    >
      <div className="itr-type-detector">
        {loading ? (
          <div className="detection-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <h3>Analyzing your income sources...</h3>
            <p>Our AI is determining the best ITR form for you</p>
          </div>
        ) : (
          <div className="detection-results">
            <div className="detection-header">
              <h3>🎯 Recommended ITR Type</h3>
              <p>Based on your income sources and CA-like analysis</p>
            </div>

            {detectedType && (
              <div className="detection-card">
                <Card className="recommendation-card">
                  <div className="recommendation-header">
                    <h4>{detectionRules[detectedType].name}</h4>
                    <StatusBadge
                      status={getConfidenceText(confidence)}
                      color={getConfidenceColor(confidence)}
                    />
                  </div>

                  <p className="recommendation-description">
                    {detectionRules[detectedType].description}
                  </p>

                  <div className="confidence-meter">
                    <div className="confidence-label">
                      Confidence: {confidence}%
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${confidence}%`,
                          backgroundColor: getConfidenceColor(confidence) === 'green' ? '#10B981' :
                                         getConfidenceColor(confidence) === 'yellow' ? '#F59E0B' : '#EF4444',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="detection-reasons">
                    <h5>Why this ITR type?</h5>
                    <ul>
                      {detectionReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            )}

            <div className="detection-actions">
              <div className="action-buttons">
                <Button
                  variant="primary"
                  onClick={handleAutoDetectionAccept}
                  className="accept-button"
                >
                  ✅ Use {detectedType} (Recommended)
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowManualSelection(true)}
                  className="override-button"
                >
                  🔄 Choose Different ITR Type
                </Button>
              </div>

              <div className="ca-note">
                <p>
                  💡 <strong>CA-like Guidance:</strong> Our system analyzed your income sources
                  like a CA would. You can override if you know better, but our recommendation
                  is based on tax law compliance.
                </p>
              </div>
            </div>

            {showManualSelection && (
              <div className="manual-selection">
                <h4>Choose ITR Type Manually</h4>
                <div className="itr-options">
                  {Object.keys(detectionRules).map(itrType => (
                    <Card
                      key={itrType}
                      className={`itr-option ${userOverride === itrType ? 'selected' : ''}`}
                      onClick={() => handleManualSelection(itrType)}
                    >
                      <h5>{detectionRules[itrType].name}</h5>
                      <p>{detectionRules[itrType].description}</p>
                      <div className="itr-conditions">
                        <strong>Applies when:</strong>
                        <ul>
                          {detectionRules[itrType].conditions.slice(0, 3).map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ITRTypeDetector;
