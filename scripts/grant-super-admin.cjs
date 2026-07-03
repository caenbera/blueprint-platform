#!/usr/bin/env node
/**
 * Script de mantenimiento — NO forma parte de la app en runtime.
 * Otorga el rol de plataforma "Super Admin" a un usuario ya registrado.
 *
 * Uso:
 *   node scripts/grant-super-admin.cjs correo@ejemplo.com
 *
 * Requiere que .env.local tenga las credenciales del Admin SDK
 * (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * FIREBASE_ADMIN_PRIVATE_KEY).
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

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node scripts/grant-super-admin.cjs <email>");
    process.exit(1);
  }

  loadEnvLocal();

  const { initializeApp, cert } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const user = await auth.getUserByEmail(email);

  await db.collection("platformAdmins").doc(user.uid).set({
    grantedAt: FieldValue.serverTimestamp(),
    grantedBy: "scripts/grant-super-admin.cjs",
    email: user.email,
  });

  console.log(`Listo: ${email} (uid: ${user.uid}) ahora es Super Admin.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
