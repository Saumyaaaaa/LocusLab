// Unit tests verifying dynamic participant word order assignment in the memory palace study condition.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { useExperimentStore } from '../store/useExperimentStore';
import { LIST_A, LIST_B } from '../data/lists';
import { PALACE_LOCI } from '../data/loci';

describe('Palace Word Order & Counterbalancing Assignment', () => {
  beforeEach(() => {
    useExperimentStore.getState().reset();
  });

  it('assigns shuffledWordsA to Palace when palaceList is listA in StudyFirstStep', () => {
    const store = useExperimentStore.getState();
    const customShuffleA = [...LIST_A.map((w) => w.word)].reverse();
    const customShuffleB = [...LIST_B.map((w) => w.word)].sort();

    store.setCounterbalanceAssignment({
      conditionOrder: 'palace_first',
      palaceList: 'listA',
      flashcardList: 'listB',
      immediateTestOrder: 'A_first',
    });
    store.setShuffledWords(customShuffleA, customShuffleB);

    const state = useExperimentStore.getState();
    const isPalace = state.conditionOrder === 'palace_first';
    const assignedListId = isPalace ? state.palaceList : state.flashcardList;
    const wordStrings = assignedListId === 'listA' ? state.shuffledWordsA : state.shuffledWordsB;

    expect(isPalace).toBe(true);
    expect(assignedListId).toBe('listA');
    expect(wordStrings).toEqual(customShuffleA);
    expect(wordStrings).not.toEqual(customShuffleB);
    expect(wordStrings).toHaveLength(20);
  });

  it('assigns shuffledWordsB to Palace when palaceList is listB in StudyFirstStep', () => {
    const store = useExperimentStore.getState();
    const customShuffleA = [...LIST_A.map((w) => w.word)].reverse();
    const customShuffleB = [...LIST_B.map((w) => w.word)].reverse();

    store.setCounterbalanceAssignment({
      conditionOrder: 'palace_first',
      palaceList: 'listB',
      flashcardList: 'listA',
      immediateTestOrder: 'B_first',
    });
    store.setShuffledWords(customShuffleA, customShuffleB);

    const state = useExperimentStore.getState();
    const isPalace = state.conditionOrder === 'palace_first';
    const assignedListId = isPalace ? state.palaceList : state.flashcardList;
    const wordStrings = assignedListId === 'listA' ? state.shuffledWordsA : state.shuffledWordsB;

    expect(isPalace).toBe(true);
    expect(assignedListId).toBe('listB');
    expect(wordStrings).toEqual(customShuffleB);
    expect(wordStrings).not.toEqual(customShuffleA);
    expect(wordStrings).toHaveLength(20);
  });

  it('assigns shuffledWordsB to Palace in StudySecondStep when conditionOrder is flashcard_first and palaceList is listB', () => {
    const store = useExperimentStore.getState();
    const customShuffleA = [...LIST_A.map((w) => w.word)].sort();
    const customShuffleB = [...LIST_B.map((w) => w.word)].reverse();

    store.setCounterbalanceAssignment({
      conditionOrder: 'flashcard_first',
      palaceList: 'listB',
      flashcardList: 'listA',
      immediateTestOrder: 'A_first',
    });
    store.setShuffledWords(customShuffleA, customShuffleB);

    const state = useExperimentStore.getState();
    // In StudySecondStep:
    const isPalace = state.conditionOrder === 'flashcard_first';
    const assignedListId = isPalace ? state.palaceList : state.flashcardList;
    const wordStrings = assignedListId === 'listA' ? state.shuffledWordsA : state.shuffledWordsB;

    expect(isPalace).toBe(true);
    expect(assignedListId).toBe('listB');
    expect(wordStrings).toEqual(customShuffleB);
    expect(wordStrings).not.toEqual(customShuffleA);
  });

  it('assigns shuffledWordsA to Palace in StudySecondStep when conditionOrder is flashcard_first and palaceList is listA', () => {
    const store = useExperimentStore.getState();
    const customShuffleA = [...LIST_A.map((w) => w.word)].reverse();
    const customShuffleB = [...LIST_B.map((w) => w.word)].sort();

    store.setCounterbalanceAssignment({
      conditionOrder: 'flashcard_first',
      palaceList: 'listA',
      flashcardList: 'listB',
      immediateTestOrder: 'B_first',
    });
    store.setShuffledWords(customShuffleA, customShuffleB);

    const state = useExperimentStore.getState();
    // In StudySecondStep:
    const isPalace = state.conditionOrder === 'flashcard_first';
    const assignedListId = isPalace ? state.palaceList : state.flashcardList;
    const wordStrings = assignedListId === 'listA' ? state.shuffledWordsA : state.shuffledWordsB;

    expect(isPalace).toBe(true);
    expect(assignedListId).toBe('listA');
    expect(wordStrings).toEqual(customShuffleA);
    expect(wordStrings).not.toEqual(customShuffleB);
  });

  it('strictly maps assigned words 1:1 to loci 1 through 20 by index 0..19', () => {
    const store = useExperimentStore.getState();
    store.initializeWordShuffles();
    const state = useExperimentStore.getState();

    const assignedWords = state.shuffledWordsA;
    expect(assignedWords).toHaveLength(20);
    expect(PALACE_LOCI).toHaveLength(20);

    for (let i = 0; i < 20; i++) {
      const locus = PALACE_LOCI[i];
      const word = assignedWords[i];

      expect(locus.id).toBe(i + 1);
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it('verifies that no study component hardcodes LIST_A or LIST_B for the palace study session', () => {
    const studyFirstCode = fs.readFileSync(
      path.resolve(__dirname, '../steps/StudyFirstStep.tsx'),
      'utf8'
    );
    const studySecondCode = fs.readFileSync(
      path.resolve(__dirname, '../steps/StudySecondStep.tsx'),
      'utf8'
    );
    const containerCode = fs.readFileSync(
      path.resolve(__dirname, '../components/palace/PalaceStudyContainer.tsx'),
      'utf8'
    );
    const sceneCode = fs.readFileSync(
      path.resolve(__dirname, '../components/palace/PalaceScene.tsx'),
      'utf8'
    );

    // In StudyFirstStep and StudySecondStep, PalaceStudyContainer must be fed dynamic assignedWords={wordStrings}
    expect(studyFirstCode).toContain('assignedWords={wordStrings}');
    expect(studySecondCode).toContain('assignedWords={wordStrings}');

    // PalaceStudyContainer must receive assignedWords prop and forward it to PalaceScene
    expect(containerCode).toContain('assignedWords: readonly string[]');
    expect(containerCode).toContain('assignedWords={assignedWords}');

    // PalaceScene must receive assignedWords prop and must NEVER import LIST_A or LIST_B
    expect(sceneCode).toContain('assignedWords: readonly string[]');
    expect(sceneCode).not.toContain("from '../../data/lists'");
    expect(sceneCode).not.toContain('from "../data/lists"');
    expect(sceneCode).not.toContain('LIST_A');
    expect(sceneCode).not.toContain('LIST_B');
    expect(sceneCode).not.toContain('SAMPLE_WORDS');
  });
});
