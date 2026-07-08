import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * Crea una organizacion nueva y su membership inicial (Owner) para el
 * usuario autenticado. Es el UNICO lugar autorizado a escribir en
 * organizations/{orgId} y organizations/{orgId}/users/{uid} - las
 * Firestore Security Rules deniegan esa escritura directamente desde el
 * cliente (ver firestore.rules), asi que este invariante (un usuario solo
 * puede auto-asignarse Owner de una organizacion NUEVA, nunca de una
 * existente) se garantiza aqui, en codigo de servidor, no en las rules.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!idToken) {
    return NextResponse.json({ error: "Falta el token de autenticación." }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Token de autenticación inválido." }, { status: 401 });
  }

  const { uid, email, name: tokenName } = decoded;

  const body = await request.json().catch(() => null);
  const orgName = typeof body?.name === "string" ? body.name.trim() : "";
  if (!orgName) {
    return NextResponse.json(
      { error: "El nombre de la organización es obligatorio." },
      {
        status: 400,
      },
    );
  }

  // Configuracion Global (Sprint 18): el Super Admin puede cerrar el
  // registro de organizaciones nuevas desde /admin/settings. Se aplica
  // aqui, en el unico lugar que crea organizaciones, no solo en la UI.
  const generalSettingsSnap = await adminDb.doc("platformConfig/general").get();
  if (generalSettingsSnap.data()?.allowNewRegistrations === false) {
    return NextResponse.json(
      { error: "El registro de nuevas organizaciones está cerrado temporalmente." },
      { status: 403 },
    );
  }

  const existingIndex = await adminDb.collection("userOrgIndex").doc(uid).get();
  if (existingIndex.exists) {
    return NextResponse.json(
      { error: "Este usuario ya pertenece a una organización." },
      { status: 409 },
    );
  }

  const orgRef = adminDb.collection("organizations").doc();
  const now = FieldValue.serverTimestamp();

  const batch = adminDb.batch();
  batch.set(orgRef, {
    name: orgName,
    ownerId: uid,
    createdAt: now,
  });
  batch.set(orgRef.collection("users").doc(uid), {
    uid,
    orgId: orgRef.id,
    role: "owner",
    displayName: tokenName ?? "",
    email: email ?? "",
    joinedAt: now,
  });
  batch.set(adminDb.collection("userOrgIndex").doc(uid), {
    orgId: orgRef.id,
  });
  await batch.commit();

  return NextResponse.json({ orgId: orgRef.id }, { status: 201 });
}
