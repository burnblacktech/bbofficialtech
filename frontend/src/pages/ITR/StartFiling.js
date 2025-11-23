// =====================================================
// START FILING PAGE - ITR FILING ENTRY POINT
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useITR } from '../../contexts/ITRContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, Users, User, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

const StartFiling = () => {
  const { user } = useAuth();
  const { resetFiling } = useITR();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [filingContext, setFilingContext] = useState('self');

  const handleStartFiling = async (context) => {
    try {
      setLoading(true);
      setFilingContext(context);
      
      // Reset filing data for new filing
      resetFiling();
      
      // Navigate to ITR filing form
      navigate('/itr/filing', { 
        state: { 
          context,
          userId: user.id 
        } 
      });
      
    } catch (error) {
      console.error('Error starting filing:', error);
      toast.error('Failed to start filing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filingOptions = [
    {
      id: 'self',
      title: 'File for Myself',
      description: 'Start a new ITR filing for your own income',
      icon: User,
      color: 'bg-blue-500',
      action: () => handleStartFiling('self')
    },
    {
      id: 'family',
      title: 'File for Family Member',
      description: 'File ITR for a family member',
      icon: Users,
      color: 'bg-green-500',
      action: () => handleStartFiling('family')
    },
    {
      id: 'client',
      title: 'File for Client',
      description: 'File ITR for a client (CA users)',
      icon: FileText,
      color: 'bg-purple-500',
      action: () => handleStartFiling('client')
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Start ITR Filing
          </h1>
          <p className="text-neutral-600">
            Choose how you want to start your income tax return filing process
          </p>
        </div>

        {/* Filing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filingOptions.map((option) => (
            <Card key={option.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div 
                className="p-6 text-center"
                onClick={option.action}
              >
                <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-neutral-600 mb-4">
                  {option.description}
                </p>
                <Button
                  variant="primary"
                  onClick={option.action}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && filingContext === option.id ? 'Starting...' : 'Start Filing'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/filing-history')}
                className="flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Filing History</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/add-members')}
                className="flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Manage Family Members</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StartFiling;