// Study phase 1 view placeholder for either the 3D memory palace or flashcards condition.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const StudyFirstStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 3: Condition 1 (6 Minutes)</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Study Phase 1</h2>
      <p className="lead-text">
        You will study your first 20-word list for a fixed 6 minutes using either the 3D Memory Palace or Flashcards.
      </p>
      <div className="description-box">
        <p>Timer and interactive study interface (Flashcards or 3D Palace) will be mounted here.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Study Phase 2 &rarr;
        </button>
      </div>
    </div>
  );
};
