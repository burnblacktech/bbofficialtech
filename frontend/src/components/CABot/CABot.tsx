// =====================================================
// CA AI BOT - CONVERSATIONAL ITR FILING INTERFACE
// Mimics real CA consultation with adaptive responses
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useITR } from '../../contexts/ITRContext';
import { 
  Mic, 
  MicOff, 
  Send, 
  User, 
  Bot, 
  Settings, 
  Globe,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    userType?: UserType;
    filingStep?: string;
    suggestions?: string[];
  };
}

enum UserType {
  NON_EDUCATED = 'non_educated',
  EDUCATED = 'educated', 
  ULTRA_EDUCATED = 'ultra_educated'
}

interface FilingState {
  currentStep: string;
  collectedData: any;
  userType: UserType;
  language: 'en' | 'hi';
  isVoiceEnabled: boolean;
}

const CABot: React.FC = () => {
  const { currentFiling } = useITR();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [filingState, setFilingState] = useState<FilingState>({
    currentStep: 'greeting',
    collectedData: {},
    userType: UserType.EDUCATED,
    language: 'en',
    isVoiceEnabled: false
  });
  
  // UI state
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = filingState.language === 'hi' ? 'hi-IN' : 'en-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition failed');
      };
    }
    
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, [filingState.language]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  }, [messages.length, startConversation]);

  // Start conversation with greeting
  const startConversation = useCallback(() => {
    const greetingMessage = getGreetingMessage();
    addMessage('bot', greetingMessage);
  }, [filingState.language, filingState.userType, addMessage, getGreetingMessage]);

  // Add message to conversation
  const addMessage = useCallback((type: 'user' | 'bot' | 'system', content: string, metadata?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    
    setMessages(prev => [...prev, message]);
    
    // Speak bot messages if voice is enabled
    if (type === 'bot' && filingState.isVoiceEnabled) {
      speakMessage(content);
    }
  }, [filingState.isVoiceEnabled]);

  // Get greeting message based on user type and language
  const getGreetingMessage = useCallback(() => {
    const greetings = {
      [UserType.NON_EDUCATED]: {
        en: "Hi! I'm your CA assistant. Let's file your ITR step by step. First, are you filing for yourself or for family?",
        hi: "नमस्ते! मैं आपका CA सहायक हूं। आइए आपका ITR फाइल करें। पहले बताइए, आप अपने लिए फाइल कर रहे हैं या परिवार के लिए?"
      },
      [UserType.EDUCATED]: {
        en: "Hello! I'm your CA assistant. I'll help you file your ITR efficiently. Are you filing for yourself or for family members?",
        hi: "नमस्ते! मैं आपका CA सहायक हूं। मैं आपके ITR फाइलिंग में मदद करूंगा। क्या आप अपने लिए फाइल कर रहे हैं या परिवार के सदस्यों के लिए?"
      },
      [UserType.ULTRA_EDUCATED]: {
        en: "Good day! I'm your CA assistant. I'll guide you through the ITR filing process with advanced optimization options. Are you filing for yourself or for family members?",
        hi: "नमस्कार! मैं आपका CA सहायक हूं। मैं आपको उन्नत अनुकूलन विकल्पों के साथ ITR फाइलिंग प्रक्रिया के माध्यम से मार्गदर्शन करूंगा। क्या आप अपने लिए फाइल कर रहे हैं या परिवार के सदस्यों के लिए?"
      }
    };
    
    return greetings[filingState.userType][filingState.language];
  }, [filingState.userType, filingState.language]);

  // Detect user type from input
  const detectUserType = (input: string): UserType => {
    const technicalTerms = ['section 80c', 'hra exemption', 'ltcg', 'stcg', 'depreciation', 'p&l', 'balance sheet'];
    const simpleTerms = ['kitna', 'kya', 'kaise', 'kab', 'kahan'];
    
    const lowerInput = input.toLowerCase();
    
    if (technicalTerms.some(term => lowerInput.includes(term))) {
      return UserType.ULTRA_EDUCATED;
    }
    
    if (simpleTerms.some(term => lowerInput.includes(term))) {
      return UserType.NON_EDUCATED;
    }
    
    return UserType.EDUCATED;
  };

  // Process user input and generate bot response
  const processUserInput = async (input: string) => {
    // Detect user type from input
    const detectedUserType = detectUserType(input);
    if (detectedUserType !== filingState.userType) {
      setFilingState(prev => ({ ...prev, userType: detectedUserType }));
    }

    // Add user message
    addMessage('user', input);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Generate bot response based on current step and user type
      const response = await generateBotResponse(input, filingState);
      
      // Simulate typing delay
      setTimeout(() => {
        addMessage('bot', response.content, response.metadata);
        setIsTyping(false);
        
        // Update filing state
        if (response.metadata?.filingStep) {
          setFilingState(prev => ({ 
            ...prev, 
            currentStep: response.metadata.filingStep 
          }));
        }
      }, 1000 + Math.random() * 2000);
      
    } catch (error) {
      console.error('Error processing user input:', error);
      setIsTyping(false);
      addMessage('bot', 'Sorry, I encountered an error. Please try again.');
    }
  };

  // Generate bot response based on input and current state
  const generateBotResponse = async (input: string, state: FilingState) => {
    // This would integrate with OpenAI API in production
    // For now, using rule-based responses
    
    const lowerInput = input.toLowerCase();
    
    // Filing context detection
    if (lowerInput.includes('self') || lowerInput.includes('myself') || lowerInput.includes('apne')) {
      return {
        content: getContextResponse('self', state),
        metadata: { filingStep: 'personal_info', userType: state.userType }
      };
    }
    
    if (lowerInput.includes('family') || lowerInput.includes('parivar') || lowerInput.includes('ghar')) {
      return {
        content: getContextResponse('family', state),
        metadata: { filingStep: 'family_selection', userType: state.userType }
      };
    }
    
    // Income questions
    if (lowerInput.includes('salary') || lowerInput.includes('income') || lowerInput.includes('paisa')) {
      return {
        content: getIncomeResponse(state),
        metadata: { filingStep: 'income_details', userType: state.userType }
      };
    }
    
    // Default response
    return {
      content: getDefaultResponse(state),
      metadata: { userType: state.userType }
    };
  };

  // Get context-specific responses
  const getContextResponse = (context: 'self' | 'family', state: FilingState) => {
    const responses = {
      self: {
        [UserType.NON_EDUCATED]: {
          en: "Great! Let's file your ITR. First, I need your PAN number. Can you share it?",
          hi: "बहुत बढ़िया! आइए आपका ITR फाइल करें। पहले मुझे आपका PAN नंबर चाहिए। क्या आप इसे साझा कर सकते हैं?"
        },
        [UserType.EDUCATED]: {
          en: "Perfect! Let's start with your personal information. Please provide your PAN number for verification.",
          hi: "बिल्कुल सही! आइए आपकी व्यक्तिगत जानकारी से शुरुआत करें। कृपया सत्यापन के लिए अपना PAN नंबर प्रदान करें।"
        },
        [UserType.ULTRA_EDUCATED]: {
          en: "Excellent! Let's begin the ITR filing process. I'll need your PAN number for verification and then we'll proceed with income optimization.",
          hi: "उत्कृष्ट! आइए ITR फाइलिंग प्रक्रिया शुरू करें। मुझे सत्यापन के लिए आपका PAN नंबर चाहिए और फिर हम आय अनुकूलन के साथ आगे बढ़ेंगे।"
        }
      },
      family: {
        [UserType.NON_EDUCATED]: {
          en: "Okay! For family filing, I need to know who you're filing for. How many family members?",
          hi: "ठीक है! परिवार के लिए फाइलिंग के लिए, मुझे पता होना चाहिए कि आप किसके लिए फाइल कर रहे हैं। कितने परिवार के सदस्य?"
        },
        [UserType.EDUCATED]: {
          en: "Understood! For family filing, please specify the family members you're filing for and their relationship to you.",
          hi: "समझ गया! परिवार के लिए फाइलिंग के लिए, कृपया उन परिवार के सदस्यों को निर्दिष्ट करें जिनके लिए आप फाइल कर रहे हैं और उनका आपसे संबंध।"
        },
        [UserType.ULTRA_EDUCATED]: {
          en: "Noted! For family filing, I'll need details of each family member including their PAN, income sources, and any joint investments for optimal tax planning.",
          hi: "ध्यान में रखा! परिवार के लिए फाइलिंग के लिए, मुझे प्रत्येक परिवार के सदस्य का विवरण चाहिए जिसमें उनका PAN, आय स्रोत और अनुकूलतम कर योजना के लिए कोई संयुक्त निवेश शामिल है।"
        }
      }
    };
    
    return responses[context][state.userType][state.language];
  };

  // Get income-related responses
  const getIncomeResponse = (state: FilingState) => {
    const responses = {
      [UserType.NON_EDUCATED]: {
        en: "Tell me about your salary. How much did you earn this year? Just the number is fine.",
        hi: "अपने वेतन के बारे में बताइए। इस साल आपने कितना कमाया? सिर्फ नंबर बताइए।"
      },
      [UserType.EDUCATED]: {
        en: "Please share your salary details. Do you have Form 16? If yes, upload it or tell me the basic salary amount.",
        hi: "कृपया अपने वेतन का विवरण साझा करें। क्या आपके पास Form 16 है? यदि हां, तो इसे अपलोड करें या मुझे बुनियादी वेतन राशि बताएं।"
      },
      [UserType.ULTRA_EDUCATED]: {
        en: "Let's optimize your salary income. Please provide: Basic salary, HRA, allowances, and any exemptions. Do you have Form 16 for accurate calculation?",
        hi: "आइए आपकी वेतन आय को अनुकूलित करें। कृपया प्रदान करें: बुनियादी वेतन, HRA, भत्ते, और कोई छूट। सटीक गणना के लिए क्या आपके पास Form 16 है?"
      }
    };
    
    return responses[state.userType][state.language];
  };

  // Get default response
  const getDefaultResponse = (state: FilingState) => {
    const responses = {
      [UserType.NON_EDUCATED]: {
        en: "I'm here to help! Can you tell me more about what you need help with?",
        hi: "मैं यहां मदद के लिए हूं! क्या आप मुझे बता सकते हैं कि आपको किस चीज में मदद चाहिए?"
      },
      [UserType.EDUCATED]: {
        en: "I understand you need assistance. Could you please provide more details about your query?",
        hi: "मैं समझता हूं कि आपको सहायता की आवश्यकता है। कृपया अपने प्रश्न के बारे में अधिक विवरण प्रदान करें।"
      },
      [UserType.ULTRA_EDUCATED]: {
        en: "I'm ready to assist you with advanced tax planning. Please specify your requirements for optimal guidance.",
        hi: "मैं उन्नत कर योजना में आपकी सहायता के लिए तैयार हूं। अनुकूलतम मार्गदर्शन के लिए कृपया अपनी आवश्यकताएं निर्दिष्ट करें।"
      }
    };
    
    return responses[state.userType][state.language];
  };

  // Handle voice input
  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Speak message
  const speakMessage = (text: string) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = filingState.language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthesisRef.current.speak(utterance);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processUserInput(inputValue.trim());
      setInputValue('');
    }
  };

  // Toggle language
  const toggleLanguage = () => {
    setFilingState(prev => ({ 
      ...prev, 
      language: prev.language === 'en' ? 'hi' : 'en' 
    }));
  };

  // Toggle voice
  const toggleVoice = () => {
    setFilingState(prev => ({ 
      ...prev, 
      isVoiceEnabled: !prev.isVoiceEnabled 
    }));
  };

  // Reset conversation
  const resetConversation = () => {
    setMessages([]);
    setFilingState(prev => ({ 
      ...prev, 
      currentStep: 'greeting',
      collectedData: {} 
    }));
    startConversation();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {filingState.language === 'hi' ? 'CA सहायक' : 'CA Assistant'}
              </h1>
              <p className="text-sm text-gray-500">
                {filingState.language === 'hi' ? 'आपका ITR फाइलिंग सहायक' : 'Your ITR Filing Assistant'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={filingState.language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Voice Toggle */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-colors ${
                filingState.isVoiceEnabled 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={filingState.isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
            >
              {filingState.isVoiceEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
            
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Reset */}
            <button
              onClick={resetConversation}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* User Type Indicator */}
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {filingState.language === 'hi' ? 'उपयोगकर्ता प्रकार:' : 'User Type:'}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            filingState.userType === UserType.NON_EDUCATED 
              ? 'bg-green-100 text-green-800'
              : filingState.userType === UserType.EDUCATED
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {filingState.userType === UserType.NON_EDUCATED 
              ? (filingState.language === 'hi' ? 'सरल' : 'Simple')
              : filingState.userType === UserType.EDUCATED
              ? (filingState.language === 'hi' ? 'संतुलित' : 'Balanced')
              : (filingState.language === 'hi' ? 'उन्नत' : 'Advanced')
            }
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'bot'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && (
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-sm border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                filingState.language === 'hi' 
                  ? 'अपना संदेश टाइप करें...' 
                  : 'Type your message...'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
          </div>
          
          {/* Voice Input */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            disabled={isTyping}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          
          {/* Send */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CABot;
