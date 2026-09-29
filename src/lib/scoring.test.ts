// Unit test suite for recall scoring engine covering exact matching, length-gated fuzzy matching, and duplicates.
import { describe, it, expect } from 'vitest';
import { levenshteinDistance, evaluateSingleAnswer, scoreRecallResponses } from './scoring';

const SAMPLE_TARGET_LIST = [
  'flag',    // 4 letters
  'rope',    // 4 letters
  'brick',   // 5 letters
  'clock',   // 5 letters
  'hammer',  // 6 letters
  'feather', // 7 letters
];

describe('levenshteinDistance', () => {
  it('correctly calculates basic edit distances', () => {
    expect(levenshteinDistance('clock', 'clock')).toBe(0);
    expect(levenshteinDistance('clock', 'cloc')).toBe(1);
    expect(levenshteinDistance('clock', 'cloxk')).toBe(1);
    expect(levenshteinDistance('clock', 'block')).toBe(1);
    expect(levenshteinDistance('clock', 'clxxk')).toBe(2);
  });
});

describe('evaluateSingleAnswer', () => {
  it('Case 1: Exact match for a 4-letter word is credited', () => {
    const credited = new Set<string>();
    const res = evaluateSingleAnswer('rope', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(true);
    expect(res.reason).toBe('exact');
    expect(res.matchedWord).toBe('rope');
    expect(credited.has('rope')).toBe(true);
  });

  it('Case 2: Case-insensitive and trimmed exact match is credited', () => {
    const credited = new Set<string>();
    const res = evaluateSingleAnswer('  BRICK  ', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(true);
    expect(res.reason).toBe('exact');
    expect(res.matchedWord).toBe('brick');
    expect(credited.has('brick')).toBe(true);
  });

  it('Case 3: 1-character typo on a 4-letter word is REJECTED', () => {
    const credited = new Set<string>();
    // "flad" has distance 1 to "flag", but 4-letter words require exact match
    const res = evaluateSingleAnswer('flad', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(false);
    expect(res.reason).toBe('short_word_fuzzy_rejected');
    expect(credited.has('flag')).toBe(false);
  });

  it('Case 4: 1-character typo on a 5-letter word is CREDITED', () => {
    const credited = new Set<string>();
    // "cloc" has distance 1 to "clock" (5 letters)
    const res = evaluateSingleAnswer('cloc', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(true);
    expect(res.reason).toBe('fuzzy');
    expect(res.matchedWord).toBe('clock');
    expect(credited.has('clock')).toBe(true);
  });

  it('Case 5: 1-character typo on a 6-letter word is CREDITED', () => {
    const credited = new Set<string>();
    // "hammr" has distance 1 to "hammer" (6 letters)
    const res = evaluateSingleAnswer('hammr', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(true);
    expect(res.reason).toBe('fuzzy');
    expect(res.matchedWord).toBe('hammer');
    expect(credited.has('hammer')).toBe(true);
  });

  it('Case 6: 2-character error is REJECTED', () => {
    const credited = new Set<string>();
    // "hamxx" has distance 2 to "hammer"
    const res = evaluateSingleAnswer('hamxx', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(false);
    expect(res.reason).toBe('no_match');
  });

  it('Case 7: Exact duplicate of an already credited word is REJECTED', () => {
    const credited = new Set<string>();
    // First entry credited
    const first = evaluateSingleAnswer('brick', SAMPLE_TARGET_LIST, credited);
    expect(first.correct).toBe(true);

    // Second entry duplicate rejected
    const second = evaluateSingleAnswer('brick', SAMPLE_TARGET_LIST, credited);
    expect(second.correct).toBe(false);
    expect(second.reason).toBe('duplicate');
  });

  it('Case 8: Fuzzy near-match duplicate after exact match is REJECTED', () => {
    const credited = new Set<string>();
    // "clock" is entered and credited
    evaluateSingleAnswer('clock', SAMPLE_TARGET_LIST, credited);
    expect(credited.has('clock')).toBe(true);

    // Later, participant types near-match "cloc" -> must be rejected as duplicate
    const res = evaluateSingleAnswer('cloc', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(false);
    expect(res.reason).toBe('duplicate');
  });

  it('Case 9: Ambiguous tie between two equidistant words is REJECTED', () => {
    const credited = new Set<string>();
    const tiedList = ['cat', 'bat', 'rat'];
    // "oat" is distance 1 from cat, bat, and rat
    const res = evaluateSingleAnswer('oat', tiedList, credited);
    expect(res.correct).toBe(false);
    expect(res.reason).toBe('ambiguous');
  });

  it('Case 10: Completely unrelated word is REJECTED', () => {
    const credited = new Set<string>();
    const res = evaluateSingleAnswer('spaceship', SAMPLE_TARGET_LIST, credited);
    expect(res.correct).toBe(false);
    expect(res.reason).toBe('no_match');
  });
});

describe('scoreRecallResponses', () => {
  it('accurately scores a list of mixed responses and credits each target only once', () => {
    const answers = [
      'flag',    // Exact match (4 letters) -> Correct (1)
      'flad',    // 1-letter typo on 4-letter word -> Rejected (0)
      'cloc',    // 1-letter typo on 5-letter word -> Correct (1)
      'clock',   // Exact duplicate of already credited "clock" -> Duplicate (0)
      'hammr',   // 1-letter typo on 6-letter word -> Correct (1)
      'hammr',   // Duplicate typo of "hammer" -> Duplicate (0)
      'feather', // Exact match (7 letters) -> Correct (1)
      'random',  // Unrelated intrusion -> Rejected (0)
    ];

    const result = scoreRecallResponses(answers, SAMPLE_TARGET_LIST);
    expect(result.totalCorrect).toBe(4); // flag, clock, hammer, feather
    expect(result.targetCount).toBe(6);
    expect(result.accuracyPercent).toBe(66.7);
    expect(result.creditedWords).toEqual(['flag', 'clock', 'hammer', 'feather']);
  });
});
