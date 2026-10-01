// Orchestrates the tutorial onboarding phase and subsequent timed 3D palace study session.
import React, { useState } from 'react';
import { PalaceTutorial } from './PalaceTutorial';
import { PalaceScene, PalaceStudyCompletionPayload } from './PalaceScene';
import { useExperimentStore } from '../../store/useExperimentStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface PalaceStudyContainerProps {
  assignedWords: readonly string[]; // 20 words
  durationSeconds?: number;
  onComplete: (payload: PalaceStudyCompletionPayload & { tutorialDurationMs: number }) => void;
}

export const PalaceStudyContainer: React.FC<PalaceStudyContainerProps> = ({
  assignedWords,
  durationSeconds = 240,
  onComplete,
}) => {
  const { participantId, setTutorialSkipped } = useExperimentStore();
  const [inTutorial, setInTutorial] = useState(true);
  const [tutorialDurationMs, setTutorialDurationMs] = useState(0);

  const handleFinishTutorial = async (durationMs: number, skipped: boolean) => {
    setTutorialDurationMs(durationMs);
    setTutorialSkipped(skipped);
    setInTutorial(false);

    if (participantId && isSupabaseConfigured) {
      try {
        await supabase
          .from('participants')
          .update({
            tutorial_skipped: skipped,
            tutorial_ms: durationMs,
          })
          .eq('id', participantId);
      } catch {
        // Fallback silently if schema column pending
      }
    }
  };

  const handleStudyComplete = (payload: PalaceStudyCompletionPayload) => {
    onComplete({
      ...payload,
      tutorialDurationMs,
    });
  };

  if (inTutorial) {
    return (
      <PalaceTutorial
        durationSeconds={durationSeconds}
        onFinishTutorial={handleFinishTutorial}
      />
    );
  }

  return (
    <PalaceScene
      assignedWords={assignedWords}
      durationSeconds={durationSeconds}
      onComplete={handleStudyComplete}
    />
  );
};
