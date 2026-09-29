// Unit test ensuring zero semantic or lexical collisions between loci names and word stimuli.
import { describe, it, expect } from 'vitest';
import { PALACE_LOCI } from './loci';
import { LIST_A, LIST_B } from './lists';

describe('PALACE_LOCI naming integrity', () => {
  it('strictly contains exactly 20 loci numbered 1 through 20', () => {
    expect(PALACE_LOCI).toHaveLength(20);
    const ids = PALACE_LOCI.map((l) => l.id);
    for (let i = 1; i <= 20; i++) {
      expect(ids).toContain(i);
    }
  });

  it('fails if any locus name contains or equals any word in List A or List B', () => {
    const allStimuliWords = [
      ...LIST_A.map((w) => w.word.toLowerCase()),
      ...LIST_B.map((w) => w.word.toLowerCase()),
    ];

    const violations: string[] = [];

    for (const locus of PALACE_LOCI) {
      const locusWords = locus.name.toLowerCase().split(/\s+/);
      for (const stimulus of allStimuliWords) {
        // Check if locus name equals or contains the stimulus word as a token or substring
        for (const locusWord of locusWords) {
          if (locusWord === stimulus || locusWord.includes(stimulus)) {
            violations.push(
              `Locus "${locus.name}" (ID ${locus.id}) contains stimulus word "${stimulus}"`
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
});
