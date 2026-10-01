// Primary 3D memory palace study scene with full-viewport immersion, dedicated non-overlapping word panel, and responsive camera framing.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { PALACE_LOCI, LocusData } from '../../data/loci';
import { PalaceHouse } from './PalaceHouse';
import { GuidedCameraController } from './GuidedCameraController';
import { FreeWalkCameraController } from './FreeWalkCameraController';
import { OnScreenJoystick } from './OnScreenJoystick';
import { RouteTextFallback } from './RouteTextFallback';
import { isWebGLAvailable } from '../../lib/webglCheck';
import { useTimestampTimer } from '../../hooks/useTimestampTimer';
import { DeleteDataModal } from '../DeleteDataModal';
import { detectDeviceInfo } from '../../lib/deviceDetection';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useExperimentStore } from '../../store/useExperimentStore';

interface OperationalFrameTrackerProps {
  assetsReady: boolean;
  onFirstOperationalFrame: () => void;
}

/**
 * Tracks the very first animation frame rendered strictly AFTER assets are ready
 * (all GLBs loaded or 20s timeout triggered).
 */
const OperationalFrameTracker: React.FC<OperationalFrameTrackerProps> = ({
  assetsReady,
  onFirstOperationalFrame,
}) => {
  const triggeredRef = useRef(false);

  useFrame(() => {
    if (assetsReady && !triggeredRef.current) {
      triggeredRef.current = true;
      onFirstOperationalFrame();
    }
  });

  return null;
};

export interface PalaceStudyCompletionPayload {
  mode: 'guided' | 'freewalk';
  tabHidden: boolean;
  webglFallback: boolean;
  palaceAssetFallback: boolean;
  visitsByLocus: Record<number, number>;
  dwellMsByLocus: Record<number, number>;
  totalVisits: number;
}

interface PalaceSceneProps {
  assignedWords: readonly string[]; // 20 words assigned to loci 1-20
  durationSeconds?: number; // 360 seconds (6 minutes)
  initialLocusIdx?: number;
  cameraPositionOverride?: [number, number, number];
  cameraTargetOverride?: [number, number, number];
  loadTimeoutMs?: number; // 20-second timeout guard
  onComplete: (metadata: PalaceStudyCompletionPayload) => void;
}

