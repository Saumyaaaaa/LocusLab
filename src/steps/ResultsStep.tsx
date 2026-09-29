// Results view placeholder rendering the SVG bar chart comparison and privacy data deletion controls.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';

export const ResultsStep: React.FC = () => {
  const { reset } = useExperimentStore();

  return (
    <div className="card">
      <span className="badge">Your Experiment Results</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>Palace vs. Flashcards Comparison</h2>
      <p className="lead-text">
        At 24 hours you recalled X of 20 palace words vs Y of 20 flashcard words.
      </p>
      <div className="description-box">
        <p>Interactive SVG chart, non-diagnostic imagery comparison, and "Delete all my data" button will be wired in Prompt 7.</p>
      </div>
      <div className="button-bar">
        <button type="button" className="btn btn-secondary" onClick={reset}>
          &larr; Return to Start
        </button>
      </div>
    </div>
  );
};
