// =====================================================
// PRIVACY POLICY PAGE
// Privacy policy for BurnBlack platform
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const PrivacyPage = () => {

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/signup"
          className="inline-flex items-center text-gold-600 hover:text-gold-500 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign Up
        </Link>

        <div className="bg-white rounded-xl shadow-elevation-1 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center mr-4">
              <Lock className="w-6 h-6 text-info-600" />
            </div>
            <h1 className="text-display-md text-black">Privacy Policy</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-body-md text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">1. Information We Collect</h2>
              <p className="text-body-md text-slate-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>Personal identification information (name, email, phone, PAN)</li>
                <li>Financial information for ITR filing</li>
                <li>Document uploads related to your tax filing</li>
                <li>Usage data and preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">2. How We Use Your Information</h2>
              <p className="text-body-md text-slate-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>Process and file your Income Tax Returns</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Send you important updates about your filings</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">3. Data Security</h2>
              <p className="text-body-md text-slate-700 mb-4">
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Compliance with data protection regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">4. Data Sharing</h2>
              <p className="text-body-md text-slate-700 mb-4">
                We do not sell your personal information. We may share your information only:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>With government authorities as required for ITR filing</li>
                <li>With service providers who assist in our operations (under strict confidentiality)</li>
                <li>When required by law or legal process</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">5. Your Rights</h2>
              <p className="text-body-md text-slate-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">6. Cookies and Tracking</h2>
              <p className="text-body-md text-slate-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">7. Contact Us</h2>
              <p className="text-body-md text-slate-700 mb-4">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <Link to="/help/contact" className="text-gold-600 hover:text-gold-500">
                  our support center
                </Link>.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <Link
              to="/signup"
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors"
            >
              <Shield className="w-5 h-5 mr-2" />
              I Accept - Continue Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

