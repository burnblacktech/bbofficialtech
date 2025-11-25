import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useIntakeStore = create(
  persist(
    (set, get) => ({
      // State
      currentIntakeData: null,
      intakeHistory: [],
      currentStep: 1,
      totalSteps: 5,

      // Actions
      setIntakeData: (data) => {
        set({ currentIntakeData: data });
      },

      updateIntakeData: (updates) => {
        set(state => ({
          currentIntakeData: {
            ...state.currentIntakeData,
            ...updates,
          },
        }));
      },

      nextStep: () => {
        set(state => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        }));
      },

      previousStep: () => {
        set(state => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        }));
      },

      saveIntakeData: () => {
        const { currentIntakeData } = get();
        if (currentIntakeData) {
          set(state => ({
            intakeHistory: [...state.intakeHistory, {
              ...currentIntakeData,
              id: Date.now(),
              savedAt: new Date().toISOString(),
            }],
          }));
        }
      },

      clearIntakeData: () => {
        set({
          currentIntakeData: null,
          currentStep: 1,
        });
      },
    }),
    {
      name: 'intake-storage',
    },
  ),
);

export default useIntakeStore;
