import { useEffect, useState } from 'react';
import {
  DEFAULT_AUCTION_SERVER,
  LOCAL_SERVER,
  getPreferredServer,
  getServerFromSearch,
  normalizeServer,
  setPreferredServer,
} from '../lib/auctionServers';
import { resolveRoomServer } from '../lib/auctionServerDirectory';
import { isServerAvailable, setActiveServer } from '../lib/firebase';
import { isHotspotRoomCode } from '../lib/roomCodes';

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
 * Hotspot and offline rooms resolve immediately to 'local' without any cloud
 * lookup. Supabase's auction directory is authoritative for cloud rooms;
 * `?server=` is a fallback hint when the directory is unavailable.
 *
 * The state is keyed by roomId so changing rooms derives `ready = false`
 * immediately, without a synchronous state reset inside the effect.
 */
export default function useRoomServer(roomId) {
  const [resolution, setResolution] = useState(EMPTY_RESOLUTION);

  useEffect(() => {
    let cancelled = false;

    if (!roomId) return undefined;

    const searchStr = typeof window !== 'undefined' ? window.location.search : '';
    const hint = getServerFromSearch(searchStr);

    // Hotspot / local offline mode bypasses all cloud server discovery & RTDB probes
    if (
      isHotspotRoomCode(roomId) ||
      hint === LOCAL_SERVER ||
      searchStr.includes('local=true') ||
      searchStr.includes('server=local')
    ) {
      setResolution({
        roomId,
        server: LOCAL_SERVER,
        ready: true,
        error: null,
      });
      return undefined;
    }

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
