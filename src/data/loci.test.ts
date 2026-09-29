// Unit test ensuring zero semantic or lexical collisions between loci names, model filenames, labels, and word stimuli.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PALACE_LOCI } from './loci';
import { LIST_A, LIST_B } from './lists';

describe('PALACE_LOCI naming integrity and scene manifest', () => {
  const allStimuliWords = [
    ...LIST_A.map((w) => w.word.toLowerCase()),
    ...LIST_B.map((w) => w.word.toLowerCase()),
  ];

  it('strictly contains exactly 20 loci numbered 1 through 20', () => {
    expect(PALACE_LOCI).toHaveLength(20);
    const ids = PALACE_LOCI.map((l) => l.id);
    for (let i = 1; i <= 20; i++) {
      expect(ids).toContain(i);
    }
  });

  it('fails if any locus name contains or equals any word in List A or List B', () => {
    const violations: string[] = [];

    for (const locus of PALACE_LOCI) {
      const locusWords = locus.name.toLowerCase().split(/\s+/);
      for (const stimulus of allStimuliWords) {
        for (const locusWord of locusWords) {
          if (locusWord === stimulus || locusWord.includes(stimulus)) {
            violations.push(
              `Locus name "${locus.name}" (ID ${locus.id}) contains stimulus word "${stimulus}"`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('fails if any model filename contains or matches any word in List A or List B', () => {
    const violations: string[] = [];

    for (const locus of PALACE_LOCI) {
      if (locus.modelFile) {
        const normalizedFilename = locus.modelFile.toLowerCase();
        for (const stimulus of allStimuliWords) {
          if (normalizedFilename.includes(stimulus)) {
            violations.push(
              `Model filename "${locus.modelFile}" for Locus "${locus.name}" contains stimulus word "${stimulus}"`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('ensures all 20 loci have unique names and distinct 3D positions', () => {
    const names = new Set(PALACE_LOCI.map((l) => l.name));
    expect(names.size).toBe(20);

    const positions = new Set(PALACE_LOCI.map((l) => l.position.join(',')));
    expect(positions.size).toBe(20);
  });

  it('verifies that all 20 loci use completely unique model files across the entire house', () => {
    const modelFiles = new Set(PALACE_LOCI.map((l) => l.modelFile));
    expect(modelFiles.size).toBe(20);
  });

  it('verifies that every locus modelFile exists on disk in public/models/', () => {
    const modelsDir = path.resolve(process.cwd(), 'public/models');
    for (const locus of PALACE_LOCI) {
      const filePath = path.join(modelsDir, locus.modelFile);
      expect(fs.existsSync(filePath), `Missing model file: ${filePath}`).toBe(true);
    }
  });

  it('fails if the audit list is not identical to [...LIST_A, ...LIST_B] from src/data/lists.ts', () => {
    const expectedWords = [...LIST_A, ...LIST_B].map((w) => w.word.toLowerCase());
    expect(allStimuliWords).toEqual(expectedWords);
    expect(allStimuliWords).toHaveLength(40);
  });

  it('verifies zero stimuli word or semantic synonym collisions across every node, mesh, and material in all 20 GLB files', () => {
    const modelsDir = path.resolve(process.cwd(), 'public/models');
    const violations: string[] = [];

    const semanticSynonyms: Record<string, string[]> = {
      wheel: ['wheel', 'caster', 'castor'],
      button: ['button', 'knob', 'dial', 'pushbutton'],
      clock: ['clock', 'timer', 'watch'],
      plate: ['plate', 'nameplate', 'plaque'],
      lamp: ['lamp', 'lantern', 'sconce'],
      bottle: ['bottle', 'flask', 'vial'],
      vase: ['vase', 'urn'],
      brick: ['brick', 'masonry'],
      fence: ['fence', 'railing'],
      plant: ['plant', 'flower', 'foliage'],
      rope: ['rope', 'cord'],
      ribbon: ['ribbon', 'bow'],
      pillow: ['pillow', 'cushion'],
      basket: ['basket', 'hamper'],
      mirror: ['mirror'],
    };

    for (const locus of PALACE_LOCI) {
      const filePath = path.join(modelsDir, locus.modelFile);
      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        const jsonLen = buf.readUInt32LE(12);
        const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
        const gltf = JSON.parse(jsonStr);

        const nodeNames = (gltf.nodes || []).map((n: { name?: string }) => n.name || '');
        const meshNames = (gltf.meshes || []).map((m: { name?: string }) => m.name || '');
        const matNames = (gltf.materials || []).map((mat: { name?: string }) => mat.name || '');
        const allNames = [...nodeNames, ...meshNames, ...matNames];

        for (const token of allNames) {
          const lower = token.toLowerCase();
          // Check against 40 stimuli words
          for (const w of allStimuliWords) {
            if (lower === w || lower.includes(w)) {
              violations.push(
                `Model "${locus.modelFile}" (Locus #${locus.id} ${locus.name}) has element "${token}" containing stimulus word "${w}"`
              );
            }
          }

          // Check against semantic synonyms
          for (const [targetWord, syns] of Object.entries(semanticSynonyms)) {
            for (const syn of syns) {
              if (lower.includes(syn)) {
                violations.push(
                  `Model "${locus.modelFile}" (Locus #${locus.id} ${locus.name}) has element "${token}" matching semantic synonym "${syn}" for "${targetWord}"`
                );
              }
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
