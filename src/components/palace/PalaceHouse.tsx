// 3D single-floor house architecture constructed solely from code primitives, rendering 6 rooms and 20 distinct loci.
import React from 'react';
import { Html } from '@react-three/drei';
import { PALACE_LOCI, LocusData } from '../../data/loci';

interface PalaceHouseProps {
  activeLocusId: number;
  assignedWords: readonly string[]; // 20 words in current shuffle order
}

export const PalaceHouse: React.FC<PalaceHouseProps> = ({
  activeLocusId,
  assignedWords,
}) => {
  return (
    <group>
      {/* 1. ROOM FLOORS WITH SUBTLE ROOM-SPECIFIC TINTS */}
      {/* Hallway Floor (Z: -14 to -8, X: -3 to 3) */}
      <mesh position={[0, -0.05, -11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>

      {/* Living Room Floor (Z: -8 to 0, X: -8 to 0) */}
      <mesh position={[-4, -0.05, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#d6d3d1" />
      </mesh>

      {/* Kitchen Floor (Z: -8 to 0, X: 0 to 8) */}
      <mesh position={[4, -0.05, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>

      {/* Study Floor (Z: 0 to 8, X: -8 to 0) */}
      <mesh position={[-4, -0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#fef3c7" />
      </mesh>

      {/* Bedroom Floor (Z: 0 to 8, X: 0 to 8) */}
      <mesh position={[4, -0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#ede9fe" />
      </mesh>

      {/* Bathroom Floor (Z: 8 to 14, X: -4 to 4) */}
      <mesh position={[0, -0.05, 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#cffafe" />
      </mesh>

      {/* 2. EXTERIOR WALLS & INTERIOR PARTITIONS (Low-poly code primitives) */}
      {/* Hallway Back Wall */}
      <mesh position={[0, 1.4, -14]}>
        <boxGeometry args={[6, 2.8, 0.2]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Outer North Walls (Living Room & Kitchen) */}
      <mesh position={[-5.5, 1.4, -8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[5.5, 1.4, -8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Exterior West Wall */}
      <mesh position={[-8, 1.4, 0]}>
        <boxGeometry args={[0.2, 2.8, 16]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Exterior East Wall */}
      <mesh position={[8, 1.4, 0]}>
        <boxGeometry args={[0.2, 2.8, 16]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Bathroom Outer South Wall */}
      <mesh position={[0, 1.4, 14]}>
        <boxGeometry args={[8, 2.8, 0.2]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Center Dividing Spine (North-South, with doorways at center) */}
      <mesh position={[0, 1.4, -5.5]}>
        <boxGeometry args={[0.2, 2.8, 5]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>
      <mesh position={[0, 1.4, 4.5]}>
        <boxGeometry args={[0.2, 2.8, 7]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>

      {/* East-West Divider Wall between Living/Kitchen and Study/Bedroom */}
      <mesh position={[-5, 1.4, 0]}>
        <boxGeometry args={[6, 2.8, 0.2]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>
      <mesh position={[5, 1.4, 0]}>
        <boxGeometry args={[6, 2.8, 0.2]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>

      {/* Divider between Bedroom/Study and Bathroom */}
      <mesh position={[-5.5, 1.4, 8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>
      <mesh position={[5.5, 1.4, 8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshBasicMaterial color="#b0bec5" />
      </mesh>

      {/* 3. RENDER ALL 20 LOCI OBJECTS */}
      {PALACE_LOCI.map((locus: LocusData, index: number) => {
        const isActive = locus.id === activeLocusId;
        const assignedWord = assignedWords[index] || `word-${locus.id}`;

        return (
          <group key={locus.id} position={locus.position}>
            {/* Primitive Geometry for Locus */}
            {locus.shape === 'cylinder' ? (
              <mesh position={[0, locus.dimensions[1] / 2, 0]}>
                <cylinderGeometry
                  args={[locus.dimensions[0], locus.dimensions[0], locus.dimensions[1], 16]}
                />
                <meshBasicMaterial color={locus.color} />
              </mesh>
            ) : locus.shape === 'sphere' ? (
              <mesh position={[0, locus.dimensions[0], 0]}>
                <sphereGeometry args={[locus.dimensions[0], 16, 16]} />
                <meshBasicMaterial color={locus.color} />
              </mesh>
            ) : (
              <mesh position={[0, locus.dimensions[1] / 2, 0]}>
                <boxGeometry args={locus.dimensions} />
                <meshBasicMaterial color={locus.color} />
              </mesh>
            )}

            {/* Active Locus Floor Highlight Marker */}
            {isActive && (
              <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.15, 32]} />
                <meshBasicMaterial color="#4f46e5" />
              </mesh>
            )}

            {/* Floating 3D Route Marker Number (Accessible & distinct) */}
            <Html
              position={[0, locus.dimensions[1] + 0.6, 0]}
              center
              distanceFactor={10}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transform: 'translate3d(0,0,0)',
                }}
              >
                <span
                  style={{
                    backgroundColor: isActive ? '#1e1b4b' : '#334155',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.8)' : '0 2px 4px rgba(0,0,0,0.3)',
                    border: isActive ? '2px solid #818cf8' : '1px solid #475569',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{locus.id} {locus.name}
                </span>

                {isActive && (
                  <span
                    style={{
                      backgroundColor: '#4338ca',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
                      textTransform: 'uppercase',
                      border: '1px solid #c7d2fe',
                    }}
                  >
                    ★ {assignedWord}
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
