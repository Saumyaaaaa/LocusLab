// Session 1 completion view presenting participant code, return link, calendar download, and same-browser advisory.
import React, { useState } from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { downloadCalendarReminder } from '../lib/calendarReminder';

export const SessionDoneStep: React.FC = () => {
  const { participantCode, studyCompletedAt, nextStep } = useExperimentStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadedCalendar, setDownloadedCalendar] = useState(false);

  const returnUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/return?code=${participantCode || ''}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(returnUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
    }
  };

  const handleDownloadCalendar = () => {
    if (!participantCode) return;
    downloadCalendarReminder(participantCode, studyCompletedAt || undefined);
    setDownloadedCalendar(true);
  };

  return (
    <div className="card" role="region" aria-label="Session 1 Complete">
      <span className="badge">Session 1 Completed</span>
      <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
        Day 1 Complete — Great Job!
      </h2>
      <p className="lead-text">
        Your immediate recall responses have been safely recorded. The primary outcome of this experiment evaluates how much information remains accessible after sleep (at 24 hours) and after one week (at 7 days).
      </p>

      {/* Critical Same-Browser Advisory Warning */}
      <div
        role="alert"
        style={{
          backgroundColor: 'var(--color-warning-bg)',
          borderLeft: '4px solid var(--color-warning)',
          color: 'var(--color-warning)',
          padding: 'var(--space-4) var(--space-6)',
          borderRadius: 'var(--radius-md)',
          margin: 'var(--space-6) 0',
          lineHeight: 1.6,
        }}
      >
        <strong>⚠️ Crucial: Use the SAME browser on this device when returning</strong>
        <p style={{ marginTop: 'var(--space-2)' }}>
          Because this is an anonymous citizen-science project, you did not create a username or password. Your anonymous authentication session is stored locally inside <strong>this specific browser</strong>.
        </p>
        <p style={{ marginTop: 'var(--space-2)' }}>
          <strong>The 8-character code alone does not log you in on a different device or browser.</strong> You must open your return link in this exact browser to access your 24-hour and 7-day tests.
        </p>
      </div>

      {/* Participant Code and Link Box */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          border: '2px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
          YOUR PARTICIPANT CODE
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: '0.15em',
            marginBottom: 'var(--space-4)',
          }}
        >
          {participantCode || 'N/A'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopyLink}
            aria-label="Copy return link to clipboard"
          >
            {copiedLink ? '✓ Return Link Copied!' : '🔗 Copy Return Link'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadCalendar}
            aria-label="Download calendar reminders"
          >
            {downloadedCalendar ? '✓ Calendar File Downloaded (.ics)' : '📅 Download Calendar Reminder (.ics)'}
          </button>
        </div>
      </div>

      <div className="button-bar">
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Next recall test opens in 24 hours (tested in Prompt 6).
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={nextStep}
          aria-label="Preview return test"
        >
          Preview Return Test (Prompt 6) &rarr;
        </button>
      </div>
    </div>
  );
};
