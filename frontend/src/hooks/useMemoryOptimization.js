import React, { useEffect, useCallback, useMemo, useState } from 'react';

// Memory optimization hook
export const useMemoryOptimization = () => {
  const optimizeMemory = useCallback(() => {
    // Clear any unused event listeners
    if (typeof window !== 'undefined') {
      // Clear any global variables that might be holding references
      if (window.tempData) {
        delete window.tempData;
      }

      // Force garbage collection if available (Chrome DevTools)
      if (window.gc) {
        window.gc();
      }
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      optimizeMemory();
    };
  }, [optimizeMemory]);

  return { optimizeMemory };
};

// Debounced hook to prevent excessive re-renders
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized component wrapper
export const MemoizedComponent = React.memo(({ children, ...props }) => {
  return children;
});

// Lazy loading hook
export const useLazyLoad = (importFn) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadComponent = useCallback(async () => {
    if (!Component && !loading) {
      setLoading(true);
      try {
        const module = await importFn();
        setComponent(() => module.default || module);
      } catch (error) {
        console.error('Failed to load component:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [Component, loading, importFn]);

  return { Component, loading, loadComponent };
};

// Memory monitoring hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
        });
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

export default {
  useMemoryOptimization,
  useDebounce,
  MemoizedComponent,
  useLazyLoad,
  useMemoryMonitor,
};
