import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, query, limit } from "firebase/firestore";
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

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDB() {
    console.log("Checking project:", firebaseConfig.projectId);
    
    // 1. Check status
    const statusSnap = await getDoc(doc(db, "fantasyConfig", "autoUpdateStatus"));
    if (statusSnap.exists()) {
        console.log("Status found:", statusSnap.data());
    } else {
        console.log("Status NOT found!");
    }
    
    // 2. Check a few match records
    const matchPointsSnap = await getDocs(query(collection(db, "playerMatchPoints"), limit(5)));
    console.log(`Found ${matchPointsSnap.size} latest playerMatchPoints records.`);
    matchPointsSnap.forEach(d => console.log(` - ${d.id}:`, d.data().points, "pts"));

    // 3. Check playerStats for a sample player (e.g., p_1)
    const statsSnap = await getDoc(doc(db, "fantasyConfig", "playerStats"));
    if (statsSnap.exists()) {
        const data = statsSnap.data();
        console.log("Sample playerStats (p_1):", data['p_1']);
    }
}

checkDB();
