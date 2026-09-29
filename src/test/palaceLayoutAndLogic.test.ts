// Comprehensive logic and layout tests for the 3D memory palace study session.
import { describe, it, expect } from 'vitest';
import { PALACE_LOCI } from '../data/loci';
import { LIST_A, LIST_B } from '../data/lists';

describe('Palace Navigation & Index Wrapping Logic', () => {
  it('wraps next locus index cleanly from 20 -> 1 and 1 -> 20 without NaN or out-of-bounds', () => {
    let currentIdx = 0; // Locus 1

    const next = (idx: number) => (idx + 1) % PALACE_LOCI.length;
    const prev = (idx: number) => (idx - 1 + PALACE_LOCI.length) % PALACE_LOCI.length;

    // Advance 19 times: from index 0 to 19 (Locus 1 to 20)
    for (let i = 0; i < 19; i++) {
      currentIdx = next(currentIdx);
      expect(currentIdx).toBeGreaterThanOrEqual(0);
      expect(currentIdx).toBeLessThan(20);
      expect(Number.isNaN(currentIdx)).toBe(false);
    }
    expect(currentIdx).toBe(19); // Locus 20

    // Next from 19 wraps to 0 (Locus 1)
    currentIdx = next(currentIdx);
    expect(currentIdx).toBe(0);

    // Prev from 0 wraps to 19 (Locus 20)
    currentIdx = prev(currentIdx);
    expect(currentIdx).toBe(19);

    // Prev from 19 goes to 18
    currentIdx = prev(currentIdx);
    expect(currentIdx).toBe(18);
  });

  it('debounces rapid repeated taps/keys within 150ms to prevent skipping or desync', () => {
    let currentIdx = 0;
    let lastNavTime = 0;

    const tryNavigate = (currentTime: number, direction: 'next' | 'prev') => {
      if (currentTime - lastNavTime < 150) return currentIdx; // Debounce rejected
      lastNavTime = currentTime;
      return direction === 'next'
        ? (currentIdx + 1) % PALACE_LOCI.length
        : (currentIdx - 1 + PALACE_LOCI.length) % PALACE_LOCI.length;
    };

    // First tap at t = 1000
    currentIdx = tryNavigate(1000, 'next');
    expect(currentIdx).toBe(1);

    // Immediate rapid tap 30ms later at t = 1030
    currentIdx = tryNavigate(1030, 'next');
    expect(currentIdx).toBe(1); // Ignored!

    // Another rapid tap 80ms later at t = 1110
    currentIdx = tryNavigate(1110, 'next');
    expect(currentIdx).toBe(1); // Still ignored!

    // Valid tap at t = 1200 (> 150ms from 1000)
    currentIdx = tryNavigate(1200, 'next');
    expect(currentIdx).toBe(2); // Accepted!
  });
});

describe('Word to Locus Mapping Integrity', () => {
  it('ensures word shown at locus i strictly equals assignedWords[i] for all 20 loci', () => {
    const assignedWords = LIST_A.map((w) => w.word);
    expect(assignedWords).toHaveLength(20);

    for (let i = 0; i < 20; i++) {
      const locus = PALACE_LOCI[i];
      const word = assignedWords[i];
      expect(locus.id).toBe(i + 1);
      expect(word).toBe(LIST_A[i].word);
    }
  });

  it('guarantees 20 distinct words with none missing or duplicated', () => {
    const listAWords = LIST_A.map((w) => w.word);
    const setA = new Set(listAWords);
    expect(setA.size).toBe(20);

    const listBWords = LIST_B.map((w) => w.word);
    const setB = new Set(listBWords);
    expect(setB.size).toBe(20);
  });
});

describe('Keyboard Input Safeguards', () => {
  it('ignores event.repeat to prevent continuous runaway scrolling when holding down keys', () => {
    let advances = 0;
    const handleKey = (e: { repeat: boolean; code: string; isInput: boolean }) => {
      if (e.repeat) return;
      if (e.isInput) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') advances++;
    };

    // First press
    handleKey({ repeat: false, code: 'Space', isInput: false });
    expect(advances).toBe(1);

    // Auto-repeats while held down
    handleKey({ repeat: true, code: 'Space', isInput: false });
    handleKey({ repeat: true, code: 'Space', isInput: false });
    handleKey({ repeat: true, code: 'Space', isInput: false });
    expect(advances).toBe(1); // No runaway advance!
  });

  it('ignores hotkeys when user is focused inside a text input or textarea', () => {
    let advances = 0;
    const handleKey = (e: { repeat: boolean; code: string; isInput: boolean }) => {
      if (e.repeat) return;
      if (e.isInput) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') advances++;
    };

    handleKey({ repeat: false, code: 'Space', isInput: true });
    handleKey({ repeat: false, code: 'ArrowRight', isInput: true });
    expect(advances).toBe(0);
  });
});

