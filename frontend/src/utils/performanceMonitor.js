// =====================================================
// PERFORMANCE MONITORING
// Comprehensive performance tracking and reporting
// =====================================================

/**
 * Performance monitoring utilities
 */

// Performance marks and measures
const marks = new Map();
const measures = new Map();

/**
 * Mark a performance point
 */
export const mark = (name) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
    marks.set(name, performance.now());
  }
};

/**
 * Measure performance between two marks
 */
export const measure = (name, startMark, endMark) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        measures.set(name, measure.duration);
        return measure.duration;
      }
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
    }
  }
  return null;
};

/**
 * Get all performance marks
 */
export const getMarks = () => {
  return Array.from(marks.entries());
};

/**
 * Get all performance measures
 */
export const getMeasures = () => {
  return Array.from(measures.entries());
};

/**
 * Get navigation timing
 */
export const getNavigationTiming = () => {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ssl: navigation.secureConnectionStart
          ? navigation.connectEnd - navigation.secureConnectionStart
          : 0,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domComplete - navigation.domInteractive,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart,
      };
    }
  }
  return null;
};

/**
 * Get resource timing
 */
export const getResourceTiming = () => {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    return resources.map((resource) => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize,
      startTime: resource.startTime,
    }));
  }
  return [];
};

/**
 * Get largest contentful paint
 */
export const getLCP = async () => {
  if (typeof PerformanceObserver !== 'undefined') {
    return new Promise((resolve) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve({
            value: lastEntry.renderTime || lastEntry.loadTime,
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported:', error);
        resolve(null);
      }
    });
  }
  return null;
};

/**
 * Get first input delay
 */
export const getFID = () => {
  if (typeof PerformanceObserver !== 'undefined') {
    return new Promise((resolve) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            resolve({
              value: entry.processingStart - entry.startTime,
              eventType: entry.name,
              target: entry.target?.tagName,
            });
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported:', error);
        resolve(null);
      }
    });
  }
  return null;
};

/**
 * Get cumulative layout shift
 */
export const getCLS = () => {
  if (typeof PerformanceObserver !== 'undefined') {
    return new Promise((resolve) => {
      try {
        let clsValue = 0;
        let clsEntries = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push({
                value: entry.value,
                sources: entry.sources?.map((source) => ({
                  node: source.node?.tagName,
                  previousRect: source.previousRect,
                  currentRect: source.currentRect,
                })),
              });
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Resolve after page load
        window.addEventListener('load', () => {
          setTimeout(() => {
            resolve({
              value: clsValue,
              entries: clsEntries,
            });
          }, 1000);
        });
      } catch (error) {
        console.warn('CLS observer not supported:', error);
        resolve(null);
      }
    });
  }
  return null;
};

/**
 * Report performance metrics
 */
export const reportPerformance = async () => {
  const metrics = {
    navigation: getNavigationTiming(),
    resources: getResourceTiming(),
    marks: getMarks(),
    measures: getMeasures(),
    lcp: await getLCP(),
    fid: await getFID(),
    cls: await getCLS(),
  };

  // Send to analytics
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...metrics,
        url: window.location.href,
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch((error) => {
      console.warn('Failed to report performance:', error);
    });
  } else {
    console.log('Performance Metrics:', metrics);
  }

  return metrics;
};

export default {
  mark,
  measure,
  getMarks,
  getMeasures,
  getNavigationTiming,
  getResourceTiming,
  getLCP,
  getFID,
  getCLS,
  reportPerformance,
};

