// =====================================================
// BurnBlack Motion System — Framer Motion springs, variants, helpers
// =====================================================
export const springs = {
  snappy: { type: 'spring', stiffness: 500, damping: 35, mass: 1 },
  slide: { type: 'spring', stiffness: 400, damping: 40, mass: 1 },
  pop: { type: 'spring', stiffness: 600, damping: 25, mass: 0.8 },
  gentle: { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

export const m = (props) => (prefersReducedMotion() ? {} : props);

// ── Grid variants for FilingShell ──
export const shellVariants = {
  overview: { gridTemplateColumns: '1fr 0fr 0fr' },
  zoomed: { gridTemplateColumns: '48px 1fr 260px' },
};

// ── Editor panel ──
export const editorVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: springs.snappy },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

// ── Section slide (directional) ──
export const sectionSlide = {
  enter: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: springs.slide },
  exit: (d) => ({ x: d > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.12 } }),
};

// ── Checkmark pop ──
export const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: springs.pop },
};

// ── Stagger container ──
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};
