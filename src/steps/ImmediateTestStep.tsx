// Immediate recall view placeholder for testing free recall of both word lists with 1-character typo tolerance.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const ImmediateTestStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 6: Immediate Free Recall</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Immediate Recall Test</h2>
      <p className="lead-text">
        Free recall test for List A and List B in randomized order (3 minutes per list).
      </p>
      <div className="description-box">
        <p>Interactive chip-input recall engine with Levenshtein typo tolerance will be wired in Prompt 3.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Session 1 Complete &rarr;
        </button>
      </div>
    </div>
  );
};
