/**
 * Cloudflare Worker API for CrickAuction Directory & History
 * Database: Cloudflare D1 (SQLite)
 */

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    const host = hostname.toLowerCase();
    return (
      host === 'crickauction.in' ||
      host.endsWith('.crickauction.in') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.web.app') ||
      host.endsWith('.firebaseapp.com')
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(origin) {
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://crickauction.in',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CrickAuction-Client',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function parseJsonField(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function stringifyJsonField(val) {
  if (val === undefined || val === null) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
    const clientHeader = request.headers.get('X-CrickAuction-Client');

    const json = (data, status = 200, extraHeaders = {}) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
          ...extraHeaders,
        },
      });
    };

    // ─── 0. CORS Preflight ───
    if (request.method === 'OPTIONS') {
      if (origin && !isAllowedOrigin(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    // Health check endpoint
    if (request.method === 'GET' && (path === '' || path === '/api' || path === '/health')) {
      return json({ status: 'ok', service: 'crickauction-api', timestamp: Date.now() }, 200, {}, origin);
    }

    // ─── Security Checks ───
    // 1. Origin Restriction: Reject browser requests from unauthorized origins
    if (origin && !isAllowedOrigin(origin)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Mutating Operations Protection: Require allowed origin or verified client header
    if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
      const isAllowed = isAllowedOrigin(origin) || clientHeader === 'crickauction-web';
      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Unauthorized request source' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    try {

      // ─── 1. Public Rooms Directory (Edge-Cached 5s) ───
      if (request.method === 'GET' && path === '/api/public-rooms') {
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let cached = await cache.match(cacheKey);
        if (cached) return cached;

        // Active waiting rooms created in the last 2 hours
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        const { results } = await env.DB.prepare(
          `SELECT id, server, auction_type, squad_limit, overseas_limit, settings, players, created_at 
           FROM auctions 
           WHERE is_public = 1 AND status = 'waiting' AND created_at >= ? 
           ORDER BY created_at DESC LIMIT 20`
        ).bind(twoHoursAgo).all();

        const formatted = (results || []).map((r) => {
          const players = parseJsonField(r.players, []);
          const settings = parseJsonField(r.settings, {});
          return {
            id: r.id,
            server: r.server || 'server-1',
            type: r.auction_type || 'mega',
            playerCount: Array.isArray(players) ? players.length : 1,
            maxPlayers: 10,
            hostName: Array.isArray(players) && players[0] ? players[0].name : 'Host',
            budget: settings.budget || 120,
            createdAt: r.created_at,
          };
        });

        const response = json({ data: formatted }, 200, {
          'Cache-Control': 'public, max-age=3, s-maxage=5, stale-while-revalidate=10',
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }

      // ─── 2. Single Auction Lookup ───
      if (request.method === 'GET' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        const row = await env.DB.prepare(
          `SELECT * FROM auctions WHERE id = ? LIMIT 1`
        ).bind(id).first();

        if (!row) {
          return json({ data: null }, 200);
        }

        return json({
          data: {
            ...row,
            settings: parseJsonField(row.settings, {}),
            players: parseJsonField(row.players, []),
            banned_players: parseJsonField(row.banned_players, []),
          },
        });
      }

      // ─── 3. Create / Upsert Auction ───
      if (request.method === 'POST' && path === '/api/auctions') {
        const body = await request.json();
        const {
          id,
          server = 'server-1',
          auction_type = 'mega',
          status = 'waiting',
          is_public = 1,
          squad_limit = 25,
          overseas_limit = 8,
          settings,
          players,
          banned_players,
          mode = 'insert',
        } = body;

        if (!id) return json({ error: 'Missing id' }, 400);

        if (mode === 'insert') {
          // Check collision
          const existing = await env.DB.prepare(
            `SELECT id FROM auctions WHERE id = ? LIMIT 1`
          ).bind(id).first();

          if (existing) {
            return json({ error: 'Room code already taken', code: 'ROOM_CODE_TAKEN' }, 409);
          }
        }

        await env.DB.prepare(
          `INSERT INTO auctions (
            id, server, auction_type, status, is_public, squad_limit, overseas_limit, settings, players, banned_players, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            server = excluded.server,
            status = excluded.status,
            is_public = excluded.is_public,
            settings = COALESCE(excluded.settings, auctions.settings),
            players = COALESCE(excluded.players, auctions.players),
            banned_players = COALESCE(excluded.banned_players, auctions.banned_players)`
        ).bind(
          id,
          server,
          auction_type,
          status,
          is_public ? 1 : 0,
          squad_limit,
          overseas_limit,
          stringifyJsonField(settings),
          stringifyJsonField(players),
          stringifyJsonField(banned_players),
          Date.now()
        ).run();

        return json({ success: true, id });
      }

      // ─── 4. Patch Auction Status / Players ───
      if (request.method === 'PATCH' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        const body = await request.json();

        const updates = [];
        const bindings = [];

        if (body.status !== undefined) {
          updates.push('status = ?');
          bindings.push(body.status);
        }
        if (body.players !== undefined) {
          updates.push('players = ?');
          bindings.push(stringifyJsonField(body.players));
        }
        if (body.banned_players !== undefined) {
          updates.push('banned_players = ?');
          bindings.push(stringifyJsonField(body.banned_players));
        }
        if (body.settings !== undefined) {
          updates.push('settings = ?');
          bindings.push(stringifyJsonField(body.settings));
        }

        if (updates.length > 0) {
          bindings.push(id);
          await env.DB.prepare(
            `UPDATE auctions SET ${updates.join(', ')} WHERE id = ?`
          ).bind(...bindings).run();
        }

        return json({ success: true, id });
      }

      // ─── 5. Delete Auction (Cascades to Teams) ───
      if (request.method === 'DELETE' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM teams WHERE auction_id = ?`).bind(id),
          env.DB.prepare(`DELETE FROM auctions WHERE id = ?`).bind(id),
        ]);
        return json({ success: true, id });
      }

      // ─── 6. Upsert Teams (Single or Batch) ───
      if (request.method === 'POST' && (path === '/api/teams' || path === '/api/teams/batch')) {
        const body = await request.json();
        const items = Array.isArray(body) ? body : (body.teams ? body.teams : [body]);

        const statements = items.map((t) => {
          return env.DB.prepare(
            `INSERT INTO teams (
              id, auction_id, user_id, team_id, team_name, budget_remaining, spent, squad, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              team_name = excluded.team_name,
              budget_remaining = excluded.budget_remaining,
              spent = excluded.spent,
              squad = excluded.squad`
          ).bind(
            t.id,
            t.auction_id || t.auctionId,
            t.user_id || t.userId,
            t.team_id || t.teamId,
            t.team_name || t.teamName || 'Unknown',
            t.budget_remaining ?? t.budgetRemaining ?? 120,
            t.spent ?? 0,
            stringifyJsonField(t.squad || []),
            t.created_at || Date.now()
          );
        });

        if (statements.length > 0) {
          await env.DB.batch(statements);
        }

        return json({ success: true, count: statements.length });
      }

      // ─── 7. Get Teams for Auction ───
      if (request.method === 'GET' && path === '/api/teams') {
        const auctionId = url.searchParams.get('auctionId');
        if (!auctionId) return json({ data: [] });

        const { results } = await env.DB.prepare(
          `SELECT * FROM teams WHERE auction_id = ?`
        ).bind(auctionId).all();

        const formatted = (results || []).map((t) => ({
          ...t,
          squad: parseJsonField(t.squad, []),
        }));

        return json({ data: formatted });
      }

      // ─── 8. User History ───
      if (request.method === 'GET' && path === '/api/history') {
        const userId = url.searchParams.get('userId');
        if (!userId) return json({ data: [] });

        const { results: teamRows } = await env.DB.prepare(
          `SELECT t.*, a.settings AS auction_settings, a.status AS auction_status, 
                  a.auction_type, a.overseas_limit, a.squad_limit, a.server AS auction_server
           FROM teams t
           LEFT JOIN auctions a ON t.auction_id = a.id
           WHERE t.user_id = ?
           ORDER BY t.created_at DESC
           LIMIT 20`
        ).bind(userId).all();

        const formatted = (teamRows || []).map((t) => {
          const auctionSettings = parseJsonField(t.auction_settings, {});
          return {
            id: t.id,
            roomId: t.auction_id,
            server: t.auction_server || auctionSettings.server || 'server-1',
            teamId: t.team_id,
            teamName: t.team_name,
            mode: t.auction_type || 'mega',
            status: t.auction_status || 'waiting',
            budgetRemaining: t.budget_remaining,
            spent: t.spent,
            overseasLimit: t.overseas_limit || 8,
            squadLimit: t.squad_limit || 25,
            squad: parseJsonField(t.squad, []),
            createdAt: t.created_at,
          };
        });

        return json({ data: formatted });
      }

      // ─── 9. Delete User History Entry ───
      if (request.method === 'DELETE' && path.startsWith('/api/teams/')) {
        const id = path.replace('/api/teams/', '').trim();
        await env.DB.prepare(`DELETE FROM teams WHERE id = ?`).bind(id).run();
        return json({ success: true, id });
      }

      // ─── 10. Admin Auctions & Stats ───
      if (request.method === 'GET' && path === '/api/admin/auctions') {
        const [totalRes, activeRes, completedRes, listRes] = await env.DB.batch([
          env.DB.prepare(`SELECT COUNT(*) AS count FROM auctions`),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM auctions WHERE status != 'completed'`),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM auctions WHERE status = 'completed'`),
          env.DB.prepare(`SELECT id, server, auction_type, status, created_at FROM auctions ORDER BY created_at DESC LIMIT 100`),
        ]);

        return json({
          totalCount: totalRes.results?.[0]?.count || 0,
          activeCount: activeRes.results?.[0]?.count || 0,
          completedCount: completedRes.results?.[0]?.count || 0,
          auctions: listRes.results || [],
        });
      }

      return json({ error: 'Endpoint not found' }, 404);
    } catch (err) {
      console.error('[worker-error]', err);
      return json({ error: err.message || 'Internal error' }, 500);
    }
  },
};
