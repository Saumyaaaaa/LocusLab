// Study phase 1 step rendering the flashcard study mode with 6-minute timestamp timer and keyboard navigation.
import React, { useEffect, useMemo } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, WordItem } from '../data/lists';
import { FlashcardStudy } from '../components/FlashcardStudy';

export const StudyFirstStep: React.FC = () => {
  const { nextStep, setPhaseTabHidden, shuffledWordsA, initializeWordShuffles } = useExperimentStore();

  useEffect(() => {
    if (!shuffledWordsA || shuffledWordsA.length === 0) {
      initializeWordShuffles();
    }
  }, [initializeWordShuffles, shuffledWordsA]);

  // Map shuffled word strings back to WordItem objects
  const shuffledItems: readonly WordItem[] = useMemo(() => {
    const wordMap = new Map(LIST_A.map((item) => [item.word, item]));
    return shuffledWordsA.map((word, idx) => {
      const original = wordMap.get(word);
      return original || { id: `a-shuffled-${idx}`, word, letters: word.length, syllables: 1 };
    });
  }, [shuffledWordsA]);

  const handleStudyComplete = ({ tabHidden }: { tabHidden: boolean }) => {
    setPhaseTabHidden('studyFirst_flashcards', tabHidden);
    nextStep();
  };

  return (
    <FlashcardStudy
      words={shuffledItems}
      title="Study Phase 1: Flashcards (6 Minutes)"
      durationSeconds={360}
      onComplete={handleStudyComplete}
    />
  );
};
