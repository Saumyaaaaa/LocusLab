// Imagery rating view placeholder for the 5 original vividness self-assessment questions.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const ImageryStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 2: Baseline Imagery</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Mental Imagery Vividness</h2>
      <p className="lead-text">
        Before studying the word lists, you will complete a quick 5-question rating of your mental visual imagery vividness.
      </p>
      <div className="description-box">
        <p>Original 5-question visual rating scale (1-5) will be wired in Prompt 2.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Study Phase 1 &rarr;
        </button>
      </div>
    </div>
  );
};
