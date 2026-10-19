import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CAPACITY,
  describeConsoleArgs,
  isCapacityWarning,
  resolveProblemReason,
} from '../lib/connectionAlerts';

const ConnectionAlertContext = createContext(null);

// While the server is full the SDK keeps retrying, and every failed attempt
// logs the same warning again. After a dismissal, stay quiet for a minute so
// the notice does not turn into spam.
const DISMISS_COOLDOWN_MS = 60_000;

/**
 * Surfaces "we cannot talk to the live auction server" as a first-class UI
 * state instead of letting pages sit on a loading spinner forever.
 *
 * Two independent detectors feed it, because neither one is reliable alone:
 *
 * 1. The SDK's capacity warning. It is the *precise* signal — it names the
 *    connection limit — but the server only reports that kill reason on some
 *    failure paths, so on its own it misses cases.
 * 2. A watchdog (`reportConnectionTrouble`), driven by the auction session when
 *    nothing has arrived from the database. It catches every path that would
 *    leave a screen loading forever, at the cost of not knowing *why*.
 *
 * The SDK exposes the capacity case only as a console warning, so we wrap
 * `console.warn` (the same approach `QuotaContext` already uses for
 * `console.error`) and match the one specific message. Everything still passes
 * through untouched.
 */
export const ConnectionAlertProvider = ({ children }) => {
  // null | CAPACITY | UNREACHABLE
  const [problem, setProblem] = useState(null);
  const dismissedAtRef = useRef(0);
  const sawCapacityRef = useRef(false);

  // A dismissal silences both detectors briefly, never permanently: if the
  // problem is still there it can re-surface instead of hiding forever.
  const isMuted = () => Date.now() - dismissedAtRef.current < DISMISS_COOLDOWN_MS;

  const dismiss = useCallback(() => {
    dismissedAtRef.current = Date.now();
    setProblem(null);
  }, []);

  const retry = useCallback(() => {
    // A reload re-establishes the RTDB connection cleanly once capacity frees up.
    window.location.reload();
  }, []);

  /** Precise signal: the SDK logged the connection-limit warning. */
  const reportCapacity = useCallback(() => {
    sawCapacityRef.current = true;
    if (isMuted()) return;
    setProblem(CAPACITY);
  }, []);

  /**
   * Fallback signal: a session never managed to reach the database. If the
   * capacity warning was seen we keep that wording; otherwise stay generic
   * rather than blaming the server for what may be a flaky network.
   */
  const reportConnectionTrouble = useCallback(() => {
    if (isMuted()) return;
    setProblem((prev) => resolveProblemReason(prev, sawCapacityRef.current));
  }, []);

  /** The database answered: whatever we were reporting no longer holds. */
  const clearConnectionAlert = useCallback(() => {
    sawCapacityRef.current = false;
    setProblem(null);
  }, []);

  useEffect(() => {
    const originalWarn = console.warn;

    const guardedWarn = (...args) => {
      originalWarn.apply(console, args);
      try {
        if (!isCapacityWarning(describeConsoleArgs(args))) return;
        reportCapacity();
      } catch {
        // A UI watcher must never be able to break logging.
      }
    };

    console.warn = guardedWarn;

    return () => {
      // Only restore if nothing else wrapped console.warn after us.
      if (console.warn === guardedWarn) {
        console.warn = originalWarn;
      }
    };
  }, [reportCapacity]);

  return (
    <ConnectionAlertContext.Provider
      value={{
        problem,
        dismiss,
        retry,
        reportCapacity,
        reportConnectionTrouble,
        clearConnectionAlert,
      }}
    >
      {children}
    </ConnectionAlertContext.Provider>
  );
};

export const useConnectionAlert = () => {
  const context = useContext(ConnectionAlertContext);
  if (!context) {
    throw new Error('useConnectionAlert must be used within a ConnectionAlertProvider');
  }
  return context;
};
