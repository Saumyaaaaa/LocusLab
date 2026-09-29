// Root application component managing step routing, tab close warnings, back button guards, and resume logic.
import React, { useEffect } from 'react';
import { useExperimentStore, ExperimentStep } from './store/useExperimentStore';
import { ProgressIndicator } from './components/ProgressIndicator';
import { InterruptionNotice } from './components/InterruptionNotice';
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
import { ReturnPage } from './pages/ReturnPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const TIMED_STUDY_STEPS: readonly ExperimentStep[] = [
  'studyFirst',
  'studySecond',
  'distractor',
  'immediateTest',
];

export const App: React.FC = () => {
  const {
    currentStep,
    nextStep,
    sessionInterrupted,
    setSessionInterrupted,
    participantId,
  } = useExperimentStore();

  const isTimedPhase = TIMED_STUDY_STEPS.includes(currentStep);

  // 1. Navigation Guards: beforeunload & back button prevention during active study/test phases only
  useEffect(() => {
    if (!isTimedPhase) return;

    // Track active phase in sessionStorage to detect mid-session refreshes
    sessionStorage.setItem('locus_active_timed_phase', currentStep);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard browser confirmation prompt
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Prevent accidental browser back button navigation
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      sessionStorage.removeItem('locus_active_timed_phase');
    };
  }, [currentStep, isTimedPhase]);

  // 2. Interruption Detection: Check on initial mount if page was refreshed during a timed phase
  useEffect(() => {
    const interruptedPhase = sessionStorage.getItem('locus_active_timed_phase');
    if (interruptedPhase) {
      sessionStorage.removeItem('locus_active_timed_phase');
      setSessionInterrupted(true);

      // Record interruption flag in Supabase
      if (participantId && isSupabaseConfigured) {
        supabase
          .from('participants')
          .update({ session_interrupted: true })
          .eq('id', participantId);
      }

      // Advance to next unfinished step so extra learning time cannot be gained
      nextStep();
    }
  }, [nextStep, participantId, setSessionInterrupted]);

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

  const isReturnRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/return');

  return (
    <div className="app-container">
      {!isReturnRoute && <ProgressIndicator />}
      {sessionInterrupted && (
        <InterruptionNotice onDismiss={() => setSessionInterrupted(false)} />
      )}
      <main className="main-content">
        {isReturnRoute ? <ReturnPage /> : renderActiveStep()}
      </main>
      <footer
        style={{
          textAlign: 'center',
          padding: 'var(--space-6) 0 var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-light)',
        }}
      >
        Locus Lab • Self-directed citizen-science project • Adults (18+) only • Anonymous & Free
      </footer>
    </div>
  );
};

export default App;
