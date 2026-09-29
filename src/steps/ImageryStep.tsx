// Mental imagery self-rating step presenting 5 randomized vividness questions with clear endpoints and RLS update.
import React, { useState, useMemo } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ImageryQuestion {
  id: number;
  prompt: string;
}

const ORIGINAL_IMAGERY_QUESTIONS: ImageryQuestion[] = [
  {
    id: 1,
    prompt: 'Close your eyes and picture the front entrance or door of your home. How vivid is the mental image?',
  },
  {
    id: 2,
    prompt: 'Think of the face of a close friend or relative whom you see regularly. How clearly can you visualize their facial features?',
  },
  {
    id: 3,
    prompt: 'Imagine the sun rising over an open horizon in the early morning. How vivid are the colors and light in your mind?',
  },
  {
    id: 4,
    prompt: 'Picture a bowl of fresh fruit resting on a table, such as a green apple and an orange. How vivid are the shapes and textures?',
  },
  {
    id: 5,
    prompt: 'Imagine walking past the exterior and entrance sign of a local shop or cafe you know well. How clearly can you picture it?',
  },
];

const SCALE_DESCRIPTIONS: Record<number, string> = {
  1: "No image at all, I only know I'm thinking of it",
  2: 'Vague and dim',
  3: 'Moderately clear',
  4: 'Clear and reasonably vivid',
  5: 'Perfectly clear, as vivid as real seeing',
};

export const ImageryStep: React.FC = () => {
  const {
    nextStep,
    prevStep,
    participantId,
    imageryRatings,
    setImageryRating,
    setImageryScore,
  } = useExperimentStore();

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unbiased randomized question order per participant
  const randomizedQuestions = useMemo(() => {
    const list = [...ORIGINAL_IMAGERY_QUESTIONS];
    for (let i = list.length - 1; i > 0; i--) {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const j = buffer[0] % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, []);

  const allAnswered = ORIGINAL_IMAGERY_QUESTIONS.every((q) => Boolean(imageryRatings[q.id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;

    setSaving(true);
    setErrorMessage(null);

    // Calculate mean score (1.00 to 5.00)
    const sum = ORIGINAL_IMAGERY_QUESTIONS.reduce((acc, q) => acc + (imageryRatings[q.id] || 0), 0);
    const meanScore = Number((sum / ORIGINAL_IMAGERY_QUESTIONS.length).toFixed(2));

    try {
      setImageryScore(meanScore);

      // Save imagery score to Supabase if participant is authenticated
      if (participantId && isSupabaseConfigured) {
        const { error } = await supabase
          .from('participants')
          .update({ imagery_score: meanScore })
          .eq('id', participantId);

        if (error) {
          throw new Error(`Failed to save imagery score: ${error.message}`);
        }
      }

      nextStep();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save imagery score.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" role="region" aria-label="Mental Imagery Self-Rating">
      <span className="badge">Phase 2: Baseline Imagery</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
        Mental Imagery Self-Rating
      </h2>
      <p className="lead-text">
        Rate the vividness of the mental pictures that arise for each scenario below.
      </p>

      <div className="description-box" style={{ fontStyle: 'italic', marginBottom: 'var(--space-6)' }}>
        <strong>Note:</strong> This is a self-rating of visual imagery, not a medical or diagnostic test. People naturally vary widely in the vividness of their mental pictures—some experience vivid inner images, while others experience abstract thoughts without pictures.
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
            marginBottom: 'var(--space-6)',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {randomizedQuestions.map((q, idx) => {
            const currentVal = imageryRatings[q.id] || 0;
            return (
              <fieldset
                key={q.id}
                style={{
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <legend
                  style={{
                    padding: '0 var(--space-2)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  Question {idx + 1} of 5
                </legend>

                <p style={{ marginBottom: 'var(--space-4)', fontWeight: 500 }}>
                  {q.prompt}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-3)',
                  }}
                  role="radiogroup"
                  aria-label={`Rating for question ${idx + 1}`}
                >
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const isSelected = currentVal === rating;
                    return (
                      <label
                        key={rating}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: 'var(--space-3) var(--space-2)',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? '2px solid var(--color-accent)'
                            : '1px solid var(--color-surface-border)',
                          backgroundColor: isSelected
                            ? 'var(--color-primary-light)'
                            : 'var(--color-surface-subtle)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          textAlign: 'center',
                        }}
                      >
                        <input
                          type="radio"
                          name={`imagery-q-${q.id}`}
                          value={rating}
                          checked={isSelected}
                          onChange={() => setImageryRating(q.id, rating)}
                          style={{ marginBottom: 'var(--space-2)' }}
                          aria-label={`${rating} - ${SCALE_DESCRIPTIONS[rating]}`}
                        />
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                          {rating}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-muted)',
                            marginTop: 'var(--space-1)',
                            lineHeight: 1.3,
                          }}
                        >
                          {rating === 1 ? '1: No image at all' : rating === 5 ? '5: Perfectly clear & vivid' : SCALE_DESCRIPTIONS[rating]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="button-bar" style={{ marginTop: 'var(--space-8)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={prevStep}
            disabled={saving}
          >
            &larr; Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!allAnswered || saving}
            aria-label="Save ratings and begin study phase"
          >
            {saving ? 'Saving...' : allAnswered ? 'Save & Begin Study Phase 1 &rarr;' : 'Answer all 5 questions to continue'}
          </button>
        </div>
      </form>
    </div>
  );
};
