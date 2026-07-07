import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type {
  Membership,
  Organization,
  SupportAccessGrant,
  SupportAccessStatus,
} from "@/types/domain";

/**
 * Verifica si el usuario es Super Admin de plataforma (platformAdmins/{uid},
 * ver firestore.rules y scripts/grant-super-admin.cjs). Si el usuario NO es
 * Super Admin, la lectura es denegada por las Security Rules - eso tambien
 * significa "no es Super Admin", no es un error real.
 */
export async function checkIsSuperAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "platformAdmins", uid));
    return snap.exists();
  } catch {
    return false;
  }
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromGrantFirestore(data: Record<string, unknown>): SupportAccessGrant {
  return {
    ...data,
    requestedAt: toIso(data.requestedAt),
    respondedAt: data.respondedAt ? toIso(data.respondedAt) : null,
  } as SupportAccessGrant;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
  myGrantStatus: SupportAccessStatus | "none";
}

/**
 * Directorio completo de organizaciones (Panel de Super Admin). Legible sin
 * necesitar ningun supportAccessGrant - las Security Rules ya permiten a
 * un Super Admin leer metadata/membresia de cualquier organizacion sin
 * aprobacion (ver firestore.rules, bloques `organizations/{orgId}` y
 * `users/{userId}`). Fan-out acotado (organizaciones suelen ser pocas),
 * mismo patron ya usado en Blueprint Health y en el Marketplace.
 */
export async function listAllOrganizations(): Promise<OrganizationSummary[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const orgsSnap = await getDocs(collection(db, "organizations"));

  return Promise.all(
    orgsSnap.docs.map(async (orgDoc) => {
      const org = orgDoc.data() as Organization;
      const [ownerSnap, membersSnap, grantSnap] = await Promise.all([
        getDoc(doc(db, "organizations", orgDoc.id, "users", org.ownerId)),
        getDocs(collection(db, "organizations", orgDoc.id, "users")),
        getDoc(doc(db, "organizations", orgDoc.id, "supportAccessGrants", user.uid)),
      ]);
      const owner = ownerSnap.exists() ? (ownerSnap.data() as Membership) : null;

      return {
        id: orgDoc.id,
        name: org.name,
        ownerId: org.ownerId,
        ownerName: owner?.displayName ?? "",
        ownerEmail: owner?.email ?? "",
        memberCount: membersSnap.size,
        createdAt: toIso(org.createdAt),
        myGrantStatus: grantSnap.exists()
          ? (grantSnap.data().status as SupportAccessStatus)
          : "none",
      };
    }),
  );
}

/** Solicita acceso de soporte a una organizacion (Sprint "Panel de Super Admin"). Siempre nace en "pending" - nunca se autoaprueba (impuesto por firestore.rules). */
export async function requestSupportAccess(
  orgId: string,
  orgName: string,
  reason: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await setDoc(doc(db, "organizations", orgId, "supportAccessGrants", user.uid), {
    superAdminUid: user.uid,
    orgId,
    status: "pending",
    reason,
    organizationName: orgName,
    superAdminEmail: user.email ?? "",
    requestedAt: serverTimestamp(),
    respondedAt: null,
    respondedBy: null,
  });
}

/** Solicitudes pendientes/aprobadas de una organizacion (lado Owner/Administrator - Notifications widget). */
export async function listSupportAccessGrantsForOrg(orgId: string): Promise<SupportAccessGrant[]> {
  const snap = await getDocs(
    query(
      collection(db, "organizations", orgId, "supportAccessGrants"),
      where("status", "in", ["pending", "approved"]),
    ),
  );
  return snap.docs.map((d) => fromGrantFirestore(d.data()));
}

/** Aprobar/denegar/revocar una solicitud - solo owner/administrator puede (impuesto por firestore.rules). */
export async function respondToSupportAccessGrant(
  orgId: string,
  superAdminUid: string,
  status: Extract<SupportAccessStatus, "approved" | "denied" | "revoked">,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await updateDoc(doc(db, "organizations", orgId, "supportAccessGrants", superAdminUid), {
    status,
    respondedAt: serverTimestamp(),
    respondedBy: user.uid,
  });
}
