// =====================================================
// PERFORMANCE-OPTIMIZED COMPONENT EXAMPLE
// Demonstrates React.memo, useMemo, and useCallback patterns
// =====================================================

import React, { memo, useMemo, useCallback } from 'react';
import { usePerformanceMonitor } from '../../utils/performance';

const OptimizedComponent = memo(({
  title,
  description,
  items = [],
  onItemClick,
  className = ''
}) => {
  usePerformanceMonitor('OptimizedComponent');

  // Memoize expensive calculations
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      processed: true,
      label: item.name?.toUpperCase() || item.label,
      value: parseFloat(item.value || '0').toFixed(2)
    }));
  }, [items]);

  // Memoize event handlers
  const handleItemClick = useCallback((item) => {
    onItemClick?.(item);
  }, [onItemClick]);

  // Memoize computed values
  const totalValue = useMemo(() => {
    return processedItems.reduce((sum, item) => sum + parseFloat(item.value || 0), 0);
  }, [processedItems]);

  return (
    <div className={`optimized-component ${className}`}>
      <div className="component-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="items-container">
        {processedItems.map(item => (
          <div
            key={item.id}
            className="item"
            onClick={() => handleItemClick(item)}
          >
            <span className="item-label">{item.label}</span>
            <span className="item-value">₹{item.value}</span>
          </div>
        ))}
      </div>

      <div className="component-footer">
        <strong>Total: ₹{totalValue.toFixed(2)}</strong>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.className === nextProps.className &&
    prevProps.items.length === nextProps.items.length &&
    prevProps.items.every((item, index) =>
      item.id === nextProps.items[index]?.id &&
      item.name === nextProps.items[index]?.name &&
      item.value === nextProps.items[index]?.value
    )
  );
});

OptimizedComponent.displayName = 'OptimizedComponent';

export default OptimizedComponent;