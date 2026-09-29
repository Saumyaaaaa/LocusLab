// Informed consent component managing adult eligibility verification, anonymous sign-in, counterbalancing, and strict session reuse.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateParticipantCode } from '../lib/codeGenerator';
import { generateCounterbalanceAssignment } from '../lib/counterbalancing';
import { preloadPalaceModels } from '../components/palace/preloadModels';
import { detectDeviceInfo } from '../lib/deviceDetection';

export const ConsentStep: React.FC = () => {
  React.useEffect(() => {
    preloadPalaceModels();
  }, []);
  const {
    nextStep,
    prevStep,
    participantCode,
    setParticipant,
    setCounterbalanceAssignment,
    setShuffledWords,
  } = useExperimentStore();

  const [isAdult, setIsAdult] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // If code is already generated and saved in this session, show the code view directly
  const [codeGenerated, setCodeGenerated] = useState(Boolean(participantCode));

  const handleStartConsent = async () => {
    if (!isAdult || !hasConsented) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase environment variables are missing. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        );
      }

      // Step 1: Check if an active session already exists in the browser
      const { data: sessionData } = await supabase.auth.getSession();
      let currentSession = sessionData?.session;
      let currentUser = currentSession?.user;

      // Check if this existing session already has a participant record in the database
      if (currentUser?.id) {
        const { data: existingParticipant } = await supabase
          .from('participants')
          .select('id, code, condition_order, palace_list, immediate_test_order, word_order')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (existingParticipant?.code) {
          // Rule 3: KEEP stored condition_order, palace_list, and word_order. Never re-randomize!
          setParticipant(currentUser.id, existingParticipant.code);
          if (existingParticipant.condition_order && existingParticipant.palace_list) {
            setCounterbalanceAssignment({
              conditionOrder: existingParticipant.condition_order,
              palaceList: existingParticipant.palace_list,
              flashcardList: existingParticipant.palace_list === 'listA' ? 'listB' : 'listA',
              immediateTestOrder: existingParticipant.immediate_test_order || 'A_first',
            });
          }
          if (existingParticipant.word_order) {
            setShuffledWords(
              existingParticipant.word_order.listA || [],
              existingParticipant.word_order.listB || []
            );
          }
          setCodeGenerated(true);
          return;
        }
      }

      // Step 2: Establish a new anonymous session if none active
      if (!currentSession || !currentUser) {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

        if (authError || !authData?.session || !authData?.user) {
          throw new Error(
            `Unable to establish an anonymous session: ${authError?.message || 'Authentication session was not returned. Please try again.'}`
          );
        }

        currentSession = authData.session;
        currentUser = authData.user;
      }

      const userId = currentUser.id;

      // Step 3: Counterbalancing and code generation
      const assignment = generateCounterbalanceAssignment();
      const newCode = generateParticipantCode(8);

      // Per-participant word shuffles
      const { initializeWordShuffles } = useExperimentStore.getState();
      initializeWordShuffles();
      const state = useExperimentStore.getState();
      const wordsA = state.shuffledWordsA;
      const wordsB = state.shuffledWordsB;

      // Step 4: Strict insertion using data.user.id with strict RLS (id = auth.uid())
      const devInfo = detectDeviceInfo();
      const insertPayload: Record<string, unknown> = {
        id: userId,
        code: newCode,
        condition_order: assignment.conditionOrder,
        palace_list: assignment.palaceList,
        immediate_test_order: assignment.immediateTestOrder,
        word_order: { listA: wordsA, listB: wordsB },
        cohort: import.meta.env.VITE_COHORT || 'main',
        viewport_w: devInfo.viewport_w,
        viewport_h: devInfo.viewport_h,
        device_class: devInfo.device_class,
        input_type: devInfo.input_type,
      };

      let { error: insertError } = await supabase
        .from('participants')
        .insert(insertPayload);

      // If remote schema cache is missing newly added covariate columns, retry with base payload
      if (insertError && (insertError.message.includes('column') || insertError.message.includes('schema cache'))) {
        console.warn('Supabase schema cache missing covariate columns. Executing fallback insert. Run pending schema.sql migrations.');
        const { viewport_w: _vw, viewport_h: _vh, device_class: _dc, input_type: _it, ...basePayload } = insertPayload;
        const retryResult = await supabase.from('participants').insert(basePayload);
        insertError = retryResult.error;
      }

      if (insertError) {
        throw new Error(
          `Could not record participant in database: ${insertError.message}. Make sure strict schema.sql is executed.`
        );
      }

      // Step 5: Store in local Zustand store and show code on screen
      setParticipant(userId, newCode);
      setCounterbalanceAssignment(assignment);
      setCodeGenerated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during setup.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!participantCode) return;
    try {
      await navigator.clipboard.writeText(participantCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  // State 2: Code generated successfully -> show code and allow proceeding
  if (codeGenerated && participantCode) {
    return (
      <div className="card" role="region" aria-label="Participant Code Generated">
        <span className="badge">Step 1: Your Participant Code</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Your Anonymous Participant Code
        </h2>
        <p className="lead-text">
          Save this 8-character code. You will need it to return for your 24-hour and 7-day memory tests, or if you ever wish to delete your data.
        </p>

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
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            ANONYMOUS PARTICIPANT CODE
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: 'var(--color-primary)',
              userSelect: 'all',
              marginBottom: 'var(--space-4)',
            }}
          >
            {participantCode}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyCode}
            aria-label="Copy participant code to clipboard"
          >
            {copied ? '✓ Code Copied to Clipboard!' : '📋 Copy Code'}
          </button>
        </div>

        <div className="button-bar">
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Keep this code safe for return visits.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={nextStep}
            aria-label="Proceed to mental imagery self-rating"
          >
            Continue to Mental Imagery &rarr;
          </button>
        </div>
      </div>
    );
  }

  // State 1: Consent & 18+ Verification Form
  return (
    <div className="card" role="region" aria-label="Informed Consent & Eligibility">
      <span className="badge">Participant Consent</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
        Informed Consent & Study Information
      </h2>
      <p className="lead-text">
        Please review the study terms below before choosing to take part.
      </p>

      <div className="description-box" style={{ lineHeight: '1.7' }}>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <strong>Purpose:</strong> This self-directed citizen-science project investigates how spatial visualization (a 3D memory palace) compares with standard repetition (flashcards) for long-term word recall.
        </p>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <strong>Data Collected:</strong> We record anonymous word recall attempts, response timings (milliseconds), and your mental imagery self-rating. We <em>never</em> collect names, emails, phone numbers, or IP-linked personal identifiers.
        </p>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <strong>Citizen Science Status:</strong> This is a self-directed, independent educational and scientific investigation. It is <strong>NOT</strong> an IRB-approved medical study and is <strong>NOT</strong> a medical or diagnostic tool.
        </p>
        <p>
          <strong>Voluntary Participation:</strong> Participation is completely voluntary. You may stop at any point. You will receive an anonymous 8-character code that allows you to delete all your recorded data at any time.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            borderLeft: '4px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            margin: 'var(--space-4) 0',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 1.6,
          }}
        >
          <strong>Notice:</strong>
          <p style={{ marginTop: 'var(--space-1)' }}>{errorMessage}</p>
        </div>
      )}

      <fieldset
        style={{
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          margin: 'var(--space-6) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <legend style={{ padding: '0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Required Confirmations
        </legend>
        
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.15rem' }}
          />
          <span>
            <strong>I am 18 years of age or older.</strong> (Minors cannot participate in this citizen-science experiment.)
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(e) => setHasConsented(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.15rem' }}
          />
          <span>
            <strong>I consent to participate.</strong> I understand this is an anonymous citizen-science project and not a medical or diagnostic tool.
          </span>
        </label>
      </fieldset>

      <div className="button-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={prevStep}
          disabled={loading}
        >
          &larr; Back
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStartConsent}
          disabled={!isAdult || !hasConsented || loading}
          aria-label="Agree to consent and generate anonymous participant code"
        >
          {loading ? 'Connecting & Generating Code...' : 'Agree & Generate Anonymous Code &rarr;'}
        </button>
      </div>
    </div>
  );
};
