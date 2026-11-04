import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Lightweight in-memory bridge for Hotspot/Offline play.
// Allows normal tabs, incognito windows, and LAN/Wi-Fi devices to share local room state
// without touching any cloud database or consuming Firebase quota.
function hotspotSyncPlugin() {
  const localRooms = new Map();

  const mergeRoomData = (existing, incoming) => {
    if (!existing) return incoming;

    // Status progression hierarchy: completed > active > waiting
    // An active or completed auction must NEVER regress to waiting from stale client heartbeats
    const statusWeight = { waiting: 0, active: 1, completed: 2 };
    const existingWeight = statusWeight[existing.status] || 0;
    const incomingWeight = statusWeight[incoming.status] || 0;

    let finalStatus = incoming.status;
    let finalLive = incoming.live;
    let finalPlayerOrder = incoming.playerOrder;

    if (existingWeight > incomingWeight) {
      finalStatus = existing.status;
      finalLive = existing.live;
      finalPlayerOrder = existing.playerOrder || incoming.playerOrder;
    }

    const playerMap = new Map();
    (existing.players || []).forEach((p) => playerMap.set(p.id, p));
    (incoming.players || []).forEach((p) => {
      const prev = playerMap.get(p.id) || {};
      playerMap.set(p.id, { ...prev, ...p });
    });

    const msgMap = new Map();
    (existing.messages || []).forEach((m) => msgMap.set(m.id, m));
    (incoming.messages || []).forEach((m) => msgMap.set(m.id, m));
    const messages = Array.from(msgMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );

    return {
      ...existing,
      ...incoming,
      status: finalStatus,
      live: finalLive,
      playerOrder: finalPlayerOrder,
      players: Array.from(playerMap.values()),
      teams: { ...(existing.teams || {}), ...(incoming.teams || {}) },
      presences: { ...(existing.presences || {}), ...(incoming.presences || {}) },
      messages,
    };
  };

  const createMiddleware = () => (req, res, next) => {
    const url = req.url || '';
    if (url.startsWith('/api/hotspot-room/')) {
      const roomId = decodeURIComponent(url.replace('/api/hotspot-room/', '').split('?')[0]);
      if (req.method === 'GET') {
        const data = localRooms.get(roomId);
        res.setHeader('Content-Type', 'application/json');
        if (data) {
          res.statusCode = 200;
          res.end(JSON.stringify(data));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Room not found' }));
        }
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body);
            const existing = localRooms.get(roomId);
            const merged = mergeRoomData(existing, incoming);
            localRooms.set(roomId, merged);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, room: merged }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'hotspot-sync-middleware',
    configureServer(server) {
      server.middlewares.use(createMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware());
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    hotspotSyncPlugin(),
  ],
  server: {
    host: true, // Listen on all network interfaces so hotspot peers can connect
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'icons-motion';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200
  }
})
