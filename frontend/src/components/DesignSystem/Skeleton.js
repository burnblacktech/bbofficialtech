// =====================================================
// SKELETON LOADING COMPONENTS
// Shimmer animation placeholders for loading states
// =====================================================

import { motion } from 'framer-motion';
import { cn } from '../../utils';

// Base shimmer animation - newUI.md Section 9.3.6
// Animation: shimmer 1.5s infinite
const shimmerVariants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 1.5, // 1.5s infinite - newUI.md Section 9.3.6
      ease: 'linear',
    },
  },
};

// =====================================================
// BASE SKELETON
// =====================================================
export const Skeleton = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
  ...props
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-xl',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  // Shimmer animation - newUI.md Section 9.3.6
  // Background: linear-gradient(90deg, Gray-200 0%, Gray-100 50%, Gray-200 100%)
  // Animation: shimmer 1.5s infinite
  // Background-size: 200% 100%
  return (
    <motion.div
      className={cn(
        'bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-300', // Gray-200, Gray-100, Gray-200
        'bg-[length:200%_100%]',
        roundedClasses[rounded],
        className,
      )}
      style={{ width, height }}
      variants={animate ? shimmerVariants : {}}
      initial="initial"
      animate={animate ? 'animate' : 'initial'}
      {...props}
    />
  );
};

// =====================================================
// SKELETON TEXT
// =====================================================
export const SkeletonText = ({
  lines = 1,
  className = '',
  lineHeight = '16px',
  gap = '8px',
  lastLineWidth = '75%',
  ...props
}) => {
  return (
    <div className={cn('flex flex-col', className)} style={{ gap }} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          className={cn(
            index === lines - 1 && lines > 1 ? '' : 'w-full',
          )}
          style={index === lines - 1 && lines > 1 ? { width: lastLineWidth } : {}}
          rounded="md"
        />
      ))}
    </div>
  );
};

// =====================================================
// SKELETON VALUE (Currency/Number)
// =====================================================
export const SkeletonValue = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: { height: '20px', width: '60px' },
    md: { height: '28px', width: '100px' },
    lg: { height: '36px', width: '140px' },
    xl: { height: '44px', width: '180px' },
  };

  return (
    <Skeleton
      className={cn('inline-block', className)}
      height={sizes[size].height}
      width={sizes[size].width}
      rounded="lg"
      {...props}
    />
  );
};

// =====================================================
// SKELETON CARD (For SectionCard)
// =====================================================
export const SkeletonCard = ({
  variant = 'summary', // 'glance' | 'summary' | 'detailed'
  className = '',
  ...props
}) => {
  if (variant === 'glance') {
    return (
      <div className={cn('w-[72px] h-[72px]', className)} {...props}>
        <Skeleton className="w-full h-full" rounded="xl" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('w-full max-w-[720px] p-6 bg-white rounded-2xl border border-slate-200', className)} {...props}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton width="48px" height="48px" rounded="xl" />
          <div className="flex-1">
            <Skeleton width="200px" height="24px" rounded="md" className="mb-2" />
            <Skeleton width="150px" height="16px" rounded="md" />
          </div>
          <Skeleton width="120px" height="36px" rounded="lg" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton width="80px" height="14px" rounded="md" className="mb-2" />
              <Skeleton width="100%" height="44px" rounded="xl" />
            </div>
            <div>
              <Skeleton width="100px" height="14px" rounded="md" className="mb-2" />
              <Skeleton width="100%" height="44px" rounded="xl" />
            </div>
          </div>
          <div>
            <Skeleton width="120px" height="14px" rounded="md" className="mb-2" />
            <Skeleton width="100%" height="44px" rounded="xl" />
          </div>
        </div>
      </div>
    );
  }

  // Summary variant (default)
  return (
    <div className={cn('w-[200px] min-h-[140px] p-4 bg-white rounded-xl border border-slate-200', className)} {...props}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton width="32px" height="32px" rounded="lg" />
        <Skeleton width="80px" height="16px" rounded="md" />
      </div>

      {/* Value */}
      <Skeleton width="120px" height="28px" rounded="lg" className="mb-2" />

      {/* Secondary */}
      <Skeleton width="80px" height="12px" rounded="md" />
    </div>
  );
};

// =====================================================
// SKELETON FORM
// =====================================================
export const SkeletonForm = ({
  fields = 4,
  columns = 2,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      {...props}
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className={index === fields - 1 && fields % columns !== 0 ? `col-span-${columns}` : ''}>
          <Skeleton width="80px" height="14px" rounded="md" className="mb-2" />
          <Skeleton width="100%" height="44px" rounded="xl" />
        </div>
      ))}
    </div>
  );
};

