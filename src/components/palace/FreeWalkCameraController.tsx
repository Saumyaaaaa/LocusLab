// Non-locking free-walk camera controller supporting click-and-drag mouse look, touch look, WASD/arrow navigation, and collision bounds.
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FreeWalkCameraControllerProps {
  isFreeWalk: boolean;
  takeMeThereTrigger: number;
  targetLocusPosition: [number, number, number];
  targetCameraPosition: [number, number, number];
  moveVectorRef: React.MutableRefObject<{ x: number; z: number }>;
}

// Bounding limits of the 6-room apartment (meters)
const BOUNDS = {
  minX: -7.6,
  maxX: 7.6,
  minZ: -13.5,
  maxZ: 13.5,
  eyeHeight: 1.5,
};

export const FreeWalkCameraController: React.FC<FreeWalkCameraControllerProps> = ({
  isFreeWalk,
  takeMeThereTrigger,
  targetLocusPosition,
  targetCameraPosition,
  moveVectorRef,
}) => {
  const { camera, gl } = useThree();

  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const isGlidingToLocusRef = useRef(false);

  // Initialize yaw/pitch from current camera orientation
  useEffect(() => {
    if (isFreeWalk) {
      const euler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);
      yawRef.current = euler.y;
      pitchRef.current = euler.x;
      isGlidingToLocusRef.current = false;
    }
  }, [isFreeWalk, camera]);

  // Handle "Take me there" glide
  useEffect(() => {
    if (takeMeThereTrigger > 0 && isFreeWalk) {
      isGlidingToLocusRef.current = true;
    }
  }, [takeMeThereTrigger, isFreeWalk]);

  // Pointer drag listeners (mouse & touch) on the Canvas DOM element
  useEffect(() => {
    if (!isFreeWalk) return;
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      // Only drag on primary mouse button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
      isGlidingToLocusRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.003;
      yawRef.current -= dx * sensitivity;
      pitchRef.current -= dy * sensitivity;

      // Clamp pitch between -70 deg and +70 deg
      const maxPitch = (70 * Math.PI) / 180;
      pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isFreeWalk, gl.domElement]);

  // Keyboard navigation listeners (WASD movement & Arrow keys look)
  useEffect(() => {
    if (!isFreeWalk) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const code = e.code.toLowerCase();
      if (['keyw', 'keya', 'keys', 'keyd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(code)) {
        keysPressedRef.current[code] = true;
        isGlidingToLocusRef.current = false;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      keysPressedRef.current[code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      keysPressedRef.current = {};
    };
  }, [isFreeWalk]);

  useFrame((_, delta) => {
    if (!isFreeWalk) return;

    // Handle "Take me there" glide transition
    if (isGlidingToLocusRef.current) {
      const targetPos = new THREE.Vector3(...targetCameraPosition);
      const targetLook = new THREE.Vector3(...targetLocusPosition);

      camera.position.lerp(targetPos, Math.min(1, delta * 4));

      // Compute target yaw/pitch towards targetLocusPosition
      const dir = targetLook.clone().sub(camera.position).normalize();
      const targetYaw = Math.atan2(-dir.x, -dir.z);
      const targetPitch = Math.asin(dir.y);

      // Smoothly rotate
      yawRef.current = THREE.MathUtils.lerp(yawRef.current, targetYaw, Math.min(1, delta * 4));
      pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, targetPitch, Math.min(1, delta * 4));

      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ')
      );
      camera.quaternion.copy(q);

      if (camera.position.distanceTo(targetPos) < 0.05) {
        camera.position.copy(targetPos);
        isGlidingToLocusRef.current = false;
      }
      return;
    }

    // 1. Arrow key looking/turning
    const turnSpeed = 1.8 * delta;
    if (keysPressedRef.current['arrowleft']) yawRef.current += turnSpeed;
    if (keysPressedRef.current['arrowright']) yawRef.current -= turnSpeed;
    if (keysPressedRef.current['arrowup']) pitchRef.current = Math.min((70 * Math.PI) / 180, pitchRef.current + turnSpeed);
    if (keysPressedRef.current['arrowdown']) pitchRef.current = Math.max(-(70 * Math.PI) / 180, pitchRef.current - turnSpeed);

    // Apply rotation to camera
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ')
    );
    camera.quaternion.copy(q);

    // 2. WASD & Joystick Movement
    let forward = 0;
    let strafe = 0;

    if (keysPressedRef.current['keyw']) forward += 1;
    if (keysPressedRef.current['keys']) forward -= 1;
    if (keysPressedRef.current['keya']) strafe -= 1;
    if (keysPressedRef.current['keyd']) strafe += 1;

    // Add touch joystick input if active
    if (moveVectorRef.current.z !== 0 || moveVectorRef.current.x !== 0) {
      forward += moveVectorRef.current.z;
      strafe += moveVectorRef.current.x;
    }

    if (forward !== 0 || strafe !== 0) {
      const moveSpeed = 3.6 * delta; // ~3.6 m/s walk speed

      // Compute forward vector on horizontal plane
      const forwardVec = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current)).normalize();
      const rightVec = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current)).normalize();

      const move = forwardVec.multiplyScalar(forward).add(rightVec.multiplyScalar(strafe)).normalize().multiplyScalar(moveSpeed);

      camera.position.add(move);

      // Collision clamping within house walls
      camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x));
      camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z));
      camera.position.y = BOUNDS.eyeHeight;
    }
  });

  return null;
};
