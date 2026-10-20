import { useEffect, useState } from 'react';
import {
  DEFAULT_AUCTION_SERVER,
  getPreferredServer,
  getServerFromSearch,
  normalizeServer,
  setPreferredServer,
} from '../lib/auctionServers';
import { resolveRoomServer } from '../lib/auctionServerDirectory';
import { isServerAvailable, setActiveServer } from '../lib/firebase';

const EMPTY_RESOLUTION = {
  roomId: null,
  server: null,
  ready: false,
  error: null,
};

/**
 * Resolve a room's RTDB before any listener subscribes.
 *
 * This is the readiness gate used by Lobby, AuctionRoom and AuctionSummary.
 * Supabase's auction directory is authoritative; `?server=` is a fallback hint
 * when the directory is unavailable or the row has not been mirrored yet.
 *
 * The state is keyed by roomId so changing rooms derives `ready = false`
 * immediately, without a synchronous state reset inside the effect.
 */
export default function useRoomServer(roomId) {
  const [resolution, setResolution] = useState(EMPTY_RESOLUTION);

  useEffect(() => {
    let cancelled = false;

    if (!roomId) return undefined;

    const hint = getServerFromSearch(window.location.search);

    resolveRoomServer(roomId, hint)
      .catch((lookupError) => {
        console.warn(
          '[servers] Room directory lookup failed; using the preferred server',
          lookupError,
        );
        return hint || getPreferredServer();
      })
      .then((resolved) => {
        if (cancelled) return;

        const candidate = normalizeServer(resolved);
        const next = isServerAvailable(candidate)
          ? candidate
          : DEFAULT_AUCTION_SERVER;

        setActiveServer(next);
        setPreferredServer(next);
        setResolution({
          roomId,
          server: next,
          ready: true,
          error: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const current = resolution.roomId === roomId ? resolution : EMPTY_RESOLUTION;

  return {
    server: current.server,
    ready: Boolean(roomId) && current.ready,
    error: current.error,
  };
}
