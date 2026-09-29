// Interruption notice banner displayed when a participant refreshes mid-session, advancing them to preserve study time integrity.
import React from 'react';

interface InterruptionNoticeProps {
  onDismiss: () => void;
}

export const InterruptionNotice: React.FC<InterruptionNoticeProps> = ({ onDismiss }) => {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--color-danger-bg)',
        borderLeft: '4px solid var(--color-danger)',
        color: 'var(--color-danger)',
        padding: 'var(--space-4) var(--space-6)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}
    >
      <div>
        <strong>⚠️ Session Interrupted:</strong>
        <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
          The page was refreshed during a timed phase. To prevent unfair rehearsal time, the previous study phase cannot be restarted and has been advanced.
        </p>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onDismiss}
        style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}
      >
        Dismiss
      </button>
    </div>
  );
};
