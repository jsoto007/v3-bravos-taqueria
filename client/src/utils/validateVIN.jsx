

// client/src/utils/validateVIN.jsx
// ISO 3779 VIN validation with full check-digit verification (position 9)
// Returns an object { valid: boolean, reason?: string }

/** Transliteration table per ISO 3779 */
const VIN_MAP = Object.freeze({
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
});

/** Positional weights for characters 1..17 */
const WEIGHTS = Object.freeze([8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]);

/** Allowed character set (excludes I, O, Q) */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Validate a VIN string strictly per ISO 3779.
 * - Ignores surrounding whitespace
 * - Uppercases input
 * - Verifies allowed chars (no I/O/Q)
 * - Verifies length = 17
 * - Verifies check digit (position 9): remainder 10 -> 'X'
 *
 * @param {unknown} rawVin - candidate VIN (string-like)
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateVIN(rawVin) {
  // Basic guard: must be non-empty and string-like
  if (rawVin == null) return { valid: false, reason: "Empty VIN." };

  const vin = String(rawVin).trim().toUpperCase().replace(/\s+/g, "");

  // Quick length check before regex work
  if (vin.length !== 17) {
    return { valid: false, reason: "VIN must be 17 characters." };
  }

  // Character whitelist (no I, O, Q)
  if (!VIN_REGEX.test(vin)) {
    return { valid: false, reason: "Invalid characters (I, O, Q are not allowed)." };
  }

  // Compute check digit per ISO 3779
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i];
    const mapped = VIN_MAP[ch];
    // Safety: regex guarantees membership, but keep a guard for unexpected cases
    if (mapped == null) {
      return { valid: false, reason: `Unexpected character at position ${i + 1}.` };
    }
    sum += mapped * WEIGHTS[i];
  }

  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  const actual = vin[8]; // position 9 (0-indexed)

  if (actual !== expected) {
    return { valid: false, reason: `Check digit mismatch (expected ${expected}, found ${actual}).` };
  }

  return { valid: true };
}

/**
 * Convenience boolean helper.
 * @param {unknown} rawVin
 * @returns {boolean}
 */
export function isValidVIN(rawVin) {
  return validateVIN(rawVin).valid === true;
}

export default validateVIN;