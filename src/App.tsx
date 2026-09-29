// Top-level application component orchestrating the header progress bar and active experiment step.
import React from 'react';
import { useExperimentStore } from './store/useExperimentStore';
import { ProgressIndicator } from './components/ProgressIndicator';
import { LandingStep } from './steps/LandingStep';
import { ConsentStep } from './steps/ConsentStep';
import { ImageryStep } from './steps/ImageryStep';
import { StudyFirstStep } from './steps/StudyFirstStep';
import { StudySecondStep } from './steps/StudySecondStep';
import { DistractorStep } from './steps/DistractorStep';
import { ImmediateTestStep } from './steps/ImmediateTestStep';
import { SessionDoneStep } from './steps/SessionDoneStep';
import { Test24hStep } from './steps/Test24hStep';
import { Test7dStep } from './steps/Test7dStep';
import { ResultsStep } from './steps/ResultsStep';

export const App: React.FC = () => {
  const currentStep = useExperimentStore((state) => state.currentStep);

  const renderActiveStep = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingStep />;
      case 'consent':
        return <ConsentStep />;
      case 'imagery':
        return <ImageryStep />;
      case 'studyFirst':
        return <StudyFirstStep />;
      case 'studySecond':
        return <StudySecondStep />;
      case 'distractor':
        return <DistractorStep />;
      case 'immediateTest':
        return <ImmediateTestStep />;
      case 'sessionDone':
        return <SessionDoneStep />;
      case 'test24h':
        return <Test24hStep />;
      case 'test7d':
        return <Test7dStep />;
      case 'results':
        return <ResultsStep />;
      default:
        return <LandingStep />;
    }
  };

  return (
    <div className="app-container">
      <ProgressIndicator />
      <main className="main-content">
        {renderActiveStep()}
      </main>
      <footer style={{
        textAlign: 'center',
        padding: 'var(--space-6) 0 var(--space-4)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-light)',
      }}>
        Locus Lab • Self-directed citizen-science project • Adults (18+) only • Anonymous & Free
      </footer>
    </div>
  );
};

export default App;
