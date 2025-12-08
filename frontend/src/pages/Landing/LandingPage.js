/**
 * Public Landing Page - Marketing & Conversion Focused
 * Showcases BurnBlack platform value proposition
 * Optimized for performance and conversion
 */

import React, { memo, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  FileText,
  Bot,
  Building2,
  UserCheck,
  Loader2,
} from 'lucide-react';
import landingService from '../../services/api/landingService';

// Memoized components for better performance
const TrustIndicators = memo(({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="text-number-lg text-orange-500 animate-pulse">---</div>
            <div className="text-body-sm text-gray-600 animate-pulse">---</div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = stats?.data || {
    totalUsersFormatted: '10K+',
    totalRefundsFormatted: '₹50Cr+',
    successRateFormatted: '99.9%',
    supportAvailability: '24/7',
  };

  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-number-lg text-orange-500">{statsData.totalUsersFormatted}</div>
        <div className="text-body-sm text-gray-600">Users Trust Us</div>
      </div>
      <div className="text-center">
        <div className="text-number-lg text-orange-500">{statsData.totalRefundsFormatted}</div>
        <div className="text-body-sm text-gray-600">Refunds Generated</div>
      </div>
      <div className="text-center">
        <div className="text-number-lg text-orange-500">{statsData.successRateFormatted}</div>
        <div className="text-body-sm text-gray-600">Success Rate</div>
      </div>
      <div className="text-center">
        <div className="text-number-lg text-orange-500">{statsData.supportAvailability}</div>
        <div className="text-body-sm text-gray-600">Support</div>
      </div>
    </div>
  );
});
TrustIndicators.displayName = 'TrustIndicators';

const TestimonialCard = memo(({ stars, text, name, title }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <div className="flex items-center mb-4">
      {stars.map((_, i) => (
        <Star key={i} className="w-5 h-5 text-gold-500 fill-current" />
      ))}
    </div>
    <p className="text-body-md text-gray-600 mb-4">"{text}"</p>
    <div className="text-heading-sm">{name}</div>
    <div className="text-body-sm text-gray-500">{title}</div>
  </div>
));

