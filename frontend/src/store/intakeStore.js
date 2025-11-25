import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useIntakeStore = create(
  persist(
    (set, get) => ({
      // Intake data state
      currentIntakeId: null,
      currentIntakeData: null,
      intakes: [],
      isLoading: false,
      error: null,

      // Set current intake
      setCurrentIntake: (intakeId, intakeData) => {
        set({
          currentIntakeId: intakeId,
          currentIntakeData: intakeData,
        });
      },

      // Clear current intake
      clearCurrentIntake: () => {
        set({
          currentIntakeId: null,
          currentIntakeData: null,
        });
      },

      // Add intake to list
      addIntake: (intake) => {
        set((state) => ({
          intakes: [...state.intakes, intake],
        }));
      },

      // Update intake
      updateIntake: (intakeId, updates) => {
        set((state) => ({
          intakes: state.intakes.map(intake =>
            intake.intake_id === intakeId
              ? { ...intake, ...updates }
              : intake,
          ),
          currentIntakeData: state.currentIntakeId === intakeId
            ? { ...state.currentIntakeData, ...updates }
            : state.currentIntakeData,
        }));
      },

      // Remove intake
      removeIntake: (intakeId) => {
        set((state) => ({
          intakes: state.intakes.filter(intake => intake.intake_id !== intakeId),
          currentIntakeId: state.currentIntakeId === intakeId ? null : state.currentIntakeId,
          currentIntakeData: state.currentIntakeId === intakeId ? null : state.currentIntakeData,
        }));
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          currentIntakeId: null,
          currentIntakeData: null,
          intakes: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'intake-storage',
      partialize: (state) => ({
        currentIntakeId: state.currentIntakeId,
        currentIntakeData: state.currentIntakeData,
        intakes: state.intakes,
      }),
    },
  ),
);

export { useIntakeStore };
