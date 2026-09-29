// Unit tests verifying cryptographic counterbalancing properties and recall row formatting.
import { describe, it, expect } from 'vitest';
import { generateCounterbalanceAssignment } from './counterbalancing';
import { formatListRecallRows } from './responseQueue';
import { LIST_A } from '../data/lists';
import { RecallCompletionPayload } from '../components/RecallTest';

describe('generateCounterbalanceAssignment', () => {
  it('generates valid counterbalanced assignments with mutually exclusive lists', () => {
    for (let i = 0; i < 20; i++) {
      const assignment = generateCounterbalanceAssignment();
      expect(['palace_first', 'flashcard_first']).toContain(assignment.conditionOrder);
      expect(['listA', 'listB']).toContain(assignment.palaceList);
      expect(['listA', 'listB']).toContain(assignment.flashcardList);
      expect(['A_first', 'B_first']).toContain(assignment.immediateTestOrder);
      expect(assignment.palaceList).not.toBe(assignment.flashcardList);
    }
  });
});

describe('formatListRecallRows', () => {
  it('creates exactly 20 target rows with null answers for missed words, plus intrusions', () => {
    const mockPayload: RecallCompletionPayload = {
      listId: 'listA',
      phase: 'immediate',
      enteredWords: ['flag', 'cloc', 'extraneous'],
      recordedResponses: [
        {
          typed: 'flag',
          responseMs: 1200,
          evaluation: { typed: 'flag', correct: true, matchedWord: 'flag', distance: 0, reason: 'exact' },
        },
        {
          typed: 'cloc',
          responseMs: 2400,
          evaluation: { typed: 'cloc', correct: true, matchedWord: 'clock', distance: 1, reason: 'fuzzy' },
        },
        {
          typed: 'extraneous',
          responseMs: 4000,
          evaluation: { typed: 'extraneous', correct: false, matchedWord: null, distance: 999, reason: 'no_match' },
        },
      ],
      scoreResult: {
        totalCorrect: 2,
        targetCount: 20,
        accuracyPercent: 10,
        evaluations: [],
        creditedWords: ['flag', 'clock'],
      },
      tabHidden: false,
      durationMs: 5000,
    };

    const rows = formatListRecallRows(mockPayload, LIST_A, 'test-participant-id', 'palace');

    // 20 target stimuli words + 1 intrusion row = 21 rows
    expect(rows).toHaveLength(21);

    // Target rows: exactly 20 with item_index 0 to 19
    const targetRows = rows.filter((r) => r.item_index >= 0);
    expect(targetRows).toHaveLength(20);

    // Verify 'condition' column is present on all rows
    rows.forEach((r) => {
      expect(r.condition).toBe('palace');
      expect(r.participant_id).toBe('test-participant-id');
    });

    // Check recalled target words
    const flagRow = targetRows.find((r) => r.typed_answer === 'flag');
    expect(flagRow?.correct).toBe(true);
    expect(flagRow?.item_index).toBe(0); // 'flag' is index 0 in LIST_A

    const clockRow = targetRows.find((r) => r.typed_answer === 'cloc');
    expect(clockRow?.correct).toBe(true);
    expect(clockRow?.item_index).toBe(5); // 'clock' is index 5 in LIST_A

    // Check missed words: correct should be false, typed_answer null, response_ms null
    const missedRows = targetRows.filter((r) => !r.correct);
    expect(missedRows).toHaveLength(18);
    missedRows.forEach((r) => {
      expect(r.typed_answer).toBeNull();
      expect(r.response_ms).toBeNull();
    });

    // Check intrusion row: item_index = -1
    const intrusionRow = rows.find((r) => r.item_index === -1);
    expect(intrusionRow).toBeDefined();
    expect(intrusionRow?.typed_answer).toBe('extraneous');
    expect(intrusionRow?.correct).toBe(false);
  });
});
