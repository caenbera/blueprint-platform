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
import { listAllBlueprints } from "@/services/blueprints";
import { logPlatformAction } from "@/services/platform-audit";
import type {
  Membership,
  Organization,
  OrganizationPlan,
  OrganizationStatus,
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
  status: OrganizationStatus;
  plan: OrganizationPlan;
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
        status: org.status ?? "active",
        plan: org.plan ?? "gratuito",
      };
    }),
  );
}

/**
 * Suspender/reactivar una organizacion (Sprint 16): firestore.rules solo
 * deja al Super Admin tocar el campo `status` de una organizacion ajena,
 * nunca su nombre ni ningun otro dato de negocio.
 */
export async function suspendOrganization(orgId: string, orgName: string): Promise<void> {
  await updateDoc(doc(db, "organizations", orgId), {
    status: "suspended" satisfies OrganizationStatus,
  });
  void logPlatformAction({
    action: "organization_suspended",
    summary: `Organización suspendida: "${orgName}"`,
    targetOrgId: orgId,
    targetOrgName: orgName,
  });
}

export async function reactivateOrganization(orgId: string, orgName: string): Promise<void> {
  await updateDoc(doc(db, "organizations", orgId), {
    status: "active" satisfies OrganizationStatus,
  });
  void logPlatformAction({
    action: "organization_reactivated",
    summary: `Organización reactivada: "${orgName}"`,
    targetOrgId: orgId,
    targetOrgName: orgName,
  });
}

/** Suscripciones (Sprint 18): sin cobro real todavía - el Super Admin asigna el plan manualmente. */
export async function updateOrganizationPlan(
  orgId: string,
  orgName: string,
  plan: OrganizationPlan,
): Promise<void> {
  await updateDoc(doc(db, "organizations", orgId), { plan });
  void logPlatformAction({
    action: "organization_plan_changed",
    summary: `Plan de "${orgName}" cambiado a ${plan}`,
    targetOrgId: orgId,
    targetOrgName: orgName,
  });
}

export interface PlatformUserRow extends Membership {
  organizationName: string;
}

/**
 * Directorio global de usuarios (Sprint 16): fan-out sobre todas las
 * organizaciones y sus miembros - mismo patron y misma autorizacion ya
 * usada por listAllOrganizations (el bloque `users/{userId}` de
 * firestore.rules ya permite `isSuperAdmin()` sin condiciones, es gestion
 * de plataforma, no contenido de negocio).
 */
export async function listAllUsers(): Promise<PlatformUserRow[]> {
  const orgsSnap = await getDocs(collection(db, "organizations"));

  const rows = await Promise.all(
    orgsSnap.docs.map(async (orgDoc) => {
      const org = orgDoc.data() as Organization;
      const membersSnap = await getDocs(collection(db, "organizations", orgDoc.id, "users"));
      return membersSnap.docs.map(
        (m) => ({ ...(m.data() as Membership), organizationName: org.name }) as PlatformUserRow,
      );
    }),
  );

  return rows.flat();
}

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  totalPublishedBlueprints: number;
  pendingSupportRequests: number;
  topOrganizationsByMembers: { id: string; name: string; memberCount: number }[];
}

/**
 * Dashboard General (Sprint 16): agregaciones reales sobre datos que el
 * Super Admin ya puede leer (metadata/membresia de organizaciones,
 * Blueprints top-level). Deliberadamente NO incluye conteos de contenido
 * de negocio (Proyectos, Steps, etc.) por organizacion - leerlos
 * requeriria un supportAccessGrant aprobado por cada una (ver
 * firestore.rules), asi que un total "de toda la plataforma" seria
 * incompleto y enganoso. Ver docs/security-audit.md.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [organizations, blueprints] = await Promise.all([
    listAllOrganizations(),
    listAllBlueprints(),
  ]);

  const topOrganizationsByMembers = [...organizations]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5)
    .map((o) => ({ id: o.id, name: o.name, memberCount: o.memberCount }));

  return {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter((o) => o.status === "active").length,
    suspendedOrganizations: organizations.filter((o) => o.status === "suspended").length,
    totalUsers: organizations.reduce((sum, o) => sum + o.memberCount, 0),
    totalPublishedBlueprints: blueprints.filter((b) => b.status === "published").length,
    pendingSupportRequests: organizations.filter((o) => o.myGrantStatus === "pending").length,
    topOrganizationsByMembers,
  };
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
