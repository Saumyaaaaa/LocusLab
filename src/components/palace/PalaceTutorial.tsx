// Interactive concise tutorial explaining the method of loci with practice demo items and a skip option.
import React, { useState, useRef } from 'react';

interface PalaceTutorialProps {
  durationSeconds?: number;
  onFinishTutorial: (tutorialDurationMs: number, skipped: boolean) => void;
}

const DEMO_PRACTICE_ITEMS = [
  {
    locusName: 'Front Porch Steps',
    room: 'Entrance',
    demoWord: 'GUITAR',
    prompt: 'Imagine an electric guitar smashing against the wooden steps, vibrating the boards.',
  },
  {
    locusName: 'Entry Vestibule',
    room: 'Hallway',
    demoWord: 'TELESCOPE',
    prompt: 'Imagine a giant brass telescope spinning on the floor tiles, beaming light at the ceiling.',
  },
];

export const PalaceTutorial: React.FC<PalaceTutorialProps> = ({
  durationSeconds = 240,
  onFinishTutorial,
}) => {
  const [practiceStep, setPracticeStep] = useState(0);
  const startTimeRef = useRef(Date.now());

  const currentItem = DEMO_PRACTICE_ITEMS[practiceStep];
  const isLastPractice = practiceStep >= DEMO_PRACTICE_ITEMS.length - 1;
  const studyMinutes = Math.round(durationSeconds / 60);

  const handleNextPractice = () => {
    if (isLastPractice) {
      const durationMs = Date.now() - startTimeRef.current;
      onFinishTutorial(durationMs, false);
    } else {
      setPracticeStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    const durationMs = Date.now() - startTimeRef.current;
    onFinishTutorial(durationMs, true);
  };

  return (
    <div className="card" role="region" aria-label="Memory Palace Tutorial">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span className="badge">Quick Tutorial (~30s, Not Timed)</span>
        <button
          type="button"
          onClick={handleSkip}
          className="btn btn-secondary"
          style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
          aria-label="Skip tutorial and begin study session immediately"
        >
          Skip Tutorial ⏩
        </button>
      </div>

      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
        How the 3D Memory Palace Works
      </h2>
      <p className="lead-text">
        The Method of Loci connects words to specific physical locations along a walking route.
      </p>

      <div className="description-box" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)' }}>
        <p style={{ margin: 0 }}>
          💡 <strong>The Rule of Association:</strong> When you arrive at each locus, don't just read the word—<strong>visualize it doing something bizarre, emotional, or physical</strong> at that exact spot.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          textAlign: 'center',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
          Practice Item {practiceStep + 1} of 2
        </div>
        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
          📍 Practice Locus: {currentItem.locusName} ({currentItem.room})
        </div>

        <div style={{ margin: 'var(--space-3) 0' }}>
          <div
            style={{
              fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--color-accent)',
              letterSpacing: '0.08em',
              wordBreak: 'break-word',
            }}
          >
            {currentItem.demoWord}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '560px',
            margin: '0 auto',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 1.5,
          }}
        >
          <em>Association example: {currentItem.prompt}</em>
        </div>
      </div>

      <div className="button-bar">
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Skip tutorial
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNextPractice}
          aria-label={isLastPractice ? `Start timed ${studyMinutes}-minute palace study` : 'Try next practice locus'}
        >
          {isLastPractice
            ? `Begin Official ${studyMinutes}-Minute Study →`
            : 'Next Practice Item →'}
        </button>
      </div>
    </div>
  );
};
