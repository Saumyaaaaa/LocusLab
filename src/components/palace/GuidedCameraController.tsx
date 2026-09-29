// Smooth guided-tour camera controller with delta lerping and prefers-reduced-motion direct jump support.
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALACE_LOCI } from '../../data/loci';

interface GuidedCameraControllerProps {
  activeLocusId: number;
  onFirstFrameRendered?: () => void;
}

export const GuidedCameraController: React.FC<GuidedCameraControllerProps> = ({
  activeLocusId,
  onFirstFrameRendered,
}) => {
  const { camera } = useThree();
  const firstFrameReportedRef = useRef(false);

  const activeLocus = PALACE_LOCI.find((l) => l.id === activeLocusId) || PALACE_LOCI[0];

  // Target camera position and eye-height center target
  const locusCenterY = activeLocus.position[1] + activeLocus.dimensions[1] * 0.4;
  const targetCamPos = useRef(new THREE.Vector3(...activeLocus.cameraPosition));
  const targetLookAt = useRef(
    new THREE.Vector3(activeLocus.position[0], locusCenterY, activeLocus.position[2])
  );
  const currentLookAt = useRef(
    new THREE.Vector3(activeLocus.position[0], locusCenterY, activeLocus.position[2])
  );

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const centerY = activeLocus.position[1] + activeLocus.dimensions[1] * 0.4;
    targetCamPos.current.set(...activeLocus.cameraPosition);
    targetLookAt.current.set(activeLocus.position[0], centerY, activeLocus.position[2]);

    if (prefersReducedMotion) {
      // Instant transition for reduced motion users
      camera.position.copy(targetCamPos.current);
      currentLookAt.current.copy(targetLookAt.current);
      camera.lookAt(targetLookAt.current);
    }
  }, [activeLocus, camera, prefersReducedMotion]);

  useFrame((_, delta) => {
    if (!firstFrameReportedRef.current) {
      firstFrameReportedRef.current = true;
      if (onFirstFrameRendered) {
        onFirstFrameRendered();
      }
    }

    if (prefersReducedMotion) return;

    // Smooth lerping with subtle ease-in towards target locus
    const lerpFactor = Math.min(1, delta * 3.2);
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
