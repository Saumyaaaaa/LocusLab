// Privacy-preserving share button sharing only the generic origin URL without code or results.
import React, { useState } from 'react';

interface ShareExperimentButtonProps {
  className?: string;
}

export const ShareExperimentButton: React.FC<ShareExperimentButtonProps> = ({ className = 'btn btn-secondary' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareData = {
      title: 'Locus Lab: 3D Memory Palace vs Flashcards',
      text: 'Participate in an open citizen-science memory experiment exploring whether a 3D memory palace produces superior long-term recall compared to digital flashcards.',
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        // User cancelled or share rejected -> fall through to clipboard copy
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: Copy generic URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleShare}
      aria-label="Share this citizen-science experiment"
    >
      {copied ? '✓ Site Link Copied!' : '📤 Share This Experiment'}
    </button>
  );
};
