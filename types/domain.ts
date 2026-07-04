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

/** Comentario libre sobre una Card (Prompt 8/9 — sin menciones todavia, Sprint 4). */
export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: string;
}

/**
 * Snapshot de una Card justo ANTES de aplicarse un cambio (Prompt 11
 * "Soft Delete"/"Versionado": nunca sobrescribir informacion). Se escribe
 * automaticamente desde `services/cards.ts#updateCard`.
 */
export interface CardVersion {
  id: string;
  title: string;
  objective: string;
  content: unknown;
  savedBy: string;
  createdAt: string;
}

/**
 * Formas de `Card.content` por tipo (Card System, Sprint 5). `content`
 * sigue siendo `unknown` a nivel de dominio - cada renderer en
 * components/features/workspace/card-content/ valida/castea localmente.
 */

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
export type ChecklistContent = ChecklistItem[];

export interface TableContent {
  headers: string[];
  rows: string[][];
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
}
export type TimelineContent = TimelineEntry[];

export interface KpiContent {
  value: string;
  target: string;
  unit: string;
  trend: "up" | "down" | "flat";
}

export interface ComparisonRow {
  id: string;
  aspect: string;
  optionA: string;
  optionB: string;
}
export interface ComparisonContent {
  labelA: string;
  labelB: string;
  rows: ComparisonRow[];
}

export interface FormField {
  id: string;
  label: string;
  answer: string;
}
export type FormContent = FormField[];

/** Usado por los tipos "archivo" e "imagen" (Firebase Storage). */
export interface FileContent {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Usado por los tipos "video" y "audio" (URL externa, sin subida). */
export interface MediaContent {
  url: string;
}

/** Catalogo de categorias de la Knowledge Base (Prompt 4.5), extensible. */
export type KnowledgeCategory =
  | "estrategia"
  | "finanzas"
  | "operaciones"
  | "marketing"
  | "rrhh"
  | "legal"
  | "ventas"
  | "clientes"
  | "productos"
  | "procesos"
  | "plantillas"
  | "documentos";

/** Estado de publicacion de un Knowledge Item (Prompt 4.5) - solo lo
 * "aprobado" es reutilizable por defecto. Distinto de CardLifecycleStatus. */
export type KnowledgeItemStatus = "borrador" | "en_revision" | "aprobado" | "archivado";

/**
 * Elemento de la Knowledge Base (Prompt 4.5/9): copia (snapshot) del
 * contenido de una Card promovida en el momento de la promocion - no una
 * referencia viva (ver plan Sprint 6).
 */
export interface KnowledgeItem {
  id: string;
  orgId: string;
  title: string;
  summary: string;
  category: KnowledgeCategory;
  tags: string[];
  sourceCardId: string;
  sourceCardTitle: string;
  content: unknown;
  status: KnowledgeItemStatus;
  relatedItemIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
