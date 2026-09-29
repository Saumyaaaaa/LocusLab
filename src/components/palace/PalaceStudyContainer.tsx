// Orchestrates the tutorial onboarding phase and subsequent 6-minute timed 3D palace study session.
import React, { useState } from 'react';
import { PalaceTutorial } from './PalaceTutorial';
import { PalaceScene, PalaceStudyCompletionPayload } from './PalaceScene';

interface PalaceStudyContainerProps {
  assignedWords: readonly string[]; // 20 words
  durationSeconds?: number;
  onComplete: (payload: PalaceStudyCompletionPayload & { tutorialDurationMs: number }) => void;
}

export const PalaceStudyContainer: React.FC<PalaceStudyContainerProps> = ({
  assignedWords,
  durationSeconds = 360,
  onComplete,
}) => {
  const [inTutorial, setInTutorial] = useState(true);
  const [tutorialDurationMs, setTutorialDurationMs] = useState(0);

  const handleFinishTutorial = (durationMs: number) => {
    setTutorialDurationMs(durationMs);
    setInTutorial(false);
  };

  const handleStudyComplete = (payload: PalaceStudyCompletionPayload) => {
    onComplete({
      ...payload,
      tutorialDurationMs,
    });
  };

  if (inTutorial) {
    return <PalaceTutorial onFinishTutorial={handleFinishTutorial} />;
  }

  return (
    <PalaceScene
      assignedWords={assignedWords}
      durationSeconds={durationSeconds}
      onComplete={handleStudyComplete}
    />
  );
};
