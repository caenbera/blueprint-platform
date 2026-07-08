import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Membership, Organization } from "@/types/domain";

export interface MembershipWithOrg extends Membership {
  organizationName: string;
}

export async function createOrganization(name: string): Promise<{ orgId: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/organizations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? "No se pudo crear la organización.");
  }

  return res.json();
}

/**
 * Busca la organizacion del usuario actual: primero resuelve el orgId via
 * userOrgIndex/{uid} (lectura simple, sin necesitar un indice compuesto),
 * y despues lee su doc de membership dentro de esa organizacion.
 */
export async function getMyMembership(uid: string): Promise<MembershipWithOrg | null> {
  const indexSnap = await getDoc(doc(db, "userOrgIndex", uid));
  if (!indexSnap.exists()) return null;

  const orgId = indexSnap.data().orgId as string;
  const [membershipSnap, orgSnap] = await Promise.all([
    getDoc(doc(db, "organizations", orgId, "users", uid)),
    getDoc(doc(db, "organizations", orgId)),
  ]);
  if (!membershipSnap.exists()) return null;

  const organizationName = orgSnap.exists() ? (orgSnap.data() as Organization).name : "";

  return {
    ...(membershipSnap.data() as Omit<Membership, "orgId">),
    orgId,
    organizationName,
  };
}

/** Miembros de la organizacion (Equipo, Sprint 15) - lectura permitida a cualquier miembro por firestore.rules; escribir un Membership sigue restringido al Admin SDK. */
export async function listMembers(orgId: string): Promise<Membership[]> {
  const snap = await getDocs(collection(db, "organizations", orgId, "users"));
  return snap.docs.map((d) => d.data() as Membership);
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, "organizations", orgId));
  if (!snap.exists()) return null;
  return { ...(snap.data() as Omit<Organization, "id">), id: snap.id };
}

/** Configuración > Empresa (Sprint 15) - firestore.rules ya permite `allow update: if isOrgMember(orgId)`. */
export async function updateOrganization(
  orgId: string,
  data: Partial<Pick<Organization, "name" | "website" | "industry">>,
): Promise<void> {
  await updateDoc(doc(db, "organizations", orgId), data);
}
