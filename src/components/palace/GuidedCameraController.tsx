// Smooth guided-tour camera controller with delta lerping and prefers-reduced-motion direct jump support.
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALACE_LOCI } from '../../data/loci';

interface GuidedCameraControllerProps {
  activeLocusId: number;
  recenterTrigger?: number;
  cameraPositionOverride?: [number, number, number];
  cameraTargetOverride?: [number, number, number];
  onFirstFrameRendered?: () => void;
}

export const GuidedCameraController: React.FC<GuidedCameraControllerProps> = ({
  activeLocusId,
  recenterTrigger = 0,
  cameraPositionOverride,
  cameraTargetOverride,
  onFirstFrameRendered,
}) => {
  const { camera, size } = useThree();
  const firstFrameReportedRef = useRef(false);

  const activeLocus = PALACE_LOCI.find((l) => l.id === activeLocusId) || PALACE_LOCI[0];

  // Target camera position and eye-height center target
  const locusCenterY = activeLocus.position[1] + activeLocus.dimensions[1] * 0.4;
  const initialCamPos = cameraPositionOverride || activeLocus.cameraPosition;
  const initialTarget = cameraTargetOverride || [activeLocus.position[0], locusCenterY, activeLocus.position[2]];

  const targetCamPos = useRef(new THREE.Vector3(...initialCamPos));
  const targetLookAt = useRef(new THREE.Vector3(...initialTarget));
  const currentLookAt = useRef(new THREE.Vector3(...initialTarget));

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Aspect-ratio aware vertical FOV: wider in portrait viewports so models are never clipped
  useEffect(() => {
    if ('aspect' in camera && typeof (camera as THREE.PerspectiveCamera).fov === 'number') {
      const persp = camera as THREE.PerspectiveCamera;
      const aspect = size.width / Math.max(1, size.height);
      if (aspect < 1.0) {
        // Portrait phone/tablet: calculate wider vertical FOV
        persp.fov = Math.min(84, Math.max(65, 65 / Math.max(0.65, aspect)));
      } else {
        persp.fov = 65;
      }
      persp.updateProjectionMatrix();
    }
  }, [camera, size]);

  useEffect(() => {
    if (cameraPositionOverride) {
      targetCamPos.current.set(...cameraPositionOverride);
    } else {
      targetCamPos.current.set(...activeLocus.cameraPosition);
    }

    if (cameraTargetOverride) {
      targetLookAt.current.set(...cameraTargetOverride);
    } else {
      const centerY = activeLocus.position[1] + activeLocus.dimensions[1] * 0.4;
      targetLookAt.current.set(activeLocus.position[0], centerY, activeLocus.position[2]);
    }

    if (prefersReducedMotion || cameraPositionOverride) {
      // Instant transition for reduced motion users or explicit angle inspection
      camera.position.copy(targetCamPos.current);
      currentLookAt.current.copy(targetLookAt.current);
      camera.lookAt(targetLookAt.current);
    }
  }, [activeLocus, camera, prefersReducedMotion, cameraPositionOverride, cameraTargetOverride]);

  // Recenter trigger effect
  useEffect(() => {
    if (recenterTrigger > 0) {
      const centerY = activeLocus.position[1] + activeLocus.dimensions[1] * 0.4;
      targetCamPos.current.set(...activeLocus.cameraPosition);
      targetLookAt.current.set(activeLocus.position[0], centerY, activeLocus.position[2]);
      camera.position.copy(targetCamPos.current);
      currentLookAt.current.copy(targetLookAt.current);
      camera.lookAt(targetLookAt.current);
    }
  }, [recenterTrigger, activeLocus, camera]);

  useFrame((_, delta) => {
    if (!firstFrameReportedRef.current) {
      firstFrameReportedRef.current = true;
      if (onFirstFrameRendered) {
        onFirstFrameRendered();
      }
    }

    if (prefersReducedMotion) return;

    // Smooth lerping with subtle ease-in towards target locus
    const lerpFactor = Math.min(1, delta * 3.5);
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
