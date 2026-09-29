// Visual progress indicator displaying current step and completion percentage across the experiment flow.
import React from 'react';
import { useExperimentStore, EXPERIMENT_STEPS, STEP_LABELS } from '../store/useExperimentStore';

export const ProgressIndicator: React.FC = () => {
  const currentStep = useExperimentStore((state) => state.currentStep);
  const currentIndex = EXPERIMENT_STEPS.indexOf(currentStep);
  const totalSteps = EXPERIMENT_STEPS.length;
  const progressPercent = Math.round(((currentIndex) / (totalSteps - 1)) * 100);

  // Keep landing clean without a bulky progress bar, or show subtle status
  if (currentStep === 'landing') {
    return null;
  }

  return (
    <header className="progress-container" aria-label="Experiment Progress">
      <div className="progress-header">
        <span className="step-counter">
          Step {currentIndex + 1} of {totalSteps}: <strong>{STEP_LABELS[currentStep]}</strong>
        </span>
        <span className="step-percent" aria-hidden="true">
          {progressPercent}%
        </span>
      </div>
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${progressPercent}% completed, step ${STEP_LABELS[currentStep]}`}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
