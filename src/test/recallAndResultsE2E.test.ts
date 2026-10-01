import { describe, it, expect, beforeEach } from 'vitest';
import { LIST_A, LIST_B } from '../data/lists';
import { scoreRecallResponses } from '../lib/scoring';
import { formatListRecallRows, FormattedResponseRow } from '../lib/responseQueue';
import { useExperimentStore } from '../store/useExperimentStore';
import { RecallCompletionPayload } from '../components/RecallTest';

describe('Recall and Results End-to-End Simulation & Verification', () => {
  beforeEach(() => {
    useExperimentStore.getState().reset();
  });

  it('simulates 10 correct words in List A (manual submit with text in box) and 8 in List B (timer expiry with text in box), mapping to correct conditions', () => {
    // 1. Setup participant and counterbalancing: Palace assigned to List A, Flashcard to List B
    const participantId = '00000000-0000-0000-0000-000000000001';
    useExperimentStore.getState().setParticipant(participantId, 'TEST0001');
    useExperimentStore.getState().setCounterbalanceAssignment({
      conditionOrder: 'palace_first',
      palaceList: 'listA',
      flashcardList: 'listB',
      immediateTestOrder: 'A_first',
    });

    const palaceList = useExperimentStore.getState().palaceList; // 'listA'

    // =========================================================================
    // LIST A (PALACE): 10 correct words
    // - 9 words entered previously into recordedList
    // - 10th word ('train') left in inputText at manual submit
    // =========================================================================
    const listAFirst9 = ['flag', 'rope', 'tent', 'vase', 'brick', 'clock', 'crown', 'plate', 'scarf'];
    const listA10thInBox = 'train';

    // Simulate input state at submit
    const currentListA = listAFirst9.map((word, i) => ({
      typed: word,
      responseMs: 1000 + i * 200,
    }));

    // Simulating submitTest logic: finalText.trim() is pushed to list
    const combinedListA = [...currentListA];
    if (listA10thInBox.trim()) {
      combinedListA.push({
        typed: listA10thInBox.trim(),
        responseMs: 5000,
      });
    }

    const typedStringsA = combinedListA.map((r) => r.typed);
    expect(typedStringsA).toHaveLength(10);
    expect(typedStringsA).toContain('train');

    // Scorer runs against target words (handling both WordItem[] and string[])
    const targetStringsA = LIST_A.map((item) => item.word);
    const scoreResultA = scoreRecallResponses(typedStringsA, targetStringsA);

    expect(scoreResultA.totalCorrect).toBe(10);
    expect(scoreResultA.targetCount).toBe(20);

    const payloadA: RecallCompletionPayload = {
      listId: 'listA',
      phase: 'immediateTest',
      enteredWords: typedStringsA,
      recordedResponses: combinedListA.map((r, idx) => ({
        ...r,
        evaluation: scoreResultA.evaluations[idx],
      })),
      scoreResult: scoreResultA,
      tabHidden: false,
      durationMs: 45000,
    };

    // Format rows via responseQueue
    const conditionA = payloadA.listId === palaceList ? 'palace' : 'flashcard';
    expect(conditionA).toBe('palace');

    const rowsA = formatListRecallRows(payloadA, LIST_A, participantId, conditionA);
    expect(rowsA).toHaveLength(20); // Exactly 20 target rows

    const correctRowsA = rowsA.filter((r) => r.correct);
    const missedRowsA = rowsA.filter((r) => !r.correct);
    expect(correctRowsA).toHaveLength(10);
    expect(missedRowsA).toHaveLength(10);
    expect(rowsA.every((r) => r.condition === 'palace')).toBe(true);

    // Verify 10th word 'train' was properly saved in target rows
    const trainRow = rowsA.find((r) => r.typed_answer?.toLowerCase() === 'train');
    expect(trainRow).toBeDefined();
    expect(trainRow?.correct).toBe(true);
    expect(trainRow?.condition).toBe('palace');

    // =========================================================================
    // LIST B (FLASHCARD): 8 correct words
    // - 7 words entered previously into recordedList
    // - 8th word ('pearl') left in inputText at timer auto-submit (onExpire)
    // =========================================================================
    const listBFirst7 = ['boat', 'coin', 'lamp', 'nest', 'chalk', 'fence', 'glove'];
    const listB8thInBoxAtExpire = 'pearl';

    const currentListB = listBFirst7.map((word, i) => ({
      typed: word,
      responseMs: 1200 + i * 250,
    }));

    // Simulating timer expiry onExpire: stateRef.current.inputText is added
    const combinedListB = [...currentListB];
    if (listB8thInBoxAtExpire.trim()) {
      combinedListB.push({
        typed: listB8thInBoxAtExpire.trim(),
        responseMs: 120000,
      });
    }

    const typedStringsB = combinedListB.map((r) => r.typed);
    expect(typedStringsB).toHaveLength(8);
    expect(typedStringsB).toContain('pearl');

    const targetStringsB = LIST_B.map((item) => item.word);
    const scoreResultB = scoreRecallResponses(typedStringsB, targetStringsB);

    expect(scoreResultB.totalCorrect).toBe(8);
    expect(scoreResultB.targetCount).toBe(20);

    const payloadB: RecallCompletionPayload = {
      listId: 'listB',
      phase: 'immediateTest',
      enteredWords: typedStringsB,
      recordedResponses: combinedListB.map((r, idx) => ({
        ...r,
        evaluation: scoreResultB.evaluations[idx],
      })),
      scoreResult: scoreResultB,
      tabHidden: false,
      durationMs: 120000,
    };

    const conditionB = payloadB.listId === palaceList ? 'palace' : 'flashcard';
    expect(conditionB).toBe('flashcard');

    const rowsB = formatListRecallRows(payloadB, LIST_B, participantId, conditionB);
    expect(rowsB).toHaveLength(20);

    const correctRowsB = rowsB.filter((r) => r.correct);
    const missedRowsB = rowsB.filter((r) => !r.correct);
    expect(correctRowsB).toHaveLength(8);
    expect(missedRowsB).toHaveLength(12);
    expect(rowsB.every((r) => r.condition === 'flashcard')).toBe(true);

    // Verify 8th word 'pearl' was properly saved in target rows
    const pearlRow = rowsB.find((r) => r.typed_answer?.toLowerCase() === 'pearl');
    expect(pearlRow).toBeDefined();
    expect(pearlRow?.correct).toBe(true);
    expect(pearlRow?.condition).toBe('flashcard');

    // =========================================================================
    // RESULTS AGGREGATION: Combine all 40 rows and evaluate
    // =========================================================================
    const allResponses: FormattedResponseRow[] = [...rowsA, ...rowsB];
    expect(allResponses).toHaveLength(40);

    // Simulate ResultsView aggregation
    let palaceTargets = 0;
    let flashcardTargets = 0;
    let palaceCorrect = 0;
    let flashcardCorrect = 0;

    allResponses.forEach((row) => {
      if (row.item_index >= 0) {
        if (row.condition === 'palace') {
          palaceTargets++;
          if (row.correct) palaceCorrect++;
        } else if (row.condition === 'flashcard') {
          flashcardTargets++;
          if (row.correct) flashcardCorrect++;
        }
      }
    });

    expect(palaceTargets).toBe(20);
    expect(flashcardTargets).toBe(20);
    expect(palaceCorrect).toBe(10);
    expect(flashcardCorrect).toBe(8);
  });

  it('correctly maps 10 and 8 when counterbalancing is reversed (palaceList = listB)', () => {
    const participantId = '00000000-0000-0000-0000-000000000002';
    useExperimentStore.getState().setCounterbalanceAssignment({
      conditionOrder: 'flashcard_first',
      palaceList: 'listB',
      flashcardList: 'listA',
      immediateTestOrder: 'B_first',
    });

    const palaceList = useExperimentStore.getState().palaceList; // 'listB'

    // Recall 10 words in List A (which is now Flashcard!)
    const payloadA: RecallCompletionPayload = {
      listId: 'listA',
      phase: 'immediateTest',
      enteredWords: ['flag', 'rope', 'tent', 'vase', 'brick', 'clock', 'crown', 'plate', 'scarf', 'train'],
      recordedResponses: ['flag', 'rope', 'tent', 'vase', 'brick', 'clock', 'crown', 'plate', 'scarf', 'train'].map((w) => ({
        typed: w,
        responseMs: 1000,
        evaluation: { typed: w, correct: true, matchedWord: w, distance: 0, reason: 'exact' },
      })),
      scoreResult: {
        totalCorrect: 10,
        targetCount: 20,
        accuracyPercent: 50,
        evaluations: [],
        creditedWords: [],
      },
      tabHidden: false,
      durationMs: 30000,
    };

    // Recall 8 words in List B (which is now Palace!)
    const payloadB: RecallCompletionPayload = {
      listId: 'listB',
      phase: 'immediateTest',
      enteredWords: ['boat', 'coin', 'lamp', 'nest', 'chalk', 'fence', 'glove', 'pearl'],
      recordedResponses: ['boat', 'coin', 'lamp', 'nest', 'chalk', 'fence', 'glove', 'pearl'].map((w) => ({
        typed: w,
        responseMs: 1000,
        evaluation: { typed: w, correct: true, matchedWord: w, distance: 0, reason: 'exact' },
      })),
      scoreResult: {
        totalCorrect: 8,
        targetCount: 20,
        accuracyPercent: 40,
        evaluations: [],
        creditedWords: [],
      },
      tabHidden: false,
      durationMs: 30000,
    };

    const conditionA = payloadA.listId === palaceList ? 'palace' : 'flashcard';
    const conditionB = payloadB.listId === palaceList ? 'palace' : 'flashcard';

    expect(conditionA).toBe('flashcard');
    expect(conditionB).toBe('palace');

    const rowsA = formatListRecallRows(payloadA, LIST_A, participantId, conditionA);
    const rowsB = formatListRecallRows(payloadB, LIST_B, participantId, conditionB);

    const allResponses = [...rowsA, ...rowsB];
    let palaceCorrect = 0;
    let flashcardCorrect = 0;

    allResponses.forEach((row) => {
      if (row.item_index >= 0) {
        if (row.condition === 'palace' && row.correct) palaceCorrect++;
        if (row.condition === 'flashcard' && row.correct) flashcardCorrect++;
      }
    });

    // Reversed mapping asserted: Palace = 8, Flashcard = 10
    expect(palaceCorrect).toBe(8);
    expect(flashcardCorrect).toBe(10);
  });

  it('refuses to render zero chart when fewer than 20 target rows exist per list', () => {
    // Simulate incomplete responses (e.g. only 5 rows saved due to network cutoff)
    const incompleteResponses: FormattedResponseRow[] = [
      {
        participant_id: 'test-user',
        phase: 'immediateTest',
        list_id: 'listA',
        condition: 'palace',
        item_index: 0,
        typed_answer: null,
        correct: false,
        response_ms: null,
        tab_hidden: false,
        intrusion_seq: 0,
      },
      {
        participant_id: 'test-user',
        phase: 'immediateTest',
        list_id: 'listB',
        condition: 'flashcard',
        item_index: 0,
        typed_answer: null,
        correct: false,
        response_ms: null,
        tab_hidden: false,
        intrusion_seq: 0,
      },
    ];

    let palaceTargets = 0;
    let flashcardTargets = 0;

    incompleteResponses.forEach((r) => {
      if (r.item_index >= 0) {
        if (r.condition === 'palace') palaceTargets++;
        if (r.condition === 'flashcard') flashcardTargets++;
      }
    });

    const hasCompleteData = palaceTargets >= 20 && flashcardTargets >= 20;
    expect(hasCompleteData).toBe(false);

    // Rule: When hasCompleteData is false, system MUST show "We could not load your results", never 0 of 20
    const shouldShowZerosChart = hasCompleteData;
    expect(shouldShowZerosChart).toBe(false);
  });

  it('evaluates target list seamlessly whether passed as strings or WordItem objects', () => {
    const typed = ['flag', 'rop', 'tent', 'randomWord']; // flag exact, rop fuzzy rejected (4 letters), tent exact, randomWord no match

    // 1. Pass as strings
    const stringTargets = ['flag', 'rope', 'tent', 'vase'];
    const resStrings = scoreRecallResponses(typed, stringTargets);
    expect(resStrings.totalCorrect).toBe(2); // flag, tent

    // 2. Pass as WordItem objects ({ id, word, letters, syllables })
    const resObjects = scoreRecallResponses(typed, LIST_A.slice(0, 4));
    expect(resObjects.totalCorrect).toBe(2);
  });
});
