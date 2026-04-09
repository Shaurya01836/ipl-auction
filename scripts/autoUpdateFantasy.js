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
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
};

loadEnv();

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

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

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
    const url = `https://api.cricapi.com/v1/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${CRICKET_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
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

        console.log("[AutoUpdate] Initializing daily fetch...");

        const matches = await fetchFromAPI('currentMatches');
        const finishedIPL = matches.filter(m => 
            m.matchFinished && 
            (m.name.toLowerCase().includes("ipl") || m.name.toLowerCase().includes("indian premier league"))
        );

        if (finishedIPL.length === 0) {
            console.log("[AutoUpdate] No new IPL matches finished.");
            process.exit(0);
        }

        const aggregatedPoints = {};
        const playerStatsUpdates = {}; // { playerId: { totalPoints: X, matches: Y } }
        const batch = writeBatch(db);

        const weekInfoSnap = await getDoc(doc(db, "matchSchedule", "current_match"));
        const weekId = weekInfoSnap.exists() ? weekInfoSnap.data().weekId : "Week_Auto";

        for (const match of finishedIPL) {
            const sampleRef = doc(db, "playerMatchPoints", `p_1_${match.id}`); 
            const sampleSnap = await getDoc(sampleRef);
            if (sampleSnap.exists()) {
                console.log(`[AutoUpdate] Skipping ${match.name} (already processed)`);
                continue;
            }

            console.log(`[AutoUpdate] Processing ${match.name}`);
            const scorecard = await fetchFromAPI(`match_scorecard?id=${match.id}`);
            const info = await fetchFromAPI(`match_info?id=${match.id}`);

            const matchPlayers = {};
            const announced = new Set();
            info.players?.forEach(p => announced.add(normalizeName(p.name)));

            scorecard.scorecard?.forEach(inning => {
                inning.batting?.forEach(b => {
                    const name = normalizeName(b.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].batting = b;
                    if (announced.has(name)) matchPlayers[name].announced = true;
                });
                inning.bowling?.forEach(bw => {
                    const name = normalizeName(bw.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].bowling = bw;
                });
                inning.fielding?.forEach(f => {
                    const name = normalizeName(f.name);
                    if (!matchPlayers[name]) matchPlayers[name] = {};
                    matchPlayers[name].fielding = f;
                });
            });

            for (const [name, stats] of Object.entries(matchPlayers)) {
                // Resolution: explicit map -> direct map -> name only map
                const pId = explicitMappings[name] || playerMap[name]?.id;
                const player = IPL_PLAYERS.find(p => p.id === pId);

                if (player) {
                    const { points, details } = calculatePoints(stats, player.role);
                    aggregatedPoints[player.id] = (aggregatedPoints[player.id] || 0) + points;

                    // Track cumulative stats for average calculation
                    if (!playerStatsUpdates[player.id]) playerStatsUpdates[player.id] = { totalPoints: 0, matches: 0 };
                    playerStatsUpdates[player.id].totalPoints += points;
                    playerStatsUpdates[player.id].matches += 1;

                    // Store granular match record
                    batch.set(doc(db, "playerMatchPoints", `${player.id}_${match.id}`), {
                        playerId: player.id, playerName: player.name, matchId: match.id,
                        matchName: match.name, points, details, updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            }
        }

        if (Object.keys(aggregatedPoints).length === 0) {
            console.log("[AutoUpdate] No new points to process.");
            process.exit(0);
        }

        // 1. Update overall playerStats (Total Points & Match Counts)
        const globalStatsRef = doc(db, 'fantasyConfig', 'playerStats');
        const incrementObj = {};
        for (const [pId, updates] of Object.entries(playerStatsUpdates)) {
            incrementObj[`${pId}.totalPoints`] = increment(updates.totalPoints);
            incrementObj[`${pId}.matches`] = increment(updates.matches);
        }
        batch.update(globalStatsRef, incrementObj);

        // 2. Update playerPoints (cumulative totals)
        const globalPointsRef = doc(db, 'fantasyConfig', 'playerPoints');
        const pointsIncObj = {};
        for (const [pId, pts] of Object.entries(aggregatedPoints)) {
            pointsIncObj[pId] = increment(pts);
        }
        batch.update(globalPointsRef, pointsIncObj);

        // 3. Update weekly stats and leaderboards
        await setDoc(doc(db, "matchStats", weekId), { weekId, calculatedPoints: aggregatedPoints, updatedAt: new Date().toISOString() }, { merge: true });

        const squadsSnap = await getDocs(collection(db, "userSquads"));
        for (const squadDoc of squadsSnap.docs) {
            const squad = squadDoc.data();
            const { userId, players, captain, viceCaptain, impactPlayer } = squad;
            
            let weeklyTotal = 0;
            players.forEach(pId => {
                let pts = aggregatedPoints[pId] || 0;
                if (pId === captain) pts *= 2;
                else if (pId === viceCaptain) pts *= 1.5;
                weeklyTotal += pts;
            });
            if (impactPlayer) weeklyTotal += (aggregatedPoints[impactPlayer] || 0);

            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            const currentTotal = userSnap.exists() ? (userSnap.data().totalFantasyPoints || 0) : 0;
            const newTotal = currentTotal + weeklyTotal;

            batch.set(doc(db, "fantasyLeaderboard", `${weekId}_${userId}`), {
                ...squad, weekId, weeklyPoints: weeklyTotal, totalPoints: newTotal, updatedAt: new Date().toISOString()
            }, { merge: true });
            batch.set(userRef, { totalFantasyPoints: newTotal }, { merge: true });
        }

        await batch.commit();
        console.log(`[Success] Auto-update completed for ${weekId}.`);
        process.exit(0);

    } catch (error) {
        console.error("[Error] Auto-update failed:", error);
        process.exit(1);
    }
}

runAutoUpdate();
