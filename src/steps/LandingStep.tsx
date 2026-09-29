// Landing view introducing the 25-minute memory experiment and confirming 18+ eligibility.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const LandingStep: React.FC = () => {
  const nextStep = useExperimentStore((state) => state.nextStep);

  return (
    <div className="card">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <span className="badge">Citizen Science Experiment</span>
      </div>
      
      <h1 className="title-xl">Locus Lab</h1>
      
      <p className="lead-text">
        Locus Lab is an open citizen-science experiment investigating whether a 3D memory palace or digital flashcards produces superior long-term word recall for your brain.
      </p>

      <div className="description-box">
        <p style={{ marginBottom: 'var(--space-2)' }}>
          The initial study and recall session takes approximately 25 minutes, with no sign-up or account required.
        </p>
        <p>
          Participation is voluntary, fully anonymous, and strictly limited to adults aged 18 and older.
        </p>
      </div>

      <div
        role="note"
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          borderLeft: '4px solid var(--color-primary)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          margin: 'var(--space-4) 0',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        <strong>⚠️ Browser Continuity Notice:</strong> Private/incognito windows and clearing site data will prevent you from returning for later tests. This anonymous study stores your session locally in this browser. Please use a regular browser window to ensure you can complete the 24-hour and 7-day memory tests.
      </div>

      <div className="button-bar">
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Self-directed study • Desktop or laptop recommended
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={nextStep}
          aria-label="Start experiment and proceed to consent"
        >
          Begin Experiment &rarr;
        </button>
      </div>
    </div>
  );
};
