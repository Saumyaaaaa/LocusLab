// Accessible list-style text-based route fallback for devices without WebGL or participants preferring high-contrast text.
import React, { useState } from 'react';
import { PALACE_LOCI } from '../../data/loci';
import { useTimestampTimer } from '../../hooks/useTimestampTimer';

interface RouteTextFallbackProps {
  assignedWords: readonly string[];
  durationSeconds?: number;
  onComplete: (metadata: { tabHidden: boolean; webglFallback: true }) => void;
}

export const RouteTextFallback: React.FC<RouteTextFallbackProps> = ({
  assignedWords,
  durationSeconds = 360,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: true,
    onExpire: () => onComplete({ tabHidden, webglFallback: true }),
  });

  const activeLocus = PALACE_LOCI[currentIdx];
  const assignedWord = assignedWords[currentIdx] || '';

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % PALACE_LOCI.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + PALACE_LOCI.length) % PALACE_LOCI.length);
  };

  const [showFloatingWord, setShowFloatingWord] = useState(true);

  return (
    <div className="card" role="region" aria-label="Accessible Memory Palace Text Route">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span className="badge">Text-Route Memory Palace (Accessible Mode)</span>
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

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Locus {activeLocus.id} of 20 • {activeLocus.room}
        </span>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          📍 Location: {activeLocus.name} ({activeLocus.room})
        </div>

        {showFloatingWord ? (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '2px solid #6366f1',
              borderRadius: '12px',
              padding: '16px 24px',
              display: 'inline-block',
              margin: 'var(--space-4) auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#a5b4fc',
                marginBottom: '4px',
              }}
            >
              #{activeLocus.id} &bull; {activeLocus.name}
            </div>
            <div
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              {assignedWord}
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '16px',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: 800,
              margin: 'var(--space-4) auto',
            }}
          >
            #{activeLocus.id}
          </div>
        )}

        <div style={{ margin: 'var(--space-3) 0' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#64748b',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showFloatingWord}
              onChange={(e) => setShowFloatingWord(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Show floating word badge</span>
          </label>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            display: 'inline-block',
            marginTop: 'var(--space-2)',
          }}
        >
          💡 <em>Imagine this word doing something bizarre or vivid at the {activeLocus.name}.</em>
        </div>
      </div>

      <div className="button-bar" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrev}
          aria-label="Previous locus"
        >
          &larr; Previous Locus
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          aria-label="Next locus"
        >
          Next Locus (Locus {((currentIdx + 1) % 20) + 1}) &rarr;
        </button>
      </div>
    </div>
  );
};
