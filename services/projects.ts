import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { logActivity } from "@/services/activity";
import { getBlueprint } from "@/services/blueprints";
import type { Project } from "@/types/domain";

/**
 * Proyectos (Sprint 13, motor de datos nuevo): subcoleccion
 * `organizations/{orgId}/projects/{id}` - instancia de un Blueprint para
 * una organizacion. `blueprintSnapshot` congela el Blueprint completo al
 * momento de iniciar (copia no destructiva, mismo principio que
 * Knowledge/Documents/Marketplace) - cambios posteriores al Blueprint
 * original no afectan Proyectos ya iniciados.
 */

function projectsPath(orgId: string) {
  return `organizations/${orgId}/projects`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): Project {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as Project;
}

export async function createProjectFromBlueprint(
  orgId: string,
  blueprintId: string,
  name?: string,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const blueprint = await getBlueprint(blueprintId);
  if (!blueprint) throw new Error("El Blueprint no existe.");

  const projectName = name?.trim() || blueprint.name;
  const ref = await addDoc(collection(db, projectsPath(orgId)), {
    orgId,
    blueprintId,
    blueprintSnapshot: blueprint,
    name: projectName,
    icon: blueprint.icon,
    deletionStatus: "active",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  void logActivity(orgId, {
    action: "project_created",
    summary: `Proyecto creado: "${projectName}"`,
    projectRef: { projectId: ref.id, projectName },
  });

  return ref.id;
}

export async function listProjects(orgId: string): Promise<Project[]> {
  const snap = await getDocs(
    query(collection(db, projectsPath(orgId)), orderBy("createdAt", "desc")),
  );
  return snap.docs
    .map((d) => fromFirestore(d.id, d.data()))
    .filter((p) => p.deletionStatus === "active" && isValidProject(p));
}

export async function getProject(orgId: string, projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, projectsPath(orgId), projectId));
  if (!snap.exists()) return null;
  const project = fromFirestore(snap.id, snap.data());
  return isValidProject(project) ? project : null;
}

/**
 * Descarta Proyectos sin `blueprintSnapshot` (datos huerfanos del modelo
 * viejo, previos al corte limpio del Sprint 13 - esa migracion decidio no
 * convertir datos existentes, ver plan de rediseno). Sin snapshot un
 * Proyecto no tiene ni roadmap ni Steps, es irrecuperable.
 */
function isValidProject(project: Project): boolean {
  return Boolean(project.blueprintSnapshot);
}

/** Tarjeta "Mis proyectos" (mockup "02-inicio.png") - menu de opciones, Renombrar. */
export async function renameProject(orgId: string, projectId: string, name: string): Promise<void> {
  await updateDoc(doc(db, projectsPath(orgId), projectId), { name, updatedAt: serverTimestamp() });
}

/** Menu de opciones - Archivar (soft delete reversible, ver DeletionStatus en types/domain.ts). */
export async function archiveProject(orgId: string, projectId: string): Promise<void> {
  await updateDoc(doc(db, projectsPath(orgId), projectId), {
    deletionStatus: "archived",
    updatedAt: serverTimestamp(),
  });
}

/** Menu de opciones - Eliminar (soft delete: "Soft delete universal: nunca borrado fisico"). */
export async function deleteProject(orgId: string, projectId: string): Promise<void> {
  await updateDoc(doc(db, projectsPath(orgId), projectId), {
    deletionStatus: "deleted",
    updatedAt: serverTimestamp(),
  });
}
