// On-screen touch joystick for mobile free-walk navigation.
import React, { useRef, useState } from 'react';

interface OnScreenJoystickProps {
  moveVectorRef: React.MutableRefObject<{ x: number; z: number }>;
}

export const OnScreenJoystick: React.FC<OnScreenJoystickProps> = ({ moveVectorRef }) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 40; // max knob travel in pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null || !baseRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxRadius) {
          clampedX = (dx / dist) * maxRadius;
          clampedY = (dy / dist) * maxRadius;
        }

        setKnobPos({ x: clampedX, y: clampedY });

        // Normalize to -1.0 to 1.0 (x = strafe, y = forward/back where negative dy is forward)
        moveVectorRef.current = {
          x: clampedX / maxRadius,
          z: -clampedY / maxRadius,
        };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        moveVectorRef.current = { x: 0, z: 0 };
        break;
      }
    }
  };

  return (
    <div
      ref={baseRef}
      role="region"
      aria-label="Touch Walk Joystick"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: isActive ? 'rgba(30, 41, 59, 0.45)' : 'rgba(30, 41, 59, 0.25)',
        border: '2px solid rgba(255, 255, 255, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
