// Return session management handling anonymous session validation, timing windows, single attempt enforcement, dual-list tests, and no-early-feedback display.
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RecallTest, RecallCompletionPayload } from '../components/RecallTest';
import { LIST_A, LIST_B, WordItem } from '../data/lists';
import { formatListRecallRows, saveResponsesWithRetry } from '../lib/responseQueue';
import {
  evaluate24hWindow,
  evaluate7dWindow,
  formatFriendlyDuration,
  getElapsedHours,
  WindowEvaluation,
} from '../lib/timingWindows';
import { downloadCalendarReminder } from '../lib/calendarReminder';
import { ResultsView } from '../components/ResultsView';
import { DeleteDataModal } from '../components/DeleteDataModal';
import type { Phase } from '../data/phases';

interface ParticipantRecord {
  id: string;
  code: string;
  condition_order: string;
  palace_list: 'listA' | 'listB';
  immediate_test_order: 'A_first' | 'B_first';
  session_completed_at: string | null;
  study_completed_at: string | null;
  withdrew_early?: boolean;
}

interface SessionRecord {
  id: string;
  phase: Phase | string;
  started_at: string;
  completed_at: string | null;
  late: boolean;
  session_interrupted: boolean;
}

type ViewState =
  | 'verifying'
  | 'browserMismatch'
  | 'sessionIncomplete'
  | 'countdown'
  | 'ready'
  | 'testing'
  | 'alreadyCompleted'
  | 'interrupted'
  | 'allFinished';

