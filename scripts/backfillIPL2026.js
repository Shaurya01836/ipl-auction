import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  writeBatch 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { IPL_PLAYERS } from "../src/data/players.js";
import fs from 'fs';
import path from 'path';

// Manual .env loader
const loadEnv = () => {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const trimmedKey = key.trim();
                const trimmedVal = valueParts.join('=').trim();
                if (trimmedKey && !process.env[trimmedKey]) {
                    process.env[trimmedKey] = trimmedVal;
                }
            }
        });
    }
};

loadEnv();

const requiredEnv = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

requiredEnv.forEach(key => {
    if (!process.env[key]) {
        console.error(`[Critical] Environment variable ${key} is missing or empty.`);
        console.error(`Please check your .env file or GitHub Secrets.`);
        process.exit(1);
    }
});

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const CRICKET_API_KEY = process.env.CRICKET_API_KEY || process.env.VITE_CRICKET_API_KEY || "7a07fdbd-f72b-4f19-a950-f9e0f774317c";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const playerMap = {};
IPL_PLAYERS.forEach(p => {
    playerMap[normalizeName(p.name)] = p;
});

// --- Fantasy Point Calculation Logic (User Rules) ---

const calculatePoints = (stats, role) => {
    let points = 0;
    const details = { batting: 0, bowling: 0, fielding: 0, other: 0 };

    // Batting Points
    if (stats.batting) {
        const { r, b, fours, sixes, dismissal } = stats.batting;
        const runs = parseInt(r) || 0;
        const balls = parseInt(b) || 0;
        const f = parseInt(fours) || 0;
        const s = parseInt(sixes) || 0;

        let battingPts = runs; // 1 pt per run
        battingPts += (f * 4); // Boundary Bonus +4
        battingPts += (s * 6); // Six Bonus +6

        // Milestones
        if (runs >= 100) battingPts += 16;
        else if (runs >= 75) battingPts += 12;
        else if (runs >= 50) battingPts += 8;
        else if (runs >= 25) battingPts += 4;

        // Duck (Batter, WK, All-Rounder)
        if (runs === 0 && dismissal && !role.toLowerCase().includes('bowler')) {
            battingPts -= 2;
        }

        // Strike Rate (min 10 balls, except bowlers)
        if (balls >= 10 && !role.toLowerCase().includes('bowler')) {
            const sr = (runs / balls) * 100;
            if (sr > 170) battingPts += 6;
            else if (sr > 150) battingPts += 4;
            else if (sr > 130) battingPts += 2;
            else if (sr >= 60 && sr < 70) battingPts -= 2;
            else if (sr >= 50 && sr < 60) battingPts -= 4;
            else if (sr < 50) battingPts -= 6;
        }
        details.batting = battingPts;
        points += battingPts;
    }

    // Bowling Points
    if (stats.bowling) {
        const { w, m, r, o, dot, lbw_bowled } = stats.bowling;
        const wickets = parseInt(w) || 0;
        const maidens = parseInt(m) || 0;
        const runsConceded = parseInt(r) || 0;
        const oversValue = parseFloat(o) || 0;
        const dots = parseInt(dot) || 0;
        const lbwB = parseInt(lbw_bowled) || 0;

        let bowlingPts = (dots * 1); // Dot ball +1
        bowlingPts += (wickets * 30); // Wicket +30
        bowlingPts += (maidens * 12); // Maiden Over +12
        bowlingPts += (lbwB * 8); // Bonus LBW/Bowled +8

        // Multi-wicket bonus
        if (wickets >= 5) bowlingPts += 12;
        else if (wickets >= 4) bowlingPts += 8;
        else if (wickets >= 3) bowlingPts += 4;

        // Economy Rate (min 2 overs)
        if (oversValue >= 2) {
            const er = runsConceded / oversValue;
            if (er < 5) bowlingPts += 6;
            else if (er < 6) bowlingPts += 4;
            else if (er < 7.01) bowlingPts += 2;
            else if (er >= 10 && er < 11.01) bowlingPts -= 2;
            else if (er > 11 && er < 12.01) bowlingPts -= 4;
            else if (er > 12) bowlingPts -= 6;
        }
        details.bowling = bowlingPts;
        points += bowlingPts;
    }

    // Fielding Points
    if (stats.fielding) {
        const { c, s, ro_d, ro_i } = stats.fielding;
        const catches = parseInt(c) || 0;
        const stumpings = parseInt(s) || 0;
        const runoutsDirect = parseInt(ro_d) || 0;
        const runoutsIndirect = parseInt(ro_i) || 0;

        let fieldingPts = (catches * 8);
        if (catches >= 3) fieldingPts += 4;
        fieldingPts += (stumpings * 12);
        fieldingPts += (runoutsDirect * 12);
        fieldingPts += (runoutsIndirect * 6);
        
        details.fielding = fieldingPts;
        points += fieldingPts;
    }

    // Lineup/Impact
    let otherPts = 0;
    if (stats.announced) otherPts += 4;
    if (stats.impact) otherPts += 4;
    details.other = otherPts;
    points += otherPts;

    return { points, details };
};

// --- API Helper ---

