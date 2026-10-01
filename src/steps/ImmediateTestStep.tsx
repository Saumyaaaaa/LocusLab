// Immediate recall step administering counterbalanced free recall tests for both lists and saving per-item rows to Supabase.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, LIST_B, WordItem } from '../data/lists';
import { RecallTest, RecallCompletionPayload } from '../components/RecallTest';
import { formatListRecallRows, saveResponsesWithRetry } from '../lib/responseQueue';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { detectDeviceInfo } from '../lib/deviceDetection';

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
    palaceAssetFallbackUsed,
  } = useExperimentStore();

  // Test presentation order determined by cryptographic counterbalancing
  const firstList = immediateTestOrder === 'B_first' ? 'B' : 'A';
  const secondList = firstList === 'A' ? 'B' : 'A';

  const [currentTestList, setCurrentTestList] = useState<'A' | 'B'>(firstList);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    payload: RecallCompletionPayload;
    targetWordList: readonly WordItem[];
    condition: 'palace' | 'flashcard';
    isFirstList: boolean;
  } | null>(null);

  const finalizeImmediateSession = async () => {
    const nowIso = new Date().toISOString();
    const { setSessionCompletedAt } = useExperimentStore.getState();
    setSessionCompletedAt(nowIso);

    if (participantId && isSupabaseConfigured) {
      const devInfo = detectDeviceInfo();
      const updatePayload: Record<string, unknown> = {
        palace_mode: palaceMode || 'guided',
        tutorial_ms: tutorialDurationMs || 0,
        webgl_fallback: webglFallbackUsed,
        palace_asset_fallback: palaceAssetFallbackUsed,
        viewport_w: devInfo.viewport_w,
        viewport_h: devInfo.viewport_h,
        device_class: devInfo.device_class,
        input_type: devInfo.input_type,
        flashcard_tab_hidden: Boolean(
          tabHiddenByPhase['studyFirst_flashcards'] || tabHiddenByPhase['studySecond_flashcards']
        ),
        palace_tab_hidden: Boolean(
          tabHiddenByPhase['studyFirst_palace'] || tabHiddenByPhase['studySecond_palace']
        ),
        study_completed_at: nowIso,
        session_completed_at: nowIso,
      };

      const { error: updateError } = await supabase
        .from('participants')
        .update(updatePayload)
        .eq('id', participantId);

      if (
        updateError &&
        (updateError.message.includes('column') || updateError.message.includes('schema cache'))
      ) {
        const {
          viewport_w: _vw,
          viewport_h: _vh,
          device_class: _dc,
          input_type: _it,
          palace_asset_fallback: _paf,
          ...baseUpdate
        } = updatePayload;
        await supabase.from('participants').update(baseUpdate).eq('id', participantId);
      }

      await supabase
        .from('sessions')
        .upsert(
          {
            participant_id: participantId,
            phase: 'immediateTest',
            completed_at: nowIso,
            start_hour: new Date().getHours(),
            late: false,
            lists_completed: 2,
          },
          { onConflict: 'participant_id,phase' }
        );
    }
  };

  const handleTestComplete = async (payload: RecallCompletionPayload) => {
    recordRecallCompletion(payload);
    setPhaseTabHidden(`immediateTest_${payload.listId}`, payload.tabHidden);

    const condition: 'palace' | 'flashcard' =
      payload.listId === palaceList ? 'palace' : 'flashcard';
    const targetWordList = payload.listId === 'listA' ? LIST_A : LIST_B;
    const isFirst = currentTestList === firstList;

    if (participantId && isSupabaseConfigured) {
      setSaveStatus('saving');
      setSaveError(null);
      const rows = formatListRecallRows(payload, targetWordList, participantId, condition);
      const res = await saveResponsesWithRetry(rows);

      if (!res.success) {
        setSaveStatus('error');
        setSaveError(res.error || 'Network error saving responses to database.');
        setPendingSave({ payload, targetWordList, condition, isFirstList: isFirst });
        // CRITICAL: Stop here! Never clear state or advance before save resolves!
        return;
      }
      setSaveStatus('saved');
    }

    if (isFirst) {
      if (participantId && isSupabaseConfigured) {
        await supabase
          .from('sessions')
          .upsert(
            {
              participant_id: participantId,
              phase: 'immediateTest',
              start_hour: new Date().getHours(),
              late: false,
              lists_completed: 1,
            },
            { onConflict: 'participant_id,phase' }
          );
      }
      setCurrentTestList(secondList);
    } else {
      await finalizeImmediateSession();
      nextStep();
    }
  };

  const handleRetrySave = async () => {
    if (!pendingSave || !participantId) return;
    setSaveStatus('saving');
    setSaveError(null);

    const rows = formatListRecallRows(
      pendingSave.payload,
      pendingSave.targetWordList,
      participantId,
      pendingSave.condition
    );
    const res = await saveResponsesWithRetry(rows);

    if (!res.success) {
      setSaveStatus('error');
      setSaveError(res.error || 'Retry failed. Please check internet connection.');
      return;
    }

    setSaveStatus('saved');
    setSaveError(null);
    const wasFirst = pendingSave.isFirstList;
    setPendingSave(null);

    if (wasFirst) {
      if (isSupabaseConfigured) {
        await supabase
          .from('sessions')
          .upsert(
            {
              participant_id: participantId,
              phase: 'immediateTest',
              start_hour: new Date().getHours(),
              late: false,
              lists_completed: 1,
            },
            { onConflict: 'participant_id,phase' }
          );
      }
      setCurrentTestList(secondList);
    } else {
      await finalizeImmediateSession();
      nextStep();
    }
  };

  const isListA = currentTestList === 'A';
  const targetWords = isListA ? LIST_A : LIST_B;
  const listId = isListA ? 'listA' : 'listB';
  const listTitle = `Immediate Recall Test: List ${currentTestList} (2 Minutes)`;

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
      {saveError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: 'var(--space-1)' }}>
            ⚠️ Save Failed: Could Not Reach Database
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#7f1d1d', marginBottom: 'var(--space-3)' }}>
            {saveError}. <strong>Your typed answers have been safely preserved in this browser.</strong> Please check your connection and click Retry below.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRetrySave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : '🔄 Retry Saving Responses'}
            </button>
          </div>
        </div>
      )}

      <RecallTest
        key={listId}
        listId={listId}
        phase="immediateTest"
        targetWords={targetWords}
        title={listTitle}
        durationSeconds={120}
        onComplete={handleTestComplete}
      />
    </div>
  );
};
