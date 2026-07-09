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
  BlueprintPhase,
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
    registroData:
      data.registroData && typeof data.registroData === "object"
        ? (data.registroData as Record<string, string>)
        : undefined,
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

/** Total de recursos (StepResource) adjuntos en todos los Steps del Blueprint - "Documentos" en los mockups de A4/A5/A6. */
export function countBlueprintResources(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce(
    (sum, phase) => sum + phase.steps.reduce((s, step) => s + step.content.resources.length, 0),
    0,
  );
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

/**
 * Guarda un unico campo del "Registro del Paso" (pestaña 2, Vista del
 * Step) - notacion con punto para tocar solo esa clave del mapa
 * `registroData` sin sobrescribir el resto de campos ya guardados.
 */
export async function updateStepRegistroField(
  orgId: string,
  projectId: string,
  stepId: string,
  fieldId: string,
  value: string,
): Promise<void> {
  await setDoc(
    doc(db, stepStatesPath(orgId, projectId), stepId),
    {
      [`registroData.${fieldId}`]: value,
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

/**
 * El porcentaje de avance (Roadmap del Proyecto, mockup "06-roadmap.png")
 * representa unicamente Steps tipo "one_time" - los recurrentes (daily,
 * weekly, monthly, quarterly, semester, yearly) nunca "terminan", asi que
 * incluirlos en el denominador haria que el proyecto nunca llegue a 100%.
 */
function isCountableStep(step: BlueprintStep): boolean {
  return step.type === "one_time";
}

/** El progreso nunca se guarda - siempre se calcula a partir de los ProjectStepState existentes. */
export function calculateProjectProgress(
  project: Project,
  stepStates: ProjectStepState[],
): ProjectProgress {
  const countableIds = new Set(
    project.blueprintSnapshot.roadmap
      .flatMap((phase) => phase.steps)
      .filter(isCountableStep)
      .map((s) => s.id),
  );
  const total = countableIds.size;
  const completed = stepStates.filter(
    (s) => s.status === "completed" && countableIds.has(s.stepId),
  ).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const status: ProgressStatus =
    completed === 0 ? "no_iniciado" : completed >= total && total > 0 ? "aprobado" : "en_progreso";
  return { total, completed, percent, status };
}

/** Igual que calculateProjectProgress pero acotado a una sola Fase (Roadmap/Vista de fase, Sprint 14). */
export function calculatePhaseProgress(
  phase: BlueprintPhase,
  stepStates: ProjectStepState[],
): ProjectProgress {
  const countableIds = new Set(phase.steps.filter(isCountableStep).map((s) => s.id));
  const relevant = stepStates.filter((s) => countableIds.has(s.stepId));
  const total = countableIds.size;
  const completed = relevant.filter((s) => s.status === "completed").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const status: ProgressStatus =
    completed === 0 ? "no_iniciado" : completed >= total && total > 0 ? "aprobado" : "en_progreso";
  return { total, completed, percent, status };
}

/** Un Step esta bloqueado si alguna de sus dependencias todavia no esta "completed". */
export function isStepBlocked(step: BlueprintStep, stepStates: ProjectStepState[]): boolean {
  if (step.dependencies.length === 0) return false;
  const doneIds = new Set(stepStates.filter((s) => s.status === "completed").map((s) => s.stepId));
  return step.dependencies.some((depId) => !doneIds.has(depId));
}

export type PhaseRowStatus =
  "pendiente" | "disponible" | "en_progreso" | "completada" | "bloqueada";

/** Estado de una Fase (Roadmap/Vista de Fase, mockups "06"/"07"): calculado a partir de dependencias reales entre Steps, nunca guardado. */
export function calculatePhaseStatus(
  phase: BlueprintPhase,
  stepStates: ProjectStepState[],
  nextPhaseId: string | null,
): PhaseRowStatus {
  const progress = calculatePhaseProgress(phase, stepStates);
  if (progress.status === "aprobado") return "completada";
  if (progress.status === "en_progreso") return "en_progreso";
  const allBlocked =
    phase.steps.length > 0 && phase.steps.every((s) => isStepBlocked(s, stepStates));
  if (allBlocked) return "bloqueada";
  if (phase.id === nextPhaseId) return "disponible";
  return "pendiente";
}

export type StepRowStatus = "completado" | "en_progreso" | "pendiente" | "bloqueado";

/**
 * Estado visual de un Step en la Vista de Fase (mockup "07-vista-fase.png"):
 * "en_progreso" es EXCLUSIVO del Step que devuelve findNextStep - "solo
 * puede existir un Step activo por fase".
 */
export function calculateStepRowStatus(
  step: BlueprintStep,
  stepStates: ProjectStepState[],
  activeStepId: string | null,
): StepRowStatus {
  const state = stepStates.find((s) => s.stepId === step.id);
  if (state?.status === "completed") return "completado";
  if (step.id === activeStepId) return "en_progreso";
  if (isStepBlocked(step, stepStates)) return "bloqueado";
  return "pendiente";
}

/** El primer Step no completado, en orden de Fase/Step (para "Siguiente paso" del Roadmap). */
export function findNextStep(
  blueprint: Blueprint,
  stepStates: ProjectStepState[],
): { phase: BlueprintPhase; step: BlueprintStep } | null {
  const doneIds = new Set(stepStates.filter((s) => s.status === "completed").map((s) => s.stepId));
  const sortedPhases = [...blueprint.roadmap].sort((a, b) => a.order - b.order);
  for (const phase of sortedPhases) {
    const sortedSteps = [...phase.steps].sort((a, b) => a.order - b.order);
    for (const step of sortedSteps) {
      if (!doneIds.has(step.id)) return { phase, step };
    }
  }
  return null;
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
