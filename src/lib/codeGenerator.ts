// Unbiased cryptographic random code generator using rejection sampling over an unambiguous uppercase alphabet.

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const ALPHABET_LENGTH = CODE_ALPHABET.length; // 31
// Max unbiased byte value: 256 - (256 % 31) = 248
const REJECTION_THRESHOLD = 256 - (256 % ALPHABET_LENGTH);

/**
 * Generates an 8-character human-friendly participant code without ambiguous characters (no 0, O, 1, I, l).
 * Uses crypto.getRandomValues with rejection sampling to eliminate modulo bias completely.
 */
export function generateParticipantCode(length = 8): string {
  let result = '';
  const buffer = new Uint8Array(1);

  while (result.length < length) {
    crypto.getRandomValues(buffer);
    const byte = buffer[0];
    if (byte < REJECTION_THRESHOLD) {
      result += CODE_ALPHABET[byte % ALPHABET_LENGTH];
    }
  }

  return result;
}
