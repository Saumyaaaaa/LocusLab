// Floating in-scene 3D label for the ACTIVE locus displaying #n Locus Name and the assigned word,
// with occlude={false}, pointer-events: none, responsive font size, viewport edge clamping, and reduced-motion support.
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { LocusData } from '../../data/loci';

interface ActiveLocusWordLabelProps {
  locus: LocusData;
  assignedWord: string;
}

export const ActiveLocusWordLabel: React.FC<ActiveLocusWordLabelProps> = ({ locus, assignedWord }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Check prefers-reduced-motion media query
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute target world position directly above the locus furniture
  const targetWorldPos = useMemo(() => {
    const p = new THREE.Vector3(...locus.position);
    // Position comfortably above the object silhouette (min 1.15m height)
    p.y += Math.max(locus.dimensions[1] + 0.35, 1.15);
    return p;
  }, [locus]);

  // In each frame, project 3D position to Normalized Device Coordinates (NDC)
  // and clamp so the label NEVER exceeds canvas bounds on any viewport (360x640, 844x390, etc.)
  useFrame(() => {
    if (!groupRef.current) return;

    const proj = targetWorldPos.clone().project(camera);

    // If point is in front of camera (proj.z < 1)
    if (proj.z < 1) {
      // Clamped NDC safe boundaries:
      // X between -0.80 and 0.80 (leaves margin on left/right for card width)
      // Y between -0.80 and 0.72 (leaves margin at top for card height)
      const safeX = Math.min(0.8, Math.max(-0.8, proj.x));
      const safeY = Math.min(0.72, Math.max(-0.8, proj.y));

      if (safeX !== proj.x || safeY !== proj.y) {
        const clampedNDC = new THREE.Vector3(safeX, safeY, proj.z);
        clampedNDC.unproject(camera);
        groupRef.current.position.copy(clampedNDC);
      } else {
        groupRef.current.position.copy(targetWorldPos);
      }
    } else {
      groupRef.current.position.copy(targetWorldPos);
    }
  });

  return (
    <group ref={groupRef} position={targetWorldPos}>
      <Html
        center
        occlude={false}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          cursor: 'default',
        }}
      >
        <div
          data-testid="active-locus-floating-label"
          className="active-locus-label-card"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.94)', // Solid dark slate #0f172a
            border: '2px solid #6366f1', // High-contrast glowing indigo border
            borderRadius: '12px',
            padding: '8px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(99, 102, 241, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            maxWidth: 'min(90vw, 360px)',
            boxSizing: 'border-box',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            animation: prefersReducedMotion ? 'none' : 'floatPulse 3s ease-in-out infinite',
          }}
        >
          {/* Header: #n Locus Name */}
          <div
            data-testid="active-locus-label-header"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#a5b4fc', // Light indigo for crisp visibility
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            #{locus.id} &bull; {locus.name}
          </div>

          {/* Word: Large, bold, high contrast, clamp-sized */}
          <div
            data-testid="active-locus-word-text"
            style={{
              fontSize: 'clamp(1.25rem, 4vw, 2.25rem)',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#ffffff',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {assignedWord}
          </div>
        </div>
      </Html>
    </group>
  );
};
