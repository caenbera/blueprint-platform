import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { logActivity } from "@/services/activity";
import type {
  Blueprint,
  BlueprintStep,
  Comment,
  ProgressStatus,
  Project,
  ProjectStepState,
  StepNote,
  StepStatus,
} from "@/types/domain";

/**
 * Progreso de ejecucion (Sprint 13, motor de datos nuevo): subcoleccion
 * `organizations/{orgId}/projects/{projectId}/stepStates/{stepId}` - el
 * unico lugar donde vive progreso real. El % de avance nunca se guarda,
 * siempre se calcula (ver calculateProjectProgress) a partir de estos
 * documentos, tal como exige el spec del Blueprint JSON.
 */

function stepStatesPath(orgId: string, projectId: string) {
  return `organizations/${orgId}/projects/${projectId}/stepStates`;
}

function notesPath(orgId: string, projectId: string, stepId: string) {
  return `${stepStatesPath(orgId, projectId)}/${stepId}/notes`;
}

function commentsPath(orgId: string, projectId: string, stepId: string) {
  return `${stepStatesPath(orgId, projectId)}/${stepId}/comments`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): ProjectStepState {
  return {
    stepId: id,
    status: (data.status as StepStatus) ?? "pending",
    checklistDone: Array.isArray(data.checklistDone) ? (data.checklistDone as string[]) : [],
    timeInvestedMinutes:
      typeof data.timeInvestedMinutes === "number" ? data.timeInvestedMinutes : 0,
    completedAt: data.completedAt ? toIso(data.completedAt) : null,
    completedBy: (data.completedBy as string | null) ?? null,
    updatedAt: toIso(data.updatedAt),
  };
}

/** Busca un Step por ID dentro del roadmap completo de un Blueprint (o snapshot congelado). */
export function findStepById(blueprint: Blueprint, stepId: string): BlueprintStep | null {
  for (const phase of blueprint.roadmap) {
    const step = phase.steps.find((s) => s.id === stepId);
    if (step) return step;
  }
  return null;
}

export function countBlueprintSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
}

export async function listStepStates(
  orgId: string,
  projectId: string,
): Promise<ProjectStepState[]> {
  const snap = await getDocs(collection(db, stepStatesPath(orgId, projectId)));
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function getStepState(
  orgId: string,
  projectId: string,
  stepId: string,
): Promise<ProjectStepState | null> {
  const snap = await getDoc(doc(db, stepStatesPath(orgId, projectId), stepId));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

export async function setStepStatus(
  orgId: string,
  projectId: string,
  step: BlueprintStep,
  status: StepStatus,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await setDoc(
    doc(db, stepStatesPath(orgId, projectId), step.id),
    {
      status,
      updatedAt: serverTimestamp(),
      ...(status === "completed"
        ? { completedAt: serverTimestamp(), completedBy: user.uid }
        : { completedAt: null, completedBy: null }),
    },
    { merge: true },
  );

  if (status === "completed") {
    void logActivity(orgId, {
      action: "step_completed",
      summary: `Paso completado: "${step.title}"`,
      projectRef: { projectId, stepId: step.id, stepTitle: step.title },
    });
  }
}

export async function toggleChecklistItem(
  orgId: string,
  projectId: string,
  stepId: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  await setDoc(
    doc(db, stepStatesPath(orgId, projectId), stepId),
    {
      checklistDone: done ? arrayUnion(itemId) : arrayRemove(itemId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export interface ProjectProgress {
  total: number;
  completed: number;
  percent: number;
  status: ProgressStatus;
}

/** El progreso nunca se guarda - siempre se calcula a partir de los ProjectStepState existentes. */
export function calculateProjectProgress(
  project: Project,
  stepStates: ProjectStepState[],
): ProjectProgress {
  const total = countBlueprintSteps(project.blueprintSnapshot);
  const completed = stepStates.filter((s) => s.status === "completed").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const status: ProgressStatus =
    completed === 0 ? "no_iniciado" : completed >= total && total > 0 ? "aprobado" : "en_progreso";
  return { total, completed, percent, status };
}

// --- Notas privadas ---

export async function listNotes(
  orgId: string,
  projectId: string,
  stepId: string,
): Promise<StepNote[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await getDocs(
    query(collection(db, notesPath(orgId, projectId, stepId)), orderBy("createdAt", "asc")),
  );
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id, createdAt: toIso(d.data().createdAt) }) as StepNote)
    .filter((n) => n.authorUid === user.uid);
}

export async function addNote(
  orgId: string,
  projectId: string,
  stepId: string,
  text: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  await addDoc(collection(db, notesPath(orgId, projectId, stepId)), {
    authorUid: user.uid,
    text,
    createdAt: serverTimestamp(),
  });
}

// --- Comentarios colaborativos ---

export async function listComments(
  orgId: string,
  projectId: string,
  stepId: string,
): Promise<Comment[]> {
  const snap = await getDocs(
    query(collection(db, commentsPath(orgId, projectId, stepId)), orderBy("createdAt", "asc")),
  );
  return snap.docs.map(
    (d) => ({ ...d.data(), id: d.id, createdAt: toIso(d.data().createdAt) }) as Comment,
  );
}

export async function addComment(
  orgId: string,
  projectId: string,
  stepId: string,
  text: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  await addDoc(collection(db, commentsPath(orgId, projectId, stepId)), {
    authorUid: user.uid,
    authorName: user.displayName || user.email || "Usuario",
    text,
    createdAt: serverTimestamp(),
  });
}
