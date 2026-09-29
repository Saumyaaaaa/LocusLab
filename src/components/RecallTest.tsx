// Free recall test component with paste prevention, removable word chips, 3-minute auto-submit, and response latency tracking.
import React, { useState, useRef, useEffect } from 'react';
import { WordItem } from '../data/lists';
import { useTimestampTimer } from '../hooks/useTimestampTimer';
import { scoreRecallResponses, RecallScoreResult, ItemEvaluation } from '../lib/scoring';

export interface RecordedRecallResponse {
  typed: string;
  responseMs: number;
  evaluation?: ItemEvaluation;
}

export interface RecallCompletionPayload {
  listId: string;
  phase: string;
  enteredWords: string[];
  recordedResponses: RecordedRecallResponse[];
  scoreResult: RecallScoreResult;
  tabHidden: boolean;
  durationMs: number;
}

interface RecallTestProps {
  listId: string;
  phase: string;
  targetWords: readonly WordItem[];
  title?: string;
  durationSeconds?: number; // 180 seconds (3 minutes)
  onComplete: (payload: RecallCompletionPayload) => void;
}

export const RecallTest: React.FC<RecallTestProps> = ({
  listId,
  phase,
  targetWords,
  title = 'Recall Test',
  durationSeconds = 180,
  onComplete,
}) => {
  const [inputText, setInputText] = useState('');
  const [recordedList, setRecordedList] = useState<RecordedRecallResponse[]>([]);
  const [pasteWarning, setPasteWarning] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  // Keep ref of latest state for timer auto-submit
  const stateRef = useRef({ inputText, recordedList });
  stateRef.current = { inputText, recordedList };

  const submitTest = (finalText: string, currentList: RecordedRecallResponse[], tabHidden: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const list = [...currentList];
    const trimmedInput = finalText.trim();
    if (trimmedInput) {
      list.push({
        typed: trimmedInput,
        responseMs: Math.max(0, Date.now() - startTimeRef.current),
      });
    }

    const typedStrings = list.map((item) => item.typed);
    const targetStrings = targetWords.map((item) => item.word);
    const scoreResult = scoreRecallResponses(typedStrings, targetStrings);

    // Attach evaluation to each response
    const evaluatedResponses: RecordedRecallResponse[] = list.map((item, idx) => ({
      ...item,
      evaluation: scoreResult.evaluations[idx],
    }));

    onComplete({
      listId,
      phase,
      enteredWords: typedStrings,
      recordedResponses: evaluatedResponses,
      scoreResult,
      tabHidden,
      durationMs: Date.now() - startTimeRef.current,
    });
  };

  const { formattedTime, remainingSeconds, tabHidden } = useTimestampTimer({
    durationSeconds,
    isActive: true,
    onExpire: () => {
      submitTest(stateRef.current.inputText, stateRef.current.recordedList, tabHidden);
    },
  });

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    const newResponse: RecordedRecallResponse = {
      typed: clean,
      responseMs: Math.max(0, Date.now() - startTimeRef.current),
    };

    setRecordedList((prev) => [...prev, newResponse]);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleRemoveWord = (indexToRemove: number) => {
    setRecordedList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    inputRef.current?.focus();
  };

  const handleManualSubmit = () => {
    submitTest(inputText, recordedList, tabHidden);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 3000);
  };

  return (
    <div className="card" role="region" aria-label="Free Recall Test">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span className="badge">{title}</span>
        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            padding: 'var(--space-1) var(--space-4)',
            backgroundColor: remainingSeconds <= 30 ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
            color: remainingSeconds <= 30 ? 'var(--color-danger)' : 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
          }}
          aria-live="polite"
          aria-label={`Time remaining: ${formattedTime}`}
        >
          ⏱ {formattedTime}
        </div>
      </div>

      <h2 className="title-lg">Type All Words You Remember</h2>
      <p className="lead-text">
        Type one word at a time and press <strong>Enter</strong>. You have 3 minutes for this list.
      </p>

      {pasteWarning && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          ⚠️ Pasting is disabled during recall tests to preserve experiment validity. Please type words manually.
        </div>
      )}

      {/* Word Input Form */}
      <form onSubmit={handleAddWord} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={handlePaste}
          placeholder="Type a remembered word and press Enter..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-base)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-surface-border)',
            backgroundColor: 'var(--color-surface)',
          }}
          aria-label="Recall word input"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputText.trim()}
        >
          Add Word
        </button>
      </form>

      {/* Words Entered Chips (No correct/incorrect feedback shown!) */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
          Entered Words ({recordedList.length}):
        </div>

        {recordedList.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              border: '1px dashed var(--color-surface-border)',
            }}
          >
            No words entered yet. Type words above as they come to mind.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              minHeight: '60px',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)',
            }}
            role="list"
            aria-label="List of entered words"
          >
            {recordedList.map((item, index) => (
              <span
                key={`${item.typed}-${index}`}
                role="listitem"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span>{item.typed}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-light)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                  aria-label={`Remove word ${item.typed}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submission Actions */}
      <div className="button-bar">
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Tip: You can submit early or wait for the 3-minute timer to auto-submit.
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleManualSubmit}
          aria-label="Submit recall test"
        >
          Submit & Finish List Test &rarr;
        </button>
      </div>
    </div>
  );
};
