// =====================================================
// WEB VITALS TRACKING
// Performance monitoring using Web Vitals API
// =====================================================

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Send metrics to analytics endpoint
 */
const sendToAnalytics = (metric) => {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Send to backend analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true, // Ensure request completes even if page unloads
    }).catch((error) => {
      console.warn('Failed to send web vitals:', error);
    });
  } else {
    // Log in development
    console.log('Web Vital:', metric.name, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
};

/**
 * Initialize Web Vitals tracking
 */
export const initWebVitals = () => {
  // Core Web Vitals (LCP, FID, CLS)
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
  // Note: INP (Interaction to Next Paint) is available in newer versions
  // If your web-vitals version supports it, uncomment:
  // getINP(sendToAnalytics);

  console.log('Web Vitals tracking initialized');
};

/**
 * Get performance budget thresholds
 */
export const getPerformanceBudgets = () => ({
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
});

/**
 * Check if metric meets performance budget
 */
export const checkPerformanceBudget = (metricName, value) => {
  const budgets = getPerformanceBudgets();
  const budget = budgets[metricName];

  if (!budget) return 'unknown';

  if (value <= budget.good) return 'good';
  if (value <= budget.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Get performance score based on all metrics
 */
export const getPerformanceScore = (metrics) => {
  const budgets = getPerformanceBudgets();
  let score = 0;
  let total = 0;

  Object.entries(metrics).forEach(([name, value]) => {
    const budget = budgets[name];
    if (!budget) return;

    total += 1;
    if (value <= budget.good) {
      score += 1;
    } else if (value <= budget.needsImprovement) {
      score += 0.5;
    }
  });

  return total > 0 ? Math.round((score / total) * 100) : 0;
};

export default {
  initWebVitals,
  getPerformanceBudgets,
  checkPerformanceBudget,
  getPerformanceScore,
};

