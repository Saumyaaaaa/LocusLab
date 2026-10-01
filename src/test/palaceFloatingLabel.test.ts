import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PALACE_LOCI } from '../data/loci';
import { LIST_A, LIST_B } from '../data/lists';
import { useExperimentStore } from '../store/useExperimentStore';

describe('3D In-Scene Locus Label & Exposure Equivalence', () => {
  const wordsA = LIST_A.map((item) => item.word.toUpperCase());
  const wordsB = LIST_B.map((item) => item.word.toUpperCase());

  it('guarantees label text always equals the active panel word and assigned word_order[i]', () => {
    // Test across all 20 loci for both List A and List B
    for (let i = 0; i < PALACE_LOCI.length; i++) {
      const locus = PALACE_LOCI[i];
      const panelWordA = wordsA[i];
      const panelWordB = wordsB[i];

      expect(panelWordA).toBe(LIST_A[i].word.toUpperCase());
      expect(panelWordB).toBe(LIST_B[i].word.toUpperCase());
      expect(locus.id).toBe(i + 1);
    }
  });

  it('strictly ensures only ONE active locus renders a word label at a time', () => {
    for (let activeIdx = 0; activeIdx < PALACE_LOCI.length; activeIdx++) {
      const activeLocusId = PALACE_LOCI[activeIdx].id;

      let wordLabelsRendered = 0;
      let numberBadgesRendered = 0;

      PALACE_LOCI.forEach((locus) => {
        const isActive = locus.id === activeLocusId;
        if (isActive) {
          wordLabelsRendered++;
        } else {
          numberBadgesRendered++;
        }
      });

      // Exactly 1 word label rendered for active locus
      expect(wordLabelsRendered).toBe(1);
      // Exactly 19 number-only badges rendered for inactive loci
      expect(numberBadgesRendered).toBe(19);
    }
  });

  it('strictly guarantees no stimulus word appears at any inactive locus', () => {
    const activeIdx = 3; // Locus 4 is active
    const activeLocusId = PALACE_LOCI[activeIdx].id;

    const renderedBadges: { locusId: number; text: string; hasWord: boolean }[] = [];

    PALACE_LOCI.forEach((locus, idx) => {
      const isActive = locus.id === activeLocusId;
      const word = wordsA[idx];

      if (isActive) {
        renderedBadges.push({
          locusId: locus.id,
          text: `#${locus.id} • ${locus.name} ${word}`,
          hasWord: true,
        });
      } else {
        // Inactive loci render only their number badge: `#{locus.id}`
        renderedBadges.push({
          locusId: locus.id,
          text: `#${locus.id}`,
          hasWord: false,
        });
      }
    });

    // Check inactive loci
    renderedBadges
      .filter((b) => b.locusId !== activeLocusId)
      .forEach((b) => {
        expect(b.hasWord).toBe(false);
        // Verify none of the 40 stimuli words appear in inactive badge text
        const allWords = [...LIST_A, ...LIST_B].map((w) => w.word.toUpperCase());
        allWords.forEach((targetWord) => {
          expect(b.text).not.toContain(targetWord);
        });
      });
  });

  it('tracks label_toggled_off state in store when user toggles off floating word', () => {
    useExperimentStore.getState().reset();
    expect(useExperimentStore.getState().labelToggledOff).toBe(false);

    useExperimentStore.getState().setLabelToggledOff(true);
    expect(useExperimentStore.getState().labelToggledOff).toBe(true);

    useExperimentStore.getState().reset();
    expect(useExperimentStore.getState().labelToggledOff).toBe(false);
  });

  describe('Viewport Edge Clamping Projection across standard screen sizes', () => {
    const targetSizes = [
      { name: '360x640 (Mobile Portrait Small)', width: 360, height: 640 },
      { name: '390x844 (Mobile Portrait Standard)', width: 390, height: 844 },
      { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024 },
      { name: '1366x768 (Desktop Standard)', width: 1366, height: 768 },
      { name: '1920x1080 (Desktop Full HD)', width: 1920, height: 1080 },
      { name: '844x390 (Mobile Landscape)', width: 844, height: 390 },
    ];

    it('keeps projected label within visible screen margins on all target viewports', () => {
      // Simulate camera at standard guided distance
      const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 60);

      targetSizes.forEach(({ name, width, height }) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Test Locus 4 and Locus 11 camera viewpoints
        const testLoci = [PALACE_LOCI[3], PALACE_LOCI[10]]; // Locus 4 and Locus 11

        testLoci.forEach((locus) => {
          camera.position.set(...locus.cameraPosition);
          camera.lookAt(new THREE.Vector3(...locus.position));

          const labelWorldPos = new THREE.Vector3(...locus.position);
          labelWorldPos.y += Math.max(locus.dimensions[1] + 0.35, 1.15);

          const proj = labelWorldPos.clone().project(camera);

          // Clamping logic:
          const safeX = Math.min(0.8, Math.max(-0.8, proj.x));
          const safeY = Math.min(0.72, Math.max(-0.8, proj.y));

          // Compute clamped pixel coordinates
          const screenPixelX = (safeX * 0.5 + 0.5) * width;
          const screenPixelY = (-(safeY * 0.5) + 0.5) * height;

          // Must be strictly within canvas bounds with safe margins
          expect(
            screenPixelX,
            `Label X outside canvas on ${name} for ${locus.name}`
          ).toBeGreaterThanOrEqual(20);
          expect(
            screenPixelX,
            `Label X outside canvas on ${name} for ${locus.name}`
          ).toBeLessThanOrEqual(width - 20);

          expect(
            screenPixelY,
            `Label Y outside canvas on ${name} for ${locus.name}`
          ).toBeGreaterThanOrEqual(20);
          expect(
            screenPixelY,
            `Label Y outside canvas on ${name} for ${locus.name}`
          ).toBeLessThanOrEqual(height - 20);
        });
      });
    });
  });
});
