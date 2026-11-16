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
      host === '[::1]' ||
      host.endsWith('.web.app') ||
      host.endsWith('.firebaseapp.com') ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.pages.dev') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
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

// --- Rate Limiter (Sliding 60s Window per Client IP) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
let lastRateLimitCleanup = Date.now();

function cleanupRateLimits(now) {
  if (now - lastRateLimitCleanup < 5 * 60 * 1000) return;
  lastRateLimitCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(ip, category = 'read') {
  if (!ip) return { allowed: true };
  const now = Date.now();
  cleanupRateLimits(now);

  const key = `${category}:${ip}`;
  let entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(key, entry);
    return { allowed: true };
  }

  entry.count += 1;
  // Maximum operations per 60-second window per IP
  const maxLimit = category === 'write' ? 40 : 60;
  if (entry.count > maxLimit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
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

    // --- 0. CORS Preflight ---
    if (request.method === 'OPTIONS') {
      const allowed = isAllowedOrigin(origin);
      return new Response(null, {
        status: allowed ? 204 : 403,
        headers: {
          ...getCorsHeaders(origin),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    // Health check endpoint
    if (request.method === 'GET' && (path === '' || path === '/api' || path === '/health')) {
      return json({ status: 'ok', service: 'crickauction-api', timestamp: Date.now() }, 200, {}, origin);
    }

    // --- Security Checks ---
    // 1. Origin Restriction: Reject browser requests from unauthorized origins on mutating endpoints
    const isPublicRead = request.method === 'GET' && (path === '/api/stats' || path === '/api/public-rooms' || path.endsWith('/ai-rating'));
    if (origin && !isAllowedOrigin(origin) && !isPublicRead) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
        },
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

    // 3. Server-Side Rate Limiter (Per client IP)
    const clientIp =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      'unknown';
    const isMutation = ['POST', 'PATCH', 'DELETE'].includes(request.method);
    const rateLimit = checkRateLimit(clientIp, isMutation ? 'write' : 'read');

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded: Too many requests. Please wait ${rateLimit.retryAfter}s before retrying.`,
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter),
            ...getCorsHeaders(origin),
          },
        },
      );
    }

    try {

      // --- 1. Public Rooms Directory & Stats Consolidated (Edge-Cached 15s) ---
      if (request.method === 'GET' && path === '/api/public-rooms') {
        const cache = caches.default;
        const cacheUrl = new URL(url.origin + '/api/public-rooms');
        const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
        let cached = await cache.match(cacheKey);
        if (cached) return cached;

        // Active waiting rooms created in the last 20 minutes with online admin/host
        const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
        const [roomsRes, statsRow] = await Promise.all([
          env.DB.prepare(
            `SELECT id, server, auction_type, squad_limit, overseas_limit, settings, players, host_online, created_at 
             FROM auctions 
             WHERE is_public = 1 AND status = 'waiting' AND host_online = 1 AND created_at >= ? 
             ORDER BY created_at DESC LIMIT 20`
          ).bind(twentyMinutesAgo).all(),
          env.DB.prepare(
            `SELECT active_count FROM platform_stats WHERE id = 'global' LIMIT 1`
          ).first().catch(() => null),
        ]);

        const formatted = (roomsRes.results || []).map((r) => {
          const players = parseJsonField(r.players, []);
          const settings = parseJsonField(r.settings, {});
          return {
            id: r.id,
            server: r.server || 'server-1',
            type: r.auction_type || 'mega',
            playerCount: Array.isArray(players) ? players.length : 1,
            maxPlayers: 10,
            hostName: Array.isArray(players) && players[0] ? players[0].name : 'Host',
            hostOnline: r.host_online !== 0,
            budget: settings.budget || 120,
            createdAt: r.created_at,
          };
        });

        const response = json({ data: formatted, activeCount: statsRow?.active_count ?? 0 }, 200, {
          'Cache-Control': 'public, max-age=10, s-maxage=15, stale-while-revalidate=30',
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }

      // --- 1.1 Fast Platform Stats (Single-Row Read, Edge-Cached 60s) ---
      if (request.method === 'GET' && path === '/api/stats') {
        const cache = caches.default;
        const cacheUrl = new URL(url.origin + '/api/stats');
        const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
        let cached = await cache.match(cacheKey);
        if (cached) return cached;

        const row = await env.DB.prepare(
          `SELECT active_count FROM platform_stats WHERE id = 'global' LIMIT 1`
        ).first();

        const data = {
          activeCount: row?.active_count || 0,
        };

        const response = json(data, 200, {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }

      // --- 2.0 AI Squad Rating & Analysis (Cached in D1) ---
      if (path.endsWith('/ai-rating')) {
        const id = path.replace('/api/auctions/', '').replace('/ai-rating', '').trim();

        if (request.method === 'GET') {
          const existing = await env.DB.prepare(
            `SELECT ai_analysis FROM auctions WHERE id = ? LIMIT 1`
          ).bind(id).first();

          if (existing?.ai_analysis) {
            const parsed = parseJsonField(existing.ai_analysis, null);
            // Only serve cache if it has modern 0-100 score
            if (parsed && parsed.winner && parsed.winner.score !== undefined) {
              return json({
                success: true,
                cached: true,
                analysis: parsed,
              });
            }
          }
          return json({ success: true, cached: false, analysis: null });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const { mode = 'Mega Auction', teams = [], force = false } = body;

          // Check if valid modern analysis is already cached or within 60s cooldown
          const existing = await env.DB.prepare(
            `SELECT ai_analysis FROM auctions WHERE id = ? LIMIT 1`
          ).bind(id).first();

          if (existing?.ai_analysis) {
            const parsed = parseJsonField(existing.ai_analysis, null);
            if (parsed && parsed.winner && parsed.winner.score !== undefined) {
              const ageMs = Date.now() - (parsed.generatedAt || 0);
              // 60-second cooldown per room prevents spamming or multiple concurrent member clicks
              if (!force || ageMs < 60 * 1000) {
                return json({
                  success: true,
                  cached: true,
                  cooldown: Math.max(0, Math.ceil((60 * 1000 - ageMs) / 1000)),
                  analysis: parsed,
                });
              }
            }
          }

          if (!teams || teams.length === 0) {
            return json({ error: 'No teams provided for evaluation' }, 400);
          }

          if (!env.GROQ_API_KEY) {
            return json({ error: 'AI analysis service unconfigured' }, 503);
          }

          // Build prompt with all players from each squad + mode context
          const teamsContext = teams.map((t) => {
            const roster = t.roster || t.players || (t.topStars ? t.topStars.map(s => s.name).join(', ') : 'None');
            return `- [${t.teamId || t.teamName}] ${t.teamName || t.teamId} (Spent ₹${t.spent || 0}Cr, ${t.playerCount || 0} players):\n  Roster: ${roster}`;
          }).join('\n');

          const prompt = `You are a world-class IPL cricket scout and analyst.
Analyze the complete squads for each franchise in the context of this game mode: ${mode}.
Evaluate every player's role, squad balance, depth, and fit for this specific format.
Give each squad a rating from 0 to 100 based on their readiness to win this format, and a 1-2 line punchy squad review.

Teams:
${teamsContext}

Respond ONLY with valid JSON in this exact structure without markdown:
{
  "winner": {
    "teamId": "Team code inside brackets e.g. CSK",
    "score": 92,
    "badge": "e.g. Best Overall Squad",
    "title": "e.g. Tournament Favorites",
    "verdict": "1-2 punchy lines explaining why they won the auction in this mode."
  },
  "teams": [
    {
      "teamId": "Team code inside brackets e.g. CSK",
      "score": 92,
      "grade": "A+",
      "title": "e.g. Bowling Powerhouse",
      "verdict": "1-2 punchy lines on squad strengths and weaknesses in this mode."
    }
  ]
}`;

          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'qwen/qwen3.8-27b',
                messages: [
                  { role: 'system', content: 'You are an IPL cricket auction scout engine. You output strictly raw JSON matching the schema.' },
                  { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                max_tokens: 1500,
                temperature: 0.5,
              }),
            });

            if (!groqRes.ok) {
              const errText = await groqRes.text();
              console.warn('[groq-error]', groqRes.status, errText);
              return json({ success: false, error: 'AI rating generation temporarily unavailable' }, 200);
            }

            const groqData = await groqRes.json();
            const rawContent = groqData.choices?.[0]?.message?.content || '{}';
            const parsed = parseJsonField(rawContent, null);

            if (parsed && parsed.winner) {
              parsed.generatedAt = Date.now();
              // Persist to D1 (upsert so local solo rooms without an existing record also persist)
              try {
                await env.DB.prepare(
                  `INSERT INTO auctions (id, status, ai_analysis, created_at)
                   VALUES (?, 'completed', ?, unixepoch())
                   ON CONFLICT(id) DO UPDATE SET ai_analysis = excluded.ai_analysis`
                ).bind(id, JSON.stringify(parsed)).run();
              } catch (dbErr) {
                console.warn('[ai-d1-upsert-err]', dbErr);
              }

              return json({ success: true, cached: false, analysis: parsed });
            }

            return json({ success: false, error: 'Invalid analysis structure' }, 200);
          } catch (aiErr) {
            console.error('[ai-rating-error]', aiErr);
            return json({ success: false, error: aiErr.message || 'AI rating failed' }, 200);
          }
        }
      }

      // --- 2. Single Auction Lookup (Cached 10s) ---
      if (request.method === 'GET' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        const row = await env.DB.prepare(
          `SELECT * FROM auctions WHERE id = ? LIMIT 1`
        ).bind(id).first();

        if (!row) {
          return json({ data: null }, 200, { 'Cache-Control': 'public, max-age=5' });
        }

        return json({
          data: {
            ...row,
            settings: parseJsonField(row.settings, {}),
            players: parseJsonField(row.players, []),
            banned_players: parseJsonField(row.banned_players, []),
          },
        }, 200, {
          'Cache-Control': 'public, max-age=10, s-maxage=15, stale-while-revalidate=30',
        });
      }

      // --- 3. Create / Upsert Auction ---
      if (request.method === 'POST' && path === '/api/auctions') {
        const body = await request.json();
        const {
          id,
          server = 'server-1',
          auction_type = 'mega',
          status = 'waiting',
          is_public = 1,
          host_online = 1,
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

        const insertAuctionStmt = env.DB.prepare(
          `INSERT INTO auctions (
            id, server, auction_type, status, is_public, host_online, squad_limit, overseas_limit, settings, players, banned_players, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            server = excluded.server,
            status = excluded.status,
            is_public = excluded.is_public,
            host_online = excluded.host_online,
            settings = COALESCE(excluded.settings, auctions.settings),
            players = COALESCE(excluded.players, auctions.players),
            banned_players = COALESCE(excluded.banned_players, auctions.banned_players)`
        ).bind(
          id,
          server,
          auction_type,
          status,
          is_public ? 1 : 0,
          host_online ? 1 : 0,
          squad_limit,
          overseas_limit,
          stringifyJsonField(settings),
          stringifyJsonField(players),
          stringifyJsonField(banned_players),
          Date.now()
        );

        if (mode === 'insert') {
          await env.DB.batch([
            insertAuctionStmt,
            env.DB.prepare(
              `UPDATE platform_stats SET total_count = total_count + 1, active_count = active_count + 1, updated_at = ? WHERE id = 'global'`
            ).bind(Date.now()),
          ]);
        } else {
          await insertAuctionStmt.run();
        }

        return json({ success: true, id });
      }

      // --- 4. Patch Auction Status / Players ---
      if (request.method === 'PATCH' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        const body = await request.json();

        const updates = [];
        const bindings = [];

        if (body.status !== undefined) {
          updates.push('status = ?');
          bindings.push(body.status);
        }
        if (body.host_online !== undefined) {
          updates.push('host_online = ?');
          bindings.push(body.host_online ? 1 : 0);
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
          const stmts = [
            env.DB.prepare(`UPDATE auctions SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings),
          ];

          if (body.status !== undefined) {
            const current = await env.DB.prepare(`SELECT status FROM auctions WHERE id = ? LIMIT 1`).bind(id).first();
            const prevStatus = current?.status || 'waiting';

            // Only update active_count when status genuinely transitions to terminal (completed/cancelled)
            if (body.status !== prevStatus && (body.status === 'completed' || body.status === 'cancelled')) {
              if (prevStatus === 'active' || prevStatus === 'waiting' || prevStatus === 'paused') {
                stmts.push(
                  env.DB.prepare(
                    `UPDATE platform_stats SET active_count = MAX(0, active_count - 1), updated_at = ? WHERE id = 'global'`
                  ).bind(Date.now())
                );
              }
            }
          }

          await env.DB.batch(stmts);
        }

        return json({ success: true, id });
      }

      // --- 5. Delete Auction (Cascades to Teams) ---
      if (request.method === 'DELETE' && path.startsWith('/api/auctions/')) {
        const id = path.replace('/api/auctions/', '').trim();
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM teams WHERE auction_id = ?`).bind(id),
          env.DB.prepare(`DELETE FROM auctions WHERE id = ?`).bind(id),
          env.DB.prepare(
            `UPDATE platform_stats SET active_count = MAX(0, active_count - 1), updated_at = ? WHERE id = 'global'`
          ).bind(Date.now()),
        ]);
        return json({ success: true, id });
      }

      // --- 6. Upsert Teams (Single or Batch) ---
      if (request.method === 'POST' && (path === '/api/teams' || path === '/api/teams/batch')) {
        const body = await request.json();
        const items = Array.isArray(body) ? body : (body.teams ? body.teams : [body]);

        // Server-side guard: filter out bot teams (only human profile history is stored in teams table)
        const validTeams = items.filter((t) => {
          const uid = t.user_id || t.userId || '';
          return !String(uid).startsWith('bot_');
        });

        if (validTeams.length === 0) {
          return json({ success: true, count: 0, note: 'Skipped bot teams' });
        }

        const statements = validTeams.map((t) => {
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

      // --- 7. Get Teams for Auction ---
      if (request.method === 'GET' && path === '/api/teams') {
        const auctionId = url.searchParams.get('auctionId');
        if (!auctionId) return json({ data: [] });

        // Fast path: check if auction row has complete finalTeams embedded in settings
        const auctionRow = await env.DB.prepare(
          `SELECT settings FROM auctions WHERE id = ? LIMIT 1`
        ).bind(auctionId).first();

        const settings = parseJsonField(auctionRow?.settings, {});
        if (Array.isArray(settings?.finalTeams) && settings.finalTeams.length > 0) {
          const normalized = settings.finalTeams.map((t) => ({
            ...t,
            id: t.id,
            auction_id: t.auction_id || t.auctionId,
            auctionId: t.auctionId || t.auction_id,
            user_id: t.user_id || t.userId,
            userId: t.userId || t.user_id,
            team_id: t.team_id || t.teamId,
            teamId: t.teamId || t.team_id,
            team_name: t.team_name || t.teamName,
            teamName: t.teamName || t.team_name,
            budget_remaining: t.budget_remaining ?? t.budgetRemaining ?? null,
            budgetRemaining: t.budgetRemaining ?? t.budget_remaining ?? null,
            spent: t.spent ?? 0,
            squad: parseJsonField(t.squad, t.squad || []),
          }));
          return json({ data: normalized }, 200, {
            'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
          });
        }

        const { results } = await env.DB.prepare(
          `SELECT * FROM teams WHERE auction_id = ?`
        ).bind(auctionId).all();

        const formatted = (results || []).map((t) => ({
          ...t,
          auctionId: t.auction_id,
          userId: t.user_id,
          teamId: t.team_id,
          teamName: t.team_name,
          budgetRemaining: t.budget_remaining,
          squad: parseJsonField(t.squad, []),
        }));

        return json({ data: formatted }, 200, {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
        });
      }

      // --- 8. User History (Private Cached 60s) ---
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

        return json({ data: formatted }, 200, {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        });
      }

      // --- 9. Delete User History Entry ---
      if (request.method === 'DELETE' && path.startsWith('/api/teams/')) {
        const id = path.replace('/api/teams/', '').trim();
        await env.DB.prepare(`DELETE FROM teams WHERE id = ?`).bind(id).run();
        return json({ success: true, id });
      }

      // --- 10. Admin Auctions & Stats (Single-Row Stats Read) ---
      if (request.method === 'GET' && path === '/api/admin/auctions') {
        const [statsRes, listRes] = await env.DB.batch([
          env.DB.prepare(`SELECT total_count, active_count FROM platform_stats WHERE id = 'global' LIMIT 1`),
          env.DB.prepare(`SELECT id, server, auction_type, status, created_at FROM auctions ORDER BY created_at DESC LIMIT 100`),
        ]);

        const stats = statsRes.results?.[0] || {};
        const totalCount = stats.total_count || 0;
        const activeCount = stats.active_count || 0;

        return json({
          totalCount,
          activeCount,
          completedCount: Math.max(0, totalCount - activeCount),
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
