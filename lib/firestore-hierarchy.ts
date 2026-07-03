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
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { DeletionStatus } from "@/types/domain";

/**
 * Motor generico para la jerarquia Organization -> Project -> Blueprint ->
 * Phase -> Module -> Chapter -> Workspace -> Card
 * (docs/blueprint-master-spec.md §2/§8). Los 6 niveles intermedios
 * comparten exactamente la misma forma y reglas (Prompt 3: "Todos los
 * modulos deberan seguir exactamente la misma arquitectura"), asi que se
 * implementan una sola vez aqui; services/projects.ts, blueprints.ts,
 * workspaces.ts y cards.ts solo exponen wrappers delgados y tipados sobre
 * estas funciones.
 */

export interface ProjectRef {
  orgId: string;
  projectId: string;
}
export interface BlueprintRef extends ProjectRef {
  blueprintId: string;
}
export interface PhaseRef extends BlueprintRef {
  phaseId: string;
}
export interface ModuleRef extends PhaseRef {
  moduleId: string;
}
export interface ChapterRef extends ModuleRef {
  chapterId: string;
}
export interface WorkspaceRef extends ChapterRef {
  workspaceId: string;
}
export interface CardRef extends WorkspaceRef {
  cardId: string;
}

export const projectsPath = (orgId: string) => `organizations/${orgId}/projects`;
export const projectPath = (ref: ProjectRef) => `${projectsPath(ref.orgId)}/${ref.projectId}`;

export const blueprintsPath = (ref: ProjectRef) => `${projectPath(ref)}/blueprints`;
export const blueprintPath = (ref: BlueprintRef) => `${blueprintsPath(ref)}/${ref.blueprintId}`;

export const phasesPath = (ref: BlueprintRef) => `${blueprintPath(ref)}/phases`;
export const phasePath = (ref: PhaseRef) => `${phasesPath(ref)}/${ref.phaseId}`;

export const modulesPath = (ref: PhaseRef) => `${phasePath(ref)}/modules`;
export const modulePath = (ref: ModuleRef) => `${modulesPath(ref)}/${ref.moduleId}`;

export const chaptersPath = (ref: ModuleRef) => `${modulePath(ref)}/chapters`;
export const chapterPath = (ref: ChapterRef) => `${chaptersPath(ref)}/${ref.chapterId}`;

export const workspacesPath = (ref: ChapterRef) => `${chapterPath(ref)}/workspaces`;
export const workspacePath = (ref: WorkspaceRef) => `${workspacesPath(ref)}/${ref.workspaceId}`;

export const cardsPath = (ref: WorkspaceRef) => `${workspacePath(ref)}/cards`;
export const cardPath = (ref: CardRef) => `${cardsPath(ref)}/${ref.cardId}`;

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore<T>(id: string, data: DocumentData): T {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as T;
}

type CreatableFields = Record<string, unknown>;

export async function createNode(collectionPath: string, data: CreatableFields): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const ref = await addDoc(collection(db, collectionPath), {
    ...data,
    deletionStatus: "active" satisfies DeletionStatus,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listNodes<T>(collectionPath: string): Promise<T[]> {
  const snap = await getDocs(query(collection(db, collectionPath), orderBy("order")));
  return snap.docs
    .map((d) => fromFirestore<T & { deletionStatus: DeletionStatus }>(d.id, d.data()))
    .filter((node) => node.deletionStatus !== "deleted");
}

export async function getNode<T>(docPath: string): Promise<T | null> {
  const snap = await getDoc(doc(db, docPath));
  if (!snap.exists()) return null;
  return fromFirestore<T>(snap.id, snap.data());
}

export async function updateNode(docPath: string, data: CreatableFields): Promise<void> {
  await updateDoc(doc(db, docPath), { ...data, updatedAt: serverTimestamp() });
}

export async function archiveNode(docPath: string): Promise<void> {
  await updateDoc(doc(db, docPath), {
    deletionStatus: "archived" satisfies DeletionStatus,
    updatedAt: serverTimestamp(),
  });
}
