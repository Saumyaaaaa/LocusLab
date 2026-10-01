import { describe, it, expect, beforeEach } from 'vitest';
import { useExperimentStore } from '../store/useExperimentStore';
import { PALACE_LOCI } from '../data/loci';

describe('Session Length & Navigation Logic', () => {
  beforeEach(() => {
    useExperimentStore.getState().reset();
  });

  describe('Experiment Store Study Duration & Flags', () => {
    it('defaults studySeconds to 240 (4 minutes)', () => {
      const state = useExperimentStore.getState();
      expect(state.studySeconds).toBe(240);
    });

    it('allows setting valid study durations (180, 240, 360 seconds)', () => {
      const { setStudySeconds } = useExperimentStore.getState();

      setStudySeconds(180);
      expect(useExperimentStore.getState().studySeconds).toBe(180);

      setStudySeconds(360);
      expect(useExperimentStore.getState().studySeconds).toBe(360);

      setStudySeconds(240);
      expect(useExperimentStore.getState().studySeconds).toBe(240);
    });

    it('tracks tutorial_skipped and palace_used_freewalk flags', () => {
      const { setTutorialSkipped, setPalaceUsedFreewalk } = useExperimentStore.getState();
      expect(useExperimentStore.getState().tutorialSkipped).toBe(false);
      expect(useExperimentStore.getState().palaceUsedFreewalk).toBe(false);

      setTutorialSkipped(true);
      expect(useExperimentStore.getState().tutorialSkipped).toBe(true);

      setPalaceUsedFreewalk(true);
      expect(useExperimentStore.getState().palaceUsedFreewalk).toBe(true);
    });

    it('stores distractor summary metrics', () => {
      const { recordDistractorDetailed } = useExperimentStore.getState();

      recordDistractorDetailed({
        attempted: 12,
        correct: 10,
        accuracy: 0.8333,
        medianMs: 1850,
        valid: true,
      });

      const state = useExperimentStore.getState();
      expect(state.distractorAttempted).toBe(12);
      expect(state.distractorCorrect).toBe(10);
      expect(state.distractorAccuracy).toBe(0.8333);
      expect(state.distractorMedianMs).toBe(1850);
      expect(state.distractorValid).toBe(true);
    });
  });

  describe('Locus Navigation Index Wrapping Logic', () => {
    const totalLoci = PALACE_LOCI.length; // 20

    it('wraps forward from locus 20 (index 19) to locus 1 (index 0)', () => {
      const currentIdx = 19;
      const nextIdx = (currentIdx + 1) % totalLoci;
      expect(nextIdx).toBe(0);
      expect(PALACE_LOCI[nextIdx].id).toBe(1);
    });

    it('wraps backward from locus 1 (index 0) to locus 20 (index 19)', () => {
      const currentIdx = 0;
      const prevIdx = (currentIdx - 1 + totalLoci) % totalLoci;
      expect(prevIdx).toBe(19);
      expect(PALACE_LOCI[prevIdx].id).toBe(20);
    });

    it('debounces rapid repeated clicks within 150ms window', () => {
      let activeIndex = 0;
      let lastNavTime = 0;

      const navigateNext = (currentTime: number) => {
        if (currentTime - lastNavTime < 150) return false;
        lastNavTime = currentTime;
        activeIndex = (activeIndex + 1) % totalLoci;
        return true;
      };

      // First click at t=1000
      expect(navigateNext(1000)).toBe(true);
      expect(activeIndex).toBe(1);

      // Rapid double tap at t=1050 (50ms later) should be dropped
      expect(navigateNext(1050)).toBe(false);
      expect(activeIndex).toBe(1);

      // Third click at t=1200 (150ms after first click) should succeed
      expect(navigateNext(1200)).toBe(true);
      expect(activeIndex).toBe(2);
    });
  });

  describe('Mode-Specific Keyboard Navigation Handling', () => {
    interface KeyActionDecision {
      advanceNext: boolean;
      advancePrev: boolean;
    }

    const evaluateKeyInput = (
      key: string,
      code: string,
      isFreeWalk: boolean,
      isInsideInput: boolean
    ): KeyActionDecision => {
      if (isInsideInput) return { advanceNext: false, advancePrev: false };

      const k = key.toLowerCase();
      const c = code.toLowerCase();

      const advanceNext =
        c === 'space' || k === ' ' || k === 'n' || (!isFreeWalk && k === 'arrowright');
      const advancePrev = k === 'p' || (!isFreeWalk && k === 'arrowleft');

      return { advanceNext, advancePrev };
    };

    it('triggers Next on Space or N in both guided and free-walk modes', () => {
      // Guided mode
      expect(evaluateKeyInput(' ', 'Space', false, false).advanceNext).toBe(true);
      expect(evaluateKeyInput('n', 'KeyN', false, false).advanceNext).toBe(true);

      // Free-walk mode
      expect(evaluateKeyInput(' ', 'Space', true, false).advanceNext).toBe(true);
      expect(evaluateKeyInput('n', 'KeyN', true, false).advanceNext).toBe(true);
    });

    it('triggers Prev on P in both guided and free-walk modes', () => {
      expect(evaluateKeyInput('p', 'KeyP', false, false).advancePrev).toBe(true);
      expect(evaluateKeyInput('p', 'KeyP', true, false).advancePrev).toBe(true);
    });

    it('allows Arrow keys to navigate loci ONLY in guided mode, never in free-walk', () => {
      // Guided mode: ArrowRight -> Next, ArrowLeft -> Prev
      expect(evaluateKeyInput('ArrowRight', 'ArrowRight', false, false).advanceNext).toBe(true);
      expect(evaluateKeyInput('ArrowLeft', 'ArrowLeft', false, false).advancePrev).toBe(true);

      // Free-walk mode: Arrow keys are reserved for looking around, NOT locus navigation
      expect(evaluateKeyInput('ArrowRight', 'ArrowRight', true, false).advanceNext).toBe(false);
      expect(evaluateKeyInput('ArrowLeft', 'ArrowLeft', true, false).advancePrev).toBe(false);
    });

    it('suppresses all navigation shortcuts when user is focused inside a text input', () => {
      expect(evaluateKeyInput(' ', 'Space', false, true).advanceNext).toBe(false);
      expect(evaluateKeyInput('n', 'KeyN', false, true).advanceNext).toBe(false);
      expect(evaluateKeyInput('p', 'KeyP', false, true).advancePrev).toBe(false);
    });
  });
});
