// =====================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// React.memo, useCallback, useMemo optimization patterns
// Code splitting and lazy loading utilities
// =====================================================

import React, { memo, useCallback, useMemo, lazy, Suspense } from 'react';

// Performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} rendered in ${renderTime}ms`);
    }

    // Track performance metrics
    if (window.gtag && renderTime > 100) {
      window.gtag('event', 'slow_render', {
        component_name: componentName,
        render_time: renderTime,
      });
    }

    startTime.current = endTime;
  });

  return {
    getRenderTime: () => Date.now() - startTime.current,
  };
};

// Optimized component HOC
export const withPerformanceOptimization = (WrappedComponent, componentName) => {
  const OptimizedComponent = memo(WrappedComponent, (prevProps, nextProps) => {
    // Custom comparison logic
    const keysToCompare = Object.keys(prevProps).filter(key =>
      key.startsWith('on') || typeof prevProps[key] === 'function',
    );

    // Check if all non-function props are equal
    for (const key of Object.keys(nextProps)) {
      if (!keysToCompare.includes(key) && prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  });

  const ComponentWithMonitor = (props) => {
    usePerformanceMonitor(componentName || WrappedComponent.name || 'Component');
    return <OptimizedComponent {...props} />;
  };

  ComponentWithMonitor.displayName = `withPerformance(${componentName || WrappedComponent.name})`;

  return ComponentWithMonitor;
};

// Optimized list component
export const OptimizedList = memo(({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items found',
  className = '',
}) => {
  const memoizedItems = useMemo(() => items, [items]);

  if (memoizedItems.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {memoizedItems.map(item => (
        <React.Fragment key={keyExtractor(item)}>
          {renderItem(item)}
        </React.Fragment>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.items.every((item, index) =>
      prevProps.keyExtractor(item) === nextProps.keyExtractor(nextProps.items[index]),
    ) &&
    prevProps.emptyMessage === nextProps.emptyMessage &&
    prevProps.className === nextProps.className
  );
});

// Lazy loading wrapper with error boundary
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preconfigured lazy components
export const LazyDashboard = createLazyComponent(
  () => import('../pages/Dashboard'),
  <div className="p-8 text-center">Loading Dashboard...</div>,
);

export const LazyITRForm = createLazyComponent(
  () => import('../pages/ITRForm'),
  <div className="p-8 text-center">Loading ITR Form...</div>,
);

export const LazyDocuments = createLazyComponent(
  () => import('../pages/Documents'),
  <div className="p-8 text-center">Loading Documents...</div>,
);

export const LazySettings = createLazyComponent(
  () => import('../pages/Settings'),
  <div className="p-8 text-center">Loading Settings...</div>,
);

// Route-based code splitting utilities
export const loadRouteComponent = (componentPath) => {
  return lazy(() => import(`../pages/${componentPath}`));
};

// Infinite scroll optimization
export const useInfiniteScroll = (callback, hasMore) => {
  const observer = React.useRef();
  const lastElementRef = React.useCallback(node => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      },
      {
        threshold: 1.0,
        rootMargin: '100px',
      },
    );

    if (node) observer.current.observe(node);
  }, [callback, hasMore]);

  return lastElementRef;
};

// Debounced search optimization
export const useDebounce = (callback, delay) => {
  const timeoutRef = React.useRef(null);

  const debouncedCallback = React.useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Virtual scrolling for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length,
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = React.useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    ...visibleItems,
    totalHeight: items.length * itemHeight,
    handleScroll,
  };
};

// Image lazy loading component
export const LazyImage = React.memo(({
  src,
  alt,
  className = '',
  placeholder = '/placeholder.png',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      img.src = src;
    }
  }, [isInView, src]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} {...props}>
      <img
        src={isLoaded ? src : placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-50'
        }`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Performance monitoring hook
export const useRenderCount = () => {
  const count = React.useRef(0);
  React.useEffect(() => {
    count.current += 1;
  });
  return count.current;
};

// Memoized fetch hook
export const useMemoizedFetch = (url, options = {}) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const memoizedOptions = useMemo(() => options, [options]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, memoizedOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, memoizedOptions]);

  React.useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url, fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Bundle size monitoring
export const useBundleSizeMonitor = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log bundle size information
      const perfData = window.performance;
      if (perfData && perfData.getEntriesByType) {
        const navigationEntries = perfData.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const navEntry = navigationEntries[0];
          console.log('📦 Bundle Performance:', {
            domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart),
            loadComplete: Math.round(navEntry.loadEventEnd - navEntry.loadEventStart),
            transferSize: navEntry.transferSize,
          });
        }
      }
    }
  }, []);

  return null;
};