// =====================================================
// SKELETON AVATAR
// =====================================================
export const SkeletonAvatar = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  return (
    <Skeleton
      width={sizes[size]}
      height={sizes[size]}
      rounded="full"
      className={className}
      {...props}
    />
  );
};

// =====================================================
// SKELETON TABLE ROW
// =====================================================
export const SkeletonTableRow = ({
  columns = 4,
  className = '',
  ...props
}) => {
  const widths = ['30%', '25%', '20%', '15%', '10%'];

  return (
    <div
      className={cn('flex items-center gap-4 py-3', className)}
      {...props}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          height="16px"
          className="flex-shrink-0"
          style={{ width: widths[index % widths.length] }}
          rounded="md"
        />
      ))}
    </div>
  );
};

// =====================================================
// SKELETON TAX BAR
// =====================================================
export const SkeletonTaxBar = ({
  className = '',
  ...props
}) => {
  return (
    <div className={cn('h-[60px] bg-white border-b border-slate-200 px-6', className)} {...props}>
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
        {/* Flow items */}
        <div className="flex items-center gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div>
                <Skeleton width="40px" height="10px" rounded="md" className="mb-1" />
                <Skeleton width="80px" height="18px" rounded="md" />
              </div>
              {i < 3 && <Skeleton width="16px" height="16px" rounded="full" />}
            </div>
          ))}
        </div>

        {/* Result */}
        <Skeleton width="120px" height="36px" rounded="lg" />

        {/* Regime */}
        <Skeleton width="140px" height="36px" rounded="lg" />

        {/* Button */}
        <Skeleton width="120px" height="40px" rounded="xl" />
      </div>
    </div>
  );
};

// =====================================================
// SKELETON GRID (For Breathing Grid)
// =====================================================
export const SkeletonGrid = ({
  items = 6,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'grid gap-4 p-6 justify-center',
        className,
      )}
      style={{ gridTemplateColumns: 'repeat(auto-fill, 200px)' }}
      {...props}
    >
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <SkeletonCard variant="summary" />
        </motion.div>
      ))}
    </div>
  );
};

// =====================================================
// SKELETON PAGE (Full page loading)
// =====================================================
export const SkeletonPage = ({
  showHeader = true,
  showTaxBar = true,
  gridItems = 6,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('min-h-screen bg-slate-50', className)} {...props}>
      {/* Header */}
      {showHeader && (
        <div className="h-14 bg-white border-b border-slate-200 px-6">
          <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton width="32px" height="32px" rounded="lg" />
              <Skeleton width="200px" height="20px" rounded="md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton width="100px" height="36px" rounded="lg" />
              <Skeleton width="100px" height="36px" rounded="lg" />
            </div>
          </div>
        </div>
      )}

      {/* Tax Bar */}
      {showTaxBar && <SkeletonTaxBar />}

      {/* Grid */}
      <SkeletonGrid items={gridItems} />
    </div>
  );
};

// =====================================================
// SKELETON STAT CARD
// =====================================================
export const SkeletonStatCard = ({
  className = '',
  ...props
}) => {
  return (
    <div className={cn('p-4 bg-white rounded-xl border border-slate-200', className)} {...props}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton width="80px" height="14px" rounded="md" />
        <Skeleton width="32px" height="32px" rounded="lg" />
      </div>
      <Skeleton width="120px" height="32px" rounded="lg" />
    </div>
  );
};

// =====================================================
// LOADING SPINNER (Alternative to skeleton)
// =====================================================
export const LoadingSpinner = ({
  size = 'md',
  className = '',
  color = 'primary',
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'border-primary-500',
    white: 'border-white',
    slate: 'border-slate-500',
  };

  return (
    <motion.div
      className={cn(
        sizes[size],
        'border-2 border-t-transparent rounded-full',
        colors[color],
        className,
      )}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      {...props}
    />
  );
};

// =====================================================
// LOADING OVERLAY
// =====================================================
export const LoadingOverlay = ({
  visible = true,
  message = 'Loading...',
  className = '',
  ...props
}) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 bg-white/80 backdrop-blur-sm z-50',
        'flex flex-col items-center justify-center',
        className,
      )}
      {...props}
    >
      <LoadingSpinner size="xl" />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-body-regular font-medium text-slate-600"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default {
  Skeleton,
  SkeletonText,
  SkeletonValue,
  SkeletonCard,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonTableRow,
  SkeletonTaxBar,
  SkeletonGrid,
  SkeletonPage,
  SkeletonStatCard,
  LoadingSpinner,
  LoadingOverlay,
};

