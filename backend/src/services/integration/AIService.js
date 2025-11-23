// =====================================================
// CA BOT SERVICE - CONVERSATIONAL AI INTEGRATION
// Handles AI responses and user type detection
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class CABotService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.isLiveMode = process.env.FEATURE_OPENAI_LIVE === 'true';
    
    this.axiosInstance = axios.create({
      baseURL: this.openaiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      timeout: 30000,
    });

    // User type detection patterns
    this.userTypePatterns = {
      non_educated: [
        'kitna', 'kya', 'kaise', 'kab', 'kahan', 'kisko', 'kisne',
        'paisa', 'rupee', 'salary', 'income', 'tax', 'itr',
        'simple', 'easy', 'help', 'samjh', 'bataye'
      ],
      educated: [
        'please', 'could', 'would', 'should', 'form', 'document',
        'upload', 'provide', 'share', 'details', 'information',
        'filing', 'return', 'assessment', 'year'
      ],
      ultra_educated: [
        'section 80c', 'hra exemption', 'ltcg', 'stcg', 'depreciation',
        'p&l', 'balance sheet', 'tax planning', 'optimization',
        'deduction', 'exemption', 'rebate', 'advance tax',
        'tds', 'form 16', 'form 26as', 'ais', 'capital gains'
      ]
    };

    // Filing step responses
    this.filingResponses = {
      greeting: {
        non_educated: {
          en: "Hi! I'm your CA assistant. Let's file your ITR step by step. First, are you filing for yourself or for family?",
          hi: "नमस्ते! मैं आपका CA सहायक हूं। आइए आपका ITR फाइल करें। पहले बताइए, आप अपने लिए फाइल कर रहे हैं या परिवार के लिए?"
        },
        educated: {
          en: "Hello! I'm your CA assistant. I'll help you file your ITR efficiently. Are you filing for yourself or for family members?",
          hi: "नमस्ते! मैं आपका CA सहायक हूं। मैं आपके ITR फाइलिंग में मदद करूंगा। क्या आप अपने लिए फाइल कर रहे हैं या परिवार के सदस्यों के लिए?"
        },
        ultra_educated: {
          en: "Good day! I'm your CA assistant. I'll guide you through the ITR filing process with advanced optimization options. Are you filing for yourself or for family members?",
          hi: "नमस्कार! मैं आपका CA सहायक हूं। मैं आपको उन्नत अनुकूलन विकल्पों के साथ ITR फाइलिंग प्रक्रिया के माध्यम से मार्गदर्शन करूंगा। क्या आप अपने लिए फाइल कर रहे हैं या परिवार के सदस्यों के लिए?"
        }
      },
      personal_info: {
        non_educated: {
          en: "Great! Let's file your ITR. First, I need your PAN number. Can you share it?",
          hi: "बहुत बढ़िया! आइए आपका ITR फाइल करें। पहले मुझे आपका PAN नंबर चाहिए। क्या आप इसे साझा कर सकते हैं?"
        },
        educated: {
          en: "Perfect! Let's start with your personal information. Please provide your PAN number for verification.",
          hi: "बिल्कुल सही! आइए आपकी व्यक्तिगत जानकारी से शुरुआत करें। कृपया सत्यापन के लिए अपना PAN नंबर प्रदान करें।"
        },
        ultra_educated: {
          en: "Excellent! Let's begin the ITR filing process. I'll need your PAN number for verification and then we'll proceed with income optimization.",
          hi: "उत्कृष्ट! आइए ITR फाइलिंग प्रक्रिया शुरू करें। मुझे सत्यापन के लिए आपका PAN नंबर चाहिए और फिर हम आय अनुकूलन के साथ आगे बढ़ेंगे।"
        }
      },
      income_details: {
        non_educated: {
          en: "Tell me about your salary. How much did you earn this year? Just the number is fine.",
          hi: "अपने वेतन के बारे में बताइए। इस साल आपने कितना कमाया? सिर्फ नंबर बताइए।"
        },
        educated: {
          en: "Please share your salary details. Do you have Form 16? If yes, upload it or tell me the basic salary amount.",
          hi: "कृपया अपने वेतन का विवरण साझा करें। क्या आपके पास Form 16 है? यदि हां, तो इसे अपलोड करें या मुझे बुनियादी वेतन राशि बताएं।"
        },
        ultra_educated: {
          en: "Let's optimize your salary income. Please provide: Basic salary, HRA, allowances, and any exemptions. Do you have Form 16 for accurate calculation?",
          hi: "आइए आपकी वेतन आय को अनुकूलित करें। कृपया प्रदान करें: बुनियादी वेतन, HRA, भत्ते, और कोई छूट। सटीक गणना के लिए क्या आपके पास Form 16 है?"
        }
      }
    };

    enterpriseLogger.info('CABotService initialized', { 
      mode: this.isLiveMode ? 'LIVE' : 'MOCK',
      hasOpenAIKey: !!this.openaiApiKey
    });
  }

  /**
   * Detect user type from input text
   * @param {string} input - User input text
   * @returns {string} - Detected user type
   */
  detectUserType(input) {
    const lowerInput = input.toLowerCase();
    
    // Count matches for each user type
    const scores = {
      non_educated: 0,
      educated: 0,
      ultra_educated: 0
    };
    
    // Check for ultra-educated patterns first (most specific)
    for (const pattern of this.userTypePatterns.ultra_educated) {
      if (lowerInput.includes(pattern)) {
        scores.ultra_educated++;
      }
    }
    
    // Check for non-educated patterns
    for (const pattern of this.userTypePatterns.non_educated) {
      if (lowerInput.includes(pattern)) {
        scores.non_educated++;
      }
    }
    
    // Check for educated patterns
    for (const pattern of this.userTypePatterns.educated) {
      if (lowerInput.includes(pattern)) {
        scores.educated++;
      }
    }
    
    // Return user type with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return 'educated'; // Default to educated
    }
    
    return Object.keys(scores).find(key => scores[key] === maxScore);
  }

  /**
   * Generate AI response using OpenAI API
   * @param {string} userInput - User input
   * @param {object} context - Conversation context
   * @returns {Promise<object>} - AI response
   */
  async generateAIResponse(userInput, context) {
    try {
      if (!this.isLiveMode || !this.openaiApiKey) {
        return this.generateMockResponse(userInput, context);
      }

      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(userInput, context);

      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = response.data.choices[0].message.content;
      
      enterpriseLogger.info('AI response generated', {
        userType: context.userType,
        language: context.language,
        step: context.currentStep,
        responseLength: aiResponse.length
      });

      return {
        content: aiResponse,
        metadata: {
          userType: context.userType,
          filingStep: context.currentStep,
          language: context.language,
          isAI: true
        }
      };

    } catch (error) {
      enterpriseLogger.error('OpenAI API error', { error: error.message });
      return this.generateMockResponse(userInput, context);
    }
  }

  /**
   * Generate mock response for testing
   * @param {string} userInput - User input
   * @param {object} context - Conversation context
   * @returns {object} - Mock response
   */
  generateMockResponse(userInput, context) {
    const lowerInput = userInput.toLowerCase();
    
    // Context detection
    if (lowerInput.includes('self') || lowerInput.includes('myself') || lowerInput.includes('apne')) {
      return {
        content: this.filingResponses.personal_info[context.userType][context.language],
        metadata: {
          userType: context.userType,
          filingStep: 'personal_info',
          language: context.language,
          isAI: false
        }
      };
    }
    
    if (lowerInput.includes('family') || lowerInput.includes('parivar') || lowerInput.includes('ghar')) {
      return {
        content: this.getFamilyResponse(context),
        metadata: {
          userType: context.userType,
          filingStep: 'family_selection',
          language: context.language,
          isAI: false
        }
      };
    }
    
    if (lowerInput.includes('salary') || lowerInput.includes('income') || lowerInput.includes('paisa')) {
      return {
        content: this.filingResponses.income_details[context.userType][context.language],
        metadata: {
          userType: context.userType,
          filingStep: 'income_details',
          language: context.language,
          isAI: false
        }
      };
    }
    
    // Default response
    return {
      content: this.getDefaultResponse(context),
      metadata: {
        userType: context.userType,
        filingStep: context.currentStep,
        language: context.language,
        isAI: false
      }
    };
  }

  /**
   * Build system prompt for OpenAI
   * @param {object} context - Conversation context
   * @returns {string} - System prompt
   */
  buildSystemPrompt(context) {
    const userTypeInstructions = {
      non_educated: "Use simple, easy-to-understand language. Avoid technical terms. Use Hindi words when appropriate. Be very patient and encouraging.",
      educated: "Use clear, professional language. Explain technical terms briefly. Balance between simplicity and accuracy.",
      ultra_educated: "Use precise technical language. Provide detailed explanations. Include optimization suggestions and advanced tax planning concepts."
    };

    const languageInstructions = {
      en: "Respond in English. Use Hindi words only when they better convey meaning.",
      hi: "Respond in Hindi. Use English technical terms when necessary. Mix languages naturally."
    };

    return `You are a professional CA (Chartered Accountant) assistant helping users file their ITR (Income Tax Return) in India.

User Type: ${context.userType}
Language: ${context.language}
Current Step: ${context.currentStep}

Instructions:
- ${userTypeInstructions[context.userType]}
- ${languageInstructions[context.language]}
- Always be helpful, accurate, and professional
- Guide users through ITR filing step by step
- Ask one question at a time
- Provide encouragement and support
- If unsure, ask for clarification
- Focus on the current filing step: ${context.currentStep}

Context: ${JSON.stringify(context.collectedData, null, 2)}`;
  }

  /**
   * Build user prompt for OpenAI
   * @param {string} userInput - User input
   * @param {object} context - Conversation context
   * @returns {string} - User prompt
   */
  buildUserPrompt(userInput, context) {
    return `User said: "${userInput}"

Please respond as a CA assistant helping with ITR filing. Current step: ${context.currentStep}. User type: ${context.userType}. Language: ${context.language}.`;
  }

  /**
   * Get family-related response
   * @param {object} context - Conversation context
   * @returns {string} - Response text
   */
  getFamilyResponse(context) {
    const responses = {
      non_educated: {
        en: "Okay! For family filing, I need to know who you're filing for. How many family members?",
        hi: "ठीक है! परिवार के लिए फाइलिंग के लिए, मुझे पता होना चाहिए कि आप किसके लिए फाइल कर रहे हैं। कितने परिवार के सदस्य?"
      },
      educated: {
        en: "Understood! For family filing, please specify the family members you're filing for and their relationship to you.",
        hi: "समझ गया! परिवार के लिए फाइलिंग के लिए, कृपया उन परिवार के सदस्यों को निर्दिष्ट करें जिनके लिए आप फाइल कर रहे हैं और उनका आपसे संबंध।"
      },
      ultra_educated: {
        en: "Noted! For family filing, I'll need details of each family member including their PAN, income sources, and any joint investments for optimal tax planning.",
        hi: "ध्यान में रखा! परिवार के लिए फाइलिंग के लिए, मुझे प्रत्येक परिवार के सदस्य का विवरण चाहिए जिसमें उनका PAN, आय स्रोत और अनुकूलतम कर योजना के लिए कोई संयुक्त निवेश शामिल है।"
      }
    };
    
    return responses[context.userType][context.language];
  }

  /**
   * Get default response
   * @param {object} context - Conversation context
   * @returns {string} - Response text
   */
  getDefaultResponse(context) {
    const responses = {
      non_educated: {
        en: "I'm here to help! Can you tell me more about what you need help with?",
        hi: "मैं यहां मदद के लिए हूं! क्या आप मुझे बता सकते हैं कि आपको किस चीज में मदद चाहिए?"
      },
      educated: {
        en: "I understand you need assistance. Could you please provide more details about your query?",
        hi: "मैं समझता हूं कि आपको सहायता की आवश्यकता है। कृपया अपने प्रश्न के बारे में अधिक विवरण प्रदान करें।"
      },
      ultra_educated: {
        en: "I'm ready to assist you with advanced tax planning. Please specify your requirements for optimal guidance.",
        hi: "मैं उन्नत कर योजना में आपकी सहायता के लिए तैयार हूं। अनुकूलतम मार्गदर्शन के लिए कृपया अपनी आवश्यकताएं निर्दिष्ट करें।"
      }
    };
    
    return responses[context.userType][context.language];
  }

  /**
   * Process filing data from conversation
   * @param {object} conversationData - Conversation data
   * @returns {object} - Processed filing data
   */
  processFilingData(conversationData) {
    const filingData = {
      personalInfo: {},
      incomeDetails: {},
      deductions: {},
      taxComputation: {},
      metadata: {
        userType: conversationData.userType,
        language: conversationData.language,
        conversationSteps: conversationData.steps,
        collectedAt: new Date().toISOString()
      }
    };

    // Extract personal information
    if (conversationData.collectedData.pan) {
      filingData.personalInfo.pan = conversationData.collectedData.pan;
    }
    
    if (conversationData.collectedData.name) {
      filingData.personalInfo.name = conversationData.collectedData.name;
    }
    
    if (conversationData.collectedData.email) {
      filingData.personalInfo.email = conversationData.collectedData.email;
    }

    // Extract income details
    if (conversationData.collectedData.salary) {
      filingData.incomeDetails.salary = conversationData.collectedData.salary;
    }
    
    if (conversationData.collectedData.hra) {
      filingData.incomeDetails.hra = conversationData.collectedData.hra;
    }

    // Extract deductions
    if (conversationData.collectedData.section80C) {
      filingData.deductions.section80C = conversationData.collectedData.section80C;
    }

    return filingData;
  }

  /**
   * Validate conversation data
   * @param {object} conversationData - Conversation data
   * @returns {object} - Validation result
   */
  validateConversationData(conversationData) {
    const errors = [];
    const warnings = [];

    // Validate user type
    if (!['non_educated', 'educated', 'ultra_educated'].includes(conversationData.userType)) {
      errors.push('Invalid user type');
    }

    // Validate language
    if (!['en', 'hi'].includes(conversationData.language)) {
      errors.push('Invalid language');
    }

    // Validate current step
    if (!conversationData.currentStep) {
      errors.push('Missing current step');
    }

    // Validate collected data
    if (!conversationData.collectedData) {
      warnings.push('No data collected yet');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new CABotService();
