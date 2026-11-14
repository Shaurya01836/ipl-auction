/**
 * Directory & History Client API (Cloudflare D1 + Worker)
 * Replaces Supabase client for all room directory, public room listings, and user history.
 */

const rawEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const API_BASE_URL = (rawEnv.VITE_DIRECTORY_API_URL || '').replace(/\/+$/, '');

const directoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CrickAuction-Client': 'crickauction-web',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Directory API error: ${response.status}`);
    error.status = response.status;
    error.code = body.code || response.status;
    throw error;
  }

  return body;
}

/** Get live public rooms (edge cached 5s on Cloudflare) */
export async function getPublicRooms() {
  try {
    const res = await request('/api/public-rooms');
    return res.data || [];
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch public rooms', err);
    return [];
  }
}

/** Read one auction directory row with 1-minute in-memory cache */
export async function fetchAuctionRecord(roomId) {
  if (!roomId) return null;

  const cached = directoryCache.get(roomId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.record;
  }

  try {
    const res = await request(`/api/auctions/${encodeURIComponent(roomId)}`);
    const record = res.data || null;
    if (record) {
      directoryCache.set(roomId, { record, timestamp: Date.now() });
    }
    return record;
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch auction record', err);
    return null;
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
    directoryCache.delete(roomId);
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

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

/** Fetch teams for an auction */
export async function fetchTeamsForAuction(auctionId) {
  if (!auctionId) return [];
  try {
    const res = await request(`/api/teams?auctionId=${encodeURIComponent(auctionId)}`);
    return res.data || [];
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch teams for auction', err);
    return [];
  }
}

/** Fetch a user's recent auctions history */
export async function fetchUserHistory(userId) {
  if (!userId) return [];
  try {
    const res = await request(`/api/history?userId=${encodeURIComponent(userId)}`);
    return res.data || [];
  } catch (err) {
    console.warn('[directoryApi] Failed to fetch user history', err);
    return [];
  }
}

/** Delete an individual team / history entry */
export async function deleteUserHistoryEntry(teamDocId) {
  if (!teamDocId) return { error: null };
  try {
    await request(`/api/teams/${encodeURIComponent(teamDocId)}`, {
      method: 'DELETE',
    });
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
