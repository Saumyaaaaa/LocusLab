// Step allowing the participant to select their study round duration (3, 4, or 6 minutes) applied equally to both methods.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DurationOption {
  seconds: number;
  minutes: number;
  label: string;
  description: string;
  isDefault?: boolean;
}

const DURATION_OPTIONS: readonly DurationOption[] = [
  {
    seconds: 180,
    minutes: 3,
    label: 'Quick',
    description: '3 minutes per method (~9 seconds per word). Fast-paced and concise.',
  },
  {
    seconds: 240,
    minutes: 4,
    label: 'Standard',
    description: '4 minutes per method (~12 seconds per word). Balanced and recommended.',
    isDefault: true,
  },
  {
    seconds: 360,
    minutes: 6,
    label: 'Thorough',
    description: '6 minutes per method (~18 seconds per word). Relaxed with deep encoding time.',
  },
];

export const StudyDurationStep: React.FC = () => {
  const { studySeconds, setStudySeconds, nextStep, participantId } = useExperimentStore();
  const [selectedSeconds, setSelectedSeconds] = useState<number>(studySeconds || 240);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsSubmitting(true);
    setSaveError(null);

    // 1. Lock selection in local Zustand store
    setStudySeconds(selectedSeconds);

    // 2. Persist to database if Supabase is active
    if (participantId && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('participants')
          .update({ study_seconds: selectedSeconds })
          .eq('id', participantId);

        if (error) {
          // Graceful handling if remote schema cache hasn't refreshed column yet
          console.warn('Could not persist study_seconds directly (schema cache pending):', error.message);
        }
      } catch (err: unknown) {
        console.warn('Failed to update study_seconds in Supabase:', err);
      }
    }

    setIsSubmitting(false);
    nextStep();
  };

  return (
    <div className="card" role="region" aria-label="Choose Study Duration">
      <span className="badge">Step 3: Study Duration</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
        How long do you want each study round to be?
      </h2>
      <p
        className="lead-text"
        style={{
          color: 'var(--color-primary)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
        }}
      >
        The same time is used for both methods, so results stay fair.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {DURATION_OPTIONS.map((opt) => {
          const isSelected = selectedSeconds === opt.seconds;
          return (
            <label
              key={opt.seconds}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                border: isSelected
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-surface-border)',
                backgroundColor: isSelected
                  ? 'var(--color-primary-light, #eff6ff)'
                  : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name="studyDuration"
                value={opt.seconds}
                checked={isSelected}
                onChange={() => setSelectedSeconds(opt.seconds)}
                style={{
                  marginTop: '4px',
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-primary)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                    {opt.minutes} Minutes ({opt.label})
                  </span>
                  {opt.isDefault && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {opt.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid #6366f1',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        🔒 <strong>Fairness Guarantee:</strong> Once study begins, the countdown timer cannot be paused or adjusted.
        Practice tutorials do not count toward your study time.
      </div>

      {saveError && (
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
          {saveError}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', minHeight: '48px', fontSize: 'var(--font-size-base)', fontWeight: 700 }}
        onClick={handleContinue}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Continue to Study Round 1 →'}
      </button>
    </div>
  );
};
