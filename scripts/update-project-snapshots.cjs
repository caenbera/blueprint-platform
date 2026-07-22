const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
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

  const bpJsonPath = path.resolve("blueprints/asesoria-financiera-profesional.json");
  const bpData = JSON.parse(fs.readFileSync(bpJsonPath, "utf8"));

  // Normalize roadmap order just like seed-blueprint does
  const normalizedRoadmap = bpData.roadmap.map((phase, phaseIndex) => ({
    ...phase,
    order: phase.order ?? phaseIndex,
    steps: (phase.steps ?? []).map((step, stepIndex) => ({
      ...step,
      order: step.order ?? stepIndex,
    })),
  }));

  console.log("--- Updating Project Snapshots in Firestore ---");
  const orgs = await db.collection("organizations").get();
  let updatedProjectsCount = 0;

  for (const orgDoc of orgs.docs) {
    const projectsRef = db.collection(`organizations/${orgDoc.id}/projects`);
    const projects = await projectsRef.get();

    for (const projDoc of projects.docs) {
      const projData = projDoc.data();
      // Match either by blueprintId or if slug/name matches
      if (projData.name.includes("Asesoría Financiera")) {
        console.log(`Updating Project: "${projData.name}" (ID: ${projDoc.id}) in Org: ${orgDoc.id}`);
        
        await projDoc.ref.update({
          blueprintId: "lFE0X5KXgp8Mn8WZFaVA",
          "blueprintSnapshot.roadmap": normalizedRoadmap,
          "blueprintSnapshot.name": bpData.name,
          "blueprintSnapshot.slug": bpData.slug,
          updatedAt: new Date()
        });

        updatedProjectsCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedProjectsCount} project snapshot(s).`);
}

main().catch(err => {
  console.error("Error:", err);
});
