// Informed consent component managing adult eligibility verification, anonymous sign-in, and participant code generation.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { supabase, signInAnonymousParticipant, isSupabaseConfigured } from '../lib/supabase';
import { generateParticipantCode } from '../lib/codeGenerator';

export const ConsentStep: React.FC = () => {
  const { nextStep, prevStep, participantCode, setParticipant } = useExperimentStore();

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
        // Helpful diagnostic when .env is not yet configured by the user
        throw new Error(
          'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured in your .env file yet. Please configure them to connect to your project.'
        );
      }

      // Step 1: Sign in anonymously
      const authData = await signInAnonymousParticipant();
      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error('Could not obtain an anonymous user ID from Supabase.');
      }

      // Step 2: Generate unbiased 8-character code
      const newCode = generateParticipantCode(8);

      // Step 3: Insert participant row with strict RLS (id = auth.uid())
      const { error: insertError } = await supabase
        .from('participants')
        .insert({
          id: userId,
          code: newCode,
        });

      if (insertError) {
        throw new Error(`Database error creating participant record: ${insertError.message}`);
      }

      // Step 4: Update store and show code on screen (no separate localStorage)
      setParticipant(userId, newCode);
      setCodeGenerated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in.';
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
      // Fallback
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
          <strong>Connection or Authentication Error:</strong>
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
