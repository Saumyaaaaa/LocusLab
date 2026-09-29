// Study phase 1 step rendering the flashcard study mode with 6-minute timestamp timer and keyboard navigation.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A } from '../data/lists';
import { FlashcardStudy } from '../components/FlashcardStudy';

export const StudyFirstStep: React.FC = () => {
  const { nextStep, setPhaseTabHidden } = useExperimentStore();

  const handleStudyComplete = ({ tabHidden }: { tabHidden: boolean }) => {
    setPhaseTabHidden('studyFirst', tabHidden);
    nextStep();
  };

  return (
    <FlashcardStudy
      words={LIST_A}
      title="Study Phase 1: Flashcards (6 Minutes)"
      durationSeconds={360}
      onComplete={handleStudyComplete}
    />
  );
};
