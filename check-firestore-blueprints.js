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

  console.log("--- Blueprints in Firestore ---");
  const bps = await db.collection("blueprints").get();
  for (const doc of bps.docs) {
    const data = doc.data();
    console.log(`Blueprint ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Slug: ${data.slug}`);
    console.log(`  Phases count: ${data.roadmap ? data.roadmap.length : "N/A"}`);
    if (data.roadmap) {
      data.roadmap.forEach((p, idx) => {
        console.log(`    Phase ${idx}: ${p.id} (${p.title}) - ${p.steps ? p.steps.length : 0} steps`);
      });
    }
  }

  console.log("\n--- Projects in Firestore ---");
  const orgs = await db.collection("organizations").get();
  for (const orgDoc of orgs.docs) {
    const projects = await db.collection(`organizations/${orgDoc.id}/projects`).get();
    for (const projDoc of projects.docs) {
      const data = projDoc.data();
      console.log(`Project ID: ${projDoc.id} (Org: ${orgDoc.id})`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Blueprint ID: ${data.blueprintId}`);
      const snap = data.blueprintSnapshot;
      console.log(`  Snapshot name: ${snap ? snap.name : "N/A"}`);
      console.log(`  Snapshot slug: ${snap ? snap.slug : "N/A"}`);
      console.log(`  Snapshot phases count: ${snap && snap.roadmap ? snap.roadmap.length : "N/A"}`);
      if (snap && snap.roadmap) {
        snap.roadmap.forEach((p, idx) => {
          console.log(`    Phase ${idx}: ${p.id} (${p.title}) - ${p.steps ? p.steps.length : 0} steps`);
        });
      }
    }
  }
}

main().catch(err => {
  console.error("Error:", err);
});
