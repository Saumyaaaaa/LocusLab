// Matched stimulus word lists (List A and List B) of concrete, common, unrelated English nouns with balanced length and syllables.

export interface WordItem {
  id: string;
  word: string;
  letters: number;
  syllables: number;
}

/**
 * PSYCHOLINGUISTIC MATCHING CRITERIA:
 * -----------------------------------------------------------------------------
 * 1. Concrete & Imageable: All words represent tangible physical objects.
 * 2. Neutrality: No emotionally charged, violent, or sensitive terms.
 * 3. Polysemy & Frequency: Highly familiar, unambiguous everyday nouns suitable for native and non-native speakers.
 * 4. Semantic Independence: Zero semantic categories or associational pairs within the same list.
 * 5. Cross-List Phonetic Independence: No rhyming pairs, minimal phonological overlap, and no singular/plural overlaps.
 * 6. Minimum Pairwise Distance: Minimum Levenshtein distance between ANY two words within a list is >= 3,
 *    mathematically guaranteeing that a distance-1 typo can never collide with another list item.
 * 7. Statistical Equivalence:
 *    - Word count: Exactly 20 words in List A and 20 words in List B.
 *    - Letter length range: 4 to 7 letters each.
 *    - Mean letter count: List A = 5.40, List B = 5.40 (difference = 0.00, well within 0.3 criterion).
 *    - Syllable distribution: Exactly 10 one-syllable and 10 two-syllable words in each list.
 *
 * -----------------------------------------------------------------------------
 * MATCHED WORD LIST COMPARISON TABLE:
 * -----------------------------------------------------------------------------
 * Item | List A Word | Letters | Syl || List B Word | Letters | Syl
 * -----+-------------+---------+-----++-------------+---------+-----
 *   1  | flag        |    4    |  1  || boat        |    4    |  1
 *   2  | rope        |    4    |  1  || coin        |    4    |  1
 *   3  | tent        |    4    |  1  || lamp        |    4    |  1
 *   4  | vase        |    4    |  1  || nest        |    4    |  1
 *   5  | brick       |    5    |  1  || chalk       |    5    |  1
 *   6  | clock       |    5    |  1  || fence       |    5    |  1
 *   7  | crown       |    5    |  1  || glove       |    5    |  1
 *   8  | plate       |    5    |  1  || pearl       |    5    |  1
 *   9  | scarf       |    5    |  1  || plant       |    5    |  1
 *  10  | train       |    5    |  1  || wheel       |    5    |  1
 *  11  | anchor      |    6    |  2  || button      |    6    |  2
 *  12  | barrel      |    6    |  2  || crayon      |    6    |  2
 *  13  | basket      |    6    |  2  || helmet      |    6    |  2
 *  14  | bottle      |    6    |  2  || magnet      |    6    |  2
 *  15  | candle      |    6    |  2  || pillow      |    6    |  2
 *  16  | hammer      |    6    |  2  || ribbon      |    6    |  2
 *  17  | ladder      |    6    |  2  || saddle      |    6    |  2
 *  18  | mirror      |    6    |  2  || tunnel      |    6    |  2
 *  19  | feather     |    7    |  2  || compass     |    7    |  2
 *  20  | whistle     |    7    |  2  || padlock     |    7    |  2
 * -----------------------------------------------------------------------------
 * SUMMARY STATS:
 * Mean Letters: List A = 5.40, List B = 5.40
 * Syllables:    List A = 10 x 1-syl, 10 x 2-syl
 *               List B = 10 x 1-syl, 10 x 2-syl
 * Pairwise Dist: List A min = 3, List B min = 3
 * -----------------------------------------------------------------------------
 */

export const LIST_A: readonly WordItem[] = [
  { id: 'a-01', word: 'flag', letters: 4, syllables: 1 },
  { id: 'a-02', word: 'rope', letters: 4, syllables: 1 },
  { id: 'a-03', word: 'tent', letters: 4, syllables: 1 },
  { id: 'a-04', word: 'vase', letters: 4, syllables: 1 },
  { id: 'a-05', word: 'brick', letters: 5, syllables: 1 },
  { id: 'a-06', word: 'clock', letters: 5, syllables: 1 },
  { id: 'a-07', word: 'crown', letters: 5, syllables: 1 },
  { id: 'a-08', word: 'plate', letters: 5, syllables: 1 },
  { id: 'a-09', word: 'scarf', letters: 5, syllables: 1 },
  { id: 'a-10', word: 'train', letters: 5, syllables: 1 },
  { id: 'a-11', word: 'anchor', letters: 6, syllables: 2 },
  { id: 'a-12', word: 'barrel', letters: 6, syllables: 2 },
  { id: 'a-13', word: 'basket', letters: 6, syllables: 2 },
  { id: 'a-14', word: 'bottle', letters: 6, syllables: 2 },
  { id: 'a-15', word: 'candle', letters: 6, syllables: 2 },
  { id: 'a-16', word: 'hammer', letters: 6, syllables: 2 },
  { id: 'a-17', word: 'ladder', letters: 6, syllables: 2 },
  { id: 'a-18', word: 'mirror', letters: 6, syllables: 2 },
  { id: 'a-19', word: 'feather', letters: 7, syllables: 2 },
  { id: 'a-20', word: 'whistle', letters: 7, syllables: 2 },
] as const;

export const LIST_B: readonly WordItem[] = [
  { id: 'b-01', word: 'boat', letters: 4, syllables: 1 },
  { id: 'b-02', word: 'coin', letters: 4, syllables: 1 },
  { id: 'b-03', word: 'lamp', letters: 4, syllables: 1 },
  { id: 'b-04', word: 'nest', letters: 4, syllables: 1 },
  { id: 'b-05', word: 'chalk', letters: 5, syllables: 1 },
  { id: 'b-06', word: 'fence', letters: 5, syllables: 1 },
  { id: 'b-07', word: 'glove', letters: 5, syllables: 1 },
  { id: 'b-08', word: 'pearl', letters: 5, syllables: 1 },
  { id: 'b-09', word: 'plant', letters: 5, syllables: 1 },
  { id: 'b-10', word: 'wheel', letters: 5, syllables: 1 },
  { id: 'b-11', word: 'button', letters: 6, syllables: 2 },
  { id: 'b-12', word: 'crayon', letters: 6, syllables: 2 },
  { id: 'b-13', word: 'helmet', letters: 6, syllables: 2 },
  { id: 'b-14', word: 'magnet', letters: 6, syllables: 2 },
  { id: 'b-15', word: 'pillow', letters: 6, syllables: 2 },
  { id: 'b-16', word: 'ribbon', letters: 6, syllables: 2 },
  { id: 'b-17', word: 'saddle', letters: 6, syllables: 2 },
  { id: 'b-18', word: 'tunnel', letters: 6, syllables: 2 },
  { id: 'b-19', word: 'compass', letters: 7, syllables: 2 },
  { id: 'b-20', word: 'padlock', letters: 7, syllables: 2 },
] as const;

export type ListId = 'listA' | 'listB';

export function getWordList(id: ListId): readonly WordItem[] {
  return id === 'listA' ? LIST_A : LIST_B;
}
