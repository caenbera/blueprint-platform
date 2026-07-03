/**
 * Contratos de dominio compartidos entre services/, hooks/ y componentes.
 * Ver docs/blueprint-master-spec.md para el modelo completo.
 */

export type Role = "owner" | "administrator" | "manager" | "editor" | "collaborator" | "viewer";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Membership {
  uid: string;
  orgId: string;
  role: Role;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
}

export type SupportAccessStatus = "pending" | "approved" | "denied" | "revoked";

export interface SupportAccessGrant {
  superAdminUid: string;
  orgId: string;
  status: SupportAccessStatus;
  requestedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
}

/**
 * Jerarquia de dominio: Organization -> Project -> Blueprint -> Phase ->
 * Module -> Chapter -> Workspace -> Card (docs/blueprint-master-spec.md §2/§8).
 */

/** Estado de progreso/navegacion (nodos del Navigator). Distinto del
 * estado de ciclo de vida de contenido (ver CardLifecycleStatus). */
export type ProgressStatus = "no_iniciado" | "en_progreso" | "revisado" | "aprobado" | "bloqueado";

/** Soft delete universal (Prompt 11 §"Soft Delete"): nunca borrado fisico. */
export type DeletionStatus = "active" | "archived" | "deleted";

interface HierarchyNodeBase {
  id: string;
  name: string;
  description: string;
  order: number;
  progressStatus: ProgressStatus;
  deletionStatus: DeletionStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface Project extends HierarchyNodeBase {
  orgId: string;
}

export interface Blueprint extends HierarchyNodeBase {
  orgId: string;
  projectId: string;
}

export interface Phase extends HierarchyNodeBase {
  orgId: string;
  projectId: string;
  blueprintId: string;
}

export interface Module extends HierarchyNodeBase {
  orgId: string;
  projectId: string;
  blueprintId: string;
  phaseId: string;
}

export interface Chapter extends HierarchyNodeBase {
  orgId: string;
  projectId: string;
  blueprintId: string;
  phaseId: string;
  moduleId: string;
}

export interface Workspace extends HierarchyNodeBase {
  orgId: string;
  projectId: string;
  blueprintId: string;
  phaseId: string;
  moduleId: string;
  chapterId: string;
}

/** Catalogo de 20 tipos oficiales de Card (Prompt 9). */
export type CardType =
  | "informacion"
  | "objetivo"
  | "pregunta"
  | "respuesta"
  | "checklist"
  | "formulario"
  | "documento"
  | "archivo"
  | "imagen"
  | "video"
  | "audio"
  | "tabla"
  | "timeline"
  | "kpi"
  | "canvas"
  | "ia"
  | "resumen"
  | "comparacion"
  | "proceso"
  | "plantilla";

/** Estado de ciclo de vida de contenido de una Card (Prompt 9), distinto
 * del ProgressStatus de navegacion. */
export type CardLifecycleStatus =
  "borrador" | "en_edicion" | "en_revision" | "aprobada" | "publicada" | "archivada" | "bloqueada";

export interface Card {
  id: string;
  orgId: string;
  projectId: string;
  blueprintId: string;
  phaseId: string;
  moduleId: string;
  chapterId: string;
  workspaceId: string;
  type: CardType;
  title: string;
  objective: string;
  /** Forma exacta depende de `type`; se define al construir el Card System (Sprint 5). */
  content: unknown;
  lifecycleStatus: CardLifecycleStatus;
  deletionStatus: DeletionStatus;
  order: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
