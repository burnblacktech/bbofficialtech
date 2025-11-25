/**
 * Enhanced Dashboard with Micro-interactions and Personalized Experience
 * Implements UI/UX upgrades: interactive cards, personalized content, micro-animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Users, TrendingUp, Clock, CheckCircle,
  AlertCircle, Plus, ArrowRight, Sparkles, Target,
  Zap, Shield, Calendar, BarChart3, Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setRecentActivity([
        { id: 1, type: 'itr', title: 'ITR-1 2024-25', status: 'completed', date: '2024-01-15' },
        { id: 2, type: 'document', title: 'Form 16 Upload', status: 'pending', date: '2024-01-14' },
        { id: 3, type: 'member', title: 'Added Family Member', status: 'completed', date: '2024-01-13' },
      ]);

      setQuickActions([
        { id: 1, title: 'New ITR Filing', description: 'Start filing for AY 2024-25', icon: FileText, color: 'blue', route: '/itr/start' },
        { id: 2, title: 'CA Bot Assistant', description: 'Get AI-powered help', icon: Sparkles, color: 'purple', route: '/ca-bot' },
        { id: 3, title: 'Add Family Member', description: 'Manage family members', icon: Users, color: 'green', route: '/add-members' },
        { id: 4, title: 'Upload Documents', description: 'Upload tax documents', icon: FileText, color: 'orange', route: '/documents' },
      ]);

      setInsights([
        { id: 1, title: 'Tax Saved', value: '₹1,25,000', description: 'Through deductions', icon: TrendingUp, color: 'green' },
        { id: 2, title: 'Documents Uploaded', value: '12', description: 'This month', icon: FileText, color: 'blue' },
        { id: 3, title: 'Family Members', value: '3', description: 'Active profiles', icon: Users, color: 'purple' },
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName || 'there'}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to continue your tax filing journey? Let's make it simple and secure.
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-12 w-12 text-yellow-300" />
          </motion.div>
        </div>
      </motion.div>

      {/* Insights Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            variants={cardHoverVariants}
            whileHover="hover"
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{insight.title}</p>
                <p className="text-2xl font-bold text-gray-900">{insight.value}</p>
                <p className="text-sm text-gray-500">{insight.description}</p>
              </div>
              <div className={`p-3 rounded-full bg-${insight.color}-100`}>
                <insight.icon className={`h-6 w-6 text-${insight.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <Target className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <motion.div
              key={action.id}
              variants={cardHoverVariants}
              whileHover="hover"
              className="p-4 border border-gray-200 rounded-lg cursor-pointer group"
              onClick={() => navigate(action.route)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                  <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(activity.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* AI Assistant Card */}
      <motion.div
        variants={itemVariants}
        variants={cardHoverVariants}
        whileHover="hover"
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white cursor-pointer"
        onClick={() => navigate('/ca-bot')}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">AI Tax Assistant</h3>
            <p className="text-purple-100 mb-4">
              Get instant help with your tax filing questions. Our AI assistant is here to guide you.
            </p>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Ask anything about taxes</span>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-12 w-12 text-yellow-300" />
          </motion.div>
        </div>
      </motion.div>

      {/* Security Status */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Account Security</h3>
              <p className="text-xs text-gray-500">Your account is secure and up to date</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Secure</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedDashboard;
