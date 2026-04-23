import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  writeBatch,
  increment
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

const CRICKET_API_KEY = process.env.CRICKET_API_KEY || process.env.VITE_CRICKET_API_KEY;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Robust player mapping with specific fixes
const playerMap = {};
IPL_PLAYERS.forEach(p => {
    playerMap[normalizeName(p.name)] = p;
});

// Specific Name Fixes (API Name -> Database ID)
const explicitMappings = {
    "amghazanfar": "p_122", // Allah Ghazanfar
    "philipsalt": "p_121",   // Phil Salt
    "mohammedshami": "p_118",
    "mohammedsiraj": "p_119",
    "lungingidi": "p_453",
    "manimaransiddharth": "p_378",
    "varunchakaravarthy": "p_159",
    "vijaykumarvyshak": "p_385",
    "digveshsinghrathi": "p_888", 
    "allahghazanfar": "p_122"
};

// --- Fantasy Point Calculation Logic (User Rules) ---

const calculatePoints = (stats, role) => {
    let points = 0;
    const details = { batting: 0, bowling: 0, fielding: 0, other: 0 };

    if (stats.batting) {
        const { r, b, fours, sixes, dismissal } = stats.batting;
        const runs = parseInt(r) || 0;
        const balls = parseInt(b) || 0;
        const f = parseInt(fours) || 0;
        const s = parseInt(sixes) || 0;

        let battingPts = runs + (f * 4) + (s * 6);
        if (runs >= 100) battingPts += 16;
        else if (runs >= 75) battingPts += 12;
        else if (runs >= 50) battingPts += 8;
        else if (runs >= 25) battingPts += 4;

        if (runs === 0 && dismissal && !role.toLowerCase().includes('bowler')) battingPts -= 2;

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

    if (stats.bowling) {
        const { w, m, r, o, dot, lbw_bowled } = stats.bowling;
        const wickets = parseInt(w) || 0;
        const maidens = parseInt(m) || 0;
        const runsConceded = parseInt(r) || 0;
        const oversValue = parseFloat(o) || 0;
        const dots = parseInt(dot) || 0;
        const lbwB = parseInt(lbw_bowled) || 0;

        let bowlingPts = (dots * 1) + (wickets * 30) + (maidens * 12) + (lbwB * 8);

        if (wickets >= 5) bowlingPts += 12;
        else if (wickets >= 4) bowlingPts += 8;
        else if (wickets >= 3) bowlingPts += 4;

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

    if (stats.fielding) {
        const { c, s, ro_d, ro_i } = stats.fielding;
        const catches = parseInt(c) || 0;
        const st = parseInt(s) || 0;
        const roD = parseInt(ro_d) || 0;
        const roI = parseInt(ro_i) || 0;

        let fieldingPts = (catches * 8) + (st * 12) + (roD * 12) + (roI * 6);
        if (catches >= 3) fieldingPts += 4;
        
        details.fielding = fieldingPts;
        points += fieldingPts;
    }

    let otherPts = 0;
    if (stats.announced) otherPts += 4;
    if (stats.impact) otherPts += 4;
    details.other = otherPts;
    points += otherPts;

    return { points, details };
};

async function fetchFromAPI(endpoint) {
    if (!CRICKET_API_KEY) throw new Error("CRICKET_API_KEY is missing in environment.");
    console.log(`[API] Fetching: ${endpoint}`);
    const url = `https://api.cricapi.com/v1/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${CRICKET_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Log hit stats if available
    if (data.info) {
        const { hitsToday, hitsLimit } = data.info;
        const remaining = hitsLimit - hitsToday;
        console.log(`[API Usage] Hits: ${hitsToday}/${hitsLimit} (Remaining today: ${remaining})`);
        if (remaining <= 0) {
            console.error("[Fatal] Daily API Limit Reached! Cannot process more matches today.");
            process.exit(0);
        }
    }

    if (data.status !== "success") {
        if (data.reason?.toLowerCase().includes("hits today exceeded")) {
            console.error("[Fatal] API Rate Limit Exceeded.");
            process.exit(0);
        }
        throw new Error(`API Error: ${data.reason}`);
    }
    return data.data;
}

async function runAutoUpdate() {
    try {
        const auth = getAuth(app);
        console.log("[Auth] Attempting anonymous sign-in...");
        await signInAnonymously(auth);
        console.log("[Auth] Signed in.");

        console.log("[AutoUpdate] Initializing catch-up fetch...");

        // 1. Get Status from DB
        const statusRef = doc(db, "fantasyConfig", "autoUpdateStatus");
        const statusSnap = await getDoc(statusRef);
        let status = statusSnap.exists() ? statusSnap.data() : {
            lastProcessedMatchDate: "2026-04-08T00:00:00Z", // User hint: fetched till 8/4/26
            seriesId: "87c62aac-bc3c-4738-ab93-19da0690488f" // Found via discovery
        };

        const lastDate = new Date(status.lastProcessedMatchDate);
        console.log(`[AutoUpdate] Catching up on matches since: ${lastDate.toISOString()}`);

        // 2. Fetch All Matches in Series
        const seriesData = await fetchFromAPI(`series_info?id=${status.seriesId}`);
        const matches = seriesData.matchList || [];
        console.log(`[Debug] Total matches in series: ${matches.length}`);


        // 3. Filter for concluded matches after lastDate
        console.log(`[Debug] Filtering matches starting from ${lastDate.toISOString()}...`);
        const pendingMatches = matches
            .filter(m => {
                const matchDate = new Date(m.dateTimeGMT);
                const isFinished = m.matchFinished || 
                                 m.status?.toLowerCase().includes("won") || 
                                 m.status?.toLowerCase().includes("tied") || 
                                 m.status?.toLowerCase().includes("no result") ||
                                 m.status?.toLowerCase().includes("result") ||
                                 m.status?.toLowerCase().includes("abandoned");
                
                const isNewer = matchDate >= lastDate;
                
                if (isNewer && !isFinished) {
                    console.log(`[Debug] Match found but not finished: ${m.name} (Status: ${m.status})`);
                }
                
                return isFinished && isNewer;
            })
            .sort((a, b) => new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT));

        if (pendingMatches.length === 0) {
            console.log("[AutoUpdate] No new matches found after filtering.");
            // Log the first few upcoming/recent matches for debugging
            matches.slice(0, 5).forEach(m => {
                console.log(`[Debug] Sample Match: ${m.name} | Date: ${m.dateTimeGMT} | Status: ${m.status} | Finished: ${m.matchFinished}`);
            });
            process.exit(0);
        }

        console.log(`[AutoUpdate] Found ${pendingMatches.length} pending matches to process.`);

        let latestProcessedDate = lastDate;

        for (const match of pendingMatches) {
            console.log(`[AutoUpdate] --> Processing ${match.name} (${match.dateTimeGMT})`);
            
            // Check if match already processed via dedicated collection
            const procRef = doc(db, "processedMatches", match.id);
            const procSnap = await getDoc(procRef);
            if (procSnap.exists()) {
                console.log(`[AutoUpdate] Skipping ${match.name} (Match ID: ${match.id} already processed)`);
                continue;
            }

            const now = new Date().toISOString();
            const scorecardData = await fetchFromAPI(`match_scorecard?id=${match.id}`);
            
            // Extract from various possible player fields (resilient detection)
            let pSource = scorecardData.players || scorecardData.playerList || [];
            
            // Smart Fallback: If scorecard is empty, try match_info only if we have hits
            // Note: fetchFromAPI already logs usage, we can check global hits state if we stored it
            // but for now we'll just try if we didn't find any players in the main list
            if (pSource.length === 0) {
                console.log(`[Debug] No player list in scorecard. Trying match_info...`);
                try {
                    const infoData = await fetchFromAPI(`match_info?id=${match.id}`);
                    pSource = infoData.players || infoData.playerList || [];
                } catch (e) {
                    console.warn(`[Warning] Could not fetch secondary info: ${e.message}`);
                }
            }

            const matchPlayers = {};
            const announced = new Set();
            pSource.forEach(p => {
                const name = p.name || p.playerName;
                if (name) announced.add(normalizeName(name));
            });

            const scorecard = scorecardData.scorecard || scorecardData.score || scorecardData.data?.scorecard;
            scorecard?.forEach((inning, idx) => {
                const bCount = inning.batting?.length || 0;
                const bwCount = inning.bowling?.length || 0;
                console.log(`[Debug] Processing Inning ${idx + 1}: ${bCount} bat, ${bwCount} bowl`);
                
                inning.batting?.forEach(b => {
                    if (!b.name) return;
                    const name = normalizeName(b.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].batting = b;
                    if (announced.has(name)) matchPlayers[name].announced = true;
                });
                inning.bowling?.forEach(bw => {
                    if (!bw.name) return;
                    const name = normalizeName(bw.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].bowling = bw;
                    if (announced.has(name)) matchPlayers[name].announced = true;
                });
                inning.fielding?.forEach(f => {
                    if (!f.name) return;
                    const name = normalizeName(f.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].fielding = f;
                    if (announced.has(name)) matchPlayers[name].announced = true;
                });
            });

            // Also include players who were announced but didn't bat/bowl/field
            announced.forEach(name => {
                if (!matchPlayers[name]) {
                    matchPlayers[name] = { announced: true };
                }
            });

            console.log(`[AutoUpdate] Match data parsed. Found ${Object.keys(matchPlayers).length} players total.`);

            const matchAggregatedPoints = {};
            const playerStatsUpdates = {};
            let matchedCount = 0;
            let unmapped = [];

            const matchBatch = writeBatch(db);

            for (const [name, stats] of Object.entries(matchPlayers)) {
                const pId = explicitMappings[name] || playerMap[name]?.id;
                const player = IPL_PLAYERS.find(p => p.id === pId);

                if (player) {
                    matchedCount++;
                    const { points, details } = calculatePoints(stats, player.role);
                    matchAggregatedPoints[player.id] = points;

                    if (!playerStatsUpdates[player.id]) playerStatsUpdates[player.id] = { totalPoints: 0, matches: 0 };
                    playerStatsUpdates[player.id].totalPoints += points;
                    playerStatsUpdates[player.id].matches += 1;

                    matchBatch.set(doc(db, "playerMatchPoints", `${player.id}_${match.id}`), {
                        playerId: player.id, playerName: player.name, matchId: match.id,
                        matchName: match.name, points, details, updatedAt: now
                    }, { merge: true });
                } else {
                    unmapped.push(name);
                }
            }

            console.log(`[AutoUpdate] Summary: Matched ${matchedCount}/${Object.keys(matchPlayers).length} players.`);
            if (unmapped.length > 0) {
                console.log(`[Advice] To fix 0 players matched, add these to explicitMappings: "${unmapped.slice(0, 5).join('", "')}"`);
            }

            if (matchedCount === 0 && Object.keys(matchPlayers).length > 0) {
                console.warn(`[Warning] Found players in API but NONE matched your database. Check normalizeName or explicitMappings.`);
            }

            // Update cumulative player stats for THIS match
            const globalStatsRef = doc(db, 'fantasyConfig', 'playerStats');
            const globalPointsRef = doc(db, 'fantasyConfig', 'playerPoints');
            const statsInc = {};
            const pointsInc = {};

            const now = new Date().toISOString();
            for (const [pId, updates] of Object.entries(playerStatsUpdates)) {
                statsInc[`${pId}.totalPoints`] = increment(updates.totalPoints);
                statsInc[`${pId}.matches`] = increment(updates.matches);
                pointsInc[pId] = increment(updates.totalPoints);
            }
            statsInc.updatedAt = now;
            pointsInc.updatedAt = now;
            
            matchBatch.update(globalStatsRef, statsInc);
            matchBatch.update(globalPointsRef, pointsInc);

            // Update user squads and leaderboard
            // Note: We use the actual week ID if possible, otherwise a generic one
            const weekId = "Week_1"; // Default for current season
            
            const squadsSnap = await getDocs(collection(db, "userSquads"));
            for (const squadDoc of squadsSnap.docs) {
                const squad = squadDoc.data();
                const { userId, players, captain, viceCaptain, impactPlayer } = squad;
                
                let matchPointsGained = 0;
                players.forEach(pId => {
                    let pts = matchAggregatedPoints[pId] || 0;
                    if (pId === captain) pts *= 2;
                    else if (pId === viceCaptain) pts *= 1.5;
                    matchPointsGained += pts;
                });
                if (impactPlayer) matchPointsGained += (matchAggregatedPoints[impactPlayer] || 0);

                if (matchPointsGained !== 0) {
                    const userRef = doc(db, "users", userId);
                    matchBatch.update(userRef, { totalFantasyPoints: increment(matchPointsGained) });

                    matchBatch.set(doc(db, "fantasyLeaderboard", `${weekId}_${userId}`), {
                        userId, 
                        userName: squad.userName || userId,
                        weeklyPoints: increment(matchPointsGained),
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            }

            // Mark match as processed
            matchBatch.set(procRef, { 
                matchId: match.id, 
                name: match.name, 
                processedAt: new Date().toISOString() 
            });

            // Update tracking status
            matchBatch.set(statusRef, {
                lastProcessedMatchDate: match.dateTimeGMT,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            console.log(`[AutoUpdate] Committing batch for ${match.name}...`);
            await matchBatch.commit();
            console.log(`[AutoUpdate] Match ${match.name} processed successfully.`);
        }

        console.log(`[Success] Final Check: Processed ${pendingMatches.length} matches. Last Date: ${latestProcessedDate.toISOString()}`);
        process.exit(0);

    } catch (error) {
        console.error("[Error] Auto-update failed:", error);
        process.exit(1);
    }
}

runAutoUpdate();
