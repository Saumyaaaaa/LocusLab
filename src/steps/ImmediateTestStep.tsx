// Immediate recall step administering counterbalanced free recall tests for both lists and saving per-item rows to Supabase.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, LIST_B } from '../data/lists';
import { RecallTest, RecallCompletionPayload } from '../components/RecallTest';
import { formatListRecallRows, saveResponsesWithRetry } from '../lib/responseQueue';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ImmediateTestStep: React.FC = () => {
  const {
    nextStep,
    participantId,
    palaceList,
    immediateTestOrder,
    recordRecallCompletion,
    setPhaseTabHidden,
    palaceMode,
    tutorialDurationMs,
    webglFallbackUsed,
    tabHiddenByPhase,
  } = useExperimentStore();

  // Test presentation order determined by cryptographic counterbalancing
  const firstList = immediateTestOrder === 'B_first' ? 'B' : 'A';
  const secondList = firstList === 'A' ? 'B' : 'A';

  const [currentTestList, setCurrentTestList] = useState<'A' | 'B'>(firstList);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleTestComplete = async (payload: RecallCompletionPayload) => {
    recordRecallCompletion(payload);
    setPhaseTabHidden(`immediateTest_${payload.listId}`, payload.tabHidden);

    // Determine condition for this list ('palace' or 'flashcard')
    const condition: 'palace' | 'flashcard' =
      payload.listId === palaceList ? 'palace' : 'flashcard';
    const targetWordList = payload.listId === 'listA' ? LIST_A : LIST_B;

    // Save formatted 20 target rows + intrusions to Supabase
    if (participantId && isSupabaseConfigured) {
      setSaveStatus('saving');
      const rows = formatListRecallRows(payload, targetWordList, participantId, condition);
      const res = await saveResponsesWithRetry(rows);
      setSaveStatus(res.success ? 'saved' : 'error');
    }

    if (currentTestList === firstList) {
      // Advance to second list
      setCurrentTestList(secondList);
    } else {
      // Both tests completed! Record study completion metrics on participant row in Supabase
      const nowIso = new Date().toISOString();
      if (participantId && isSupabaseConfigured) {
        await supabase
          .from('participants')
          .update({
            palace_mode: palaceMode || 'guided',
            tutorial_ms: tutorialDurationMs || 0,
            webgl_fallback: webglFallbackUsed,
            flashcard_tab_hidden: Boolean(tabHiddenByPhase['studyFirst_flashcards'] || tabHiddenByPhase['studySecond_flashcards']),
            palace_tab_hidden: Boolean(tabHiddenByPhase['studyFirst_palace'] || tabHiddenByPhase['studySecond_palace']),
            study_completed_at: nowIso,
          })
          .eq('id', participantId);
      }
      nextStep();
    }
  };

  const isListA = currentTestList === 'A';
  const targetWords = isListA ? LIST_A : LIST_B;
  const listId = isListA ? 'listA' : 'listB';
  const listTitle = `Immediate Recall Test: List ${currentTestList} (3 Minutes)`;

  return (
    <div>
      {saveStatus === 'saving' && (
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
          💾 Saving responses securely...
        </div>
      )}
      {saveStatus === 'saved' && (
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
          ✓ Responses saved
        </div>
      )}
      {saveStatus === 'error' && (
        <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
          ⚠️ Responses saved locally (will retry sync)
        </div>
      )}

      <RecallTest
        key={listId}
        listId={listId}
        phase="immediateTest"
        targetWords={targetWords}
        title={listTitle}
        durationSeconds={180}
        onComplete={handleTestComplete}
      />
    </div>
  );
};
