// Immediate recall step administering free recall tests sequentially for both word lists with silent score recording.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, LIST_B } from '../data/lists';
import { RecallTest, RecallCompletionPayload } from '../components/RecallTest';

export const ImmediateTestStep: React.FC = () => {
  const { nextStep, recordRecallCompletion, setPhaseTabHidden } = useExperimentStore();
  const [currentTestList, setCurrentTestList] = useState<'A' | 'B'>('A');

  const handleTestComplete = (payload: RecallCompletionPayload) => {
    recordRecallCompletion(payload);
    setPhaseTabHidden(`immediateTest_${payload.listId}`, payload.tabHidden);

    if (currentTestList === 'A') {
      // Advance to List B recall
      setCurrentTestList('B');
    } else {
      // Both recall tests complete, advance to sessionDone
      nextStep();
    }
  };

  if (currentTestList === 'A') {
    return (
      <RecallTest
        listId="listA"
        phase="immediateTest"
        targetWords={LIST_A}
        title="Immediate Recall Test (List A - 3 Minutes)"
        durationSeconds={180}
        onComplete={handleTestComplete}
      />
    );
  }

  return (
    <RecallTest
      listId="listB"
      phase="immediateTest"
      targetWords={LIST_B}
      title="Immediate Recall Test (List B - 3 Minutes)"
      durationSeconds={180}
      onComplete={handleTestComplete}
    />
  );
};
