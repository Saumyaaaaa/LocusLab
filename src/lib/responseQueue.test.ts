// Unit tests verifying 20 stimulus rows per list, correct intrusion sequencing, and tab_hidden tracking.
import { describe, it, expect } from 'vitest';
import { formatListRecallRows } from './responseQueue';
import { LIST_A } from '../data/lists';
import { RecallCompletionPayload } from '../components/RecallTest';

describe('formatListRecallRows', () => {
  const dummyPayload: RecallCompletionPayload = {
    listId: 'listA',
    phase: '24h',
    enteredWords: ['candle', 'anchor', 'banana', 'apple'],
    scoreResult: {
      totalCorrect: 2,
      targetCount: 20,
      accuracyPercent: 10,
      evaluations: [],
      creditedWords: ['candle', 'anchor'],
    },
    durationMs: 180000,
    recordedResponses: [
      {
        typed: 'candle', // Matches LIST_A word
        responseMs: 1200,
        evaluation: {
          typed: 'candle',
          correct: true,
          matchedWord: 'candle',
          distance: 0,
          reason: 'exact',
        },
      },
      {
        typed: 'anchor', // Matches LIST_A word
        responseMs: 2500,
        evaluation: {
          typed: 'anchor',
          correct: true,
          matchedWord: 'anchor',
          distance: 0,
          reason: 'exact',
        },
      },
      {
        typed: 'banana', // Intrusion (not on LIST_A)
        responseMs: 3400,
        evaluation: {
          typed: 'banana',
          correct: false,
          matchedWord: null,
          distance: 99,
          reason: 'no_match',
        },
      },
      {
        typed: 'apple', // Second intrusion
        responseMs: 4100,
        evaluation: {
          typed: 'apple',
          correct: false,
          matchedWord: null,
          distance: 99,
          reason: 'no_match',
        },
      },
    ],
    tabHidden: true,
  };

  it('formats exactly 20 target rows plus intrusion rows', () => {
    const rows = formatListRecallRows(dummyPayload, LIST_A, 'user-123', 'palace');

    // 20 target words + 2 intrusions = 22 rows
    expect(rows.length).toBe(22);

    // Target rows: exactly 20 rows with item_index from 0 to 19 and intrusion_seq = 0
    const targetRows = rows.filter((r) => r.item_index >= 0);
    expect(targetRows.length).toBe(20);
    targetRows.forEach((r) => {
      expect(r.intrusion_seq).toBe(0);
      expect(r.tab_hidden).toBe(true);
      expect(r.condition).toBe('palace');
      expect(r.phase).toBe('24h');
      expect(r.participant_id).toBe('user-123');
    });

    // Check candle (correct)
    const candleRow = targetRows.find((r) => r.typed_answer?.toLowerCase() === 'candle');
    expect(candleRow).toBeDefined();
    expect(candleRow?.correct).toBe(true);
    expect(candleRow?.response_ms).toBe(1200);

    // Check missed target words (typed_answer is null, correct is false)
    const missedRows = targetRows.filter((r) => !r.correct);
    expect(missedRows.length).toBe(18); // 20 - 2
    missedRows.forEach((r) => {
      expect(r.typed_answer).toBeNull();
      expect(r.response_ms).toBeNull();
    });

    // Intrusion rows: item_index = -1, sequential intrusion_seq (1, 2)
    const intrusionRows = rows.filter((r) => r.item_index === -1);
    expect(intrusionRows.length).toBe(2);

    expect(intrusionRows[0].typed_answer).toBe('banana');
    expect(intrusionRows[0].intrusion_seq).toBe(1);
    expect(intrusionRows[0].correct).toBe(false);
    expect(intrusionRows[0].tab_hidden).toBe(true);

    expect(intrusionRows[1].typed_answer).toBe('apple');
    expect(intrusionRows[1].intrusion_seq).toBe(2);
    expect(intrusionRows[1].correct).toBe(false);
  });
});
