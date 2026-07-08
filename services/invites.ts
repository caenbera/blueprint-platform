import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Invite, Role } from "@/types/domain";

/**
 * Invitaciones (Sprint 15): subcoleccion `organizations/{orgId}/invites`,
 * ya cubierta por la regla wildcard generica de firestore.rules (a
 * diferencia de `organizations/{orgId}/users`, que deniega toda escritura
 * de cliente - ver app/api/organizations/route.ts). Solo registra la
 * intencion de invitar; el envio de correo y la aceptacion quedan fuera
 * de alcance por ahora.
 */

function invitesPath(orgId: string) {
  return `organizations/${orgId}/invites`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): Invite {
  return { ...data, id, createdAt: toIso(data.createdAt) } as Invite;
}

export async function createInvite(orgId: string, email: string, role: Role): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const ref = await addDoc(collection(db, invitesPath(orgId)), {
    orgId,
    email: email.trim().toLowerCase(),
    role,
    status: "pending",
    invitedBy: user.uid,
    invitedByName: user.displayName || user.email || "Usuario",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listInvites(orgId: string): Promise<Invite[]> {
  const snap = await getDocs(
    query(collection(db, invitesPath(orgId)), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function revokeInvite(orgId: string, inviteId: string): Promise<void> {
  await updateDoc(doc(db, invitesPath(orgId), inviteId), { status: "revoked" });
}