const LandingPage = () => {
  // Fetch stats and testimonials using React Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: async () => {
      const response = await landingService.getStats();
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - stats don't change frequently
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
  });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: async () => {
      const response = await landingService.getTestimonials();
      return response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - testimonials change rarely
    cacheTime: 60 * 60 * 1000, // 1 hour cache
    retry: 2,
  });

  // SEO and performance optimizations
  useEffect(() => {
    // Set page title and meta description
    document.title = 'BurnBlack - Secure ITR Filing Made Simple | AI-Powered Tax Platform';

    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Experience the future of tax filing with BurnBlack. AI-powered insights, maximum refund optimization, and enterprise-grade security. Join thousands of users who trust BurnBlack for their ITR filing needs.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Experience the future of tax filing with BurnBlack. AI-powered insights, maximum refund optimization, and enterprise-grade security. Join thousands of users who trust BurnBlack for their ITR filing needs.';
      document.head.appendChild(meta);
    }

    // Add structured data for better SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'BurnBlack',
      'description': 'Secure ITR filing platform with AI-powered insights',
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Web',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'INR',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (scriptElement && scriptElement.textContent.includes('BurnBlack')) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  // Memoize testimonials data to prevent re-renders
  const testimonials = useMemo(() => {
    if (testimonialsLoading || !testimonialsData?.data) {
      // Fallback testimonials while loading
      return [
        {
          stars: [...Array(5)],
          text: 'BurnBlack made my tax filing so easy! The AI bot guided me through everything and I got a much higher refund than expected.',
          name: 'Rajesh Kumar',
          title: 'Software Engineer',
        },
        {
          stars: [...Array(5)],
          text: 'As a CA, BurnBlack has revolutionized how I handle client filings. The bulk processing feature saves me hours every day.',
          name: 'Priya Sharma',
          title: 'Chartered Accountant',
        },
        {
          stars: [...Array(5)],
          text: 'The security and compliance features give me peace of mind. I can trust BurnBlack with all my sensitive financial data.',
          name: 'Amit Patel',
          title: 'Business Owner',
        },
      ];
    }

    // Map API testimonials to component format
    return testimonialsData.data.map((testimonial) => ({
      stars: [...Array(testimonial.stars || 5)],
      text: testimonial.text,
      name: testimonial.name,
      title: testimonial.title,
    }));
  }, [testimonialsData, testimonialsLoading]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-burn-gradient rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-heading-lg text-black">BurnBlack</h1>
                <p className="text-body-sm text-gray-600">Enterprise Tax Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-black text-label-lg"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg text-label-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-br from-orange-50 via-orange-50/50 to-gold-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-display-lg text-black mb-6">
            Secure ITR Filing Made Simple
          </h1>
          <p className="text-body-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of tax filing with AI-powered insights, maximum refund optimization,
            and enterprise-grade security. Join thousands of users who trust BurnBlack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-orange-500 text-white px-8 py-4 rounded-lg text-heading-md hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center shadow-lg hover:shadow-xl"
              aria-label="Start your free trial with BurnBlack"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="#features"
              className="border border-orange-300 text-orange-600 px-8 py-4 rounded-lg text-heading-md hover:bg-orange-50 transition-all duration-200 transform hover:scale-105"
              aria-label="Learn more about BurnBlack features"
            >
              Learn More
            </Link>
          </div>

          {/* Trust Indicators */}
          <TrustIndicators stats={stats} isLoading={statsLoading} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-md text-black mb-4">
              Why Choose BurnBlack?
            </h2>
            <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for individuals, CAs, and enterprises
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-heading-lg mb-4">AI-Powered Filing</h3>
              <p className="text-body-md text-gray-600">
                Our intelligent CA Bot guides you through the entire filing process,
                ensuring accuracy and maximizing your refunds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="text-heading-lg mb-4">Maximum Refunds</h3>
              <p className="text-body-md text-gray-600">
                Advanced tax optimization algorithms ensure you claim every eligible
                deduction and credit for maximum refunds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-info-500" />
              </div>
              <h3 className="text-heading-lg mb-4">Bank-Grade Security</h3>
              <p className="text-body-md text-gray-600">
                Enterprise-grade encryption, secure document handling, and compliance
                with all regulatory requirements.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-heading-lg mb-4">Lightning Fast</h3>
              <p className="text-body-md text-gray-600">
                Complete your ITR filing in minutes, not hours. Our streamlined
                process saves you time and effort.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-warning-600" />
              </div>
              <h3 className="text-heading-lg mb-4">All ITR Forms</h3>
              <p className="text-body-md text-gray-600">
                Support for ITR-1, ITR-2, ITR-3, and ITR-4 with automatic form
                selection based on your income sources.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-info-600" />
              </div>
              <h3 className="text-heading-lg mb-4">Family Management</h3>
              <p className="text-body-md text-gray-600">
                File returns for your entire family from one account with
                centralized document management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-md text-black mb-4">
              Perfect for Everyone
            </h2>
            <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're an individual, CA, or enterprise, we have solutions for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Individual Users */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-heading-lg">Individual Users</h3>
              </div>
              <ul className="space-y-3 text-body-md text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Self-filing with AI guidance
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Family member management
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Document upload & storage
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Refund tracking
                </li>
              </ul>
              <Link
                to="/login"
                className="mt-6 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg text-label-lg hover:bg-orange-600 transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Chartered Accountants */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="text-heading-lg">Chartered Accountants</h3>
              </div>
              <ul className="space-y-3 text-body-md text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Client portfolio management
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Bulk filing capabilities
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Advanced tax computation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  E-signature integration
                </li>
              </ul>
              <Link
                to="/login"
                className="mt-6 inline-block bg-success-600 text-white px-6 py-2 rounded-lg text-label-lg hover:bg-success-600 transition-colors"
              >
                CA Dashboard
              </Link>
            </div>

            {/* Enterprises */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-info-600" />
                </div>
                <h3 className="text-heading-lg">Enterprises</h3>
              </div>
              <ul className="space-y-3 text-body-md text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Multi-user management
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Advanced reporting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  API integrations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                  Dedicated support
                </li>
              </ul>
              <Link
                to="/login"
                className="mt-6 inline-block bg-info-600 text-white px-6 py-2 rounded-lg text-label-lg hover:bg-info-600 transition-colors"
              >
                Enterprise Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-md text-black mb-4">
              What Our Users Say
            </h2>
            <p className="text-body-lg text-gray-600">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                stars={testimonial.stars}
                text={testimonial.text}
                name={testimonial.name}
                title={testimonial.title}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-display-md text-white mb-4">
            Ready to Transform Your Tax Filing?
          </h2>
          <p className="text-body-lg text-orange-50 mb-8">
            Join thousands of users who have already made the switch to BurnBlack.
            Start your free trial today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg text-heading-md hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center shadow-lg hover:shadow-xl"
              aria-label="Start your free trial with BurnBlack"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="border border-orange-300 text-white px-8 py-4 rounded-lg text-heading-md hover:bg-orange-600 transition-all duration-200 transform hover:scale-105"
              aria-label="Schedule a demo with BurnBlack"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-heading-md text-white">BurnBlack</h3>
                  <p className="text-body-sm text-gray-400">Enterprise Tax Platform</p>
                </div>
              </div>
              <p className="text-body-sm text-gray-400">
                Secure, intelligent, and user-friendly tax filing platform for individuals,
                CAs, and enterprises.
              </p>
            </div>

            <div>
              <h4 className="text-heading-sm text-white mb-4">Product</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link to="#features" className="text-gray-400 hover:text-orange-500 transition-colors">Features</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-orange-500 transition-colors">Help Center</Link></li>
                <li><Link to="/help/faqs" className="text-gray-400 hover:text-orange-500 transition-colors">FAQs</Link></li>
                <li><Link to="/tools" className="text-gray-400 hover:text-orange-500 transition-colors">Tools</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-heading-sm text-white mb-4">Support</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link to="/help" className="text-gray-400 hover:text-orange-500 transition-colors">Help Center</Link></li>
                <li><Link to="/help/contact" className="text-gray-400 hover:text-orange-500 transition-colors">Contact Us</Link></li>
                <li><Link to="/help/faqs" className="text-gray-400 hover:text-orange-500 transition-colors">FAQs</Link></li>
                <li><Link to="/notifications" className="text-gray-400 hover:text-orange-500 transition-colors">Notifications</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-heading-sm text-white mb-4">Company</h4>
              <ul className="space-y-2 text-body-sm text-gray-400">
                <li><Link to="/dashboard" className="text-gray-400 hover:text-orange-500 transition-colors">Dashboard</Link></li>
                <li><Link to="/profile" className="text-gray-400 hover:text-orange-500 transition-colors">Profile</Link></li>
                <li><Link to="/preferences" className="text-gray-400 hover:text-orange-500 transition-colors">Preferences</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-orange-500 transition-colors">Help</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-black-800 mt-8 pt-8 text-center text-body-sm text-gray-400">
            <p>&copy; 2024 BurnBlack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Memoize the entire component for better performance
export default memo(LandingPage);
