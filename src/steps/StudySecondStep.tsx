// Study phase 2 view placeholder for the second counterbalanced study condition.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const StudySecondStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 4: Condition 2 (6 Minutes)</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Study Phase 2</h2>
      <p className="lead-text">
        You will study your second 20-word list for a fixed 6 minutes using the alternate condition.
      </p>
      <div className="description-box">
        <p>Timer and the alternate counterbalanced study condition will be mounted here.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Distractor Task &rarr;
        </button>
      </div>
    </div>
  );
};
