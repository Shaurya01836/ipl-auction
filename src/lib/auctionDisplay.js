/**
 * Small, dependency-free helpers shared by auction screens.
 *
 * These functions deliberately distinguish "missing" from a real numeric zero.
 * Financial values are never coerced to a default when the value is genuinely 0.
 */

/**
 * Convert a value to a finite number, or return `fallback` when it is missing
 * or invalid. A genuine numeric 0 (or "0") is preserved.
 */
export const toFiniteNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  // Normalise -0 so callers and tests can rely on a single zero value.
  return numeric === 0 ? 0 : numeric;
};

/**
 * Canonical overseas rule for Crick Auction:
 * only the exact country code "IND" is Indian. Missing, empty, or any other
 * country value is overseas.
 */
export const isOverseasPlayer = (player) => player?.country !== 'IND';

const lookupPlayer = (id, playerIndex) => {
  if (!playerIndex) return null;
  if (typeof playerIndex.get === 'function') return playerIndex.get(id) ?? null;
  if (Array.isArray(playerIndex)) {
    return playerIndex.find((player) => player?.id === id) ?? null;
  }
  return playerIndex[id] ?? null;
};

/**
 * Resolve a saved squad entry (string id or { id, bid }) against the canonical
 * player list. If the canonical record cannot be found, the entry itself is
 * returned so its own country (if any) can be used.
 */
export const resolveSquadPlayer = (entry, playerIndex) => {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'string') return lookupPlayer(entry, playerIndex);
  if (typeof entry !== 'object') return null;

  if (entry.id) {
    return lookupPlayer(entry.id, playerIndex) ?? entry;
  }

  return entry;
};

/**
 * Count overseas players in a saved squad. Unresolvable entries have no
 * country, so the canonical rule counts them as overseas.
 */
export const countOverseas = (squad, playerIndex) => {
  if (!Array.isArray(squad)) return 0;

  return squad.reduce((count, entry) => {
    if (entry === null || entry === undefined) return count;
    return count + (isOverseasPlayer(resolveSquadPlayer(entry, playerIndex)) ? 1 : 0);
  }, 0);
};

/**
 * Format a crore value for display. Returns an em dash for missing or invalid
 * values; a genuine zero is shown as 0.00 (or 0.0 with digits = 1).
 */
export const formatCrores = (value, digits = 2) => {
  const numeric = toFiniteNumber(value, null);
  return numeric === null ? '—' : numeric.toFixed(digits);
};

/**
 * Compute how much a team has spent. Prefer an explicitly stored `spent` value
 * (including 0), otherwise derive it from budget minus remaining budget.
 * Returns null when there is not enough information.
 */
export const computeTeamSpent = ({ budget, budgetRemaining, spent } = {}) => {
  const storedSpent = toFiniteNumber(spent, null);
  if (storedSpent !== null) return Math.max(0, storedSpent);

  const remaining = toFiniteNumber(budgetRemaining, null);
  if (remaining === null) return null;

  const totalBudget = toFiniteNumber(budget, 120);
  return Math.max(0, totalBudget - remaining);
};

/**
 * Clamp a countdown to the configured timer range.
 */
export const clampTimer = (secondsLeft, totalSeconds) => {
  const total = toFiniteNumber(totalSeconds, 0);
  if (total <= 0) return 0;

  const seconds = toFiniteNumber(secondsLeft, 0);
  return Math.min(total, Math.max(0, seconds));
};

/**
 * Convert a countdown into a 0-100 progress percentage.
 */
export const timerProgress = (secondsLeft, totalSeconds) => {
  const total = toFiniteNumber(totalSeconds, 0);
  if (total <= 0) return 0;

  return (clampTimer(secondsLeft, total) / total) * 100;
};

/**
 * Decide whether a scroll container should follow new content. Used by chat so
 * a user reading older messages is not pulled back to the bottom.
 */
export const shouldStickToBottom = (
  scrollHeight,
  scrollTop,
  clientHeight,
  threshold = 48,
) => {
  const height = toFiniteNumber(scrollHeight, 0);
  const top = toFiniteNumber(scrollTop, 0);
  const viewport = toFiniteNumber(clientHeight, 0);

  return height - top - viewport <= threshold;
};
