// Experiment results step rendering the accessible SVG grouped bar chart and privacy tools.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { ResultsView } from '../components/ResultsView';

export const ResultsStep: React.FC = () => {
  const { participantId, reset } = useExperimentStore();

  if (!participantId) {
    return (
      <div className="card">
        <span className="badge">No Active Session</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Session Not Found
        </h2>
        <p className="lead-text">
          Please complete your memory sessions in this browser to view your results.
        </p>
        <div className="button-bar">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Begin Study &rarr;
          </button>
        </div>
      </div>
    );
  }

  return <ResultsView participantId={participantId} />;
};
