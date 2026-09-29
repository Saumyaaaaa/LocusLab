// Study phase 2 step dynamically hosting the alternate study condition and recording study completion timestamp.
import React, { useMemo } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, LIST_B, WordItem } from '../data/lists';
import { FlashcardStudy } from '../components/FlashcardStudy';
import { PalaceStudyContainer } from '../components/palace/PalaceStudyContainer';
import { PalaceStudyCompletionPayload } from '../components/palace/PalaceScene';

export const StudySecondStep: React.FC = () => {
  const {
    nextStep,
    conditionOrder,
    palaceList,
    flashcardList,
    shuffledWordsA,
    shuffledWordsB,
    setPhaseTabHidden,
    recordPalaceMetrics,
    setStudyCompletedAt,
  } = useExperimentStore();

  // Condition 2 is the opposite of Condition 1
  const isPalace = conditionOrder === 'flashcard_first';
  const assignedListId = isPalace ? palaceList : flashcardList;
  const wordStrings = assignedListId === 'listA' ? shuffledWordsA : shuffledWordsB;
  const originalList = assignedListId === 'listA' ? LIST_A : LIST_B;

  const flashcardItems: readonly WordItem[] = useMemo(() => {
    const map = new Map(originalList.map((item) => [item.word, item]));
    return wordStrings.map((word, idx) => {
      const match = map.get(word);
      return match || { id: `${assignedListId}-${idx}`, word, letters: word.length, syllables: 1 };
    });
  }, [originalList, wordStrings, assignedListId]);

  if (isPalace) {
    const handlePalaceComplete = (payload: PalaceStudyCompletionPayload & { tutorialDurationMs: number }) => {
      recordPalaceMetrics(payload);
      setPhaseTabHidden('studySecond_palace', payload.tabHidden);
      setStudyCompletedAt(new Date().toISOString());
      nextStep();
    };

    return (
      <PalaceStudyContainer
        assignedWords={wordStrings}
        durationSeconds={360}
        onComplete={handlePalaceComplete}
      />
    );
  }

  const handleFlashcardComplete = ({ tabHidden }: { tabHidden: boolean }) => {
    setPhaseTabHidden('studySecond_flashcards', tabHidden);
    setStudyCompletedAt(new Date().toISOString());
    nextStep();
  };

  return (
    <FlashcardStudy
      words={flashcardItems}
      title="Study Phase 2: Flashcards (6 Minutes)"
      durationSeconds={360}
      onComplete={handleFlashcardComplete}
    />
  );
};