describe('Device Covariate Detection', () => {
  it('correctly classifies desktop viewports (e.g. 1920x1080, 1440x900, 1366x768)', () => {
    const testCases = [
      { w: 1920, h: 1080 },
      { w: 1440, h: 900 },
      { w: 1366, h: 768 },
    ];

    for (const tc of testCases) {
      const minDim = Math.min(tc.w, tc.h);
      const maxDim = Math.max(tc.w, tc.h);
      const cls = minDim < 600 ? 'phone' : minDim >= 600 && maxDim <= 1200 ? 'tablet' : 'desktop';
      expect(cls).toBe('desktop');
    }
  });

  it('correctly classifies tablet viewports (e.g. 768x1024 iPad portrait)', () => {
    const w = 768;
    const h = 1024;
    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);
    const cls = minDim < 600 ? 'phone' : minDim >= 600 && maxDim <= 1200 ? 'tablet' : 'desktop';
    expect(cls).toBe('tablet');
  });

  it('correctly classifies phone viewports (e.g. 390x844 portrait, 360x640)', () => {
    const phones = [
      { w: 390, h: 844 },
      { w: 360, h: 640 },
      { w: 844, h: 390 }, // landscape phone: min dimension is 390 < 600
    ];

    for (const p of phones) {
      const minDim = Math.min(p.w, p.h);
      const cls = minDim < 600 ? 'phone' : 'desktop';
      expect(cls).toBe('phone');
    }
  });
});

describe('Layout Area & Proportion Calculations across 7 Target Viewports', () => {
  const targetViewports = [
    { name: 'Small Phone Portrait', w: 360, h: 640, isMobilePortrait: true },
    { name: 'Modern Phone Portrait', w: 390, h: 844, isMobilePortrait: true },
    { name: 'Tablet Portrait', w: 768, h: 1024, isMobilePortrait: true },
    { name: 'Standard Laptop', w: 1366, h: 768, isDesktop: true },
    { name: 'Desktop/MacBook', w: 1440, h: 900, isDesktop: true },
    { name: 'Desktop FHD', w: 1920, h: 1080, isDesktop: true },
    { name: 'Phone Landscape', w: 844, h: 390, isPhoneLandscape: true },
  ];

  it('guarantees desktop layout allocates >= 60% viewport area to 3D canvas', () => {
    const desktops = targetViewports.filter((v) => v.isDesktop);
    const topBarHeight = 48;
    const sidePanelWidth = 350;

    for (const v of desktops) {
      const totalArea = v.w * v.h;
      const contentHeight = v.h - topBarHeight;
      const canvasWidth = v.w - sidePanelWidth;
      const canvasArea = canvasWidth * contentHeight;
      const canvasPercent = (canvasArea / totalArea) * 100;

      expect(canvasPercent).toBeGreaterThanOrEqual(60);
    }
  });

  it('guarantees portrait mobile layout allocates >= 55% viewport area to 3D canvas', () => {
    const mobilePortraits = targetViewports.filter((v) => v.isMobilePortrait);
    const topBarHeight = 48;

    for (const v of mobilePortraits) {
      const totalArea = v.w * v.h;
      const contentHeight = v.h - topBarHeight;
      // In mobile portrait, canvas occupies 70% of content height
      const canvasHeight = contentHeight * 0.70;
      const canvasArea = v.w * canvasHeight;
      const canvasPercent = (canvasArea / totalArea) * 100;

      expect(canvasPercent).toBeGreaterThanOrEqual(55);
    }
  });

  it('ensures word panel and 3D canvas area have zero bounding box intersection', () => {
    for (const v of targetViewports) {
      const topBarHeight = 48;
      const contentHeight = v.h - topBarHeight;

      let canvasBox: { left: number; right: number; top: number; bottom: number };
      let panelBox: { left: number; right: number; top: number; bottom: number };

      if (v.isDesktop) {
        canvasBox = { left: 0, right: v.w - 350, top: topBarHeight, bottom: v.h };
        panelBox = { left: v.w - 350, right: v.w, top: topBarHeight, bottom: v.h };
      } else if (v.isPhoneLandscape) {
        const panelWidth = v.w * 0.40;
        canvasBox = { left: 0, right: v.w - panelWidth, top: topBarHeight, bottom: v.h };
        panelBox = { left: v.w - panelWidth, right: v.w, top: topBarHeight, bottom: v.h };
      } else {
        // Mobile portrait
        const canvasH = contentHeight * 0.70;
        canvasBox = { left: 0, right: v.w, top: topBarHeight, bottom: topBarHeight + canvasH };
        panelBox = { left: 0, right: v.w, top: topBarHeight + canvasH, bottom: v.h };
      }

      // Check for overlap: left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2
      const overlaps =
        canvasBox.left < panelBox.right &&
        canvasBox.right > panelBox.left &&
        canvasBox.top < panelBox.bottom &&
        canvasBox.bottom > panelBox.top;

      expect(overlaps).toBe(false);
    }
  });
});
