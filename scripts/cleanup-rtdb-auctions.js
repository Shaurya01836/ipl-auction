import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// September 12, 2026 00:00:00 UTC cutoff timestamp in ms
const CUTOFF_TIMESTAMP = new Date('2026-09-12T00:00:00Z').getTime();

async function cleanupOldAuctions() {
  console.log('🚀 Starting Realtime Database Cleanup...');
  console.log(`📅 Cutoff Date: September 12, 2026 (${new Date(CUTOFF_TIMESTAMP).toISOString()})`);

  try {
    await signInAnonymously(auth);
    console.log('🔑 Authenticated with Firebase Auth.');

    let roomIds = [];

    if (supabase) {
      console.log('🔍 Fetching auction IDs from Supabase index...');
      const { data, error } = await supabase.from('auctions').select('id, status, created_at');
      if (!error && data) {
        roomIds = data.map(r => r.id);
      }
    }

    if (roomIds.length === 0) {
      console.log('⚠️ Could not fetch from Supabase. Trying direct room checks...');
      // Fallback: list of known test room IDs if any
    }

    console.log(`📊 Found ${roomIds.length} auction rooms to check.`);

    let deletedCount = 0;
    let skippedCount = 0;

    for (const roomId of roomIds) {
      try {
        const roomSnap = await get(ref(db, `auctions/${roomId}/room`));
        if (roomSnap.exists()) {
          const roomData = roomSnap.val();
          const isCompleted = roomData.status === 'completed';
          const createdAt = roomData.createdAt || 0;
          const isOlderThanCutoff = createdAt > 0 ? createdAt < CUTOFF_TIMESTAMP : isCompleted;

          if (isCompleted || isOlderThanCutoff) {
            console.log(`🗑️ Deleting RTDB subnodes for completed/old auction: ${roomId}`);
            await Promise.allSettled([
              remove(ref(db, `auctions/${roomId}/room`)),
              remove(ref(db, `auctions/${roomId}/live`)),
              remove(ref(db, `auctions/${roomId}/messages`)),
              remove(ref(db, `auctions/${roomId}/teams`))
            ]);
            deletedCount++;
          } else {
            console.log(`▶️ Keeping active RTDB auction: ${roomId}`);
            skippedCount++;
          }
        }
      } catch (rErr) {
        // Node might already be deleted
      }
    }

    console.log(`\n🎉 Cleanup finished!`);
    console.log(`   - Deleted RTDB Nodes: ${deletedCount}`);
    console.log(`   - Retained Active Nodes: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error during RTDB cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanupOldAuctions();
