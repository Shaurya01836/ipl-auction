/**
 * Directory & History Client API (Cloudflare D1 + Worker)
 * High-performance, low-cost client with multi-tier storage caching
 * and resilient degradation under Cloudflare rate limits.
 */

const rawEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const API_BASE_URL = (rawEnv.VITE_DIRECTORY_API_URL || '').replace(/\/+$/, '');

// ─── Multi-Tier Storage Cache Helpers ───
function readStorageCache(storage, key, ttlMs) {
  try {
    if (typeof window === 'undefined' || !storage) return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.ts < ttlMs) {
      return item.data;
    }
  } catch {}
  return null;
}

function writeStorageCache(storage, key, data) {
  try {
    if (typeof window === 'undefined' || !storage) return;
    storage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function removeStorageCache(storage, key) {
  try {
    if (typeof window === 'undefined' || !storage) return;
    storage.removeItem(key);
  } catch {}
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(isGet ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    });
  } catch (netErr) {
    const error = new Error('Network offline or directory service unavailable');
    error.status = 0;
    error.isNetwork = true;
    throw error;
  }

  // Gracefully handle non-JSON responses (e.g. Cloudflare 429/1015/503 HTML rate limit pages)
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {
      error:
        response.status === 429
          ? 'Directory service rate limit reached. Using offline fallback.'
          : `Directory API status ${response.status}`,
    };
  }

  if (!response.ok) {
    const error = new Error(body.error || `Directory API error: ${response.status}`);
    error.status = response.status;
    error.code = body.code || response.status;
    throw error;
  }

  return body;
}

const PUBLIC_ROOMS_TTL_MS = 20 * 1000; // 20s in-session cache
const PUBLIC_ROOMS_KEY = 'crickauction_cache_public_rooms';
const PLATFORM_STATS_TTL_MS = 60 * 1000; // 60s in-session cache
const PLATFORM_STATS_KEY = 'crickauction_cache_platform_stats';

/**
 * Get live public rooms & active count in one flight.
 * Edge-cached on Cloudflare + 20s in sessionStorage.
 */
export async function getPublicRooms(force = false) {
  if (!force) {
    const cached = readStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PUBLIC_ROOMS_KEY,
      PUBLIC_ROOMS_TTL_MS,
    );
    if (cached) return cached;
  }
  try {
    const res = await request('/api/public-rooms');
    const rooms = res.data || [];
    writeStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PUBLIC_ROOMS_KEY,
      rooms,
    );

    // If activeCount is returned in consolidated response, update stats cache too!
    if (res.activeCount !== undefined) {
      writeStorageCache(
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        PLATFORM_STATS_KEY,
        { activeCount: res.activeCount },
      );
    }
    return rooms;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch public rooms', err);
    const fallback = readStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PUBLIC_ROOMS_KEY,
      Infinity,
    );
    return fallback || [];
  }
}

/**
 * Lightweight platform stats.
 * Uses consolidated cache from getPublicRooms or queries /api/stats (cached 60s).
 */
export async function fetchPlatformStats(force = false) {
  if (!force) {
    const cached = readStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PLATFORM_STATS_KEY,
      PLATFORM_STATS_TTL_MS,
    );
    if (cached) return cached;
  }
  try {
    const res = await request('/api/stats');
    const data = {
      activeCount: res.activeCount || 0,
    };
    writeStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PLATFORM_STATS_KEY,
      data,
    );
    return data;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch platform stats', err);
    const fallback = readStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PLATFORM_STATS_KEY,
      Infinity,
    );
    return fallback || { activeCount: 0 };
  }
}

const ROOM_RECORD_TTL_MS = 60 * 1000; // 60s in sessionStorage

/** Read one auction directory row with 1-minute session cache */
export async function fetchAuctionRecord(roomId) {
  if (!roomId) return null;
  const key = `crickauction_cache_room_${roomId}`;
  const cached = readStorageCache(
    typeof sessionStorage !== 'undefined' ? sessionStorage : null,
    key,
    ROOM_RECORD_TTL_MS,
  );
  if (cached) return cached;

  try {
    const res = await request(`/api/auctions/${encodeURIComponent(roomId)}`);
    const record = res.data || null;
    if (record) {
      writeStorageCache(
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        key,
        record,
      );
    }
    return record;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch auction record', err);
    return (
      readStorageCache(
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        key,
        Infinity,
      ) || null
    );
  }
}

