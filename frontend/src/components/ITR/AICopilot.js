// =====================================================
// AI COPILOT COMPONENT
// =====================================================

import React, { useState, useEffect } from 'react';
import Button from '../DesignSystem/components/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { enterpriseLogger } from '../../utils/logger';

const AICopilot = ({
  context = 'general',
  step = null,
  itrType = null,
  onClose,
  isOpen = false,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState({});

  // Rule-based knowledge base
  const knowledgeRules = {
    general: {
      greetings: [
        "Hello! I'm your AI CA assistant. How can I help you with your ITR filing today?",
        "Hi there! I'm here to guide you through your tax filing process. What would you like to know?",
        'Welcome! I can help you understand tax concepts, filing procedures, and answer your questions.',
      ],
      help: [
        'I can help you with:',
        '• Understanding ITR forms and which one to choose',
        '• Explaining tax deductions and exemptions',
        '• Calculating your tax liability',
        '• Understanding filing procedures',
        '• Answering general tax questions',
      ],
    },
    personal_info: {
      pan: [
        'PAN (Permanent Account Number) is a 10-character alphanumeric identifier issued by the Income Tax Department.',
        'Format: ABCDE1234F (5 letters + 4 numbers + 1 letter)',
        'Required for all tax-related transactions and ITR filing.',
      ],
      aadhaar: [
        'Aadhaar is a 12-digit unique identity number issued by UIDAI.',
        "While not mandatory for ITR filing, it's required for PAN applications and many financial transactions.",
        'You can link your Aadhaar with PAN for easier verification.',
      ],
      address: [
        'Provide your current residential address as it appears on official documents.',
        'This address will be used for all tax-related communications.',
        "If you've moved recently, update your address with the Income Tax Department.",
      ],
    },
    income: {
      salary: [
        'Salary income includes basic salary, allowances, perquisites, and benefits.',
        'Form 16 from your employer contains all salary details.',
        'Standard deduction of ₹50,000 is available for salaried employees.',
      ],
      house_property: [
        'House property income includes rental income from properties.',
        'You can claim deductions for municipal taxes, interest on home loan, and standard deduction.',
        'If you have a home loan, you can claim up to ₹2,00,000 interest deduction under Section 24.',
      ],
      capital_gains: [
        'Capital gains arise from sale of capital assets like property, shares, mutual funds.',
        'Short-term capital gains: Assets held for less than 1 year (shares) or 2 years (property).',
        'Long-term capital gains: Assets held for more than 1 year (shares) or 2 years (property).',
      ],
    },
    deductions: {
      section80c: [
        'Section 80C allows deduction up to ₹1,50,000 for various investments and expenses.',
        'Includes: EPF, PPF, ELSS, NSC, life insurance premium, home loan principal, tuition fees.',
        'Total deduction cannot exceed ₹1,50,000.',
      ],
      section80d: [
        'Section 80D allows deduction for health insurance premium up to ₹25,000.',
        'For senior citizens, the limit is ₹50,000.',
        'Preventive health checkup expenses up to ₹5,000 are also deductible.',
      ],
      hra: [
        'House Rent Allowance (HRA) exemption is available for salaried employees.',
        'Exemption is the least of:',
        '• Actual HRA received',
        '• Rent paid minus 10% of salary',
        '• 50% of salary (metro cities) or 40% (non-metro cities)',
      ],
    },
    tax_computation: {
      slabs: [
        'Tax slabs for FY 2024-25:',
        '• ₹0 - ₹2,50,000: No tax',
        '• ₹2,50,001 - ₹5,00,000: 5%',
        '• ₹5,00,001 - ₹7,50,000: 10%',
        '• ₹7,50,001 - ₹10,00,000: 15%',
        '• ₹10,00,001 - ₹12,50,000: 20%',
        '• ₹12,50,001 - ₹15,00,000: 25%',
        '• Above ₹15,00,000: 30%',
        'Plus 4% cess on total tax.',
      ],
      senior_citizen: [
        'Senior citizens (60+ years) have higher tax exemption limits.',
        '• ₹0 - ₹3,00,000: No tax',
        '• ₹3,00,001 - ₹5,00,000: 5%',
        'Super senior citizens (80+ years):',
        '• ₹0 - ₹5,00,000: No tax',
      ],
    },
  };

  useEffect(() => {
    initializeKnowledgeBase();
    addWelcomeMessage();
  }, [context, step, itrType]);

  const initializeKnowledgeBase = () => {
    const baseKnowledge = knowledgeRules.general;
    const contextKnowledge = knowledgeRules[context] || {};
    const stepKnowledge = step ? knowledgeRules[step] : {};

    setKnowledgeBase({
      ...baseKnowledge,
      ...contextKnowledge,
      ...stepKnowledge,
    });
  };

  const addWelcomeMessage = () => {
    const welcomeMessages = [
      "👋 Hello! I'm your AI CA assistant, here to help you with your ITR filing.",
      'I can explain tax concepts, guide you through the filing process, and answer your questions.',
      'What would you like to know about?',
    ];

    setMessages(welcomeMessages.map((text, index) => ({
      id: `welcome-${index}`,
      type: 'bot',
      text,
      timestamp: new Date(),
    })));
  };

  const findBestResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // Greeting patterns
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return knowledgeBase.greetings?.[Math.floor(Math.random() * knowledgeBase.greetings.length)] ||
             'Hello! How can I help you today?';
    }

    // Help patterns
    if (message.includes('help') || message.includes('what can you do')) {
      return knowledgeBase.help?.join('\n') || 'I can help you with tax-related questions and ITR filing guidance.';
    }

    // Context-specific responses
    if (context === 'personal_info') {
      if (message.includes('pan')) {
        return knowledgeBase.pan?.join('\n') || 'PAN is your Permanent Account Number for tax purposes.';
      }
      if (message.includes('aadhaar')) {
        return knowledgeBase.aadhaar?.join('\n') || 'Aadhaar is your unique identity number.';
      }
      if (message.includes('address')) {
        return knowledgeBase.address?.join('\n') || 'Please provide your current residential address.';
      }
    }

    if (context === 'income') {
      if (message.includes('salary')) {
        return knowledgeBase.salary?.join('\n') || 'Salary income includes all earnings from employment.';
      }
      if (message.includes('house') || message.includes('property')) {
        return knowledgeBase.house_property?.join('\n') || 'House property income includes rental income.';
      }
      if (message.includes('capital') || message.includes('gains')) {
        return knowledgeBase.capital_gains?.join('\n') || 'Capital gains arise from sale of assets.';
      }
    }

    if (context === 'deductions') {
      if (message.includes('80c')) {
        return knowledgeBase.section80c?.join('\n') || 'Section 80C provides deduction up to ₹1,50,000.';
      }
      if (message.includes('80d')) {
        return knowledgeBase.section80d?.join('\n') || 'Section 80D provides deduction for health insurance.';
      }
      if (message.includes('hra')) {
        return knowledgeBase.hra?.join('\n') || 'HRA exemption is available for salaried employees.';
      }
    }

    if (context === 'tax_computation') {
      if (message.includes('slab') || message.includes('rate')) {
        return knowledgeBase.slabs?.join('\n') || 'Tax rates vary based on income slabs.';
      }
      if (message.includes('senior')) {
        return knowledgeBase.senior_citizen?.join('\n') || 'Senior citizens have higher exemption limits.';
      }
    }

    // Default responses
    const defaultResponses = [
      "I understand you're asking about that. Let me help you with more specific information.",
      "That's a great question! Could you be more specific about what you'd like to know?",
      'I can help you with that. What specific aspect would you like me to explain?',
      "I'm here to help! Could you provide more details about your question?",
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = findBestResponse(inputMessage);

      const botMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      enterpriseLogger.info('AI Copilot response generated', {
        context,
        step,
        userMessage: inputMessage,
        responseLength: botResponse.length,
      });
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getContextTitle = () => {
    const titles = {
      personal_info: 'Personal Information Help',
      income: 'Income Details Help',
      deductions: 'Deductions Help',
      tax_computation: 'Tax Computation Help',
      general: 'General Tax Help',
    };
    return titles[context] || 'AI CA Assistant';
  };

  const getContextIcon = () => {
    const icons = {
      personal_info: '👤',
      income: '💰',
      deductions: '📊',
      tax_computation: '🧮',
      general: '🤖',
    };
    return icons[context] || '🤖';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${getContextIcon()} ${getContextTitle()}`}
      size="large"
    >
      <div className="ai-copilot">
        <div className="copilot-header">
          <div className="context-info">
            <span className="context-badge">
              {itrType && `ITR ${itrType}`}
              {step && ` • ${step.replace('_', ' ').toUpperCase()}`}
            </span>
          </div>
        </div>

        <div className="copilot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {message.text.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message bot typing">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="copilot-input">
          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about taxes or ITR filing..."
              rows={2}
              className="message-input"
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="send-button"
            >
              Send
            </Button>
          </div>
        </div>

        <div className="copilot-suggestions">
          <h4>Quick Questions:</h4>
          <div className="suggestion-chips">
            {context === 'personal_info' && (
              <>
                <button onClick={() => setInputMessage('What is PAN?')}>What is PAN?</button>
                <button onClick={() => setInputMessage('Do I need Aadhaar?')}>Do I need Aadhaar?</button>
                <button onClick={() => setInputMessage('Address requirements')}>Address requirements</button>
              </>
            )}
            {context === 'income' && (
              <>
                <button onClick={() => setInputMessage('Salary income details')}>Salary income details</button>
                <button onClick={() => setInputMessage('House property income')}>House property income</button>
                <button onClick={() => setInputMessage('Capital gains')}>Capital gains</button>
              </>
            )}
            {context === 'deductions' && (
              <>
                <button onClick={() => setInputMessage('Section 80C details')}>Section 80C details</button>
                <button onClick={() => setInputMessage('HRA exemption')}>HRA exemption</button>
                <button onClick={() => setInputMessage('Health insurance deduction')}>Health insurance deduction</button>
              </>
            )}
            {context === 'tax_computation' && (
              <>
                <button onClick={() => setInputMessage('Tax slabs')}>Tax slabs</button>
                <button onClick={() => setInputMessage('Senior citizen benefits')}>Senior citizen benefits</button>
                <button onClick={() => setInputMessage('Cess calculation')}>Cess calculation</button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AICopilot;
