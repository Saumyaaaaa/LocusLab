// Accessible modal requiring explicit DELETE confirmation to cascade-remove all participant rows and sign out.
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useExperimentStore } from '../store/useExperimentStore';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ isOpen, onClose, onDeleted }) => {
  const { participantId, reset } = useExperimentStore();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      if (participantId && isSupabaseConfigured) {
        // Strict RLS delete: ON DELETE CASCADE removes sessions and responses automatically
        const { error } = await supabase.from('participants').delete().eq('id', participantId);
        if (error) {
          throw new Error(error.message);
        }
      }

      // Sign out and wipe client state
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      reset();
      sessionStorage.clear();

      setIsDeleted(true);
      if (onDeleted) onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete data. Please try again.';
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleted) {
      window.location.href = '/';
      return;
    }
    setConfirmationInput('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '32rem',
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}
      >
        {isDeleted ? (
          <div>
            <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}>
              Data Erased
            </span>
            <h2 id="delete-modal-title" className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
              All Your Data Has Been Deleted
            </h2>
            <p className="lead-text" style={{ fontSize: 'var(--font-size-base)', margin: 'var(--space-3) 0' }}>
              Your participant record, imagery scores, session logs, and all word recall responses have been permanently removed from our database.
            </p>
            <div className="button-bar">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <div>
            <span className="badge" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>
              Irreversible Action
            </span>
            <h2 id="delete-modal-title" className="title-lg" style={{ marginTop: 'var(--space-3)', color: 'var(--color-danger)' }}>
              Delete All My Data
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 'var(--space-3) 0' }}>
              This will permanently delete your participant record, test sessions, and all word recall responses from the database. <strong>This action cannot be undone.</strong>
            </p>

            {errorMessage && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  borderLeft: '4px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {errorMessage}
              </div>
            )}

            <div style={{ margin: 'var(--space-4) 0' }}>
              <label
                htmlFor="delete-confirm-input"
                style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}
              >
                Type <code>DELETE</code> to confirm:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  fontFamily: 'var(--font-family-mono)',
                  letterSpacing: '0.1em',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-surface-border)',
                }}
              />
            </div>

            <div className="button-bar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: isConfirmed ? 'var(--color-danger)' : 'var(--color-surface-border)',
                  color: '#fff',
                  cursor: isConfirmed && !isDeleting ? 'pointer' : 'not-allowed',
                }}
                disabled={!isConfirmed || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete My Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
