import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useFilingStore from '../../store/useFilingStore';
import { m, springs, shellVariants } from '../../utils/motion';
import TimelineFull from './TimelineFull';
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
      variants={shellVariants}
      animate={mode}
      transition={springs.slide}
      style={{ gridTemplateColumns: isZoomed ? '48px 1fr 260px' : '1fr 0fr 0fr' }}
      {...m({ layout: true })}
    >
      <div className="filing-timeline">
        {isZoomed ? (
          <TimelineBreadcrumb filing={filing} />
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
