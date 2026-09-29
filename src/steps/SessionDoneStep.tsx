// Session 1 completion view placeholder displaying participant code, return URL, and calendar reminder download.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const SessionDoneStep: React.FC = () => {
  const { nextStep, prevStep } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Session 1 Completed</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Day 1 Is Finished!</h2>
      <p className="lead-text">
        Great job! Your immediate responses have been recorded. The crucial test for long-term retention occurs in 24 hours.
      </p>
      <div className="description-box">
        <p>Participant code, return link (/return?code=XXXX), and downloadable .ics calendar reminder will be generated here in Prompt 5.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          &larr; Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Jump to: 24h Return Test (Preview) &rarr;
        </button>
      </div>
    </div>
  );
};
