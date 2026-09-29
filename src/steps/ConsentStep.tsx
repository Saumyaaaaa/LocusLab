// Consent view placeholder preparing the participant agreement, ethics disclosure, and 18+ verification.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const ConsentStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Phase 1: Ethics & Consent</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Informed Consent & Eligibility</h2>
      <p className="lead-text">
        This is a self-directed citizen-science project, not an IRB-approved medical or diagnostic tool.
      </p>
      <div className="description-box">
        <p>Full consent form and age verification checkboxes will be wired in Prompt 2.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Mental Imagery &rarr;
        </button>
      </div>
    </div>
  );
};
