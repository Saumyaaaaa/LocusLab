// Interactive tutorial explaining the method of loci and practicing controls with demo items before timed study.
import React, { useState, useRef } from 'react';

interface PalaceTutorialProps {
  onFinishTutorial: (tutorialDurationMs: number) => void;
}

const DEMO_PRACTICE_ITEMS = [
  {
    locusName: 'Front Porch Steps',
    room: 'Entrance',
    demoWord: 'GUITAR',
    prompt: 'Imagine an electric guitar smashing itself against the wooden steps, making loud reverberations.',
  },
  {
    locusName: 'Entry Vestibule',
    room: 'Hallway',
    demoWord: 'TELESCOPE',
    prompt: 'Imagine a giant brass telescope spinning wildly on the floor tiles, shooting bright star beams at the ceiling.',
  },
];

export const PalaceTutorial: React.FC<PalaceTutorialProps> = ({ onFinishTutorial }) => {
  const [practiceStep, setPracticeStep] = useState(0);
  const startTimeRef = useRef(Date.now());

  const currentItem = DEMO_PRACTICE_ITEMS[practiceStep];
  const isLastPractice = practiceStep >= DEMO_PRACTICE_ITEMS.length - 1;

  const handleNextPractice = () => {
    if (isLastPractice) {
      const durationMs = Date.now() - startTimeRef.current;
      onFinishTutorial(durationMs);
    } else {
      setPracticeStep((prev) => prev + 1);
    }
  };

  return (
    <div className="card" role="region" aria-label="Memory Palace Tutorial">
      <span className="badge">Practice Tutorial (Not Timed)</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
        How the 3D Memory Palace Works
      </h2>
      <p className="lead-text">
        The Method of Loci connects words to specific physical locations along a walking route.
      </p>

      <div className="description-box" style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ marginBottom: 'var(--space-2)' }}>
          <strong>The Rule of Association:</strong> When you arrive at each locus, don't just read the word—<strong>visualize it doing something bizarre, emotional, or physically exaggerated</strong> at that exact spot.
        </p>
        <p>
          Bizarre and active mental images form deeper associative memory traces in the hippocampus than passive reading.
        </p>
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
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
          Practice Item {practiceStep + 1} of 2
        </div>
        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary)' }}>
          📍 Practice Locus: {currentItem.locusName} ({currentItem.room})
        </div>

        <div style={{ margin: 'var(--space-4) 0' }}>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--color-accent)',
              letterSpacing: '0.08em',
            }}
          >
            {currentItem.demoWord}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 1.6,
          }}
        >
          💡 <em>Example Association: {currentItem.prompt}</em>
        </div>
      </div>

      <div className="button-bar">
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Controls: Press <strong>Spacebar</strong> or click the button to advance.
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNextPractice}
          aria-label={isLastPractice ? 'Start timed 6-minute palace study' : 'Try next practice locus'}
        >
          {isLastPractice
            ? 'I Understand - Begin Official 6-Minute Study →'
            : 'Next Practice Item (Space) →'}
        </button>
      </div>
    </div>
  );
};
