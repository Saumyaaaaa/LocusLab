// 75-second working memory distractor task administering mental arithmetic with validation and detailed logging.
import React, { useState, useEffect, useRef } from 'react';
import { useTimestampTimer } from '../hooks/useTimestampTimer';
import {
  ArithmeticProblem,
  DistractorItemRecord,
  generateDistinctArithmeticProblem,
  evaluateDistractorMetrics,
} from '../lib/distractorValidation';
import { useExperimentStore } from '../store/useExperimentStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ArithmeticDistractorProps {
  durationSeconds?: number; // 75 seconds
  onComplete: (metadata: { score: number; total: number; tabHidden: boolean }) => void;
}

export const ArithmeticDistractor: React.FC<ArithmeticDistractorProps> = ({
  durationSeconds = 75,
  onComplete,
}) => {
  const { participantId, recordDistractorDetailed } = useExperimentStore();

  const [currentProblem, setCurrentProblem] = useState<ArithmeticProblem>(() =>
    generateDistinctArithmeticProblem()
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);
  const problemStartMsRef = useRef<number>(Date.now());
  const itemsRef = useRef<DistractorItemRecord[]>([]);

  const handleFinish = async (tabHidden: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const items = itemsRef.current;
    const metrics = evaluateDistractorMetrics(items);

    // 1. Record metrics in local store
    recordDistractorDetailed(metrics);

    // 2. Persist to database if Supabase is active
    if (participantId && isSupabaseConfigured) {
      try {
        // A. Insert fine-grained items
        if (items.length > 0) {
          const rows = items.map((i) => ({
            participant_id: participantId,
            item_index: i.itemIndex,
            problem: i.problem,
            answer: i.answer,
            correct: i.correct,
            response_ms: i.responseMs,
          }));

          const { error: itemsError } = await supabase
            .from('distractor_items')
            .insert(rows);

          if (itemsError) {
            console.warn('Could not insert distractor_items (migration pending):', itemsError.message);
          }
        }

        // B. Update participant summary metrics
        const { error: partError } = await supabase
          .from('participants')
          .update({
            distractor_attempted: metrics.attempted,
            distractor_correct: metrics.correct,
            distractor_accuracy: metrics.accuracy,
            distractor_median_ms: metrics.medianMs,
            distractor_valid: metrics.valid,
          })
          .eq('id', participantId);

        if (partError) {
          console.warn('Could not update distractor summary columns on participant:', partError.message);
        }
      } catch (err) {
        console.warn('Error syncing distractor data to Supabase:', err);
      }
    }

    onComplete({
      score: metrics.correct,
      total: metrics.attempted,
      tabHidden,
    });
  };

  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: true,
    onExpire: () => handleFinish(tabHidden),
  });

  // Re-focus input whenever a new problem is displayed
  useEffect(() => {
    inputRef.current?.focus();
    problemStartMsRef.current = Date.now();
  }, [currentProblem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits and optional leading minus only
    if (/^-?[0-9]*$/.test(val)) {
      setUserAnswer(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userAnswer.trim();
    if (!trimmed || trimmed === '-') return; // Ignore empty submit or lone minus

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) return;

    const responseMs = Math.max(10, Date.now() - problemStartMsRef.current);
    const isCorrect = parsed === currentProblem.solution;

    // Record item
    itemsRef.current.push({
      itemIndex: itemsRef.current.length,
      problem: currentProblem.text,
      answer: parsed,
      correct: isCorrect,
      responseMs,
    });

    if (isCorrect) {
      setScore((s) => s + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong((w) => w + 1);
    }
    setTotalAttempted((t) => t + 1);

    setUserAnswer('');
    setCurrentProblem(generateDistinctArithmeticProblem(currentProblem.text));
  };

  return (
    <div className="card" role="region" aria-label="Short-term Memory Clearing Task">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <span className="badge">Phase 5: Short-Term Memory Clearance</span>
        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            padding: 'var(--space-1) var(--space-4)',
            backgroundColor: remainingSeconds <= 15 ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
            color: remainingSeconds <= 15 ? 'var(--color-danger)' : 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
          aria-live="polite"
          aria-label={`Time remaining: ${formattedTime}`}
        >
          ⏱ {formattedTime}
        </div>
      </div>

      <h2 className="title-lg">Mental Arithmetic Task</h2>
      <p className="lead-text" style={{ fontSize: 'var(--font-size-sm)' }}>
        Solve as many math problems as you can before the 75-second timer runs out.
      </p>

      {/* Gentle non-blocking warning after 5 wrong answers in a row */}
      {consecutiveWrong >= 5 && (
        <div
          role="status"
          style={{
            margin: 'var(--space-3) 0',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            color: '#92400e',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 1.5,
          }}
        >
          💬 <em>Please try to answer carefully. This task keeps your mind busy so the memory test is fair.</em>
        </div>
      )}

      {/* Math Problem Card */}
      <div
        style={{
          margin: 'var(--space-5) 0',
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 800,
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {currentProblem.text} = ?
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: '280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="^-?[0-9]*$"
              className="input-field"
              value={userAnswer}
              onChange={handleInputChange}
              placeholder="Your answer"
              aria-label={`Answer for ${currentProblem.text}`}
              autoComplete="off"
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 700,
                fontFamily: 'var(--font-family-mono)',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              aria-label="Submit answer"
              style={{ minWidth: '80px' }}
            >
              Enter ↵
            </button>
          </div>
        </form>
      </div>

      {/* Running Score Counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center',
          borderTop: '1px solid var(--color-surface-border)',
          paddingTop: 'var(--space-4)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Attempted: </span>
          <strong>{totalAttempted}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Solved Correct: </span>
          <strong style={{ color: 'var(--color-success)' }}>{score}</strong>
        </div>
      </div>
    </div>
  );
};
