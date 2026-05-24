import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Color utilities for clean CLI output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.log(yellow("⚠️  No .env file found in root. Using system environment variables."));
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");

    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const trimmedVal = valueParts.join("=").trim();

      if (trimmedKey && !process.env[trimmedKey]) {
        process.env[trimmedKey] = trimmedVal;
      }
    }
  });
};

loadEnv();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL ?? process.env.FIREBASE_DATABASE_URL;

if (!projectId) {
  console.error(red("❌ Error: Missing Firebase Project ID in environment variables."));
  console.log(cyan("💡 Please ensure VITE_FIREBASE_PROJECT_ID is set in your .env file.\n"));
  process.exit(1);
}

if (!databaseURL) {
  console.error(red("❌ Error: Missing Realtime Database URL in environment variables."));
  console.log(cyan("💡 Please ensure VITE_FIREBASE_DATABASE_URL is set in your .env file.\n"));
  process.exit(1);
}

console.log(cyan(`🎯 Target Database: ${databaseURL}`));
console.log(cyan(`📦 Project ID: ${projectId}\n`));

// Setup authentication
let credential;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (privateKey && clientEmail) {
  console.log("🔑 Authenticating using service account certificate credentials...");
  credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });
} else {
  console.log("🌐 Authenticating using Application Default Credentials (gcloud CLI or environment)...");
  try {
    credential = admin.credential.applicationDefault();
  } catch (error) {
    console.error(red("❌ Authentication Error: Local credentials not found."));
    console.log(yellow("\nTo deploy programmatically:"));
    console.log("  1. Download a service account JSON from Firebase Console > Project Settings > Service Accounts.");
    console.log("  2. Add the client email and private key to your .env file:");
    console.log("     FIREBASE_CLIENT_EMAIL=your-service-account-email");
    console.log("     FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\"");
    console.log(cyan("\nAlternatively, you can copy the rules in 'database.rules.json' and paste them directly into the Firebase Web Console!\n"));
    process.exit(1);
  }
}

// Initialize Admin App
try {
  admin.initializeApp({
    credential,
    databaseURL,
  });
  console.log(green("✅ Firebase Admin SDK initialized successfully."));
} catch (error) {
  console.error(red("❌ Initialization Failed:"), error.message);
  process.exit(1);
}

const rulesPath = path.resolve(process.cwd(), "database.rules.json");
if (!fs.existsSync(rulesPath)) {
  console.error(red("❌ Error: 'database.rules.json' file not found in root directory!"));
  process.exit(1);
}

const rulesContent = fs.readFileSync(rulesPath, "utf8");

async function deployRules() {
  console.log("📤 Deploying security rules...");
  try {
    const db = admin.database();
    await db.setRules(rulesContent);
    console.log(green("\n🎉 SUCCESS! Realtime Database security rules deployed successfully!\n"));
    console.log("🔒 Your database is now secured against unauthorized access.");
  } catch (error) {
    console.error(red("\n❌ Error deploying security rules:"), error.message);
    console.log(cyan("\n💡 Check your credentials or try deploying via Firebase CLI:"));
    console.log(yellow("   firebase deploy --only database\n"));
  } finally {
    process.exit(0);
  }
}

deployRules();
