import { supabase } from './supabase';
import {
  getAuctionServer,
  getPreferredServer,
  normalizeServer,
} from './auctionServers';

/** Read one auction directory row. Returns null when Supabase is unavailable. */
export async function fetchAuctionRecord(roomId) {
  if (!supabase || !roomId) return null;
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

const LOOKUP_TIMEOUT_MS = 1500;

function withLookupTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(undefined), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Resolve which RTDB a room belongs to.
 *
 * The Supabase directory is authoritative, so a `?server=` hint is verified
 * when the lookup responds quickly. If Supabase is slow/down, the hint wins
 * after a short timeout so room entry never hangs on the directory; a missing
 * directory row also falls back to the hint.
 */
export async function resolveRoomServer(roomId, hint = null) {
  const hinted = normalizeServer(hint, null);
  const record = await withLookupTimeout(
    fetchAuctionRecord(roomId).catch(() => null),
    LOOKUP_TIMEOUT_MS,
  );
  if (record) return getAuctionServer(record);
  if (hinted) return hinted;
  return getPreferredServer();
}

function isMissingServerColumnError(error) {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  return /server.*column|column.*server/i.test(error.message || '');
}

/**
 * Upsert an auction row with its server.
 *
 * The preferred schema has a top-level `server` column. Until that optional
 * migration is applied, the first write fails with a PostgREST column error;
 * retry with the server stored in the existing `settings` JSON instead. This
 * keeps deployment order irrelevant and makes the app work immediately.
 */
async function writeAuction(payload, server, mode) {
  if (!supabase) return { error: null, usedServerColumn: false };

  const resolvedServer = normalizeServer(server);
  const settings = {
    ...(payload.settings || {}),
    server: resolvedServer,
  };
  const withColumn = {
    ...payload,
    server: resolvedServer,
    settings,
  };
  const write = (row) =>
    mode === 'insert'
      ? supabase.from('auctions').insert(row)
      : supabase.from('auctions').upsert(row);

  const first = await write(withColumn);
  if (!first.error) {
    return { ...first, usedServerColumn: true };
  }
  if (!isMissingServerColumnError(first.error)) {
    return { ...first, usedServerColumn: false };
  }

  return write({ ...payload, settings }).then((result) => ({
    ...result,
    usedServerColumn: false,
  }));
}

/** Update (or create) an existing directory row. Used for room-state flushes. */
export async function upsertAuctionWithServer(payload, server) {
  return writeAuction(payload, server, 'upsert');
}

/**
 * Insert a brand-new directory row. The primary key on `auctions.id` makes this
 * the cross-server uniqueness guard for room codes: a racing insert fails with
 * PostgreSQL 23505 instead of silently overwriting the other room.
 */
export async function insertAuctionWithServer(payload, server) {
  return writeAuction(payload, server, 'insert');
}
