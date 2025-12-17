// =====================================================
// TERMS OF SERVICE PAGE
// Legal terms and conditions for BurnBlack platform
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

const TermsPage = () => {
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
            <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-gold-600" />
            </div>
            <h1 className="text-display-md text-black">Terms of Service</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-body-md text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">1. Acceptance of Terms</h2>
              <p className="text-body-md text-slate-700 mb-4">
                By accessing and using BurnBlack, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">2. Use License</h2>
              <p className="text-body-md text-slate-700 mb-4">
                Permission is granted to temporarily use BurnBlack for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-body-md text-slate-700 space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">3. Data Security and Privacy</h2>
              <p className="text-body-md text-slate-700 mb-4">
                Your data will be securely stored and used only for ITR filing purposes. We comply with all applicable tax and data protection laws, including the Income Tax Act and IT Act 2000.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">4. Accuracy of Information</h2>
              <p className="text-body-md text-slate-700 mb-4">
                You are responsible for the accuracy of information provided. While we provide tools and guidance, you are ultimately responsible for ensuring your tax return is accurate and complete.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">5. Disclaimer</h2>
              <p className="text-body-md text-slate-700 mb-4">
                The materials on BurnBlack are provided on an 'as is' basis. We recommend consulting a Chartered Accountant for complex tax situations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">6. Limitations</h2>
              <p className="text-body-md text-slate-700 mb-4">
                In no event shall BurnBlack or its suppliers be liable for any damages arising out of the use or inability to use the materials on BurnBlack.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-heading-lg text-black mb-4">7. Contact Information</h2>
              <p className="text-body-md text-slate-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at{' '}
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

export default TermsPage;

