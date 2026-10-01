// Unit and integration tests for whitespace, comma, and newline token splitting and duplicate handling in RecallTest.
import { describe, it, expect } from 'vitest';
import { parseRecallInput, RecallCompletionPayload } from '../components/RecallTest';
import { scoreRecallResponses } from '../lib/scoring';
import { LIST_A } from '../data/lists';
import { formatListRecallRows } from '../lib/responseQueue';

describe('Recall Input Token Splitting & Duplicate Scoring Rules', () => {
  it('1. splits "flag, rope" into TWO distinct chips/tokens', () => {
    const tokens = parseRecallInput('flag, rope');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('2. splits "flag rope" (whitespace-separated) into TWO distinct chips/tokens', () => {
    const tokens = parseRecallInput('flag rope');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('3. splits newline-separated inputs into distinct chips/tokens', () => {
    const tokens = parseRecallInput('flag\nrope');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('4. drops empty tokens from mixed whitespace, tabs, multiple commas, and trailing newlines', () => {
    const tokens = parseRecallInput('  flag ,  , \t \n rope  \n ');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('5. scores duplicate inputs ("flag flag" and "flag, flag") only once', () => {
    // Test both space-separated and comma-separated duplicates
    const tokensSpace = parseRecallInput('flag flag');
    expect(tokensSpace).toEqual(['flag', 'flag']);

    const tokensComma = parseRecallInput('flag, flag');
    expect(tokensComma).toEqual(['flag', 'flag']);

    const targetWords = LIST_A.map((i) => i.word);
    const scoreResult = scoreRecallResponses(tokensSpace, targetWords);

    // First "flag" must be credited
    expect(scoreResult.evaluations[0].correct).toBe(true);
    expect(scoreResult.evaluations[0].reason).toBe('exact');
    expect(scoreResult.evaluations[0].matchedWord).toBe('flag');

    // Second "flag" must be rejected as duplicate
    expect(scoreResult.evaluations[1].correct).toBe(false);
    expect(scoreResult.evaluations[1].reason).toBe('duplicate');
    expect(scoreResult.evaluations[1].matchedWord).toBe('flag');

    // Total correct count must strictly equal 1
    expect(scoreResult.totalCorrect).toBe(1);
    expect(scoreResult.creditedWords).toEqual(['flag']);
  });

  it('6. awards 2 correct hits for both "flag, rope" and "flag rope" against LIST_A', () => {
    const targetWords = LIST_A.map((i) => i.word);

    // "flag, rope" -> two recognized target words in LIST_A
    const tokensComma = parseRecallInput('flag, rope');
    const scoreComma = scoreRecallResponses(tokensComma, targetWords);
    expect(scoreComma.totalCorrect).toBe(2);
    expect(scoreComma.creditedWords).toEqual(['flag', 'rope']);

    // "flag rope" -> two recognized target words in LIST_A
    const tokensSpace = parseRecallInput('flag rope');
    const scoreSpace = scoreRecallResponses(tokensSpace, targetWords);
    expect(scoreSpace.totalCorrect).toBe(2);
    expect(scoreSpace.creditedWords).toEqual(['flag', 'rope']);
  });

  it('7. formats responses with idempotent keys for target and intrusion rows', () => {
    const tokens = parseRecallInput('flag rope unknownWord1, unknownWord2');
    const targetWords = LIST_A.map((i) => i.word);
    const scoreResult = scoreRecallResponses(tokens, targetWords);

    const payload: RecallCompletionPayload = {
      listId: 'listA',
      phase: 'immediateTest',
      enteredWords: tokens,
      recordedResponses: tokens.map((t, idx) => ({
        typed: t,
        responseMs: 1000 * (idx + 1),
        evaluation: scoreResult.evaluations[idx],
      })),
      scoreResult,
      tabHidden: false,
      durationMs: 4000,
    };

    const participantId = '00000000-0000-0000-0000-000000000099';
    const rows = formatListRecallRows(payload, LIST_A, participantId, 'palace');

    // Exactly 20 target rows (item_index >= 0, intrusion_seq == 0)
    const targetRows = rows.filter((r) => r.item_index >= 0);
    expect(targetRows).toHaveLength(20);
    expect(targetRows.every((r) => r.intrusion_seq === 0)).toBe(true);

    // Exactly 2 intrusion rows (item_index == -1, intrusion_seq == 1, 2)
    const intrusionRows = rows.filter((r) => r.item_index === -1);
    expect(intrusionRows).toHaveLength(2);
    expect(intrusionRows[0].intrusion_seq).toBe(1);
    expect(intrusionRows[0].typed_answer).toBe('unknownWord1');
    expect(intrusionRows[1].intrusion_seq).toBe(2);
    expect(intrusionRows[1].typed_answer).toBe('unknownWord2');

    // All rows share the composite key schema and have phase = 'immediateTest'
    expect(rows.every((r) => r.phase === 'immediateTest')).toBe(true);
  });
});
