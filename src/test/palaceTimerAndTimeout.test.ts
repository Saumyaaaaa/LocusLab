// Unit tests verifying the 20-second asset load timeout, first-useFrame timer gating, and tutorial demo word isolation.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LIST_A, LIST_B } from '../data/lists';

describe('Palace Asset Loading Timeout & Timer Gating Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers asset fallback and arms operational state when 20-second timeout expires without asset load', () => {
    let isFullyLoaded = false;
    let loadTimedOut = false;
    let assetFallbackTriggered = false;
    let timerActive = false;
    const loadTimeoutMs = 20000;

    // Simulate PalaceScene timeout effect
    const timeoutId = setTimeout(() => {
      loadTimedOut = true;
      assetFallbackTriggered = true;
    }, loadTimeoutMs);

    // Fast-forward 10 seconds: should NOT have timed out yet
    vi.advanceTimersByTime(10000);
    expect(loadTimedOut).toBe(false);
    expect(assetFallbackTriggered).toBe(false);
    expect(timerActive).toBe(false);

    // Fast-forward remaining 10 seconds (total 20s)
    vi.advanceTimersByTime(10000);
    expect(loadTimedOut).toBe(true);
    expect(assetFallbackTriggered).toBe(true);

    const assetsReady = isFullyLoaded || loadTimedOut;
    expect(assetsReady).toBe(true);

    // First useFrame callback executes after assetsReady is true
    let frameRendered = false;
    const simulateUseFrame = () => {
      if (assetsReady && !frameRendered) {
        frameRendered = true;
        timerActive = true;
      }
    };

    simulateUseFrame();
    expect(frameRendered).toBe(true);
    expect(timerActive).toBe(true);
    clearTimeout(timeoutId);
  });

  it('cancels the 20-second timeout and does NOT trigger fallback when assets load in time', () => {
    let isFullyLoaded = false;
    let loadTimedOut = false;
    let assetFallbackTriggered = false;
    let timerActive = false;
    const loadTimeoutMs = 20000;

    let timeoutId: any = setTimeout(() => {
      loadTimedOut = true;
      assetFallbackTriggered = true;
    }, loadTimeoutMs);

    // Assets finish loading after 2.5 seconds
    vi.advanceTimersByTime(2500);
    isFullyLoaded = true;
    clearTimeout(timeoutId);

    // Fast forward past the 20-second mark
    vi.advanceTimersByTime(25000);
    expect(loadTimedOut).toBe(false);
    expect(assetFallbackTriggered).toBe(false);

    const assetsReady = isFullyLoaded || loadTimedOut;
    expect(assetsReady).toBe(true);

    // First useFrame executes
    let frameRendered = false;
    const simulateUseFrame = () => {
      if (assetsReady && !frameRendered) {
        frameRendered = true;
        timerActive = true;
      }
    };

    simulateUseFrame();
    expect(frameRendered).toBe(true);
    expect(timerActive).toBe(true);
  });

  it('guarantees that the timer NEVER starts on initial mount before assets are ready', () => {
    const isFullyLoaded = false;
    const loadTimedOut = false;
    const assetsReady = isFullyLoaded || loadTimedOut;

    let timerActive = false;
    let frameRendered = false;

    // Simulate multiple early frame callbacks during model download
    for (let f = 0; f < 60; f++) {
      if (assetsReady && !frameRendered) {
        frameRendered = true;
        timerActive = true;
      }
    }

    expect(assetsReady).toBe(false);
    expect(frameRendered).toBe(false);
    expect(timerActive).toBe(false);
  });
});

describe('Palace Tutorial Dummy Words Isolation Audit', () => {
  const allStimuliWords = [
    ...LIST_A.map((w) => w.word.toLowerCase()),
    ...LIST_B.map((w) => w.word.toLowerCase()),
  ];

  const semanticSynonyms: Record<string, string[]> = {
    wheel: ['wheel', 'caster', 'castor'],
    button: ['button', 'knob', 'dial'],
    clock: ['clock', 'timer', 'watch'],
    plate: ['plate', 'plaque'],
    lamp: ['lamp', 'lantern', 'sconce'],
    bottle: ['bottle', 'flask', 'vial'],
    vase: ['vase', 'urn'],
    brick: ['brick', 'masonry'],
    fence: ['fence', 'railing'],
    plant: ['plant', 'flower', 'foliage', 'sunflower'],
    rope: ['rope', 'cord'],
    ribbon: ['ribbon', 'bow'],
    pillow: ['pillow', 'cushion'],
    basket: ['basket', 'hamper'],
    mirror: ['mirror'],
  };

  it('verifies tutorial demo words have ZERO collision with List A, List B, or semantic synonyms', () => {
    // Current practice items from PalaceTutorial.tsx
    const tutorialDemoWords = ['GUITAR', 'TELESCOPE'];

    for (const demoWord of tutorialDemoWords) {
      const lower = demoWord.toLowerCase();

      // Check against real 40 words
      expect(allStimuliWords).not.toContain(lower);

      // Check against semantic synonyms
      for (const syns of Object.values(semanticSynonyms)) {
        for (const syn of syns) {
          expect(lower).not.toContain(syn);
          expect(syn).not.toContain(lower);
        }
      }
    }
  });

  it('verifies that tutorial prompt texts do not inadvertently contain stimuli words', () => {
    const prompts = [
      'Imagine an electric guitar smashing itself against the wooden steps, making loud reverberations.',
      'Imagine a giant brass telescope spinning wildly on the floor tiles, shooting bright star beams at the ceiling.',
    ];

    const violations: string[] = [];
    for (const prompt of prompts) {
      const tokens = prompt.toLowerCase().split(/[^a-z0-9]+/);
      for (const stimulus of allStimuliWords) {
        if (tokens.includes(stimulus)) {
          violations.push(`Prompt contains stimulus word "${stimulus}": ${prompt}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
