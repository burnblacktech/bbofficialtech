import { useState, useCallback } from 'react';

const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (message) => {
    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Mock chatbot response - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const botResponse = {
        role: 'assistant',
        content: `I received your message: "${message}". How can I help you with your ITR filing?`,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
  };
};

export default useChatbot;
