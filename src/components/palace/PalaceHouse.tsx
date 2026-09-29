// 3D architectural palace house layout rendering 6 distinct rooms with canvas procedural textures,
// realistic wall thickness, baseboards, open doorways, window panes, and CC0 locus models.
import React, { useMemo } from 'react';
import { PALACE_LOCI, LocusData } from '../../data/loci';
import { LocusModel } from './LocusModel';
import {
  getWoodPlankTexture,
  getTileTexture,
  getBathroomTileTexture,
  getCarpetTexture,
} from './proceduralTextures';

interface PalaceHouseProps {
  activeLocusId: number;
  assignedWords: readonly string[];
  onAssetFallback?: () => void;
}

export const PalaceHouse: React.FC<PalaceHouseProps> = ({
  activeLocusId,
  assignedWords,
  onAssetFallback,
}) => {
  // Procedural canvas floor textures
  const hallwayFloorTex = useMemo(() => getWoodPlankTexture('#b45309', '#92400e', '#78350f'), []);
  const livingFloorTex = useMemo(() => getWoodPlankTexture('#c29b68', '#a8804c', '#78562d'), []);
  const kitchenFloorTex = useMemo(() => getTileTexture('#f8fafc', '#94a3b8', 64), []);
  const studyFloorTex = useMemo(() => getWoodPlankTexture('#854d0e', '#713f12', '#451a03'), []);
  const bedroomFloorTex = useMemo(() => getCarpetTexture('#ede9fe', '#c4b5fd'), []);
  const bathroomFloorTex = useMemo(() => getBathroomTileTexture(), []);

  return (
    <group>
      {/* ==========================================
          1. PROCEDURAL ROOM FLOORS (Distinct textures & palettes)
          ========================================== */}
      {/* Hallway Floor (Z: -14 to -8, X: -3 to 3) */}
      <mesh position={[0, 0, -11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial map={hallwayFloorTex} roughness={0.4} />
      </mesh>

      {/* Living Room Floor (Z: -8 to 0, X: -8 to 0) */}
      <mesh position={[-4, 0, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={livingFloorTex} roughness={0.35} />
      </mesh>

      {/* Kitchen Floor (Z: -8 to 0, X: 0 to 8) */}
      <mesh position={[4, 0, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={kitchenFloorTex} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Study Floor (Z: 0 to 8, X: -8 to 0) */}
      <mesh position={[-4, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={studyFloorTex} roughness={0.45} />
      </mesh>

      {/* Bedroom Floor (Z: 0 to 8, X: 0 to 8) */}
      <mesh position={[4, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={bedroomFloorTex} roughness={0.8} />
      </mesh>

      {/* Bathroom Floor (Z: 8 to 14, X: -4 to 4) */}
      <mesh position={[0, 0, 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={bathroomFloorTex} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* ==========================================
          2. WALLS WITH THICKNESS & DISTINCT ROOM PALETTES
          ========================================== */}
      {/* --- Hallway Walls (Warm neutral #f8fafc / #e2e8f0) --- */}
      {/* North Wall with Front Door opening */}
      <mesh position={[-2, 1.4, -14]}>
        <boxGeometry args={[2, 2.8, 0.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[2, 1.4, -14]}>
        <boxGeometry args={[2, 2.8, 0.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.6, -14]}>
        <boxGeometry args={[2, 0.4, 0.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      {/* Front Door Frame Trim */}
      <mesh position={[0, 1.2, -13.95]}>
        <boxGeometry args={[1.5, 2.45, 0.08]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>

      {/* Hallway Side Partition Walls */}
      <mesh position={[-3, 1.4, -11]}>
        <boxGeometry args={[0.2, 2.8, 6]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[3, 1.4, -11]}>
        <boxGeometry args={[0.2, 2.8, 6]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>

      {/* --- Outer North Walls (Living Room & Kitchen) --- */}
      <mesh position={[-5.5, 1.4, -8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[5.5, 1.4, -8]}>
        <boxGeometry args={[5, 2.8, 0.2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* --- Exterior West Wall (Living Room & Study, with Windows) --- */}
      <mesh position={[-8, 1.4, -4]}>
        <boxGeometry args={[0.2, 2.8, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[-8, 1.4, 4]}>
        <boxGeometry args={[0.2, 2.8, 8]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.7} />
      </mesh>

      {/* Living Room Window Glass & Frame */}
      <mesh position={[-7.9, 1.6, -2]}>
        <boxGeometry args={[0.06, 1.4, 1.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.35} />
      </mesh>
      {/* Study Window Glass & Frame */}
      <mesh position={[-7.9, 1.6, 2]}>
        <boxGeometry args={[0.06, 1.4, 1.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.35} />
      </mesh>

      {/* --- Exterior East Wall (Kitchen & Bedroom, with Windows) --- */}
      <mesh position={[8, 1.4, -4]}>
        <boxGeometry args={[0.2, 2.8, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[8, 1.4, 4]}>
        <boxGeometry args={[0.2, 2.8, 8]} />
        <meshStandardMaterial color="#ede9fe" roughness={0.7} />
      </mesh>

      {/* Kitchen Window Glass */}
      <mesh position={[7.9, 1.6, -4]}>
        <boxGeometry args={[0.06, 1.4, 1.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.35} />
      </mesh>
      {/* Bedroom Window Glass */}
      <mesh position={[7.9, 1.6, 4]}>
        <boxGeometry args={[0.06, 1.4, 1.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.35} />
      </mesh>

      {/* --- Center Dividing Spine (North-South with open central archway) --- */}
      <mesh position={[0, 1.4, -5.5]}>
        <boxGeometry args={[0.2, 2.8, 5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.4, 4.5]}>
        <boxGeometry args={[0.2, 2.8, 7]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>

      {/* --- East-West Divider Wall between Living/Kitchen and Study/Bedroom --- */}
      {/* Living-Study Partition with Doorway */}
      <mesh position={[-6, 1.4, 0]}>
        <boxGeometry args={[4, 2.8, 0.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>
      <mesh position={[-2, 2.6, 0]}>
        <boxGeometry args={[2, 0.4, 0.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>

      {/* Kitchen-Bedroom Partition with Doorway */}
      <mesh position={[6, 1.4, 0]}>
        <boxGeometry args={[4, 2.8, 0.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>
      <mesh position={[2, 2.6, 0]}>
        <boxGeometry args={[2, 0.4, 0.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>

      {/* --- Bathroom Enclosure Walls (Z: 8 to 14) --- */}
      {/* North Bathroom Wall with Center Doorway */}
      <mesh position={[-2.5, 1.4, 8]}>
        <boxGeometry args={[3, 2.8, 0.2]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>
      <mesh position={[2.5, 1.4, 8]}>
        <boxGeometry args={[3, 2.8, 0.2]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.6, 8]}>
        <boxGeometry args={[2, 0.4, 0.2]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>

      {/* Bathroom Side Walls */}
      <mesh position={[-4, 1.4, 11]}>
        <boxGeometry args={[0.2, 2.8, 6]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>
      <mesh position={[4, 1.4, 11]}>
        <boxGeometry args={[0.2, 2.8, 6]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>

      {/* Bathroom Outer South Wall */}
      <mesh position={[0, 1.4, 14]}>
        <boxGeometry args={[8, 2.8, 0.2]} />
        <meshStandardMaterial color="#cffafe" roughness={0.6} />
      </mesh>

      {/* ==========================================
          3. BASEBOARDS (0.15m height, grounded at y = 0.075)
          ========================================== */}
      {/* Living Room West Baseboard */}
      <mesh position={[-7.88, 0.075, -4]}>
        <boxGeometry args={[0.04, 0.15, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>
      {/* Kitchen East Baseboard */}
      <mesh position={[7.88, 0.075, -4]}>
        <boxGeometry args={[0.04, 0.15, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Study West Baseboard */}
      <mesh position={[-7.88, 0.075, 4]}>
        <boxGeometry args={[0.04, 0.15, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.5} />
      </mesh>
      {/* Bedroom East Baseboard */}
      <mesh position={[7.88, 0.075, 4]}>
        <boxGeometry args={[0.04, 0.15, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* ==========================================
          4. 20 PALACE LOCI OBJECTS (CC0 Models with Primitive Fallback)
          ========================================== */}
      {PALACE_LOCI.map((locus: LocusData, index: number) => {
        const isActive = locus.id === activeLocusId;
        const assignedWord = assignedWords[index] || `word-${locus.id}`;

        return (
          <LocusModel
            key={locus.id}
            locus={locus}
            isActive={isActive}
            assignedWord={assignedWord}
            onFallback={onAssetFallback}
          />
        );
      })}
    </group>
  );
};
