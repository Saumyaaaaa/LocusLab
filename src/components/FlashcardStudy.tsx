// Flashcard study mode presenting one word at a time with keyboard controls, timestamp countdown, and tab visibility monitoring.
import React, { useState, useEffect } from 'react';
import { WordItem } from '../data/lists';
import { useTimestampTimer } from '../hooks/useTimestampTimer';

interface FlashcardStudyProps {
  words: readonly WordItem[];
  title?: string;
  durationSeconds?: number; // 360 seconds (6 minutes)
  onComplete: (metadata: { tabHidden: boolean }) => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  words,
  title = 'Flashcard Study Mode',
  durationSeconds = 360,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: true,
    onExpire: () => onComplete({ tabHidden }),
  });

  const currentWord = words[currentIndex] || words[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words.length]);

  return (
    <div className="card" role="region" aria-label="Flashcard Study Session">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span className="badge">{title}</span>
        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            padding: 'var(--space-1) var(--space-4)',
            backgroundColor: remainingSeconds <= 30 ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
            color: remainingSeconds <= 30 ? 'var(--color-danger)' : 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
          aria-live="polite"
          aria-label={`Time remaining: ${formattedTime}`}
        >
          ⏱ {formattedTime}
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: 'var(--space-4) 0' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Card {currentIndex + 1} of {words.length}
        </span>
      </div>

      {/* Main Flashcard Display */}
      <div
        style={{
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6) var(--space-4)',
          margin: 'var(--space-4) 0 var(--space-6)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(2.2rem, 8vw, 3.25rem)',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: 'var(--color-primary)',
            textTransform: 'lowercase',
            textAlign: 'center',
            wordBreak: 'break-word',
          }}
          aria-label={`Current word: ${currentWord.word}`}
        >
          {currentWord.word}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)', marginTop: 'var(--space-3)' }}>
          {currentWord.letters} letters • {currentWord.syllables} syllable{currentWord.syllables > 1 ? 's' : ''}
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="button-bar" style={{ justifyContent: 'center', gap: 'var(--space-3)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrev}
          aria-label="Previous flashcard"
          style={{ minHeight: '48px' }}
        >
          &larr; Previous (Left Arrow)
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          aria-label="Next flashcard"
          style={{ minHeight: '48px' }}
        >
          Next Word (Right Arrow / Space) &rarr;
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        Study all 20 words until the 6-minute timer concludes. The app will automatically proceed when time is up.
      </div>
    </div>
  );
};
