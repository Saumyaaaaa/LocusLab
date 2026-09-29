// Zustand state machine managing the sequential progression of steps through the Locus Lab experiment.
import { create } from 'zustand';

export type ExperimentStep =
  | 'landing'
  | 'consent'
  | 'imagery'
  | 'studyFirst'
  | 'studySecond'
  | 'distractor'
  | 'immediateTest'
  | 'sessionDone'
  | 'test24h'
  | 'test7d'
  | 'results';

export const EXPERIMENT_STEPS: readonly ExperimentStep[] = [
  'landing',
  'consent',
  'imagery',
  'studyFirst',
  'studySecond',
  'distractor',
  'immediateTest',
  'sessionDone',
  'test24h',
  'test7d',
  'results',
] as const;

export const STEP_LABELS: Record<ExperimentStep, string> = {
  landing: 'Welcome',
  consent: 'Consent',
  imagery: 'Mental Imagery',
  studyFirst: 'Study Phase 1',
  studySecond: 'Study Phase 2',
  distractor: 'Task Break',
  immediateTest: 'Immediate Recall',
  sessionDone: 'Day 1 Complete',
  test24h: '24-Hour Recall',
  test7d: '7-Day Recall',
  results: 'Your Results',
};

interface ExperimentState {
  currentStep: ExperimentStep;
  setStep: (step: ExperimentStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  currentStep: 'landing',

  setStep: (step: ExperimentStep) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = EXPERIMENT_STEPS.indexOf(currentStep);
    if (currentIndex < EXPERIMENT_STEPS.length - 1) {
      set({ currentStep: EXPERIMENT_STEPS[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = EXPERIMENT_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: EXPERIMENT_STEPS[currentIndex - 1] });
    }
  },

  reset: () => set({ currentStep: 'landing' }),
}));
