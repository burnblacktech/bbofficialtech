import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sectionSlide, m } from '../../utils/motion';
import useFilingStore from '../../store/useFilingStore';
import useFilingSaveMutation, { getITRType } from '../../hooks/useFilingSaveMutation';
import ErrorBoundary from '../../components/ErrorBoundary';
import { getWhispersForSection, generateWhispers } from '../../utils/taxBrain';
import { useAuth } from '../../contexts/AuthContext';

import PersonalInfoEditor from './ITR1/editors/PersonalInfoEditor';
import SalaryEditor from './ITR1/editors/SalaryEditor';
import HousePropertyEditor from './ITR1/editors/HousePropertyEditor';
import OtherIncomeEditor from './ITR1/editors/OtherIncomeEditor';
import CapitalGainsEditor from './ITR1/editors/CapitalGainsEditor';
import BusinessEditor from './ITR1/editors/BusinessEditor';
import ForeignIncomeEditor from './ITR1/editors/ForeignIncomeEditor';
import DeductionsEditor from './ITR1/editors/DeductionsEditor';
import BankEditor from './ITR1/editors/BankEditor';

/* eslint-disable camelcase */
const EDITOR_MAP = {
  personalInfo: PersonalInfoEditor,
  salary: SalaryEditor,
  house_property: HousePropertyEditor,
  other: OtherIncomeEditor,
  capital_gains: CapitalGainsEditor,
  business: BusinessEditor,
  foreign: ForeignIncomeEditor,
  deductions: DeductionsEditor,
  bank: BankEditor,
};
/* eslint-enable camelcase */

const SECTION_ORDER = [
  'personalInfo', 'salary', 'house_property', 'other',
  'capital_gains', 'business', 'foreign', 'deductions', 'bank',
];

export default function EditorSlot({ filingId, filing }) {
  const { user } = useAuth();
  const { zoomedSection, activeSources, selectedRegime, computation } = useFilingStore();
  const saveMut = useFilingSaveMutation(filingId);
  const prevRef = useRef(null);

  // Direction: positive = forward, negative = backward
  const prevIdx = SECTION_ORDER.indexOf(prevRef.current);
  const curIdx = SECTION_ORDER.indexOf(zoomedSection);
  const direction = curIdx >= prevIdx ? 1 : -1;

  // Update previous section tracker
  if (zoomedSection !== prevRef.current) {
    prevRef.current = zoomedSection;
  }

  if (!zoomedSection) return null;

  const Editor = EDITOR_MAP[zoomedSection];
  if (!Editor) return null;

  const itrType = getITRType(activeSources, filing?.jsonPayload);
  const whispers = generateWhispers(filing?.jsonPayload, computation, selectedRegime);

  const commonProps = {
    payload: filing?.jsonPayload,
    filing,
    selectedRegime,
    onSave: saveMut.mutateAsync,
    isSaving: saveMut.isPending,
    activeSources,
    computation,
    itrType,
    whispers: getWhispersForSection(whispers, zoomedSection),
  };

  const extraProps = {};
  if (zoomedSection === 'personalInfo') {
    extraProps.user = user;
    extraProps.userProfile = null;
  }
  if (zoomedSection === 'deductions') {
    extraProps.onUploadProof = () => {}; // TODO: wire to import modal
  }

  return (
    <AnimatePresence mode="popLayout" custom={direction}>
      <motion.div
        key={zoomedSection}
        custom={direction}
        variants={sectionSlide}
        initial="enter"
        animate="center"
        exit="exit"
        {...m({ style: { width: '100%' } })}
      >
        <ErrorBoundary>
          <Editor {...commonProps} {...extraProps} />
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}
