// Unit and integration tests for comma/newline token splitting, space preservation, and duplicate handling in RecallTest.
import { describe, it, expect } from 'vitest';
import { parseRecallInput, RecallCompletionPayload } from '../components/RecallTest';
import { scoreRecallResponses } from '../lib/scoring';
import { LIST_A } from '../data/lists';
import { formatListRecallRows } from '../lib/responseQueue';

describe('Recall Input Token Splitting & Duplicate Scoring Rules', () => {
  it('splits "flag, rope" into TWO distinct chips/tokens', () => {
    const tokens = parseRecallInput('flag, rope');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('keeps "flag rope" as ONE single chip/token without space splitting', () => {
    const tokens = parseRecallInput('flag rope');
    expect(tokens).toEqual(['flag rope']);
    expect(tokens).toHaveLength(1);
  });

  it('splits newline-separated inputs into distinct chips/tokens', () => {
    const tokens = parseRecallInput('flag\nrope');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('handles mixed whitespace, multiple commas, and empty trailing lines cleanly', () => {
    const tokens = parseRecallInput('  flag ,  , \n rope  \n ');
    expect(tokens).toEqual(['flag', 'rope']);
    expect(tokens).toHaveLength(2);
  });

  it('scores duplicate inputs ("flag, flag") only once', () => {
    // Both entries come from comma splitting of "flag, flag"
    const tokens = parseRecallInput('flag, flag');
    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(['flag', 'flag']);

    const targetWords = LIST_A.map((i) => i.word);
    const scoreResult = scoreRecallResponses(tokens, targetWords);

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

  it('awards 2 correct hits for "flag, rope" and 0 correct hits for "flag rope" against LIST_A', () => {
    const targetWords = LIST_A.map((i) => i.word);

    // "flag, rope" -> two recognized target words in LIST_A
    const tokensSplit = parseRecallInput('flag, rope');
    const scoreSplit = scoreRecallResponses(tokensSplit, targetWords);
    expect(scoreSplit.totalCorrect).toBe(2);
    expect(scoreSplit.creditedWords).toEqual(['flag', 'rope']);

    // "flag rope" -> single unrecognized token, evaluated as intrusion/no-match
    const tokensUnsplit = parseRecallInput('flag rope');
    const scoreUnsplit = scoreRecallResponses(tokensUnsplit, targetWords);
    expect(scoreUnsplit.totalCorrect).toBe(0);
    expect(scoreUnsplit.evaluations[0].reason).toBe('no_match');
  });

  it('formats responses with idempotent keys for target and intrusion rows', () => {
    const tokens = parseRecallInput('flag, rope, unknownWord1, unknownWord2');
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
