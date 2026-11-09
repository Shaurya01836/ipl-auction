const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a fixed-length, uppercase alphanumeric room code.
 *
 * The old `Math.random().toString(36).substring(2, 8)` approach could return
 * fewer than six characters (and occasionally an empty/very short code) for
 * certain random values. A fixed alphabet keeps codes uniform and readable.
 *
 * `random` is injectable so the pure generator can be tested deterministically.
 */
export function generateRoomCode(length = 6, random = Math.random) {
  const size = Math.max(1, Math.floor(length));
  let code = '';
  for (let i = 0; i < size; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalise user-entered room codes (trim + uppercase). */
export function normalizeRoomCode(value) {
  return String(value || '').trim().toUpperCase();
}
