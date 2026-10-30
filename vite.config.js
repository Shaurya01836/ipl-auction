import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Lightweight in-memory bridge for Hotspot/Offline play.
// Allows normal tabs, incognito windows, and LAN/Wi-Fi devices to share local room state
// without touching any cloud database or consuming Firebase quota.
function hotspotSyncPlugin() {
  const localRooms = new Map();

  return {
    name: 'hotspot-sync-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
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
                const parsed = JSON.parse(body);
                localRooms.set(roomId, parsed);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }
        next();
      });
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
