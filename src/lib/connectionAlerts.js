/**
 * Detection helpers for Realtime Database capacity warnings.
 *
 * The Firebase JS SDK has no public callback for "this database is at its
 * connection limit". The server reports the reason and the SDK just logs it
 * through `@firebase/logger`, which forwards WARN messages to `console.warn`:
 *
 *   FIREBASE WARNING: The Firebase database '<name>' has reached its peak
 *   connections limit. If you are the Firebase owner, consider upgrading.
 *   (https://<name>.<region>.firebasedatabase.app/)
 *
 * Watching that message is therefore the only way to tell "server at capacity"
 * apart from an ordinary network/offline problem, which the app should not
 * report as a capacity issue.
 *
 * Keep these patterns narrow on purpose: a false positive would show a
 * "server is full" notice for an unrelated warning.
 */
export const CAPACITY_WARNING_PATTERNS = Object.freeze([
  /peak connections limit/i,
  /has reached its peak connections/i,
  /maximum number of (?:concurrent )?connections/i,
]);

/**
 * @param {unknown} text
 * @returns {boolean} true only for the Realtime Database capacity warning.
 */
export const isCapacityWarning = (text) => {
  if (typeof text !== 'string' || text.length === 0) return false;
  return CAPACITY_WARNING_PATTERNS.some((pattern) => pattern.test(text));
};

/**
 * Flattens `console.*` arguments into one searchable string.
 *
 * The Firebase logger calls `console.warn('[timestamp]  @firebase/database:', reason)`,
 * so the message we care about is usually the second argument.
 *
 * @param {unknown[]} args
 * @returns {string}
 */
export const describeConsoleArgs = (args = []) =>
  args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');

/** The database is at its simultaneous-connection ceiling. */
export const CAPACITY = 'capacity';
/** A session could not reach the database at all, for an unknown reason. */
export const UNREACHABLE = 'unreachable';

/**
 * Picks the notice to show when the only available signal is "this session
 * never got any data". A reason that is already on screen is never downgraded,
 * and an earlier capacity warning keeps its specific wording.
 *
 * @param {string|null} current the reason already being shown (null = none)
 * @param {boolean} sawCapacityWarning whether the SDK ever logged the warning
 * @returns {string} CAPACITY or UNREACHABLE
 */
export const resolveProblemReason = (current, sawCapacityWarning) =>
  current ?? (sawCapacityWarning ? CAPACITY : UNREACHABLE);

/**
 * Whether a session that has produced no data yet should be reported as a
 * connection problem.
 *
 * A connected socket, or any snapshot that arrived at all, proves the database
 * is reachable — so a slow or empty load is not a connection failure. That last
 * part matters: a room that does not exist answers with an empty snapshot, and
 * must not be reported as "the server is unreachable".
 *
 * @param {{ socketConnected: boolean, auctionLoaded: boolean }} session
 * @returns {boolean}
 */
export const shouldReportConnectionTrouble = ({ socketConnected, auctionLoaded }) =>
  !socketConnected && !auctionLoaded;