export const PalaceScene: React.FC<PalaceSceneProps> = ({
  assignedWords,
  durationSeconds = 360,
  initialLocusIdx = 0,
  cameraPositionOverride,
  cameraTargetOverride,
  loadTimeoutMs = 20000,
  onComplete,
}) => {
  const { participantId, setPalaceUsedFreewalk } = useExperimentStore();
  const [webglSupported] = useState(() => isWebGLAvailable());
  const [useTextFallback] = useState(!webglSupported);
  const [firstOperationalFrameRendered, setFirstOperationalFrameRendered] = useState(false);
  const [assetFallbackTriggered, setAssetFallbackTriggered] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [activeIdx, setActiveIdx] = useState(initialLocusIdx);
  const [isFreeWalk, setIsFreeWalk] = useState(false);
  const [usedFreeWalk, setUsedFreeWalk] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [takeMeThereTrigger, setTakeMeThereTrigger] = useState(0);
  const moveVectorRef = useRef({ x: 0, z: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showExtendedHelp, setShowExtendedHelp] = useState(false);

  // Viewport dimensions for responsive layout
  const [viewportDims, setViewportDims] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Asset loading progress tracking
  const { active: loadingActive, progress, loaded, total } = useProgress();
  const isFullyLoaded = !loadingActive || progress === 100;

  // 20-Second Asset Loading Timeout:
  // If assets have not fully loaded within 20s, activate primitive fallbacks,
  // flag palace_asset_fallback = true, and start the timer on the next operational frame.
  useEffect(() => {
    if (isFullyLoaded || loadTimedOut) return;

    const timeoutId = setTimeout(() => {
      setLoadTimedOut(true);
      setAssetFallbackTriggered(true);
    }, loadTimeoutMs);

    return () => clearTimeout(timeoutId);
  }, [isFullyLoaded, loadTimedOut, loadTimeoutMs]);

  const assetsReady = isFullyLoaded || loadTimedOut;
  const isSceneOperational = firstOperationalFrameRendered;

  // Record device covariates once operational
  const covariatesRecordedRef = useRef(false);
  useEffect(() => {
    if (isSceneOperational && !covariatesRecordedRef.current) {
      covariatesRecordedRef.current = true;
      if (participantId && isSupabaseConfigured) {
        const info = detectDeviceInfo();
        supabase
          .from('participants')
          .update({
            viewport_w: info.viewport_w,
            viewport_h: info.viewport_h,
            device_class: info.device_class,
            input_type: info.input_type,
          })
          .eq('id', participantId)
          .then();
      }
    }
  }, [isSceneOperational, participantId]);

  // Analytics: dwell times and visit counts
  const visitsByLocusRef = useRef<Record<number, number>>({ 1: 1 });
  const dwellMsByLocusRef = useRef<Record<number, number>>({});
  const lastLocusTimestampRef = useRef<number>(Date.now());
  const completedRef = useRef(false);
  const lastNavTimeRef = useRef<number>(0);

  // Record dwell time for previous locus when transitioning
  const recordDwell = useCallback((prevIndex: number, nextIndex: number) => {
    const prevLocusId = PALACE_LOCI[prevIndex].id;
    const nextLocusId = PALACE_LOCI[nextIndex].id;
    const now = Date.now();
    const elapsed = now - lastLocusTimestampRef.current;

    dwellMsByLocusRef.current[prevLocusId] =
      (dwellMsByLocusRef.current[prevLocusId] || 0) + elapsed;
    visitsByLocusRef.current[nextLocusId] =
      (visitsByLocusRef.current[nextLocusId] || 0) + 1;
    lastLocusTimestampRef.current = now;
  }, []);

  // Navigation handlers with wrapping (20 -> 1, 1 -> 20) and rapid-tap debounce (150ms)
  const handleNextLocus = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 150) return; // Prevent double-trigger debounce
    lastNavTimeRef.current = now;

    setActiveIdx((current) => {
      const next = (current + 1) % PALACE_LOCI.length;
      recordDwell(current, next);
      return next;
    });
  }, [recordDwell]);

  const handlePrevLocus = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 150) return;
    lastNavTimeRef.current = now;

    setActiveIdx((current) => {
      const prev = (current - 1 + PALACE_LOCI.length) % PALACE_LOCI.length;
      recordDwell(current, prev);
      return prev;
    });
  }, [recordDwell]);

  const handleSelectLocus = useCallback(
    (targetIdx: number) => {
      const now = Date.now();
      if (now - lastNavTimeRef.current < 150) return;
      lastNavTimeRef.current = now;

      setActiveIdx((current) => {
        if (targetIdx === current) return current;
        recordDwell(current, targetIdx);
        return targetIdx;
      });
    },
    [recordDwell]
  );

  // Keyboard navigation shortcuts: Space or N (Next), P (Prev) in both modes; Arrow keys in guided mode
  useEffect(() => {
    if (useTextFallback) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore auto-repeat when holding down key

      // Never intercept when user is focused inside a text input or textarea
      const target = document.activeElement;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.getAttribute('contenteditable') === 'true';
      if (isInput) return;

      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();

      // Space or N advances Next; P advances Prev (works in BOTH modes!)
      if (code === 'space' || key === ' ' || key === 'n' || (!isFreeWalk && key === 'arrowright')) {
        e.preventDefault(); // Prevent page scrolling on Space
        handleNextLocus();
      } else if (key === 'p' || (!isFreeWalk && key === 'arrowleft')) {
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
      palaceAssetFallback: assetFallbackTriggered || loadTimedOut,
      visitsByLocus: visitsByLocusRef.current,
      dwellMsByLocus: dwellMsByLocusRef.current,
      totalVisits,
    });
  };

  // Study Timer: Starts ONLY when all models have loaded AND the first 3D frame has rendered
  const { formattedTime, tabHidden, remainingSeconds } = useTimestampTimer({
    durationSeconds,
    isActive: isSceneOperational || useTextFallback,
    onExpire: () => handleSessionExpire(tabHidden),
  });

  const handleToggleFreeWalk = () => {
    setIsFreeWalk((prev) => {
      const next = !prev;
      if (next) {
        setUsedFreeWalk(true);
        setPalaceUsedFreewalk(true);
        if (participantId && isSupabaseConfigured) {
          supabase
            .from('participants')
            .update({ palace_used_freewalk: true })
            .eq('id', participantId)
            .then(() => {}, () => {});
        }
      }
      return next;
    });
  };

  const handleTakeMeThere = () => {
    setTakeMeThereTrigger((prev) => prev + 1);
  };

  const handleRecenter = () => {
    setRecenterTrigger((prev) => prev + 1);
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
            palaceAssetFallback: false,
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

  // Determine layout mode based on real viewport
  const isDesktop = viewportDims.width >= 900 && viewportDims.height >= 500;
  const isPhoneLandscape = viewportDims.height < 500 && viewportDims.width >= 500;
  const isMobilePortrait = !isDesktop && !isPhoneLandscape;

  return (
    <div
      ref={containerRef}
      className="palace-study-fullscreen"
      role="region"
      aria-label="3D Memory Palace Study Session"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 50,
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {/* 1. SLIM TOP BAR */}
      <header
        style={{
          height: '48px',
          minHeight: '48px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding:
            '0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))',
          zIndex: 60,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Left: Timer + Locus Index */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontFamily: 'var(--font-family-mono, monospace)',
              fontSize: '15px',
              fontWeight: 800,
              padding: '3px 10px',
              backgroundColor:
                remainingSeconds <= 30 ? '#fee2e2' : '#e0e7ff',
              color: remainingSeconds <= 30 ? '#dc2626' : '#4338ca',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            aria-live="polite"
          >
            <span>⏱</span>
            <span>{formattedTime}</span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Locus <span style={{ color: '#4f46e5' }}>#{currentLocus.id}</span> of 20
          </div>
        </div>

        {/* Center: Progress Dots (visible when width >= 680px) */}
        {viewportDims.width >= 680 && (
          <nav
            aria-label="Locus route progress"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {PALACE_LOCI.map((loc, idx) => {
              const isCurrent = idx === activeIdx;
              const isVisited = visitsByLocusRef.current[loc.id] > 0;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocus(idx)}
                  title={`Jump to Locus #${loc.id}: ${loc.name} (${loc.room})`}
                  style={{
                    width: isCurrent ? '18px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: isCurrent
                      ? '#4f46e5'
                      : isVisited
                      ? '#818cf8'
                      : '#cbd5e1',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label={`Locus ${loc.id}: ${loc.name}`}
                  aria-current={isCurrent ? 'step' : undefined}
                />
              );
            })}
          </nav>
        )}

        {/* Right: Controls & Delete Data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFreeWalk && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTakeMeThere}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                minHeight: '32px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                borderColor: '#c7d2fe',
              }}
              title="Fly camera directly to current locus"
              aria-label="Take me to current locus"
            >
              📍 Take me there
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRecenter}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '32px',
            }}
            title="Reset camera to ideal locus angle"
            aria-label="Recenter camera on current locus"
          >
            🎯 Recenter
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleToggleFreeWalk}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '32px',
            }}
            disabled={!isSceneOperational}
            aria-label="Toggle between guided tour and free walk mode"
          >
            {isFreeWalk ? 'Exit Free-Walk' : 'Free-Walk'}
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: '4px 6px',
            }}
            aria-label="Delete my data"
          >
            Delete Data
          </button>
        </div>
      </header>

      {/* 2. MAIN STUDY VIEWPORT (NON-OVERLAPPING 3D SCENE & WORD PANEL) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isDesktop
            ? 'row'
            : isPhoneLandscape
            ? 'row'
            : 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 3D CANVAS CONTAINER */}
        <div
          data-testid="palace-canvas-area"
          style={{
            flex: isDesktop ? 1 : isPhoneLandscape ? 1 : undefined,
            width: isDesktop || isPhoneLandscape ? undefined : '100%',
            height: isMobilePortrait ? '70%' : '100%',
            position: 'relative',
            backgroundColor: '#f1f5f9',
            touchAction: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Loading Progress Bar Overlay */}
          {!isSceneOperational && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                zIndex: 40,
                padding: '24px',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                Loading 3D Memory Palace...
              </div>

              {/* Visual progress bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '8px 0',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(8, Math.round(progress))}%`,
                    height: '100%',
                    backgroundColor: '#4f46e5',
                    transition: 'width 0.2s ease',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '8px',
                }}
              >
                {Math.round(progress)}% {total > 0 ? `(${loaded}/${total} furniture models)` : ''}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  textAlign: 'center',
                  maxWidth: '360px',
                }}
              >
                ⏱ The {Math.round(durationSeconds / 60)}-minute study countdown starts once all 3D assets have fully loaded.
              </div>
            </div>
          )}

          {/* Virtual Joystick for mobile/touch free-walk navigation */}
          {isFreeWalk &&
            (isMobilePortrait ||
              isPhoneLandscape ||
              (typeof window !== 'undefined' &&
                ('ontouchstart' in window || navigator.maxTouchPoints > 0))) && (
              <OnScreenJoystick moveVectorRef={moveVectorRef} />
            )}

          <Canvas
            dpr={[1, 1.5]}
            shadows={false}
            camera={{ fov: 65, near: 0.1, far: 60, position: [0, 1.6, -11] }}
            gl={{ antialias: true, powerPreference: 'default' }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Soft, clean, bright daylight atmosphere (no dark navy gloom) */}
            <color attach="background" args={['#f1f5f9']} />
            <fog attach="fog" args={['#f1f5f9', 24, 60]} />

            {/* Warm hemisphere ambient light: crisp white sky with soft slate floor bounce */}
            <hemisphereLight args={['#ffffff', '#94a3b8', 1.25]} />

            {/* Warm sunlight directional light */}
            <directionalLight position={[12, 18, 10]} intensity={1.1} color="#fffbeb" />

            {/* Subtle cool fill light to illuminate opposite room angles */}
            <directionalLight position={[-10, 14, -8]} intensity={0.45} color="#e0e7ff" />

            {/* 3D House Layout & 20 Loci with CC0 Model support */}
            <PalaceHouse
              activeLocusId={currentLocus.id}
              assignedWords={assignedWords}
              forcePrimitiveFallback={assetFallbackTriggered || loadTimedOut}
              onAssetFallback={() => setAssetFallbackTriggered(true)}
            />

            {/* Operational Frame Tracker: starts on first useFrame strictly AFTER assetsReady */}
            <OperationalFrameTracker
              assetsReady={assetsReady}
              onFirstOperationalFrame={() => setFirstOperationalFrameRendered(true)}
            />

            {/* Guided Tour Camera or Optional Free-Walk */}
            {!isFreeWalk ? (
              <GuidedCameraController
                activeLocusId={currentLocus.id}
                recenterTrigger={recenterTrigger}
                cameraPositionOverride={cameraPositionOverride}
                cameraTargetOverride={cameraTargetOverride}
              />
            ) : (
              <FreeWalkCameraController
                isFreeWalk={isFreeWalk}
                takeMeThereTrigger={takeMeThereTrigger}
                targetLocusPosition={currentLocus.position}
                targetCameraPosition={currentLocus.cameraPosition}
                moveVectorRef={moveVectorRef}
              />
            )}
          </Canvas>
        </div>

        {/* DEDICATED WORD PANEL (NEVER OVERLAPS THE 3D SCENE) */}
        <aside
          data-testid="palace-word-panel"
          role="region"
          aria-label="Active Locus Word Prompt"
          style={{
            width: isDesktop ? '350px' : isPhoneLandscape ? '40%' : '100%',
            height: isMobilePortrait ? '30%' : '100%',
            minHeight: isMobilePortrait ? '185px' : undefined,
            backgroundColor: '#ffffff',
            borderLeft: isDesktop || isPhoneLandscape ? '1px solid #e2e8f0' : 'none',
            borderTop: isMobilePortrait ? '1px solid #e2e8f0' : 'none',
            boxShadow: isMobilePortrait
              ? '0 -4px 16px rgba(0,0,0,0.06)'
              : '-4px 0 16px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: isPhoneLandscape ? '10px 14px' : '16px 20px',
            zIndex: 30,
            overflowY: 'auto',
          }}
        >
          {/* 1. Locus Name + Room Header */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6366f1',
                marginBottom: '2px',
              }}
            >
              Locus #{currentLocus.id} &bull; {currentLocus.room}
            </div>

            <h1
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#1e293b',
                margin: 0,
              }}
            >
              {currentLocus.name}
            </h1>
          </div>

          {/* 2. THE WORD: Large, high contrast, clamp-sized, never truncated */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '4px 0',
            }}
          >
            <div
              data-testid="palace-assigned-word"
              style={{
                fontSize: isPhoneLandscape
                  ? 'clamp(1.8rem, 4.5vw, 2.4rem)'
                  : 'clamp(2.1rem, 5.5vw, 3.25rem)',
                fontWeight: 900,
                color: '#1e1b4b',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                textAlign: 'center',
                textTransform: 'uppercase',
                wordBreak: 'break-word',
              }}
            >
              {currentAssignedWord}
            </div>
          </div>

          {/* 3. Short Prompt Line & Optional Help Toggle */}
          <div style={{ textAlign: 'center', margin: '2px 0' }}>
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>💡 Picture this word doing something bizarre here.</span>
              {activeIdx >= 3 && (
                <button
                  type="button"
                  onClick={() => setShowExtendedHelp((prev) => !prev)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Toggle mnemonic tips"
                  aria-label="Toggle mnemonic tips"
                >
                  ?
                </button>
              )}
            </div>

            {/* Extended Help Tip (collapsible after locus 3) */}
            {(activeIdx < 3 || showExtendedHelp) && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#475569',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginTop: '6px',
                  textAlign: 'left',
                  lineHeight: 1.4,
                }}
              >
                Connect <strong>{currentAssignedWord}</strong> with the <strong>{currentLocus.name}</strong>.
                Exaggerate size, movement, or absurdity to make it unforgettable.
              </div>
            )}
          </div>

          {/* 4. Prev / Next Navigation Buttons (min 48px tap targets) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '4px',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {isFreeWalk && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTakeMeThere}
                style={{
                  minHeight: '38px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  borderColor: '#c7d2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                aria-label={`Take me to Locus ${currentLocus.id}: ${currentLocus.name}`}
              >
                <span>📍</span>
                <span>Take me to #{currentLocus.id} ({currentLocus.name})</span>
              </button>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrevLocus}
                style={{
                  minHeight: '48px',
                  minWidth: '90px',
                  padding: '0 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Previous locus (P)"
              >
                &larr; Prev (P)
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNextLocus}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  padding: '0 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Next locus (Space or N)"
              >
                Next Locus (Space / N) &rarr;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Data Modal */}
      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
