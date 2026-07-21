const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.local file found at:", envPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  const db = getFirestore(app);

  console.log("--- querying blueprints with slug 'asesoria-financiera-v2' ---");
  const q = await db.collection("blueprints").where("slug", "==", "asesoria-financiera-v2").get();
  console.log(`Found ${q.docs.length} documents:`);
  for (const doc of q.docs) {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Phases count: ${data.roadmap ? data.roadmap.length : 0}`);
    if (data.roadmap) {
      console.log(`  Phases:`, data.roadmap.map(p => `${p.id} (${p.steps ? p.steps.length : 0} steps)`).join(", "));
    }
  }
}

main().catch(err => console.error(err));
