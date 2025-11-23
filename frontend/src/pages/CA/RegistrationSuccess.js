// =====================================================
// CA REGISTRATION SUCCESS PAGE
// Confirmation page for independent CA registration
// =====================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Mail,
  Clock,
  Users,
  Shield,
  ArrowRight,
  FileText,
  Phone,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Button, Card } from '../../components/UI';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);

  const { applicationId, estimatedReviewTime } = location.state || {
    applicationId: 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    estimatedReviewTime: '24-48 hours'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TaxFile Pro</span>
            </div>
            <Button variant="outline" onClick={handleRedirect}>
              Go to Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Registration Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600">
            Your CA practice registration has been received and is under review
          </p>
        </div>

        {/* Application Details */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Application Details</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <Clock className="w-4 h-4 mr-1" />
              Under Review
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="font-semibold text-gray-900">{applicationId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Review Time</p>
                <p className="font-semibold text-gray-900">{estimatedReviewTime}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status Updates</p>
                <p className="font-semibold text-gray-900">Will be sent to your email</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Steps</p>
                <p className="font-semibold text-gray-900">Wait for approval email</p>
              </div>
            </div>
          </div>
        </Card>

        {/* What Happens Next */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Confirmation</h3>
            <p className="text-sm text-gray-600">
              You'll receive a confirmation email with your application details
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Verification Process</h3>
            <p className="text-sm text-gray-600">
              Our team will verify your documents and CA credentials
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Account Activation</h3>
            <p className="text-sm text-gray-600">
              Once approved, you'll receive login credentials via email
            </p>
          </Card>
        </div>

        {/* Important Information */}
        <Card className="p-6 bg-blue-50 border-blue-200 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep your Application ID safe for future reference</li>
                <li>• Check your email regularly for updates (including spam folder)</li>
                <li>• Ensure all submitted documents are clear and legible</li>
                <li>• You'll be contacted if additional information is required</li>
                <li>• Average approval time is {estimatedReviewTime}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Benefits Preview */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get After Approval</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Client Management Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Advanced ITR Filing Tools</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Staff Management System</span>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-gray-700">Analytics & Reporting</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-700">Automated Reminders</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-red-600" />
              <span className="text-gray-700">Priority Support</span>
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to help you through the approval process
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              support@taxfilepro.com
            </Button>
            <Button variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              +91 8080 123 456
            </Button>
          </div>
        </Card>

        {/* Auto-redirect notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Redirecting to login page in <span className="font-semibold">{countdown}</span> seconds...
          </p>
          <Button
            variant="link"
            onClick={handleRedirect}
            className="mt-2"
          >
            Go to Login Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600">
            © 2024 TaxFile Pro. All rights reserved. |
            <a href="#" className="text-blue-600 hover:underline ml-1">Privacy Policy</a> |
            <a href="#" className="text-blue-600 hover:underline ml-1">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationSuccess;