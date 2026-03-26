/**
 * Landing Page - Redesigned with New Design System
 * Premium, conversion-focused design using Atomic Design components
 * Mobile-first, accessible, and performance-optimized
 */

import React, { memo, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Zap,
  Lock,
  Award,
} from 'lucide-react';
import landingService from '../../services/api/landingService';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import FilingEntrySelector from '../../components/organisms/FilingEntrySelector';
import { tokens } from '../../styles/tokens';

// Trust Indicators Component
const TrustIndicators = memo(({ stats, isLoading }) => {
  const statsData = stats?.data || {
    totalUsersFormatted: 'ITR-1 to 4',
    totalRefundsFormatted: 'Old & New',
    successRateFormatted: 'Real-time',
    supportAvailability: 'Free',
  };

  const indicators = [
    { icon: FileText, value: statsData.totalUsersFormatted, label: 'All Forms', color: tokens.colors.accent[600] },
    { icon: TrendingUp, value: statsData.totalRefundsFormatted, label: 'Regime Compare', color: tokens.colors.success[600] },
    { icon: CheckCircle, value: statsData.successRateFormatted, label: 'Computation', color: tokens.colors.accent[600] },
    { icon: Zap, value: statsData.supportAvailability, label: 'To Start', color: tokens.colors.info[600] },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: tokens.spacing.lg,
      marginTop: tokens.spacing['3xl'],
      width: '100%',
      maxWidth: '700px',
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      {indicators.map((item, index) => (
        <div
          key={index}
          style={{
            padding: tokens.spacing.md,
            textAlign: 'center',
            backgroundColor: tokens.colors.neutral.white,
            borderRadius: tokens.borderRadius.lg,
            border: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.sm,
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: `${item.color}15`,
            borderRadius: tokens.borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: tokens.spacing.sm,
          }}>
            <item.icon size={20} color={item.color} />
          </div>
          <div style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            color: item.color,
            marginBottom: tokens.spacing.xs,
          }}>
            {isLoading ? '---' : item.value}
          </div>
          <div style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[600],
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
});
TrustIndicators.displayName = 'TrustIndicators';

// Feature Card Component
const FeatureCard = memo(({ icon: Icon, title, description, color = tokens.colors.accent[600] }) => (
  <Card
    hoverable
    padding="xl"
    style={{
      textAlign: 'center',
      border: `1px solid ${tokens.colors.neutral[200]}`,
      height: '100%',
    }}
  >
    <div style={{
      width: '64px',
      height: '64px',
      backgroundColor: `${color}15`,
      borderRadius: tokens.borderRadius.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      marginBottom: tokens.spacing.lg,
    }}>
      <Icon size={32} color={color} />
    </div>
    <h3 style={{
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.semibold,
      marginBottom: tokens.spacing.md,
      color: tokens.colors.neutral[900],
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.neutral[600],
      lineHeight: tokens.typography.lineHeight.relaxed,
    }}>
      {description}
    </p>
  </Card>
));
FeatureCard.displayName = 'FeatureCard';

// Testimonial Card Component
const TestimonialCard = memo(({ stars, text, name, title }) => (
  <Card
    padding="lg"
    style={{
      backgroundColor: tokens.colors.neutral[50],
      border: `1px solid ${tokens.colors.neutral[200]}`,
      height: '100%',
    }}
  >
    <div style={{ display: 'flex', gap: tokens.spacing.xs, marginBottom: tokens.spacing.md }}>
      {[...Array(stars)].map((_, i) => (
        <Star key={i} size={20} fill={tokens.colors.accent[500]} color={tokens.colors.accent[500]} />
      ))}
    </div>
    <p style={{
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.neutral[700],
      marginBottom: tokens.spacing.lg,
      lineHeight: tokens.typography.lineHeight.relaxed,
    }}>
      "{text}"
    </p>
    <div>
      <div style={{
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.neutral[900],
      }}>
        {name}
      </div>
      <div style={{
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.neutral[500],
      }}>
        {title}
      </div>
    </div>
  </Card>
));
TestimonialCard.displayName = 'TestimonialCard';

const LandingPage = () => {
  const navigate = useNavigate();

  // Fetch stats and testimonials
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: landingService.getStats,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: landingService.getTestimonials,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  // SEO
  useEffect(() => {
    document.title = 'BurnBlack — Smart ITR Filing for Individuals | ITR-1 to ITR-4';
    const metaDescription = document.querySelector('meta[name="description"]');
    const description = 'File your Income Tax Return online. Guided filing for ITR-1 to ITR-4 with real-time tax computation, old vs new regime comparison, and ITD-format JSON download. Built for Indian taxpayers.';

    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, []);

  // Testimonials data
  const testimonials = useMemo(() => {
    if (testimonialsLoading || !testimonialsData?.data) {
      return [
        {
          stars: 5,
          text: 'The guided flow made it easy to understand which ITR form I need. Regime comparison saved me from picking the wrong one.',
          name: 'Early Access User',
          title: 'Salaried Professional',
        },
        {
          stars: 5,
          text: 'Finally a platform that explains tax computation step by step. I could see exactly how my tax was calculated.',
          name: 'Beta Tester',
          title: 'Freelancer',
        },
        {
          stars: 5,
          text: 'Clean interface, no clutter. I filed my ITR-1 without needing to call my CA for the first time.',
          name: 'Early Access User',
          title: 'IT Professional',
        },
      ];
    }
    return testimonialsData.data.map((t) => ({
      stars: t.stars || 5,
      text: t.text,
      name: t.name,
      title: t.title,
    }));
  }, [testimonialsData, testimonialsLoading]);

  const features = [
    {
      icon: FileText,
      title: 'Guided Filing',
      description: 'Plain-language questions that map to ITR fields. No jargon.',
      color: tokens.colors.accent[600],
    },
    {
      icon: TrendingUp,
      title: 'Regime Comparison',
      description: 'See old vs new regime side by side. Pick the one that saves more.',
      color: tokens.colors.success[600],
    },
    {
      icon: Shield,
      title: 'Accurate Computation',
      description: 'Slab-wise tax breakdown with rebate, surcharge, and cess.',
      color: tokens.colors.accent[600],
    },
    {
      icon: Zap,
      title: 'ITD-Format JSON',
      description: 'Download ITD-ready JSON for direct upload to the Income Tax portal.',
      color: tokens.colors.warning[600],
    },
    {
      icon: FileText,
      title: 'ITR-1 to ITR-4',
      description: 'Salary, capital gains, business, presumptive — all covered.',
      color: tokens.colors.info[600],
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your data stays encrypted. No sharing with third parties.',
      color: tokens.colors.accent[600],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tokens.colors.neutral.white }}>
      {/* Header */}
      <header style={{
        backgroundColor: tokens.colors.neutral.white,
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: tokens.zIndex.sticky,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#0f172a',
              borderRadius: tokens.borderRadius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: tokens.shadows.md,
              overflow: 'hidden',
            }}>
              <img src="/bb-logo.svg" alt="BurnBlack" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: tokens.typography.fontSize.xl,
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.colors.neutral[900],
                margin: 0,
              }}>
                BurnBlack
              </h1>
              <p style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.neutral[600],
                margin: 0,
              }}>
                Enterprise Tax Platform
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center' }}>
            <Link
              to="/login"
              style={{
                color: tokens.colors.neutral[600],
                textDecoration: 'none',
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Sign In
            </Link>
            <Button variant="primary" size="md" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: `linear-gradient(135deg, ${tokens.colors.accent[50]} 0%, ${tokens.colors.neutral.white} 100%)`,
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.xl} ${tokens.spacing['5xl']}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: tokens.spacing.md }}>
            <Badge variant="info">Smart ITR Filing Platform</Badge>
          </div>
          <h1 style={{
            fontSize: tokens.typography.fontSize['4xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing.md,
            lineHeight: tokens.typography.lineHeight.tight,
          }}>
            File Your ITR Online
          </h1>
          <p style={{
            fontSize: tokens.typography.fontSize.lg,
            color: tokens.colors.neutral[600],
            marginBottom: tokens.spacing.lg,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Guided filing for individuals. ITR-1 to ITR-4 with real-time tax computation and regime comparison.
          </p>

          {/* Trust Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: tokens.spacing.md,
            flexWrap: 'wrap',
            marginBottom: tokens.spacing.xl,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[500],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} color={tokens.colors.success[600]} />
              <span>Secure & Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={14} color={tokens.colors.success[600]} />
              <span>Bank-Grade Security</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} color={tokens.colors.success[600]} />
              <span>ITD-Format JSON</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: tokens.spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: tokens.spacing['2xl'],
          }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              File Now - Free
              <ArrowRight size={20} style={{ marginLeft: tokens.spacing.sm }} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              How It Works
            </Button>
          </div>

          {/* Trust Indicators */}
          <TrustIndicators stats={stats} isLoading={statsLoading} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.xl}`,
        backgroundColor: tokens.colors.neutral.white,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: tokens.spacing['3xl'] }}>
            <h2 style={{
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing.sm,
            }}>
              Why BurnBlack?
            </h2>
            <p style={{
              fontSize: tokens.typography.fontSize.base,
              color: tokens.colors.neutral[600],
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              Fast. Accurate. Maximum refunds.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: tokens.spacing.xl,
          }}>
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section style={{
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.xl}`,
        backgroundColor: tokens.colors.neutral[50],
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: tokens.typography.fontSize['3xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing.sm,
          }}>
            3 Simple Steps
          </h2>
          <p style={{
            fontSize: tokens.typography.fontSize.base,
            color: tokens.colors.neutral[600],
            marginBottom: tokens.spacing['2xl'],
          }}>
            Upload. Verify. Submit.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: tokens.spacing.lg,
            marginTop: tokens.spacing.xl,
          }}>
            <Card padding="lg" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: `${tokens.colors.accent[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
              }}>
                <FileText size={24} color={tokens.colors.accent[600]} />
              </div>
              <h3 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.xs,
              }}>
                1. Upload Form 16
              </h3>
              <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
              }}>
                AI auto-fills in seconds
              </p>
            </Card>

            <Card padding="lg" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: `${tokens.colors.success[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
              }}>
                <CheckCircle size={24} color={tokens.colors.success[600]} />
              </div>
              <h3 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.xs,
              }}>
                2. Verify & Optimize
              </h3>
              <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
              }}>
                Maximize your refund
              </p>
            </Card>

            <Card padding="lg" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: `${tokens.colors.info[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
              }}>
                <Award size={24} color={tokens.colors.info[600]} />
              </div>
              <h3 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.xs,
              }}>
                3. Submit & Track
              </h3>
              <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
              }}>
                Instant acknowledgment
              </p>
            </Card>
          </div>

          <div style={{ marginTop: tokens.spacing['2xl'] }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Start Now - Free
              <ArrowRight size={20} style={{ marginLeft: tokens.spacing.sm }} />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.xl}`,
        backgroundColor: tokens.colors.neutral.white,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: tokens.spacing['3xl'] }}>
            <h2 style={{
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing.md,
            }}>
              What Our Users Say
            </h2>
            <p style={{
              fontSize: tokens.typography.fontSize.lg,
              color: tokens.colors.neutral[600],
            }}>
              Join thousands of satisfied customers
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: tokens.spacing.xl,
          }}>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section style={{
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.xl}`,
        background: `linear-gradient(135deg, ${tokens.colors.accent[600]}, ${tokens.colors.accent[700]})`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: tokens.typography.fontSize['3xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral.white,
            marginBottom: tokens.spacing.md,
          }}>
            Start Filing Today
          </h2>
          <p style={{
            fontSize: tokens.typography.fontSize.lg,
            color: tokens.colors.accent[50],
            marginBottom: tokens.spacing['2xl'],
          }}>
            Free to start. No credit card required. File ITR-1 to ITR-4.
          </p>
          <div style={{
            display: 'flex',
            gap: tokens.spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: tokens.colors.neutral.white,
                color: tokens.colors.accent[600],
              }}
            >
              File Now - Free
              <ArrowRight size={20} style={{ marginLeft: tokens.spacing.sm }} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              style={{
                borderColor: tokens.colors.neutral.white,
                color: tokens.colors.neutral.white,
              }}
            >
              Talk to Expert
            </Button>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer style={{
        backgroundColor: tokens.colors.neutral[900],
        color: tokens.colors.neutral.white,
        padding: `${tokens.spacing['3xl']} ${tokens.spacing.xl}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: tokens.spacing.xl,
            marginBottom: tokens.spacing.xl,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: `linear-gradient(135deg, ${tokens.colors.accent[600]}, ${tokens.colors.accent[700]})`,
                  borderRadius: tokens.borderRadius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Shield size={20} color={tokens.colors.neutral.white} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    margin: 0,
                  }}>
                    BurnBlack
                  </h3>
                  <p style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.neutral[400],
                    margin: 0,
                  }}>
                    Enterprise Tax Platform
                  </p>
                </div>
              </div>
              <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[400],
                lineHeight: tokens.typography.lineHeight.relaxed,
              }}>
                Secure, intelligent, and user-friendly tax filing platform for individuals, CAs, and enterprises.
              </p>
            </div>

            <div>
              <h4 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.md,
              }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Features', 'Help Center', 'FAQs', 'Tools'].map((item) => (
                  <li key={item} style={{ marginBottom: tokens.spacing.sm }}>
                    <Link
                      to="#"
                      style={{
                        color: tokens.colors.neutral[400],
                        textDecoration: 'none',
                        fontSize: tokens.typography.fontSize.sm,
                      }}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.md,
              }}>
                Support
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Help Center', 'Contact Us', 'FAQs', 'Notifications'].map((item) => (
                  <li key={item} style={{ marginBottom: tokens.spacing.sm }}>
                    <Link
                      to="#"
                      style={{
                        color: tokens.colors.neutral[400],
                        textDecoration: 'none',
                        fontSize: tokens.typography.fontSize.sm,
                      }}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing.md,
              }}>
                Company
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Dashboard', 'Profile', 'Preferences', 'Help'].map((item) => (
                  <li key={item} style={{ marginBottom: tokens.spacing.sm }}>
                    <Link
                      to="#"
                      style={{
                        color: tokens.colors.neutral[400],
                        textDecoration: 'none',
                        fontSize: tokens.typography.fontSize.sm,
                      }}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: `1px solid ${tokens.colors.neutral[800]}`,
            paddingTop: tokens.spacing.lg,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[400],
              margin: 0,
            }}>
              © 2025 BurnBlack. All rights reserved.
            </p>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default memo(LandingPage);
