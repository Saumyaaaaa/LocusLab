// 24-hour delayed return test placeholder evaluating intermediate long-term consolidation.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const Test24hStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Primary Outcome: 24-Hour Delayed Recall</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>24-Hour Return Test</h2>
      <p className="lead-text">
        This is our primary research outcome measure: testing how many words remain accessible in long-term memory after sleep.
      </p>
      <div className="description-box">
        <p>Participant authentication via return code, timing window validation (22-48 hrs), and dual-list recall tests wired in Prompt 6.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Jump to: 7d Return Test (Preview) &rarr;
        </button>
      </div>
    </div>
  );
};
