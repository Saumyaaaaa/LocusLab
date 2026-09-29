// Unbiased cryptographic Fisher-Yates array shuffling utilizing crypto.getRandomValues.

/**
 * Returns a cryptographically randomized permutation of an array without modulo bias.
 */
export function cryptoShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  const buffer = new Uint32Array(1);

  for (let i = result.length - 1; i > 0; i--) {
    // Generate uniform random index j in [0, i]
    const range = i + 1;
    const maxUnbiased = Math.floor(0xffffffff / range) * range;
    let rand: number;

    do {
      crypto.getRandomValues(buffer);
      rand = buffer[0];
    } while (rand >= maxUnbiased);

    const j = rand % range;
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
