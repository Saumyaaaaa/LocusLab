// Distractor view placeholder for the 3-minute working memory clearing arithmetic task.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const DistractorStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 5: Distractor Task (3 Minutes)</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Short-Term Memory Clearance</h2>
      <p className="lead-text">
        A quick 3-minute session of simple arithmetic problems (e.g., 47 - 19) to clear immediate working memory buffer.
      </p>
      <div className="description-box">
        <p>Interactive arithmetic question generator and countdown will be wired in Prompt 5.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Immediate Recall &rarr;
        </button>
      </div>
    </div>
  );
};
