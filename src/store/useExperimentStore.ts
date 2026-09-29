// Zustand state machine managing the sequential experiment progression, participant state, imagery responses, and in-memory recall scores.
import { create } from 'zustand';
import { RecallCompletionPayload } from '../components/RecallTest';
import { PalaceStudyCompletionPayload } from '../components/palace/PalaceScene';
import { LIST_A, LIST_B } from '../data/lists';
import { cryptoShuffle } from '../lib/shuffle';

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
  participantId: string | null;
  participantCode: string | null;
  imageryRatings: Record<number, number>;
  imageryScore: number | null;
  errorMessage: string | null;
  isSubmitting: boolean;

  // Shuffled word order per participant (prevents locus-word semantic pairing & serial-position confound)
  shuffledWordsA: string[];
  shuffledWordsB: string[];

  // Study and test metrics (stored in Zustand only, per Prompt 3/4 instructions)
  tabHiddenByPhase: Record<string, boolean>;
  recallResults: RecallCompletionPayload[];

  // Palace specific metrics
  palaceMode: 'guided' | 'freewalk' | null;
  tutorialDurationMs: number | null;
  palaceVisitsByLocus: Record<number, number>;
  palaceDwellMsByLocus: Record<number, number>;
  webglFallbackUsed: boolean;

  setStep: (step: ExperimentStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setParticipant: (id: string, code: string) => void;
  setImageryRating: (questionId: number, rating: number) => void;
  setImageryScore: (score: number) => void;
  setErrorMessage: (msg: string | null) => void;
  setIsSubmitting: (val: boolean) => void;
  setPhaseTabHidden: (phase: string, hidden: boolean) => void;
  recordRecallCompletion: (payload: RecallCompletionPayload) => void;
  initializeWordShuffles: () => void;
  recordPalaceMetrics: (payload: PalaceStudyCompletionPayload & { tutorialDurationMs: number }) => void;
  reset: () => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  currentStep: 'landing',
  participantId: null,
  participantCode: null,
  imageryRatings: {},
  imageryScore: null,
  errorMessage: null,
  isSubmitting: false,

  shuffledWordsA: LIST_A.map((w) => w.word),
  shuffledWordsB: LIST_B.map((w) => w.word),

  tabHiddenByPhase: {},
  recallResults: [],

  palaceMode: null,
  tutorialDurationMs: null,
  palaceVisitsByLocus: {},
  palaceDwellMsByLocus: {},
  webglFallbackUsed: false,

  setStep: (step: ExperimentStep) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = EXPERIMENT_STEPS.indexOf(currentStep);
    if (currentIndex < EXPERIMENT_STEPS.length - 1) {
      set({ currentStep: EXPERIMENT_STEPS[currentIndex + 1], errorMessage: null });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = EXPERIMENT_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: EXPERIMENT_STEPS[currentIndex - 1], errorMessage: null });
    }
  },

  setParticipant: (id: string, code: string) =>
    set({ participantId: id, participantCode: code }),

  setImageryRating: (questionId: number, rating: number) =>
    set((state) => ({
      imageryRatings: { ...state.imageryRatings, [questionId]: rating },
    })),

  setImageryScore: (score: number) => set({ imageryScore: score }),

  setErrorMessage: (msg: string | null) => set({ errorMessage: msg }),

  setIsSubmitting: (val: boolean) => set({ isSubmitting: val }),

  setPhaseTabHidden: (phase: string, hidden: boolean) =>
    set((state) => ({
      tabHiddenByPhase: { ...state.tabHiddenByPhase, [phase]: hidden },
    })),

  recordRecallCompletion: (payload: RecallCompletionPayload) =>
    set((state) => ({
      recallResults: [...state.recallResults, payload],
    })),

  initializeWordShuffles: () => {
    const shuffledA = cryptoShuffle(LIST_A).map((w) => w.word);
    const shuffledB = cryptoShuffle(LIST_B).map((w) => w.word);
    set({
      shuffledWordsA: shuffledA,
      shuffledWordsB: shuffledB,
    });
  },

  recordPalaceMetrics: (payload) =>
    set({
      palaceMode: payload.mode,
      tutorialDurationMs: payload.tutorialDurationMs,
      palaceVisitsByLocus: payload.visitsByLocus,
      palaceDwellMsByLocus: payload.dwellMsByLocus,
      webglFallbackUsed: payload.webglFallback,
    }),

  reset: () =>
    set({
      currentStep: 'landing',
      participantId: null,
      participantCode: null,
      imageryRatings: {},
      imageryScore: null,
      errorMessage: null,
      isSubmitting: false,
      shuffledWordsA: LIST_A.map((w) => w.word),
      shuffledWordsB: LIST_B.map((w) => w.word),
      tabHiddenByPhase: {},
      recallResults: [],
      palaceMode: null,
      tutorialDurationMs: null,
      palaceVisitsByLocus: {},
      palaceDwellMsByLocus: {},
      webglFallbackUsed: false,
    }),
}));
