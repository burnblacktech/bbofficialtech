// useChat Hook
// React hook for managing chat functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';

export const useChat = (ticketId) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Connect to chat service
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        chatService.connect(token)
          .then(() => {
            setIsConnected(true);
            setError(null);
          })
          .catch((error) => {
            console.error('Failed to connect to chat:', error);
            setError('Failed to connect to chat service');
          });
      }
    }

    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  // Join ticket room when connected and ticketId is available
  useEffect(() => {
    if (isConnected && ticketId) {
      chatService.joinTicket(ticketId);
    }

    return () => {
      if (ticketId) {
        chatService.leaveTicket(ticketId);
      }
    };
  }, [isConnected, ticketId]);

  // Set up event listeners
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleTicketMessages = (data) => {
      if (data.ticketId === ticketId) {
        setMessages(data.messages || []);
        scrollToBottom();
      }
    };

    const handleUserJoined = (data) => {
      setOnlineUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user?.user_id) {
        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleConnectionStatus = (data) => {
      setIsConnected(data.connected);
      if (!data.connected) {
        setError('Disconnected from chat service');
      } else {
        setError(null);
      }
    };

    const handleError = (error) => {
      console.error('Chat error:', error);
      setError(error.message || 'Chat error occurred');
    };

    // Register event listeners
    chatService.on('new_message', handleNewMessage);
    chatService.on('ticket_messages', handleTicketMessages);
    chatService.on('user_joined', handleUserJoined);
    chatService.on('user_left', handleUserLeft);
    chatService.on('user_typing', handleUserTyping);
    chatService.on('user_stop_typing', handleUserStopTyping);
    chatService.on('connection_status', handleConnectionStatus);
    chatService.on('error', handleError);

    // Cleanup
    return () => {
      chatService.off('new_message', handleNewMessage);
      chatService.off('ticket_messages', handleTicketMessages);
      chatService.off('user_joined', handleUserJoined);
      chatService.off('user_left', handleUserLeft);
      chatService.off('user_typing', handleUserTyping);
      chatService.off('user_stop_typing', handleUserStopTyping);
      chatService.off('connection_status', handleConnectionStatus);
      chatService.off('error', handleError);
    };
  }, [ticketId, user, scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async (message, messageType = 'text') => {
    if (!isConnected || !ticketId || !message.trim()) {
      return;
    }

    try {
      setLoading(true);
      await chatService.sendMessage(ticketId, message.trim(), messageType);
      setError(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [isConnected, ticketId]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!isConnected || !ticketId) return;

    setIsTyping(true);
    chatService.startTyping(ticketId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.stopTyping(ticketId);
    }, 1000);
  }, [isConnected, ticketId]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!isConnected || !ticketId) return;

    setIsTyping(false);
    chatService.stopTyping(ticketId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isConnected, ticketId]);

  // Update status
  const updateStatus = useCallback((status) => {
    if (isConnected) {
      chatService.updateStatus(status);
    }
  }, [isConnected]);

  // Format message timestamp
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }, []);

  // Check if message is from current user
  const isOwnMessage = useCallback((message) => {
    return message.userId === user?.user_id;
  }, [user]);

  // Get typing indicator text
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userEmail} is typing...`;
    }
    return `${typingUsers.length} people are typing...`;
  }, [typingUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    messages,
    isConnected,
    isTyping,
    typingUsers,
    onlineUsers,
    error,
    loading,

    // Actions
    sendMessage,
    handleTyping,
    stopTyping,
    updateStatus,

    // Utilities
    formatTimestamp,
    isOwnMessage,
    getTypingText,
    scrollToBottom,
    messagesEndRef,
  };
};

export default useChat;