async function fetchFromAPI(endpoint) {
    const url = `https://api.cricapi.com/v1/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${CRICKET_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "success") {
        if (data.reason?.toLowerCase().includes("hits today exceeded")) {
            console.error("\n[Fatal] API Rate Limit Exceeded (100 hits limit).");
            console.log("Matches processed in this run have been saved. Please run the script again tomorrow to continue backfilling.");
            process.exit(0); 
        }
        throw new Error(`API Error: ${data.reason}`);
    }
    return data.data;
}

async function backfill() {
    try {
        const auth = getAuth(app);
        console.log("[Auth] Attempting anonymous sign-in...");
        await signInAnonymously(auth);
        console.log("[Auth] Signed in as anonymous user.");

        console.log("[Backfill] Finding IPL 2026 Series...");
        let iplSeries = null;
        let offset = 0;
        
        while (!iplSeries && offset < 500) {
            const seriesList = await fetchFromAPI(`series?offset=${offset}`);
            iplSeries = seriesList.find(s => 
                s.name.toLowerCase().includes("indian premier league 2026") || 
                s.name.toLowerCase().includes("ipl 2026")
            );
            if (iplSeries || seriesList.length === 0) break;
            offset += seriesList.length;
        }

        if (!iplSeries) {
            throw new Error("Could not find IPL 2026 in series list after searching 500 entries.");
        }

        console.log(`[Backfill] Found Series: ${iplSeries.name} (${iplSeries.id})`);

        console.log("[Backfill] Fetching matches...");
        const seriesInfo = await fetchFromAPI(`series_info?id=${iplSeries.id}`);
        const matches = seriesInfo.matchList || [];
        if (matches.length > 0) {
            console.log("[Backfill] Sample match properties:", Object.keys(matches[0]));
            console.log("[Backfill] Sample match status:", matches[0].status, "Ended:", matches[0].matchEnded);
        }
        
        // Try matchEnded or status containing "won"
        const finishedMatches = matches.filter(m => m.matchEnded || m.status?.toLowerCase().includes("won"));

        console.log(`[Backfill] Processing ${finishedMatches.length} finished matches...`);

        const totalPlayerPoints = {}; // Cumulative
        // We will commit per-match to handle rate limits gracefully

        for (const match of finishedMatches) {
            // Check if this match was already processed (by checking for any player record)
            // We use a sample player ID from our database
            const sampleRef = doc(db, "playerMatchPoints", `p_1_${match.id}`);
            const sampleSnap = await getDoc(sampleRef);
            if (sampleSnap.exists()) {
                console.log(`[Backfill] Skipping Match: ${match.name} (Already in Database)`);
                continue;
            }

            console.log(`[Backfill] --> Processing Match: ${match.name} (${match.id})`);
            
            const scorecard = await fetchFromAPI(`match_scorecard?id=${match.id}`);
            const info = await fetchFromAPI(`match_info?id=${match.id}`);

            const matchPlayers = {}; // name -> raw stats
            
            // Map Lineups
            const announced = new Set();
            info.players?.forEach(p => announced.add(normalizeName(p.name)));

            // Extract Scorecard Data
            scorecard.scorecard?.forEach(inning => {
                inning.batting?.forEach(b => {
                    if (b.name) {
                        const name = normalizeName(b.name);
                        if (!matchPlayers[name]) matchPlayers[name] = {};
                        matchPlayers[name].batting = b;
                        if (announced.has(name)) matchPlayers[name].announced = true;
                    }
                });
                inning.bowling?.forEach(bw => {
                    if (bw.name) {
                        const name = normalizeName(bw.name);
                        if (!matchPlayers[name]) matchPlayers[name] = {};
                        matchPlayers[name].bowling = bw;
                    }
                });
                inning.fielding?.forEach(f => {
                    if (f.name) {
                        const name = normalizeName(f.name);
                        if (!matchPlayers[name]) matchPlayers[name] = {};
                        matchPlayers[name].fielding = f;
                    }
                });
            });

            // Calculate and Store per match
            const matchBatch = writeBatch(db);
            for (const [name, stats] of Object.entries(matchPlayers)) {
                const player = playerMap[name];
                if (player) {
                    const { points, details } = calculatePoints(stats, player.role);
                    totalPlayerPoints[player.id] = (totalPlayerPoints[player.id] || 0) + points;

                    // Store detailed match-wise record
                    const recordRef = doc(db, "playerMatchPoints", `${player.id}_${match.id}`);
                    matchBatch.set(recordRef, {
                        playerId: player.id,
                        playerName: player.name,
                        matchId: match.id,
                        matchName: match.name,
                        points,
                        details,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            }
            await matchBatch.commit();
            console.log(`[Backfill] ✓ Match data saved.`);
        }

        console.log("[Backfill] Finalizing cumulative points and updating leaderboard...");

        // Update overall week stats (assuming one giant week for backfill or per-match)
        const weekId = "Season_Backfill";
        await setDoc(doc(db, "matchStats", weekId), {
            weekId,
            calculatedPoints: totalPlayerPoints,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update User Squads based on these points
        const squadsSnap = await getDocs(collection(db, "userSquads"));
        for (const squadDoc of squadsSnap.docs) {
            const squad = squadDoc.data();
            const { userId, players, captain, viceCaptain, impactPlayer } = squad;
            
            let totalGained = 0;
            players.forEach(pId => {
                let pts = totalPlayerPoints[pId] || 0;
                if (pId === captain) pts *= 2;
                else if (pId === viceCaptain) pts *= 1.5;
                totalGained += pts;
            });
            if (impactPlayer) totalGained += (totalPlayerPoints[impactPlayer] || 0);

            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            const currentTotal = userSnap.exists() ? (userSnap.data().totalFantasyPoints || 0) : 0;
            const newTotal = currentTotal + totalGained;

            const finalBatch = writeBatch(db);
            finalBatch.set(doc(db, "fantasyLeaderboard", `${weekId}_${userId}`), {
                ...squad,
                weekId,
                weeklyPoints: totalGained,
                totalPoints: newTotal,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            finalBatch.set(userRef, { totalFantasyPoints: newTotal }, { merge: true });
            await finalBatch.commit();
        }

        console.log(`[Success] Backfill complete. Processed ${finishedMatches.length} matches.`);
        process.exit(0);

    } catch (error) {
        console.error("[Error] Backfill failed:", error);
        process.exit(1);
    }
}

backfill();
