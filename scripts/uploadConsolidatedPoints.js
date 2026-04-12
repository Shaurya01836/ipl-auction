import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
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

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const auth = getAuth(app);

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const playerPointsData = [
  { "player": "Abdul Samad", "total_points": 69, "matches": 2 },
  { "player": "Abhinandan Singh", "total_points": 22, "matches": 2 },
  { "player": "Abhishek Sharma", "total_points": 65, "matches": 3 },
  { "player": "Aiden Markram", "total_points": 81, "matches": 2 },
  { "player": "Ajinkya Rahane", "total_points": 119, "matches": 3 },
  { "player": "Allah Ghazanfar", "total_points": -2, "matches": 2 },
  { "player": "Angkrish Raghuvanshi", "total_points": 158, "matches": 3 },
  { "player": "Aniket Verma", "total_points": 63, "matches": 3 },
  { "player": "Anrich Nortje", "total_points": -22, "matches": 1 },
  { "player": "Anshul Kamboj", "total_points": 37, "matches": 3 },
  { "player": "Anukul Roy", "total_points": -2, "matches": 2 },
  { "player": "Arshdeep Singh", "total_points": -12, "matches": 3 },
  { "player": "Ashok Sharma", "total_points": -12, "matches": 3 },
  { "player": "Avesh Khan", "total_points": 9, "matches": 1 },
  { "player": "Axar Patel", "total_points": 11, "matches": 3 },
  { "player": "Ayush Badoni", "total_points": 7, "matches": 2 },
  { "player": "Ayush Mhatre", "total_points": 88, "matches": 3 },
  { "player": "Bhuvneshwar Kumar", "total_points": 10, "matches": 2 },
  { "player": "Blessing Muzarabani", "total_points": 14, "matches": 2 },
  { "player": "Brijesh Sharma", "total_points": 6, "matches": 1 },
  { "player": "Cameron Green", "total_points": 48, "matches": 3 },
  { "player": "Cooper Connolly", "total_points": 157, "matches": 2 },
  { "player": "Corbin Bosch", "total_points": 15, "matches": 1 },
  { "player": "David Miller", "total_points": 93, "matches": 3 },
  { "player": "David Payne", "total_points": 2, "matches": 2 },
  { "player": "Deepak Chahar", "total_points": -8, "matches": 2 },
  { "player": "Devdutt Padikkal", "total_points": 207, "matches": 2 },
  { "player": "Dhruv Jurel", "total_points": 176, "matches": 3 },
  { "player": "Digvesh Rathi", "total_points": -2, "matches": 1 },
  { "player": "Donovan Ferreira", "total_points": -5, "matches": 1 },
  { "player": "Eshan Malinga", "total_points": 2, "matches": 3 },
  { "player": "Finn Allen", "total_points": 106, "matches": 3 },
  { "player": "Glenn Phillips", "total_points": 78, "matches": 3 },
  { "player": "Hardik Pandya", "total_points": 40, "matches": 2 },
  { "player": "Harsh Dubey", "total_points": 39, "matches": 3 },
  { "player": "Harshal Patel", "total_points": -1, "matches": 2 },
  { "player": "Heinrich Klaasen", "total_points": 208, "matches": 3 },
  { "player": "Ishan Kishan", "total_points": 156, "matches": 3 },
  { "player": "Jacob Bethell", "total_points": 8, "matches": 1 },
  { "player": "Jacob Duffy", "total_points": 14, "matches": 2 },
  { "player": "Jamie Overton", "total_points": 101, "matches": 2 },
  { "player": "Jasprit Bumrah", "total_points": 0, "matches": 3 },
  { "player": "Jaydev Unadkat", "total_points": 43, "matches": 3 },
  { "player": "Jitesh Sharma", "total_points": 14, "matches": 2 },
  { "player": "Jofra Archer", "total_points": 28, "matches": 3 },
  { "player": "Jos Buttler", "total_points": 195, "matches": 3 },
  { "player": "Kagiso Rabada", "total_points": 27, "matches": 3 },
  { "player": "Kartik Sharma", "total_points": 29, "matches": 3 },
  { "player": "Kartik Tyagi", "total_points": 2, "matches": 2 },
  { "player": "Khaleel Ahmed", "total_points": -4, "matches": 3 },
  { "player": "KL Rahul", "total_points": 120, "matches": 3 },
  { "player": "Krunal Pandya", "total_points": -2, "matches": 2 },
  { "player": "Kuldeep Yadav", "total_points": 23, "matches": 3 },
  { "player": "Kumar Kushagra", "total_points": 29, "matches": 1 },
  { "player": "Liam Livingstone", "total_points": 32, "matches": 1 },
  { "player": "Lungisani Ngidi", "total_points": 23, "matches": 3 },
  { "player": "M Siddharth", "total_points": 10, "matches": 1 },
  { "player": "Manish Pandey", "total_points": 8, "matches": 1 },
  { "player": "Marco Jansen", "total_points": 19, "matches": 2 },
  { "player": "Marcus Stoinis", "total_points": 1, "matches": 2 },
  { "player": "Matt Henry", "total_points": 5, "matches": 3 },
  { "player": "Matthew Short", "total_points": -2, "matches": 1 },
  { "player": "Mayank Markande", "total_points": 0, "matches": 2 },
  { "player": "Mitchell Marsh", "total_points": 63, "matches": 2 },
  { "player": "Mitchell Santner", "total_points": 26, "matches": 1 },
  { "player": "Mohammad Shami", "total_points": 5, "matches": 2 },
  { "player": "Mohammad Siraj", "total_points": -4, "matches": 3 },
  { "player": "Mohsin Khan", "total_points": 10, "matches": 1 },
  { "player": "Mukesh Kumar", "total_points": 32, "matches": 3 },
  { "player": "Mukul Choudhary", "total_points": 12, "matches": 2 },
  { "player": "Naman Dhir", "total_points": 82, "matches": 3 },
  { "player": "Nandre Burger", "total_points": 9, "matches": 3 },
  { "player": "Nehal Wadhera", "total_points": 27, "matches": 2 },
  { "player": "Nicholas Pooran", "total_points": 4, "matches": 2 },
  { "player": "Nitish Kumar Reddy", "total_points": 139, "matches": 3 },
  { "player": "Nitish Rana", "total_points": 41, "matches": 3 },
  { "player": "Noor Ahmad", "total_points": 7, "matches": 3 },
  { "player": "Pathum Nissanka", "total_points": 112, "matches": 3 },
  { "player": "Phil Salt", "total_points": 107, "matches": 2 },
  { "player": "Prabhsimran Singh", "total_points": 133, "matches": 3 },
  { "player": "Prasidh Krishna", "total_points": 22, "matches": 3 },
  { "player": "Prashant Veer", "total_points": 64, "matches": 2 },
  { "player": "Prince Yadav", "total_points": 21, "matches": 2 },
  { "player": "Priyansh Arya", "total_points": 69, "matches": 2 },
  { "player": "Rahul Chahar", "total_points": 2, "matches": 1 },
  { "player": "Rahul Tewatia", "total_points": 42, "matches": 3 },
  { "player": "Rajat Patidar", "total_points": 136, "matches": 2 },
  { "player": "Ramandeep Singh", "total_points": 23, "matches": 2 },
  { "player": "Rashid Khan", "total_points": 48, "matches": 3 },
  { "player": "Ravi Bishnoi", "total_points": 49, "matches": 3 },
  { "player": "Ravindra Jadeja", "total_points": 22, "matches": 2 },
  { "player": "Rinku Singh", "total_points": 116, "matches": 2 },
  { "player": "Rishabh Pant", "total_points": 125, "matches": 2 },
  { "player": "Riyan Parag", "total_points": 66, "matches": 3 },
  { "player": "Rohit Sharma", "total_points": 163, "matches": 3 },
  { "player": "Romario Shepherd", "total_points": 2, "matches": 2 },
  { "player": "Ruturaj Gaikwad", "total_points": 54, "matches": 3 },
  { "player": "Ryan Rickelton", "total_points": 150, "matches": 3 },
  { "player": "Sai Sudharsan", "total_points": 149, "matches": 3 },
  { "player": "Salil Arora", "total_points": 5, "matches": 2 },
  { "player": "Sameer Rizvi", "total_points": 210, "matches": 3 },
  { "player": "Sandeep Sharma", "total_points": 16, "matches": 3 },
  { "player": "Sanju Samson", "total_points": 32, "matches": 3 },
  { "player": "Sarfaraz Khan", "total_points": 157, "matches": 3 },
  { "player": "Shahbaz Ahmed", "total_points": 10, "matches": 1 },
  { "player": "Shahrukh Khan", "total_points": 22, "matches": 2 },
  { "player": "Shardul Thakur", "total_points": 11, "matches": 3 },
  { "player": "Shashank Singh", "total_points": 26, "matches": 2 },
  { "player": "Sherfane Rutherford", "total_points": 51, "matches": 3 },
  { "player": "Shimron Hetmyer", "total_points": 51, "matches": 2 },
  { "player": "Shivam Dube", "total_points": 98, "matches": 3 },
  { "player": "Shivang Kumar", "total_points": 25, "matches": 2 },
  { "player": "Shreyas Iyer", "total_points": 108, "matches": 2 },
  { "player": "Shubman Gill", "total_points": 171, "matches": 2 },
  { "player": "Sunil Narine", "total_points": 26, "matches": 2 },
  { "player": "Suryakumar Yadav", "total_points": 107, "matches": 3 },
  { "player": "Suyash Sharma", "total_points": 12, "matches": 2 },
  { "player": "T Natarajan", "total_points": 20, "matches": 3 },
  { "player": "Tilak Varma", "total_points": 76, "matches": 3 },
  { "player": "Tim David", "total_points": 126, "matches": 2 },
  { "player": "Travis Head", "total_points": 89, "matches": 3 },
  { "player": "Trent Boult", "total_points": -14, "matches": 2 },
  { "player": "Tristan Stubbs", "total_points": 82, "matches": 3 },
  { "player": "Tushar Deshpande", "total_points": 6, "matches": 2 },
  { "player": "Vaibhav Arora", "total_points": -6, "matches": 2 },
  { "player": "Vaibhav Sooryavanshi", "total_points": 188, "matches": 3 },
  { "player": "Varun Chakravarthy", "total_points": -6, "matches": 2 },
  { "player": "Vyshak Vijaykumar", "total_points": 22, "matches": 2 },
  { "player": "Vipraj Nigam", "total_points": 14, "matches": 3 },
  { "player": "Virat Kohli", "total_points": 150, "matches": 2 },
  { "player": "Washington Sundar", "total_points": 120, "matches": 3 },
  { "player": "Xavier Bartlett", "total_points": 33, "matches": 3 },
  { "player": "Yashasvi Jaiswal", "total_points": 251, "matches": 3 },
  { "player": "Yuzvendra Chahal", "total_points": 10, "matches": 2 }
];

async function upload() {
  try {
    console.log("[Auth] Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("[Auth] Signed in.");

    const nameMap = {};
    IPL_PLAYERS.forEach(p => nameMap[normalizeName(p.name)] = p.id);

    const statsStore = {};
    const pointsStore = {};

    playerPointsData.forEach(item => {
      const id = nameMap[normalizeName(item.player)];
      if (id) {
        statsStore[id] = {
          totalPoints: item.total_points,
          matches: item.matches
        };
        pointsStore[id] = item.total_points;
      } else {
        console.warn(`[Warning] Could not find player: ${item.player}`);
      }
    });

    const batch = writeBatch(db);
    
    // Save to fantasyConfig/playerStats
    const statsRef = doc(db, 'fantasyConfig', 'playerStats');
    batch.set(statsRef, statsStore);

    // Save to fantasyConfig/playerPoints (cumulative totals)
    const pointsRef = doc(db, 'fantasyConfig', 'playerPoints');
    batch.set(pointsRef, pointsStore);

    await batch.commit();
    console.log("[Success] Data uploaded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Error] Upload failed:", error);
    process.exit(1);
  }
}

upload();
