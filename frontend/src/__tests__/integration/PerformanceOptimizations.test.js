// =====================================================
// INTEGRATION TESTS - PERFORMANCE OPTIMIZATIONS
// Tests React.memo, lazy loading, and other optimizations
// =====================================================

import React, { useState, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { performance } from 'perf_hooks';

// Import performance utilities
import {
  withPerformanceOptimization,
  useDebounce,
  useThrottle,
  useVirtualScroll,
  LazyImage,
  memoizedComponent
} from '../utils/performance';

// Mock component for testing
const MockExpensiveComponent = ({ items, onItemClick }) => {
  // Simulate expensive computation
  const expensiveValue = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div data-testid="expensive-component">
      <div data-testid="expensive-value">{expensiveValue}</div>
      {items.map(item => (
        <div
          key={item.id}
          data-testid={`item-${item.id}`}
          onClick={() => onItemClick(item)}
        >
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
};

// Test component with state changes
const TestComponent = () => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', value: 10 },
    { id: 2, name: 'Item 2', value: 20 }
  ]);

  const handleClick = () => setCount(prev => prev + 1);

  return (
    <div>
      <div data-testid="count">{count}</div>
      <button onClick={handleClick} data-testid="increment-btn">
        Increment
      </button>
      <MockExpensiveComponent items={items} onItemClick={() => {}} />
    </div>
  );
};

// Optimized version of the test component
const OptimizedTestComponent = withPerformanceOptimization(TestComponent, 'TestComponent');

describe('Performance Optimizations Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('withPerformanceOptimization', () => {
    test('should prevent unnecessary re-renders', () => {
      let renderCount = 0;

      const TrackedComponent = ({ data }) => {
        renderCount++;
        return <div data-testid="tracked">{data.value}</div>;
      };

      const OptimizedTrackedComponent = withPerformanceOptimization(TrackedComponent, 'TrackedComponent');

      const { rerender } = render(
        <OptimizedTrackedComponent data={{ value: 1 }} />
      );

      expect(renderCount).toBe(1);

      // Re-render with same props
      rerender(<OptimizedTrackedComponent data={{ value: 1 }} />);

      // Should not re-render due to memo
      expect(renderCount).toBe(1);

      // Re-render with different props
      rerender(<OptimizedTrackedComponent data={{ value: 2 }} />);

      // Should re-render now
      expect(renderCount).toBe(2);
    });
  });

  describe('useDebounce hook', () => {
    test('should debounce value changes', () => {
      const TestDebounceComponent = () => {
        const [value, setValue] = useState('');
        const debouncedValue = useDebounce(value, 500);

        return (
          <div>
            <input
              data-testid="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="debounced-value">{debouncedValue}</div>
          </div>
        );
      };

      render(<TestDebounceComponent />);

      const input = screen.getByTestId('input');
      const debouncedValue = screen.getByTestId('debounced-value');

      expect(debouncedValue).toHaveTextContent('');

      fireEvent.change(input, { target: { value: 'a' } });

      // Should not update immediately
      expect(debouncedValue).toHaveTextContent('');

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should update now
      expect(debouncedValue).toHaveTextContent('a');
    });
  });

  describe('useThrottle hook', () => {
    test('should throttle function calls', () => {
      const mockFn = jest.fn();

      const TestThrottleComponent = () => {
        const throttledFn = useThrottle(mockFn, 1000);

        return (
          <button data-testid="throttled-btn" onClick={throttledFn}>
            Click
          </button>
        );
      };

      render(<TestThrottleComponent />);

      const button = screen.getByTestId('throttled-btn');

      // Multiple clicks should only trigger once
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockFn).toHaveBeenCalledTimes(1);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Click again after throttle period
      fireEvent.click(button);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useVirtualScroll hook', () => {
    test('should render only visible items for large lists', () => {
      const largeItemList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: i * 10
      }));

      const TestVirtualScrollComponent = () => {
        const { visibleItems, containerProps, innerStyle } = useVirtualScroll(
          largeItemList,
          50, // item height
          500 // container height
        );

        return (
          <div {...containerProps} data-testid="virtual-container">
            <div style={innerStyle}>
              {visibleItems.map(item => (
                <div key={item.id} data-testid={`virtual-item-${item.id}`}>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<TestVirtualScrollComponent />);

      const container = screen.getByTestId('virtual-container');

      // Should only render visible items (around 10-12 items for 500px container with 50px items)
      const visibleItems = container.querySelectorAll('[data-testid^="virtual-item-"]');
      expect(visibleItems.length).toBeLessThan(50); // Much less than total 1000
      expect(visibleItems.length).toBeGreaterThan(0);
    });
  });

  describe('LazyImage component', () => {
    test('should load images lazily', () => {
      const TestLazyImageComponent = () => {
        const [isLoaded, setIsLoaded] = useState(false);

        return (
          <div>
            <LazyImage
              src="/test-image.jpg"
              alt="Test Image"
              placeholder="/placeholder.jpg"
              onLoad={() => setIsLoaded(true)}
              data-testid="lazy-image"
            />
            <div data-testid="loaded-status">{isLoaded ? 'loaded' : 'not loaded'}</div>
          </div>
        );
      };

      render(<TestLazyImageComponent />);

      const lazyImage = screen.getByTestId('lazy-image');
      const loadedStatus = screen.getByTestId('loaded-status');

      // Should show placeholder initially
      expect(lazyImage).toHaveAttribute('src', '/placeholder.jpg');
      expect(loadedStatus).toHaveTextContent('not loaded');

      // Simulate image load
      fireEvent.load(lazyImage);

      expect(loadedStatus).toHaveTextContent('loaded');
    });
  });

  describe('memoizedComponent utility', () => {
    test('should create memoized components correctly', () => {
      const BaseComponent = ({ name, value }) => {
        return (
          <div data-testid="base-component">
            {name}: {value}
          </div>
        );
      };

      const MemoizedComponent = memoizedComponent(BaseComponent, 'MemoizedComponent');

      const { rerender } = render(
        <MemoizedComponent name="Test" value={1} />
      );

      expect(screen.getByTestId('base-component')).toHaveTextContent('Test: 1');

      // Re-render with same props
      rerender(<MemoizedComponent name="Test" value={1} />);
      expect(screen.getByTestId('base-component')).toHaveTextContent('Test: 1');

      // Re-render with different props
      rerender(<MemoizedComponent name="Test" value={2} />);
      expect(screen.getByTestId('base-component')).toHaveTextContent('Test: 2');
    });
  });

  describe('Performance benchmarking', () => {
    test('should measure performance improvements', async () => {
      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000
      }));

      const TestPerformanceComponent = ({ items, useOptimization }) => {
        const Component = useOptimization
          ? withPerformanceOptimization(MockExpensiveComponent, 'MockExpensiveComponent')
          : MockExpensiveComponent;

        return <Component items={items} onItemClick={() => {}} />;
      };

      // Test without optimization
      const startTimeNoOpt = performance.now();
      render(<TestPerformanceComponent items={largeDataSet} useOptimization={false} />);
      const endTimeNoOpt = performance.now();
      const noOptTime = endTimeNoOpt - startTimeNoOpt;

      // Cleanup
      screen.getByTestId('expensive-component').remove();

      // Test with optimization
      const startTimeWithOpt = performance.now();
      render(<TestPerformanceComponent items={largeDataSet} useOptimization={true} />);
      const endTimeWithOpt = performance.now();
      const withOptTime = endTimeWithOpt - startTimeWithOpt;

      // Optimized version should be faster (or at least not significantly slower)
      expect(withOptTime).toBeLessThanOrEqual(noOptTime * 1.5); // Allow 50% tolerance
    });
  });

  describe('Bundle size optimization', () => {
    test('should support code splitting with dynamic imports', async () => {
      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: () => <div data-testid="lazy-loaded">Lazy Loaded Content</div>
        })
      );

      const TestCodeSplittingComponent = () => {
        const [showLazy, setShowLazy] = useState(false);

        return (
          <div>
            <button
              onClick={() => setShowLazy(true)}
              data-testid="load-lazy-btn"
            >
              Load Lazy Component
            </button>
            {showLazy && (
              <React.Suspense fallback={<div data-testid="fallback">Loading...</div>}>
                <LazyComponent />
              </React.Suspense>
            )}
          </div>
        );
      };

      render(<TestCodeSplittingComponent />);

      expect(screen.queryByTestId('lazy-loaded')).not.toBeInTheDocument();

      const loadButton = screen.getByTestId('load-lazy-btn');
      fireEvent.click(loadButton);

      // Should show fallback initially
      expect(screen.getByTestId('fallback')).toBeInTheDocument();

      // Should show lazy loaded content after Promise resolves
      await screen.findByTestId('lazy-loaded');
      expect(screen.getByTestId('lazy-loaded')).toHaveTextContent('Lazy Loaded Content');
    });
  });
});