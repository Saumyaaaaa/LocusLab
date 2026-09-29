// 3-minute working memory distractor task administering plain two-digit addition and subtraction problems.
import React, { useState, useEffect, useRef } from 'react';
import { useTimestampTimer } from '../hooks/useTimestampTimer';

interface Problem {
  num1: number;
  num2: number;
  operator: '+' | '-';
  solution: number;
}

function generateArithmeticProblem(): Problem {
  const isAdd = Math.random() < 0.5;
  if (isAdd) {
    const num1 = Math.floor(Math.random() * 40) + 15; // 15 to 54
    const num2 = Math.floor(Math.random() * 40) + 15; // 15 to 54
    return {
      num1,
      num2,
      operator: '+',
      solution: num1 + num2,
    };
  } else {
    const num1 = Math.floor(Math.random() * 50) + 40; // 40 to 89
    const num2 = Math.floor(Math.random() * 30) + 11; // 11 to 40
    return {
      num1,
      num2,
      operator: '-',
      solution: num1 - num2,
    };
  }
}

interface ArithmeticDistractorProps {
  durationSeconds?: number; // 180 seconds (3 minutes)
  onComplete: (metadata: { score: number; total: number; tabHidden: boolean }) => void;
}

export const ArithmeticDistractor: React.FC<ArithmeticDistractorProps> = ({
  durationSeconds = 180,
  onComplete,
}) => {
  const [currentProblem, setCurrentProblem] = useState<Problem>(() => generateArithmeticProblem());
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);

  const statsRef = useRef({ score, totalAttempted });
  statsRef.current = { score, totalAttempted };

  const handleFinish = (tabHidden: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      score: statsRef.current.score,
      total: statsRef.current.totalAttempted,
      tabHidden,
    });
  };

  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: true,
    onExpire: () => handleFinish(tabHidden),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentProblem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;

    const isCorrect = parsed === currentProblem.solution;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
    setTotalAttempted((t) => t + 1);

    setUserAnswer('');
    setCurrentProblem(generateArithmeticProblem());
  };

  return (
    <div className="card" role="region" aria-label="Short-term Memory Clearing Task">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span className="badge">Phase 5: Short-Term Memory Clearance</span>
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
        >
          ⏱ {formattedTime}
        </div>
      </div>

      <h2 className="title-lg">Mental Arithmetic Task</h2>
      <p className="lead-text">
        Solve as many simple math problems as you can during this 3-minute period. This clears working memory before the recall test.
      </p>

      {/* Arithmetic Problem Box */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          margin: 'var(--space-6) 0',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '3.5rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-6)',
          }}
        >
          {currentProblem.num1} {currentProblem.operator} {currentProblem.num2} = ?
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', maxWidth: '340px', margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer..."
            autoFocus
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              fontSize: '1.5rem',
              textAlign: 'center',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-primary)',
              fontFamily: 'var(--font-family-mono)',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={!userAnswer.trim()}>
            Submit
          </button>
        </form>
      </div>

      {/* Running Score Counter */}
      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
        Problems Solved: <span style={{ color: 'var(--color-primary)' }}>{score}</span> of {totalAttempted}
      </div>
    </div>
  );
};
