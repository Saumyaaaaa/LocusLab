// 7-day delayed return test placeholder evaluating durable long-term retention.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const Test7dStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Secondary Outcome: 7-Day Delayed Recall</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>7-Day Return Test</h2>
      <p className="lead-text">
        The ultimate test of durable memory encoding: evaluating retention after one full week.
      </p>
      <div className="description-box">
        <p>Participant authentication via return code, timing window validation (6.5-10 days), and dual-list recall tests wired in Prompt 6.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next: Results &rarr;
        </button>
      </div>
    </div>
  );
};
