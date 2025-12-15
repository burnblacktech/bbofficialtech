// =====================================================
// FOOTER COMPONENT - BOTTOM NAVIGATION & LINKS
// Clean footer with important links and copyright
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, FileText, Shield } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/help', state: { section: 'about' } },
      { name: 'Contact', path: '/help/contact' },
      { name: 'Careers', path: '/help', state: { section: 'careers' } },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/privacy', state: { section: 'cookies' } },
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Documentation', path: '/help', state: { section: 'docs' } },
      { name: 'Support', path: '/help/contact' },
    ],
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8">
          {/* Brand Section - Full width on mobile, spans 2 columns on tablet */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2.5 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-aurora-gradient rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm sm:text-base">BB</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">BurnBlack</span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 leading-relaxed max-w-sm">
              Simplifying tax filing for individuals and businesses across India.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:support@burnblack.com"
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-50"
                aria-label="Email Support"
              >
                <Mail className="h-5 w-5" />
              </a>
              <Link
                to="/help"
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-50"
                aria-label="Help Center"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              Company
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    state={link.state}
                    className="text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors inline-block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              Legal
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    state={link.state}
                    className="text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors inline-block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              Support
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    state={link.state}
                    className="text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors inline-block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 order-2 sm:order-1">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Secure & Encrypted</span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 text-center order-1 sm:order-2">
              © {currentYear} BurnBlack. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600 order-3">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