/** Write or claim an auction room code */
export async function writeAuctionRecord(payload, server, mode = 'insert') {
  const resolvedServer = server || 'server-1';
  const body = {
    ...payload,
    server: resolvedServer,
    mode,
  };

  try {
    const res = await request('/api/auctions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { data: res, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function insertAuctionRecord(payload, server) {
  return writeAuctionRecord(payload, server, 'insert');
}

export async function upsertAuctionRecord(payload, server) {
  return writeAuctionRecord(payload, server, 'upsert');
}

/** Patch auction status, players, or settings */
export async function updateAuctionRecord(roomId, updates) {
  if (!roomId) return { error: null };
  try {
    const res = await request(`/api/auctions/${encodeURIComponent(roomId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    // Invalidate room cache on local update
    removeStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      `crickauction_cache_room_${roomId}`,
    );
    return { data: res, error: null };
  } catch (err) {
    console.warn('[directoryApi] Failed to update auction', err);
    return { data: null, error: err };
  }
}

/** Delete an auction room and all associated teams */
export async function deleteAuctionRecord(roomId) {
  if (!roomId) return { error: null };
  try {
    await request(`/api/auctions/${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
    });
    removeStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      `crickauction_cache_room_${roomId}`,
    );
    removeStorageCache(
      typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      PUBLIC_ROOMS_KEY,
    );
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

const TEAMS_TTL_MS = 10 * 60 * 1000; // 10 minutes session cache (squads are immutable)

/** Batch write team squads after auction completion */
export async function flushTeamsData(teams) {
  if (!teams || teams.length === 0) return { error: null };
  try {
    const res = await request('/api/teams/batch', {
      method: 'POST',
      body: JSON.stringify(teams),
    });
    return { data: res, error: null };
  } catch (err) {
    console.warn('[directoryApi] Failed to flush teams', err);
    return { data: null, error: err };
  }
}

/** Fetch teams for an auction with 10-minute session cache */
export async function fetchTeamsForAuction(auctionId) {
  if (!auctionId) return [];
  const key = `crickauction_cache_teams_${auctionId}`;
  const cached = readStorageCache(
    typeof sessionStorage !== 'undefined' ? sessionStorage : null,
    key,
    TEAMS_TTL_MS,
  );
  if (cached) return cached;

  try {
    const res = await request(`/api/teams?auctionId=${encodeURIComponent(auctionId)}`);
    const teams = res.data || [];
    if (teams.length > 0) {
      writeStorageCache(
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        key,
        teams,
      );
    }
    return teams;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch teams for auction', err);
    return (
      readStorageCache(
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        key,
        Infinity,
      ) || []
    );
  }
}

const HISTORY_TTL_MS = 3 * 60 * 1000; // 3 minutes in localStorage

/** Fetch a user's recent auctions history with 3-minute persistent cache */
export async function fetchUserHistory(userId) {
  if (!userId) return [];
  const key = `crickauction_cache_history_${userId}`;
  const cached = readStorageCache(
    typeof localStorage !== 'undefined' ? localStorage : null,
    key,
    HISTORY_TTL_MS,
  );
  if (cached) return cached;

  try {
    const res = await request(`/api/history?userId=${encodeURIComponent(userId)}`);
    const list = res.data || [];
    writeStorageCache(
      typeof localStorage !== 'undefined' ? localStorage : null,
      key,
      list,
    );
    return list;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch user history', err);
    return (
      readStorageCache(
        typeof localStorage !== 'undefined' ? localStorage : null,
        key,
        Infinity,
      ) || []
    );
  }
}

/** Delete an individual team / history entry */
export async function deleteUserHistoryEntry(teamDocId, userId = null) {
  if (!teamDocId) return { error: null };
  try {
    await request(`/api/teams/${encodeURIComponent(teamDocId)}`, {
      method: 'DELETE',
    });
    if (userId) {
      removeStorageCache(
        typeof localStorage !== 'undefined' ? localStorage : null,
        `crickauction_cache_history_${userId}`,
      );
    }
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/** Admin: fetch all auctions and aggregated stats */
export async function fetchAdminAuctions() {
  try {
    const res = await request('/api/admin/auctions');
    return {
      totalCount: res.totalCount || 0,
      activeCount: res.activeCount || 0,
      completedCount: res.completedCount || 0,
      auctions: res.auctions || [],
      error: null,
    };
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch admin auctions', err);
    return {
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      auctions: [],
      error: err,
    };
  }
}

/** Fetch cached AI squad analysis for an auction */
export async function getAuctionAiRating(auctionId) {
  if (!auctionId) return { success: false, analysis: null };
  try {
    return await request(`/api/auctions/${auctionId}/ai-rating`);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Generate and cache AI squad analysis for an auction */
export async function generateAuctionAiRating(auctionId, payload) {
  if (!auctionId || !payload) return { success: false, analysis: null };
  try {
    return await request(`/api/auctions/${auctionId}/ai-rating`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'X-CrickAuction-Client': 'crickauction-web',
      },
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
}
