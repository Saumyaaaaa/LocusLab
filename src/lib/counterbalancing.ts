// Cryptographic counterbalancing for condition order, list assignment, and immediate test order using crypto.getRandomValues.

export interface CounterbalanceAssignment {
  conditionOrder: 'palace_first' | 'flashcard_first';
  palaceList: 'listA' | 'listB';
  flashcardList: 'listA' | 'listB';
  immediateTestOrder: 'A_first' | 'B_first';
}

/**
 * Randomizes condition order, palace list assignment, and test presentation using crypto.getRandomValues.
 * 256 is an exact multiple of 2, so byte % 2 provides strictly uniform, zero-bias 50/50 randomization.
 */
export function generateCounterbalanceAssignment(): CounterbalanceAssignment {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);

  const conditionOrder: 'palace_first' | 'flashcard_first' =
    bytes[0] % 2 === 0 ? 'palace_first' : 'flashcard_first';

  const palaceList: 'listA' | 'listB' = bytes[1] % 2 === 0 ? 'listA' : 'listB';
  const flashcardList: 'listA' | 'listB' = palaceList === 'listA' ? 'listB' : 'listA';

  const immediateTestOrder: 'A_first' | 'B_first' =
    bytes[2] % 2 === 0 ? 'A_first' : 'B_first';

  return {
    conditionOrder,
    palaceList,
    flashcardList,
    immediateTestOrder,
  };
}
