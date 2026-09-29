// Locus 3D model component loading CC0 GLB assets with automatic fallback to code-primitive geometry.
import React, { Component, ReactNode, Suspense, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
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

    return clone;
  }, [scene, dimensions]);

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

  return <primitive object={cloned} />;
};

interface LocusModelProps {
  locus: LocusData;
  isActive: boolean;
  assignedWord: string;
  onFallback?: () => void;
}

/**
 * Primary Locus component:
 * 1. Renders grounding blob shadow
 * 2. Attempts to load CC0 .glb model inside ErrorBoundary + Suspense
 * 3. Falls back immediately to clean primitive shape if .glb is absent or fails
 * 4. Renders active glowing floor ring and floating HUD badge
 */
export const LocusModel: React.FC<LocusModelProps> = ({
  locus,
  isActive,
  assignedWord: _assignedWord,
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

    </group>
  );
};
