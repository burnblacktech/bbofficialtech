import { create } from 'zustand';

/* eslint-disable camelcase */
const DEFAULT_STEPS = {
  pan_verified: false,
  income_logged: false,
  document_uploaded: false,
  filing_started: false,
};
/* eslint-enable camelcase */

const useOnboardingStore = create((set) => ({
  steps: { ...DEFAULT_STEPS },
  dismissedAt: null,

  /** Mark a single onboarding step as complete */
  markComplete: (stepKey) =>
    set((state) => ({
      steps: { ...state.steps, [stepKey]: true },
    })),

  /** Dismiss the onboarding checklist */
  dismiss: () => set({ dismissedAt: new Date().toISOString() }),

  /** Hydrate from backend profile data */
  hydrate: (onboardingData) => {
    if (!onboardingData) return;
    set({
      steps: { ...DEFAULT_STEPS, ...onboardingData.steps },
      dismissedAt: onboardingData.dismissedAt || null,
    });
  },

  /** Reset to defaults */
  reset: () => set({ steps: { ...DEFAULT_STEPS }, dismissedAt: null }),
}));

export default useOnboardingStore;
