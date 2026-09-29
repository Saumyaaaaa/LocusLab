// Study phase 2 step rendering the 3D memory palace study session with tutorial onboarding and dwell logging.
import React, { useEffect } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { PalaceStudyContainer } from '../components/palace/PalaceStudyContainer';
import { PalaceStudyCompletionPayload } from '../components/palace/PalaceScene';

export const StudySecondStep: React.FC = () => {
  const {
    nextStep,
    shuffledWordsB,
    initializeWordShuffles,
    recordPalaceMetrics,
    setPhaseTabHidden,
  } = useExperimentStore();

  useEffect(() => {
    // Ensure word shuffles are generated if not already done
    if (!shuffledWordsB || shuffledWordsB.length === 0) {
      initializeWordShuffles();
    }
  }, [initializeWordShuffles, shuffledWordsB]);

  const handlePalaceComplete = (
    payload: PalaceStudyCompletionPayload & { tutorialDurationMs: number }
  ) => {
    recordPalaceMetrics(payload);
    setPhaseTabHidden('studySecond_palace', payload.tabHidden);
    nextStep();
  };

  return (
    <PalaceStudyContainer
      assignedWords={shuffledWordsB}
      durationSeconds={360}
      onComplete={handlePalaceComplete}
    />
  );
};
