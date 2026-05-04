import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useFilingStore from '../../store/useFilingStore';
import { m, springs, shellVariants } from '../../utils/motion';
import TimelineFull from './TimelineFull';
import TimelineMobile from './TimelineMobile';
import TimelineBreadcrumb from './TimelineBreadcrumb';
import EditorSlot from './EditorSlot';
import TaxBar from './TaxBar';
import { computeProgress } from '../../utils/progressScorer';
import './FilingShell.css';

export default function FilingShell({ filingId, filing }) {
  const zoomedSection = useFilingStore((s) => s.zoomedSection);
  const zoomOut = useFilingStore((s) => s.zoomOut);
  const computation = useFilingStore((s) => s.computation);
  const isZoomed = zoomedSection !== null;

  const progress = computeProgress(filing?.jsonPayload, filing?.itrType);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Escape key → zoom out
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isZoomed) zoomOut();
    },
    [isZoomed, zoomOut],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const mode = isZoomed ? 'zoomed' : 'overview';

  return (
    <motion.div
      className={`filing-shell filing-shell--${mode}`}
      {...m({
        variants: shellVariants,
        animate: mode,
        transition: springs.slide,
      })}
    >
      <div className="filing-timeline">
        {isZoomed ? (
          <TimelineBreadcrumb filing={filing} />
        ) : isMobile ? (
          <TimelineMobile filing={filing} computation={computation} />
        ) : (
          <TimelineFull filing={filing} computation={computation} />
        )}
      </div>

      <div className="filing-editor">
        {isZoomed && <EditorSlot filingId={filingId} filing={filing} />}
      </div>

      <div className="filing-taxbar">
        {isZoomed && <TaxBar filingId={filingId} filing={filing} />}
      </div>

      {/* Mobile bottom nav when zoomed */}
      {isMobile && isZoomed && (
        <div className="mobile-bottom-nav">
          <button className="ds-btn ds-btn-sm ds-btn-ghost" onClick={zoomOut}>← Back</button>
          <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{progress?.percentage ?? 0}%</span>
          <button className="ds-btn ds-btn-sm ds-btn-primary" onClick={() => {}}>Next →</button>
        </div>
      )}

      <div className="filing-progress">
        <span>{progress?.percentage ?? 0}% complete</span>
        <div className="filing-progress__bar">
          <div
            className="filing-progress__fill"
            style={{ width: `${progress?.percentage ?? 0}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
