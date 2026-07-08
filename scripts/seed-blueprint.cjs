#!/usr/bin/env node
/**
 * Script de mantenimiento — NO forma parte de la app en runtime.
 * Crea (o actualiza) un Blueprint de prueba a partir de un archivo JSON
 * que cumpla "Blueprint JSON Specification v1.0" (ver docs/ o
 * lib/blueprint-schema.ts) - util para tener datos reales con los que
 * probar la plataforma sin pasar por el Constructor de Blueprints (Sprint
 * 17, todavia no construido).
 *
 * Uso:
 *   node scripts/seed-blueprint.cjs [ruta-al-json]
 *   (por defecto usa scripts/sample-blueprint.json)
 *
 * Requiere que .env.local tenga las credenciales del Admin SDK
 * (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * FIREBASE_ADMIN_PRIVATE_KEY) y al menos un Super Admin ya otorgado
 * (scripts/grant-super-admin.cjs) para usarse como `createdBy`.
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
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

/** Normaliza el `order` de Fases/Steps que no lo traigan explicito - mismo criterio que lib/blueprint-schema.ts#validateBlueprintJson. */
function normalizeRoadmap(roadmap) {
  return roadmap.map((phase, phaseIndex) => ({
    ...phase,
    order: phase.order ?? phaseIndex,
    steps: (phase.steps ?? []).map((step, stepIndex) => ({
      ...step,
      order: step.order ?? stepIndex,
    })),
  }));
}

async function main() {
  const jsonPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, "sample-blueprint.json");

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const { id: _ignoredTemplateId, ...blueprint } = raw;

  loadEnvLocal();

  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  const db = getFirestore(app);

  const adminSnap = await db.collection("platformAdmins").limit(1).get();
  if (adminSnap.empty) {
    throw new Error(
      "No hay ningun Super Admin todavia. Corre primero: node scripts/grant-super-admin.cjs <email>",
    );
  }
  const createdBy = adminSnap.docs[0].id;

  const existing = await db.collection("blueprints").where("slug", "==", blueprint.slug).get();
  const data = {
    ...blueprint,
    roadmap: normalizeRoadmap(blueprint.roadmap),
    createdBy,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existing.empty) {
    await existing.docs[0].ref.set(data, { merge: true });
    console.log(`Listo: Blueprint "${blueprint.name}" actualizado (id: ${existing.docs[0].id}).`);
  } else {
    const ref = await db.collection("blueprints").add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Listo: Blueprint "${blueprint.name}" creado (id: ${ref.id}).`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
