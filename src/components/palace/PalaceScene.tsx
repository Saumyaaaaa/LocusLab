// Primary 3D memory palace study scene orchestrating R3F Canvas, guided tour, dwell analytics, and accessible fallback.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { PALACE_LOCI, LocusData } from '../../data/loci';
import { PalaceHouse } from './PalaceHouse';
import { GuidedCameraController } from './GuidedCameraController';
import { RouteTextFallback } from './RouteTextFallback';
import { isWebGLAvailable } from '../../lib/webglCheck';
import { useTimestampTimer } from '../../hooks/useTimestampTimer';

export interface PalaceStudyCompletionPayload {
  mode: 'guided' | 'freewalk';
  tabHidden: boolean;
  webglFallback: boolean;
  visitsByLocus: Record<number, number>;
  dwellMsByLocus: Record<number, number>;
  totalVisits: number;
}

interface PalaceSceneProps {
  assignedWords: readonly string[]; // 20 words assigned to loci 1-20
  durationSeconds?: number; // 360 seconds (6 minutes)
  onComplete: (metadata: PalaceStudyCompletionPayload) => void;
}

export const PalaceScene: React.FC<PalaceSceneProps> = ({
  assignedWords,
  durationSeconds = 360,
  onComplete,
}) => {
  const [webglSupported] = useState(() => isWebGLAvailable());
  const [useTextFallback, setUseTextFallback] = useState(!webglSupported);
  const [sceneReady, setSceneReady] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFreeWalk, setIsFreeWalk] = useState(false);
  const [usedFreeWalk, setUsedFreeWalk] = useState(false);

  // Analytics: dwell times and visit counts
  const visitsByLocusRef = useRef<Record<number, number>>({ 1: 1 });
  const dwellMsByLocusRef = useRef<Record<number, number>>({});
  const lastLocusTimestampRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Record dwell time for previous locus when transitioning
  const recordDwell = useCallback((prevIndex: number, nextIndex: number) => {
    const prevLocusId = PALACE_LOCI[prevIndex].id;
    const nextLocusId = PALACE_LOCI[nextIndex].id;
    const now = Date.now();
    const elapsed = now - lastLocusTimestampRef.current;

    dwellMsByLocusRef.current[prevLocusId] = (dwellMsByLocusRef.current[prevLocusId] || 0) + elapsed;
    visitsByLocusRef.current[nextLocusId] = (visitsByLocusRef.current[nextLocusId] || 0) + 1;
    lastLocusTimestampRef.current = now;
  }, []);

  const handleNextLocus = useCallback(() => {
    setActiveIdx((current) => {
      const next = (current + 1) % PALACE_LOCI.length;
      recordDwell(current, next);
      return next;
    });
  }, [recordDwell]);

  const handlePrevLocus = useCallback(() => {
    setActiveIdx((current) => {
      const prev = (current - 1 + PALACE_LOCI.length) % PALACE_LOCI.length;
      recordDwell(current, prev);
      return prev;
    });
  }, [recordDwell]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (useTextFallback) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is in an input or free-walk
      if (isFreeWalk) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextLocus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextLocus, handlePrevLocus, isFreeWalk, useTextFallback]);

  // Finish study session callback
  const handleSessionExpire = (tabHidden: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Record final dwell time
    const currentLocusId = PALACE_LOCI[activeIdx].id;
    const finalElapsed = Date.now() - lastLocusTimestampRef.current;
    dwellMsByLocusRef.current[currentLocusId] =
      (dwellMsByLocusRef.current[currentLocusId] || 0) + finalElapsed;

    const totalVisits = Object.values(visitsByLocusRef.current).reduce((a, b) => a + b, 0);

    onComplete({
      mode: usedFreeWalk ? 'freewalk' : 'guided',
      tabHidden,
      webglFallback: false,
      visitsByLocus: visitsByLocusRef.current,
      dwellMsByLocus: dwellMsByLocusRef.current,
      totalVisits,
    });
  };

  // 6-Minute Timer: Starts ONLY when the 3D scene renders its first frame
  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: sceneReady || useTextFallback,
    onExpire: () => handleSessionExpire(tabHidden),
  });

  const handleToggleFreeWalk = () => {
    setIsFreeWalk((prev) => {
      const next = !prev;
      if (next) setUsedFreeWalk(true);
      return next;
    });
  };

  if (useTextFallback) {
    return (
      <RouteTextFallback
        assignedWords={assignedWords}
        durationSeconds={durationSeconds}
        onComplete={(meta) =>
          onComplete({
            mode: 'guided',
            tabHidden: meta.tabHidden,
            webglFallback: true,
            visitsByLocus: {},
            dwellMsByLocus: {},
            totalVisits: 20,
          })
        }
      />
    );
  }

  const currentLocus: LocusData = PALACE_LOCI[activeIdx];
  const currentAssignedWord = assignedWords[activeIdx] || '';

  return (
    <div
      className="card"
      role="region"
      aria-label="3D Memory Palace Study Session"
      style={{ padding: 'var(--space-4)', position: 'relative' }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-3)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="badge">Memory Palace (6 Minutes)</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Mode: <strong>{isFreeWalk ? 'Free-Walk' : 'Guided Tour (Standard)'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleToggleFreeWalk}
            style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-xs)' }}
            aria-label="Toggle between guided tour and free walk mode"
          >
            {isFreeWalk ? 'Exit Free-Walk' : 'Free-Walk Mode (WASD)'}
          </button>

          <div
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              padding: 'var(--space-1) var(--space-3)',
              backgroundColor: remainingSeconds <= 30 ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
              color: remainingSeconds <= 30 ? 'var(--color-danger)' : 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
            }}
            aria-live="polite"
          >
            ⏱ {formattedTime}
          </div>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          border: '1px solid var(--color-surface-border)',
        }}
      >
        {!sceneReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              backgroundColor: '#0f172a',
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Constructing 3D Memory Palace...
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#94a3b8' }}>
              Preparing route and loci geometry
            </div>
          </div>
        )}

        <Canvas
          dpr={[1, 1.5]}
          shadows={false}
          camera={{ fov: 65, near: 0.1, far: 50, position: [0, 1.6, -11] }}
          gl={{ antialias: true, powerPreference: 'default' }}
        >
          {/* Calm ambient and directional lighting */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 20, 10]} intensity={1.0} />

          {/* 3D House Layout & 20 Loci */}
          <PalaceHouse
            activeLocusId={currentLocus.id}
            assignedWords={assignedWords}
          />

          {/* Guided Tour Camera or Optional Free-Walk */}
          {!isFreeWalk ? (
            <GuidedCameraController
              activeLocusId={currentLocus.id}
              onFirstFrameRendered={() => setSceneReady(true)}
            />
          ) : (
            <PointerLockControls />
          )}
        </Canvas>

        {/* Floating Active Word HUD Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-3)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 24px)',
            maxWidth: '560px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            border: '1px solid var(--color-surface-border)',
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
            Locus #{currentLocus.id} of 20: <strong>{currentLocus.name}</strong> ({currentLocus.room})
          </div>

          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '0.05em',
              margin: '2px 0',
            }}
          >
            {currentAssignedWord}
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            💡 <em>Imagine this word doing something bizarre or vivid at the {currentLocus.name}.</em>
          </div>

          {/* Bottom HUD Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevLocus}
              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-xs)' }}
              aria-label="Previous locus"
            >
              &larr; Prev (Left Arrow)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextLocus}
              style={{ padding: 'var(--space-1) var(--space-4)', fontSize: 'var(--font-size-xs)' }}
              aria-label="Next locus"
            >
              Next Locus (Space / Tap) &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility text fallback toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-3)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <span>
          Tip: You can loop through all 20 loci as many times as you like until the 6-minute timer concludes.
        </span>
        <button
          type="button"
          onClick={() => setUseTextFallback(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Skip 3D and use text-route mode instead
        </button>
      </div>
    </div>
  );
};
