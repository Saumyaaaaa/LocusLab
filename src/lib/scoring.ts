// Levenshtein distance calculation and recall scoring engine enforcing length-gated fuzzy matching and duplicate prevention.

/**
 * Computes standard Levenshtein edit distance between two strings (case-insensitive).
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row matrix optimization
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) {
    dp[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    let prevDiagonal = dp[0];
    dp[0] = i;

    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (s1[i - 1] === s2[j - 1]) {
        dp[j] = prevDiagonal;
      } else {
        dp[j] = 1 + Math.min(prevDiagonal, dp[j], dp[j - 1]);
      }
      prevDiagonal = temp;
    }
  }

  return dp[n];
}

export type RejectionReason =
  | 'exact'
  | 'fuzzy'
  | 'short_word_fuzzy_rejected'
  | 'closer_to_other_word'
  | 'ambiguous'
  | 'duplicate'
  | 'no_match'
  | 'empty';

export interface ItemEvaluation {
  typed: string;
  correct: boolean;
  matchedWord: string | null;
  distance: number;
  reason: RejectionReason;
}

export interface RecallScoreResult {
  totalCorrect: number;
  targetCount: number;
  accuracyPercent: number;
  evaluations: ItemEvaluation[];
  creditedWords: string[];
}

/**
 * Evaluates an individual typed response against a target word list in accordance with strict experimental rules:
 * 1. Case-insensitive comparison.
 * 2. Words with 4 letters require an EXACT match (distance 0).
 * 3. Distance 1 is allowed ONLY for words of 5+ letters.
 * 4. Rejects typed answers if closer to another word in the list or ambiguous.
 * 5. Each target word can be credited only once.
 */
export function evaluateSingleAnswer(
  typedRaw: string,
  targetList: readonly (string | { word: string })[],
  creditedWords: Set<string>
): ItemEvaluation {
  const typed = (typedRaw || '').trim().toLowerCase();

  if (!typed) {
    return {
      typed: typedRaw,
      correct: false,
      matchedWord: null,
      distance: 999,
      reason: 'empty',
    };
  }

  // Calculate distances to all target words, extracting string representation safely
  const distances = targetList.map((item) => {
    const target = typeof item === 'string' ? item : item && typeof item === 'object' && 'word' in item ? (item as any).word : String(item || '');
    return {
      target,
      normalized: target.toLowerCase(),
      distance: levenshteinDistance(typed, target),
    };
  });

  distances.sort((a, b) => a.distance - b.distance);

  const bestMatch = distances[0];
  const minDist = bestMatch ? bestMatch.distance : 999;

  // Exact match (distance 0)
  if (minDist === 0 && bestMatch) {
    const targetKey = bestMatch.normalized;
    if (creditedWords.has(targetKey)) {
      return {
        typed: typedRaw,
        correct: false,
        matchedWord: bestMatch.target,
        distance: 0,
        reason: 'duplicate',
      };
    }
    creditedWords.add(targetKey);
    return {
      typed: typedRaw,
      correct: true,
      matchedWord: bestMatch.target,
      distance: 0,
      reason: 'exact',
    };
  }

  // Distance 1 (Single character typo tolerance)
  if (minDist === 1 && bestMatch) {
    // Check for ambiguity (two different target words tied at distance 1)
    const tiedWords = distances.filter((d) => d.distance === 1);
    if (tiedWords.length > 1) {
      return {
        typed: typedRaw,
        correct: false,
        matchedWord: null,
        distance: 1,
        reason: 'ambiguous',
      };
    }

    // Check 4-letter rule: 4-letter words require exact match
    if (bestMatch.target.length < 5) {
      return {
        typed: typedRaw,
        correct: false,
        matchedWord: bestMatch.target,
        distance: 1,
        reason: 'short_word_fuzzy_rejected',
      };
    }

    // Check duplicate credit
    const targetKey = bestMatch.normalized;
    if (creditedWords.has(targetKey)) {
      return {
        typed: typedRaw,
        correct: false,
        matchedWord: bestMatch.target,
        distance: 1,
        reason: 'duplicate',
      };
    }

    creditedWords.add(targetKey);
    return {
      typed: typedRaw,
      correct: true,
      matchedWord: bestMatch.target,
      distance: 1,
      reason: 'fuzzy',
    };
  }

  // Distance >= 2: No match
  return {
    typed: typedRaw,
    correct: false,
    matchedWord: null,
    distance: minDist,
    reason: 'no_match',
  };
}

/**
 * Evaluates an array of typed responses against a target word list.
 * Supports both arrays of strings and arrays of { word: string } objects.
 */
export function scoreRecallResponses(
  typedAnswers: readonly string[],
  targetList: readonly (string | { word: string })[]
): RecallScoreResult {
  const normalizedTargetList: string[] = targetList.map((item) =>
    typeof item === 'string' ? item : item && typeof item === 'object' && 'word' in item ? (item as any).word : String(item || '')
  );
  const creditedWords = new Set<string>();
  const evaluations: ItemEvaluation[] = [];

  for (const answer of typedAnswers) {
    const result = evaluateSingleAnswer(answer, normalizedTargetList, creditedWords);
    evaluations.push(result);
  }

  const totalCorrect = creditedWords.size;
  const targetCount = normalizedTargetList.length;
  const accuracyPercent = targetCount > 0 ? Number(((totalCorrect / targetCount) * 100).toFixed(1)) : 0;

  return {
    totalCorrect,
    targetCount,
    accuracyPercent,
    evaluations,
    creditedWords: Array.from(creditedWords),
  };
}
