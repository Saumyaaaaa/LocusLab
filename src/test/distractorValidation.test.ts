import { describe, it, expect } from 'vitest';
import {
  generateDistinctArithmeticProblem,
  calculateMedian,
  hasConsecutiveIdenticalAnswers,
  evaluateDistractorMetrics,
  DistractorItemRecord,
} from '../lib/distractorValidation';

describe('Distractor Validation & Problem Generation', () => {
  describe('generateDistinctArithmeticProblem', () => {
    it('generates valid 2-digit problems with non-negative solutions', () => {
      for (let i = 0; i < 100; i++) {
        const prob = generateDistinctArithmeticProblem();
        expect(prob.num1).toBeGreaterThanOrEqual(10);
        expect(prob.num2).toBeGreaterThanOrEqual(10);
        expect(prob.solution).toBeGreaterThanOrEqual(0);

        if (prob.operator === '+') {
          expect(prob.solution).toBe(prob.num1 + prob.num2);
        } else {
          expect(prob.solution).toBe(prob.num1 - prob.num2);
        }
      }
    });

    it('never generates consecutive identical problems back-to-back', () => {
      let lastText: string | undefined = undefined;
      for (let i = 0; i < 50; i++) {
        const prob = generateDistinctArithmeticProblem(lastText);
        expect(prob.text).not.toBe(lastText);
        lastText = prob.text;
      }
    });
  });

  describe('calculateMedian', () => {
    it('handles empty array', () => {
      expect(calculateMedian([])).toBe(0);
    });

    it('calculates median for odd-length arrays', () => {
      expect(calculateMedian([3000, 1000, 2000])).toBe(2000);
      expect(calculateMedian([500, 1500, 2500, 1000, 3500])).toBe(1500);
    });

    it('calculates median for even-length arrays', () => {
      expect(calculateMedian([1000, 2000, 3000, 4000])).toBe(2500);
      expect(calculateMedian([1200, 1800])).toBe(1500);
    });
  });

  describe('hasConsecutiveIdenticalAnswers', () => {
    it('returns false when answers length is below threshold', () => {
      expect(hasConsecutiveIdenticalAnswers([5, 5, 5], 4)).toBe(false);
    });

    it('returns true when an answer is repeated 4 or more times consecutively', () => {
      expect(hasConsecutiveIdenticalAnswers([10, 42, 42, 42, 42, 99], 4)).toBe(true);
      expect(hasConsecutiveIdenticalAnswers([1, 1, 1, 1], 4)).toBe(true);
    });

    it('returns false when repeated answers are not consecutive', () => {
      expect(hasConsecutiveIdenticalAnswers([42, 10, 42, 10, 42, 10, 42], 4)).toBe(false);
      expect(hasConsecutiveIdenticalAnswers([42, 42, 42, 10, 42, 42], 4)).toBe(false);
    });
  });

  describe('evaluateDistractorMetrics (Preregistration Criteria)', () => {
    const createItem = (index: number, answer: number, correct: boolean, responseMs: number): DistractorItemRecord => ({
      itemIndex: index,
      problem: `10 + ${index}`,
      answer,
      correct,
      responseMs,
    });

    it('marks session valid when all preregistered criteria are met', () => {
      // 6 attempts, 5 correct (83.3%), median latency 2200ms, varied answers
      const items: DistractorItemRecord[] = [
        createItem(0, 15, true, 2000),
        createItem(1, 24, true, 1800),
        createItem(2, 33, false, 2500),
        createItem(3, 42, true, 2200),
        createItem(4, 51, true, 2100),
        createItem(5, 60, true, 3000),
      ];

      const metrics = evaluateDistractorMetrics(items);
      expect(metrics.attempted).toBe(6);
      expect(metrics.correct).toBe(5);
      expect(metrics.accuracy).toBeCloseTo(0.8333, 3);
      expect(metrics.medianMs).toBeGreaterThanOrEqual(2000);
      expect(metrics.valid).toBe(true);
    });

    it('marks session invalid if fewer than 5 problems attempted (< 5)', () => {
      const items: DistractorItemRecord[] = [
        createItem(0, 10, true, 3000),
        createItem(1, 11, true, 3200),
        createItem(2, 12, true, 2800),
        createItem(3, 13, true, 3100),
      ];

      const metrics = evaluateDistractorMetrics(items);
      expect(metrics.attempted).toBe(4);
      expect(metrics.valid).toBe(false);
    });

    it('marks session invalid if accuracy is below 60% (< 0.60)', () => {
      // 6 attempts, only 2 correct (33.3%)
      const items: DistractorItemRecord[] = [
        createItem(0, 10, true, 2000),
        createItem(1, 11, false, 2100),
        createItem(2, 12, false, 2200),
        createItem(3, 13, false, 2300),
        createItem(4, 14, true, 2400),
        createItem(5, 15, false, 2500),
      ];

      const metrics = evaluateDistractorMetrics(items);
      expect(metrics.accuracy).toBeLessThan(0.6);
      expect(metrics.valid).toBe(false);
    });

    it('marks session invalid if median response latency is under 1000ms (guessing/speeding)', () => {
      // 6 attempts, 100% correct, but median latency 650ms
      const items: DistractorItemRecord[] = [
        createItem(0, 10, true, 600),
        createItem(1, 11, true, 700),
        createItem(2, 12, true, 500),
        createItem(3, 13, true, 800),
        createItem(4, 14, true, 650),
        createItem(5, 15, true, 900),
      ];

      const metrics = evaluateDistractorMetrics(items);
      expect(metrics.medianMs).toBeLessThan(1000);
      expect(metrics.valid).toBe(false);
    });

    it('marks session invalid if same answer repeated 4+ times consecutively', () => {
      const items: DistractorItemRecord[] = [
        createItem(0, 5, false, 2000),
        createItem(1, 5, false, 2100),
        createItem(2, 5, false, 2200),
        createItem(3, 5, false, 2300),
        createItem(4, 25, true, 2400),
        createItem(5, 30, true, 2500),
      ];

      const metrics = evaluateDistractorMetrics(items);
      expect(metrics.valid).toBe(false);
    });
  });
});
