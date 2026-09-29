// Standalone guided tour viewer component for inspecting and capturing locus screenshots in DEV mode.
import React from 'react';
import { PalaceScene } from './PalaceScene';
import { LIST_A } from '../../data/lists';

const REAL_WORDS = LIST_A.map((item) => item.word.toUpperCase());

export const PalaceTourViewer: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const locusParam = parseInt(params.get('tour') || '1', 10);
  const initialLocusIdx = Math.max(0, Math.min(19, locusParam - 1));
  const angle = params.get('angle');

  let cameraPositionOverride: [number, number, number] | undefined = undefined;
  let cameraTargetOverride: [number, number, number] | undefined = undefined;

  if (initialLocusIdx === 16) {
    // Locus 17: Double Bed (centered at [5.5, 0, 3.5])
    if (angle === 'top') {
      cameraPositionOverride = [5.5, 4.0, 3.5];
      cameraTargetOverride = [5.5, 0.3, 3.5];
    } else if (angle === 'side') {
      cameraPositionOverride = [7.5, 1.3, 3.5];
      cameraTargetOverride = [5.5, 0.4, 3.5];
    } else if (angle === 'headboard') {
      cameraPositionOverride = [5.5, 1.8, 5.5];
      cameraTargetOverride = [5.5, 0.4, 3.5];
    }
  }

  return (
    <PalaceScene
      assignedWords={REAL_WORDS}
      initialLocusIdx={initialLocusIdx}
      cameraPositionOverride={cameraPositionOverride}
      cameraTargetOverride={cameraTargetOverride}
      durationSeconds={9999}
      onComplete={() => {}}
    />
  );
};
