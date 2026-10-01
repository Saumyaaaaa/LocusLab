import React, { Component, ReactNode, Suspense, useMemo, useEffect } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LocusData } from '../../data/loci';

interface ErrorBoundaryProps {
  fallback: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches asset loading failures (e.g. 404 missing model) and renders primitive fallback.
 */
export class LocusModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface GLBModelProps {
  modelFile: string;
  isActive: boolean;
  dimensions: [number, number, number];
}

/**
 * Inner component that loads GLB via Drei useGLTF, normalizes scale, and aligns base to floor (y = 0).
 */
const GLBModel: React.FC<GLBModelProps> = ({ modelFile, isActive, dimensions }) => {
  const { scene } = useGLTF(`/models/${modelFile}`);

  const isBearSculpture = modelFile === 'bear.glb';

  // Clone scene so multiple loci or shared meshes do not conflict
  const cloned = useMemo(() => {
    const clone = scene.clone(true);

    // Safeguard: remove any node containing "pillow"
    clone.traverse((child: any) => {
      if (child.name && child.name.toLowerCase().includes('pillow')) {
        child.visible = false;
        child.removeFromParent?.();
      }
    });

    // 1. Calculate bounding box of raw geometry
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (isBearSculpture) {
      // Scale bear head sculpture to ~0.7m width
      const scale = 0.75 / (Math.max(size.x, size.y) || 1);
      clone.scale.set(scale, scale, scale);

      // Center horizontally and ground at top of pedestal (y = 0.85m)
      const scaledBox = new THREE.Box3().setFromObject(clone);
      const center = scaledBox.getCenter(new THREE.Vector3());
      clone.position.x = -center.x;
      clone.position.y = 0.85 - scaledBox.min.y;
      clone.position.z = -center.z;
    } else {
      // 2. Uniform scale so the largest dimension matches target dimension
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        const maxTargetDim = Math.max(...dimensions);
        const maxModelDim = Math.max(size.x, size.y, size.z);
        if (maxModelDim > 0) {
          const scale = maxTargetDim / maxModelDim;
          clone.scale.set(scale, scale, scale);
        }
      }

      // 3. Grounding: offset model so its lowest vertex sits at y = 0
      const scaledBox = new THREE.Box3().setFromObject(clone);
      clone.position.y = -scaledBox.min.y;
    }

    return clone;
  }, [scene, dimensions, isBearSculpture]);

  // Apply subtle active highlight emissive tint
  useEffect(() => {
    if (cloned) {
      cloned.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          if (isActive) {
            child.material.emissive = new THREE.Color(0x312e81);
            child.material.emissiveIntensity = 0.35;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }
  }, [cloned, isActive]);

  if (isBearSculpture) {
    return (
      <group>
        {/* Gallery column display pedestal */}
        <mesh position={[0, 0.425, 0]}>
          <boxGeometry args={[0.42, 0.85, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Gallery pedestal upper molding cap */}
        <mesh position={[0, 0.86, 0]}>
          <boxGeometry args={[0.48, 0.03, 0.48]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.15} />
        </mesh>
        <primitive object={cloned} />
      </group>
    );
  }

  return <primitive object={cloned} />;
};

interface LocusModelProps {
  locus: LocusData;
  isActive: boolean;
  assignedWord: string;
  showFloatingWord?: boolean;
  forceFallback?: boolean;
  onFallback?: () => void;
}

/**
 * Primary Locus component:
 * 1. Renders grounding blob shadow
 * 2. Attempts to load CC0 .glb model inside ErrorBoundary + Suspense
 * 3. Falls back immediately to clean primitive shape if .glb is absent, fails, or timed out
 * 4. Renders active glowing floor ring
 * 5. Floating in-scene 3D label: full word label ONLY on active locus; small number badge on the other 19
 */
export const LocusModel: React.FC<LocusModelProps> = ({
  locus,
  isActive,
  assignedWord: _assignedWord,
  showFloatingWord = true,
  forceFallback = false,
  onFallback,
}) => {
  // Height and bounding radius for shadows and markers
  const baseRadius = Math.max(locus.dimensions[0], locus.dimensions[2]) * 0.55;
  const shadowRadius = Math.max(0.45, baseRadius);

  // Fallback primitive mesh (warm, stylized, recognizable low-poly geometry)
  const primitiveFallback = (
    <group>
      {locus.shape === 'cylinder' ? (
        <mesh position={[0, locus.dimensions[1] / 2, 0]}>
          <cylinderGeometry
            args={[locus.dimensions[0] / 2, locus.dimensions[0] / 2, locus.dimensions[1], 24]}
          />
          <meshStandardMaterial
            color={locus.color}
            roughness={0.5}
            metalness={0.1}
            emissive={isActive ? '#312e81' : '#000000'}
            emissiveIntensity={isActive ? 0.35 : 0}
          />
        </mesh>
      ) : (
        <mesh position={[0, locus.dimensions[1] / 2, 0]}>
          <boxGeometry args={locus.dimensions} />
          <meshStandardMaterial
            color={locus.color}
            roughness={0.5}
            metalness={0.1}
            emissive={isActive ? '#312e81' : '#000000'}
            emissiveIntensity={isActive ? 0.35 : 0}
          />
        </mesh>
      )}
    </group>
  );

  return (
    <group position={locus.position} rotation={locus.rotation || [0, 0, 0]}>
      {/* 1. Fake Grounding Blob Shadow Plane */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[shadowRadius, 32]} />
        <meshBasicMaterial color="#000000" opacity={0.25} transparent depthWrite={false} />
      </mesh>

      {/* 2. Active Locus Floor Glowing Ring */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[shadowRadius * 1.1, shadowRadius * 1.4, 32]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.8} />
        </mesh>
      )}

      {/* 3. 3D Model with Error Boundary and Primitive Fallback */}
      {forceFallback ? (
        primitiveFallback
      ) : (
        <LocusModelErrorBoundary
          fallback={primitiveFallback}
          onError={() => {
            if (onFallback) onFallback();
          }}
        >
          <Suspense fallback={primitiveFallback}>
            <GLBModel
              modelFile={locus.modelFile}
              isActive={isActive}
              dimensions={locus.dimensions}
            />
          </Suspense>
        </LocusModelErrorBoundary>
      )}

      {/* 4. In-Scene Badges:
          Active Locus: Full word label is rendered at PalaceHouse root when showFloatingWord is true.
          If showFloatingWord is false, show active number badge.
          Inactive Loci: show ONLY a small neutral number badge (#n) with ZERO word text.
      */}
      {isActive ? (
        !showFloatingWord && (
          <Html
            center
            occlude={false}
            position={[0, Math.max(locus.dimensions[1] + 0.35, 1.15), 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div
              data-testid={`locus-badge-${locus.id}`}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 800,
                border: '2px solid #818cf8',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              #{locus.id}
            </div>
          </Html>
        )
      ) : (
        <Html
          center
          occlude={false}
          position={[0, Math.max(locus.dimensions[1] + 0.25, 0.75), 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            data-testid={`locus-badge-${locus.id}`}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              color: '#cbd5e1',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            #{locus.id}
          </div>
        </Html>
      )}
    </group>
  );
};
