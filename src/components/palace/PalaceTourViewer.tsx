// Standalone guided tour viewer component for inspecting and capturing locus screenshots.
import React from 'react';
import { PalaceScene } from './PalaceScene';
import { PALACE_LOCI } from '../../data/loci';

const SAMPLE_WORDS = [
  'HARBOR', 'TIMBER', 'GARDEN', 'VALLEY', 'MEADOW',
  'SILVER', 'DESERT', 'FOREST', 'STREAM', 'CASTLE',
  'BRIDGE', 'CANYON', 'ISLAND', 'TEMPLE', 'SUMMIT',
  'PALACE', 'VILLAGE', 'GLACIER', 'HORIZON', 'STATUE'
];

export const PalaceTourViewer: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const locusParam = parseInt(params.get('tour') || '1', 10);
  const initialLocusIdx = Math.max(0, Math.min(19, locusParam - 1));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>
          3D Memory Palace Tour (Locus #{PALACE_LOCI[initialLocusIdx].id}: {PALACE_LOCI[initialLocusIdx].name})
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Room: <strong>{PALACE_LOCI[initialLocusIdx].room}</strong> | Model: <code>{PALACE_LOCI[initialLocusIdx].modelFile}</code>
        </div>
      </div>

      <PalaceScene
        assignedWords={SAMPLE_WORDS}
        initialLocusIdx={initialLocusIdx}
        durationSeconds={9999}
        onComplete={() => {}}
      />
    </div>
  );
};
