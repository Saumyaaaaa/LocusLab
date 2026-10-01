// Study phase 2 step with an auto-continuing 5-second countdown transition and equalized study duration.
import React, { useMemo, useState, useEffect } from 'react';
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
    studySeconds,
    setPhaseTabHidden,
    recordPalaceMetrics,
    setStudyCompletedAt,
  } = useExperimentStore();

  const [inTransition, setInTransition] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Auto-countdown timer for smooth transition
  useEffect(() => {
    if (!inTransition) return;
    if (countdown <= 0) {
      setInTransition(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inTransition, countdown]);

  // Condition 2 is opposite of Condition 1
  const isPalace = conditionOrder === 'flashcard_first';
  const assignedListId = isPalace ? palaceList : flashcardList;
  const wordStrings = assignedListId === 'listA' ? shuffledWordsA : shuffledWordsB;
  const originalList = assignedListId === 'listA' ? LIST_A : LIST_B;
  const studyMinutes = Math.round(studySeconds / 60);

  const flashcardItems: readonly WordItem[] = useMemo(() => {
    const map = new Map(originalList.map((item) => [item.word, item]));
    return wordStrings.map((word, idx) => {
      const match = map.get(word);
      return match || { id: `${assignedListId}-${idx}`, word, letters: word.length, syllables: 1 };
    });
  }, [originalList, wordStrings, assignedListId]);

  // Transition screen before round 2 begins
  if (inTransition) {
    return (
      <div className="card" role="region" aria-label="Get Ready for Study Round 2">
        <span className="badge">Round 1 Finished</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Get Ready for Round 2: {isPalace ? '3D Memory Palace' : 'Flashcards'}
        </h2>
        <p className="lead-text">
          You will now study a new list of 20 words using the alternate method for the exact same duration ({studyMinutes} minutes).
        </p>

        <div
          style={{
            margin: 'var(--space-6) 0',
            padding: 'var(--space-6)',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            border: '2px solid var(--color-surface-border)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            Round 2 starts automatically in
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '3rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
            }}
          >
            {countdown}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', minHeight: '48px', fontSize: 'var(--font-size-base)', fontWeight: 700 }}
          onClick={() => setInTransition(false)}
        >
          Start Round 2 Now →
        </button>
      </div>
    );
  }

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
        durationSeconds={studySeconds}
        onComplete={handlePalaceComplete}
      />
    );
  }

  const handleFlashcardComplete = ({ tabHidden }: { tabHidden: boolean }) => {
    setPhaseTabHidden('studySecond_flashcards', tabHidden);
    setStudyCompletedAt(new Date().toISOString());
    nextStep();
  };

  // Skip tutorial for flashcard condition
  return (
    <FlashcardStudy
      words={flashcardItems}
      title={`Study Phase 2: Flashcards (${studyMinutes} Minutes)`}
      durationSeconds={studySeconds}
      onComplete={handleFlashcardComplete}
    />
  );
};