export const ReturnPage: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('verifying');
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null);
  const [activePhase, setActivePhase] = useState<'24h' | '7d'>('24h');
  const [activeWindow, setActiveWindow] = useState<WindowEvaluation | null>(null);

  // Test progression state
  const [currentTestList, setCurrentTestList] = useState<'A' | 'B'>('A');
  const [testPhaseCompleted, setTestPhaseCompleted] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Manual code input fallback if ?code= parameter was missing
  const [manualCode, setManualCode] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Dev-only simulated hours state
  const [simulatedHours, setSimulatedHours] = useState<number | null>(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('simElapsedHours');
      return p ? parseFloat(p) : null;
    }
    return null;
  });

  // Reusable reminder banner
  const RehearsalReminderBanner = (
    <div
      role="note"
      style={{
        backgroundColor: 'var(--color-surface-subtle)',
        borderLeft: '4px solid var(--color-primary)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        margin: 'var(--space-4) 0',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
        lineHeight: 1.5,
      }}
    >
      <strong>🧠 Memory Hygiene Reminder:</strong> Please do <em>not</em> study, look up, or rehearse any study words between test sessions. Unrehearsed, spontaneous recall is critical for valid citizen-science results.
    </div>
  );

  // Step 1: Verification & Participant Validation
  const verifyParticipant = useCallback(async (codeToVerify?: string) => {
    setViewState('verifying');

    if (!isSupabaseConfigured) {
      setViewState('browserMismatch');
      return;
    }

    try {
      // 1. Load active anonymous session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (sessionError || !currentUser?.id) {
        setViewState('browserMismatch');
        return;
      }

      // 2. Query participant row strictly matching auth.uid()
      const { data: partData, error: partError } = await supabase
        .from('participants')
        .select('id, code, condition_order, palace_list, immediate_test_order, session_completed_at, study_completed_at, withdrew_early')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (partError || !partData) {
        setViewState('browserMismatch');
        return;
      }

      // 3. Compare code against query param or manual input (sanitized case-insensitive)
      const urlCode = new URLSearchParams(window.location.search).get('code');
      const targetCode = (codeToVerify || urlCode || '').trim().toUpperCase();

      if (!targetCode || targetCode !== partData.code.trim().toUpperCase()) {
        setViewState('browserMismatch');
        return;
      }

      // Participant verified!
      setParticipant(partData as ParticipantRecord);
    } catch {
      setViewState('browserMismatch');
    }
  }, []);

  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
      created = true;
    }
    const prevContent = metaRobots.content;
    metaRobots.content = 'noindex';

    return () => {
      if (created && metaRobots) {
        document.head.removeChild(metaRobots);
      } else if (metaRobots) {
        metaRobots.content = prevContent;
      }
    };
  }, []);

  useEffect(() => {
    verifyParticipant();
  }, [verifyParticipant]);

  // Step 2: Session and Timing Window Evaluation
  useEffect(() => {
    if (!participant) return;

    const baseTimestamp = participant.session_completed_at || participant.study_completed_at;
    if (!baseTimestamp) {
      setViewState('sessionIncomplete');
      return;
    }

    const checkWindowsAndSessions = async () => {
      // Fetch any existing return sessions
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('id, phase, started_at, completed_at, late, session_interrupted')
        .eq('participant_id', participant.id);

      const session24h = existingSessions?.find((s: SessionRecord) => s.phase === '24h');
      const session7d = existingSessions?.find((s: SessionRecord) => s.phase === '7d');

      const elapsed = getElapsedHours(baseTimestamp, simulatedHours);
      const eval24h = evaluate24hWindow(baseTimestamp, elapsed);
      const eval7d = evaluate7dWindow(baseTimestamp, elapsed);

      // Check interruption in sessionStorage from refresh
      const interruptedPhase = sessionStorage.getItem('locus_active_return_test');
      if (interruptedPhase) {
        sessionStorage.removeItem('locus_active_return_test');
        // Record interruption in DB
        await supabase
          .from('sessions')
          .update({ session_interrupted: true })
          .eq('participant_id', participant.id)
          .eq('phase', interruptedPhase);
        setViewState('interrupted');
        return;
      }

      // Case 0: Participant already chose to stop participating early
      if (participant.withdrew_early) {
        setViewState('allFinished');
        return;
      }

      // Case 1: Both 24h and 7d tests are completed, or 7d window closed
      if (session7d?.completed_at || eval7d.status === 'closed') {
        setViewState('allFinished');
        return;
      }

      // Case 2: 7d test has been attempted/interrupted
      if (session7d) {
        if (session7d.session_interrupted || (!session7d.completed_at && session7d.started_at)) {
          setViewState('interrupted');
        } else {
          setViewState('allFinished');
        }
        return;
      }

      // Case 3: 7d window is ready/open (even if 24h was skipped or closed!)
      if (eval7d.status === 'open') {
        setActivePhase('7d');
        setActiveWindow(eval7d);
        setViewState('ready');
        return;
      }

      // Case 4: 24h test already completed -> waiting for 7d window
      if (session24h?.completed_at) {
        setActivePhase('7d');
        setActiveWindow(eval7d);
        setViewState('countdown');
        return;
      }

      // Case 5: 24h test was interrupted mid-test
      if (session24h?.session_interrupted || (session24h?.started_at && !session24h.completed_at)) {
        setViewState('interrupted');
        return;
      }

      // Case 6: 24h window evaluation
      if (eval24h.status === 'open') {
        setActivePhase('24h');
        setActiveWindow(eval24h);
        setViewState('ready');
      } else if (eval24h.status === 'early') {
        setActivePhase('24h');
        setActiveWindow(eval24h);
        setViewState('countdown');
      } else {
        // 24h window closed (> 72h) -> countdown to 7d window
        setActivePhase('7d');
        setActiveWindow(eval7d);
        setViewState('countdown');
      }
    };

    checkWindowsAndSessions();
  }, [participant, simulatedHours]);

  const handleWithdrawEarly = async () => {
    if (!participant) return;
    try {
      await supabase
        .from('participants')
        .update({ withdrew_early: true })
        .eq('id', participant.id);
      setParticipant({ ...participant, withdrew_early: true });
      setViewState('allFinished');
    } catch {
      setViewState('allFinished');
    }
  };

  // Step 3: Start Test Phase (Enforces One Attempt Per Phase)
  const handleStartTest = async () => {
    if (!participant || !activeWindow) return;

    try {
      // 1. Check if a sessions row already exists for this phase
      const { data: existing } = await supabase
        .from('sessions')
        .select('id, started_at, completed_at')
        .eq('participant_id', participant.id)
        .eq('phase', activePhase)
        .maybeSingle();

      if (existing) {
        setViewState('interrupted');
        return;
      }

      // 2. Create the sessions row with late flag, start_hour, and lists_completed (started_at defaults to now())
      const startHour = new Date().getHours();
      const { error: insertError } = await supabase.from('sessions').insert({
        participant_id: participant.id,
        phase: activePhase,
        late: activeWindow.late,
        start_hour: startHour,
        session_interrupted: false,
        lists_completed: 0,
      });

      if (insertError) {
        setViewState('interrupted');
        return;
      }

      // 3. Mark active test in sessionStorage to detect mid-test reloads
      sessionStorage.setItem('locus_active_return_test', activePhase);

      // 4. Set first list based on counterbalanced immediate_test_order
      const firstList = participant.immediate_test_order === 'B_first' ? 'B' : 'A';
      setCurrentTestList(firstList);
      setViewState('testing');
    } catch {
      setViewState('interrupted');
    }
  };

  // Step 4: Handle Recall Test Completion (Dual Lists)
  const handleRecallTestComplete = async (payload: RecallCompletionPayload) => {
    if (!participant) return;

    const condition: 'palace' | 'flashcard' =
      payload.listId === participant.palace_list ? 'palace' : 'flashcard';
    const targetWords: readonly WordItem[] = payload.listId === 'listA' ? LIST_A : LIST_B;

    // Idempotent upsert of 20 target rows + intrusions
    setSaveStatus('saving');
    const rows = formatListRecallRows(payload, targetWords, participant.id, condition);
    const res = await saveResponsesWithRetry(rows);
    setSaveStatus(res.success ? 'saved' : 'error');

    if (!res.success) {
      return;
    }

    const firstList = participant.immediate_test_order === 'B_first' ? 'B' : 'A';
    const secondList = firstList === 'A' ? 'B' : 'A';

    if (currentTestList === firstList) {
      // Record partial completion (lists_completed = 1)
      await supabase
        .from('sessions')
        .update({ lists_completed: 1 })
        .eq('participant_id', participant.id)
        .eq('phase', activePhase);

      // Advance to second list
      setCurrentTestList(secondList);
    } else {
      // Both lists completed! Complete session row in Supabase with lists_completed = 2
      sessionStorage.removeItem('locus_active_return_test');
      const nowIso = new Date().toISOString();

      await supabase
        .from('sessions')
        .update({ completed_at: nowIso, lists_completed: 2 })
        .eq('participant_id', participant.id)
        .eq('phase', activePhase);

      setTestPhaseCompleted(true);
      if (activePhase === '24h') {
        setViewState('countdown'); // Switch to 7d countdown
      } else {
        setViewState('allFinished');
      }
    }
  };

  // Navigation guards during active recall test
  useEffect(() => {
    if (viewState !== 'testing') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [viewState]);

  // Dev time simulation toolbar (eliminated in production build)
  const DevSimulationToolbar = import.meta.env.DEV ? (
    <div
      style={{
        marginTop: 'var(--space-8)',
        padding: 'var(--space-4)',
        border: '1px dashed var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface-subtle)',
        fontSize: 'var(--font-size-xs)',
      }}
    >
      <strong>🛠️ Dev Time Simulator (Development Only — Dead Code in Production)</strong>
      <p style={{ margin: 'var(--space-1) 0 var(--space-2)' }}>
        Simulated elapsed hours: <code>{simulatedHours !== null ? `${simulatedHours}h` : 'Real Time'}</code>
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(null)}
        >
          Real Time
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(5)}
        >
          5h (24h Early)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(23)}
        >
          23h (24h On-Time)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(50)}
        >
          50h (24h Late)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(75)}
        >
          75h (24h Closed)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(160)}
        >
          160h (7d On-Time)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(250)}
        >
          250h (7d Late)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setSimulatedHours(350)}
        >
          350h (7d Closed)
        </button>
      </div>
    </div>
  ) : null;

  // VIEW 1: Verifying
  if (viewState === 'verifying') {
    return (
      <div className="card" role="region" aria-label="Verifying Session">
        <span className="badge">Returning Participant</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Verifying Your Session...
        </h2>
        <p className="lead-text">
          Connecting to your local anonymous browser session. Please wait a moment.
        </p>
      </div>
    );
  }

  // VIEW 2: Browser Mismatch / Anonymous Session Missing
  if (viewState === 'browserMismatch') {
    return (
      <div className="card" role="region" aria-label="Session Not Found">
        <span className="badge">Browser Notice</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)', color: 'var(--color-warning)' }}>
          Please Open in Your Original Browser
        </h2>
        <div className="description-box" style={{ lineHeight: 1.6, marginTop: 'var(--space-4)' }}>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Please open this link in the same browser you used for Session 1. Your code is only an identifier and cannot restore a session.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Because this citizen-science study requires strict anonymity without user accounts, passwords, or personal tracking, your session token is kept locally inside the browser on your original device.
          </p>
        </div>

        {/* Sanity check code input */}
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
          <label htmlFor="manual-code-input" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Have your 8-character participant code?
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              id="manual-code-input"
              type="text"
              maxLength={8}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K4MN8PX"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                fontFamily: 'var(--font-family-mono)',
                textTransform: 'uppercase',
                padding: 'var(--space-2) var(--space-3)',
                letterSpacing: '0.1em',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-surface-border)',
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => verifyParticipant(manualCode)}
            >
              Verify Code
            </button>
          </div>
        </div>

        <div className="button-bar">
          <a href="/" className="btn btn-secondary">
            &larr; Return to Home
          </a>
        </div>
      </div>
    );
  }

  // VIEW 3: Session Incomplete
  if (viewState === 'sessionIncomplete') {
    return (
      <div className="card" role="region" aria-label="Session 1 Incomplete">
        <span className="badge">Session 1 Required</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Session 1 Incomplete
        </h2>
        <p className="lead-text">
          Our records show you have not yet completed the Day 1 study and immediate recall test.
        </p>
        <div className="button-bar">
          <a href="/" className="btn btn-primary">
            Begin Session 1 &rarr;
          </a>
        </div>
      </div>
    );
  }

  // VIEW 4: Interrupted Attempt
  if (viewState === 'interrupted') {
    return (
      <div className="card" role="region" aria-label="Session Interrupted">
        <span className="badge" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>
          Attempt Recorded
        </span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)', color: 'var(--color-danger)' }}>
          Session Interrupted
        </h2>
        <div className="description-box" style={{ lineHeight: 1.6, marginTop: 'var(--space-4)' }}>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Refreshing or navigating away during a timed memory test concludes the attempt to safeguard scientific validity.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            To prevent extra learning time or rehearsal advantages, each return test allows exactly one continuous attempt.
          </p>
        </div>

        {RehearsalReminderBanner}

        <div className="button-bar">
          <a href="/" className="btn btn-secondary">
            Return to Home
          </a>
        </div>

        {DevSimulationToolbar}
      </div>
    );
  }

  // VIEW 5: Active Testing (Dual-list 3-min tests in counterbalanced order)
  if (viewState === 'testing' && participant) {
    const isListA = currentTestList === 'A';
    const targetWords = isListA ? LIST_A : LIST_B;
    const listId = isListA ? 'listA' : 'listB';
    const testTitle = `${activePhase === '24h' ? '24-Hour' : '7-Day'} Recall Test: List ${currentTestList} (2 Minutes)`;

    return (
      <div>
        {saveStatus === 'saving' && (
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            💾 Saving responses securely...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
            ✓ Responses saved
          </div>
        )}

        <RecallTest
          key={listId}
          listId={listId}
          phase={activePhase}
          targetWords={targetWords}
          title={testTitle}
          durationSeconds={120}
          onComplete={handleRecallTestComplete}
        />

        <div style={{ maxWidth: '48rem', margin: 'var(--space-4) auto' }}>
          {RehearsalReminderBanner}
        </div>
      </div>
    );
  }

  // VIEW 6: Ready to Begin Test (24h or 7d)
  if (viewState === 'ready' && activeWindow) {
    const phaseLabel = activePhase === '24h' ? '24-Hour Delayed Recall' : '7-Day Delayed Recall';

    return (
      <div className="card" role="region" aria-label="Test Ready">
        <span className="badge">Test Window Open</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          {phaseLabel} Ready
        </h2>
        <p className="lead-text">
          Welcome back! Your memory test is now ready to begin.
        </p>

        {activeWindow.late && (
          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              borderLeft: '4px solid var(--color-warning)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              margin: 'var(--space-4) 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            <strong>Note:</strong> You are taking this test during the extended window. Your responses are still extremely valuable for citizen science!
          </div>
        )}

        <div className="description-box" style={{ lineHeight: 1.6, margin: 'var(--space-4) 0' }}>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Format:</strong> You will have 2 minutes per word list to type as many words as you remember.
          </p>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Rules:</strong> Exactly one continuous attempt. Pasting is disabled. No correctness feedback is displayed.
          </p>
        </div>

        {RehearsalReminderBanner}

        <div className="button-bar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartTest}
            aria-label={`Begin ${phaseLabel} test`}
          >
            Begin {phaseLabel} Test (2 &times; 3 min) &rarr;
          </button>
        </div>

        {DevSimulationToolbar}
      </div>
    );
  }

  // VIEW 7: Countdown / Post-24h Screen (No Early Feedback Rule)
  if (viewState === 'countdown' && activeWindow) {
    const nextPhaseLabel = activePhase === '24h' ? '24-Hour Test' : '7-Day Test';
    const opensAtFormatted = activeWindow.openDate.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <div className="card" role="region" aria-label="Test Countdown">
        {testPhaseCompleted ? (
          <>
            <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}>
              ✓ 24-Hour Test Completed
            </span>
            <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
              Thank You! Your Responses Are Recorded
            </h2>
            <p className="lead-text">
              Your 24-hour delayed recall attempt has been securely saved.
            </p>
          </>
        ) : (
          <>
            <span className="badge">Upcoming Window</span>
            <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
              {nextPhaseLabel} Countdown
            </h2>
            <p className="lead-text">
              This memory test opens after your brain consolidates what was studied.
            </p>
          </>
        )}

        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle)',
            border: '2px dashed var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            margin: 'var(--space-6) 0',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
            TIME REMAINING UNTIL WINDOW OPENS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              margin: 'var(--space-2) 0',
            }}
          >
            {formatFriendlyDuration(activeWindow.msUntilOpen)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Opens approximately: <strong>{opensAtFormatted}</strong>
          </div>
        </div>

        {RehearsalReminderBanner}

        <div className="button-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {participant?.code && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const base = participant.session_completed_at || participant.study_completed_at || undefined;
                downloadCalendarReminder(participant.code, base);
              }}
            >
              📅 Download Calendar Reminder (.ics)
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleWithdrawEarly}
            aria-label="Stop participating early and view results now"
          >
            Stop participating and see my results &rarr;
          </button>
          <a href="/" className="btn btn-secondary">
            Return to Home
          </a>
        </div>

        {DevSimulationToolbar}

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete My Data
          </button>
        </div>

        <DeleteDataModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      </div>
    );
  }

  // VIEW 8: Results View (7d test finished, 7d window closed, or participant withdrew early)
  if (participant) {
    return (
      <div>
        <ResultsView participantId={participant.id} />
        {DevSimulationToolbar}
      </div>
    );
  }

  return null;
};
