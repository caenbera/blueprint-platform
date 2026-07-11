/**
 * Contratos de dominio compartidos entre services/, hooks/ y componentes.
 * Ver docs/blueprint-master-spec.md para el modelo original y
 * "json explicacion.md" (compartido por el usuario, Sprint 13) para el
 * motor unico Blueprint -> Roadmap -> Fase -> Step -> Content -> Resources
 * que reemplaza por completo la jerarquia anterior (Project -> Blueprint ->
 * Phase -> Module -> Chapter -> Workspace -> Card). Corte limpio (Sprint
 * 13): no quedan tipos de la jerarquia vieja.
 */

export type Role = "owner" | "administrator" | "manager" | "editor" | "collaborator" | "viewer";

/** Ausente = "active" (organizaciones creadas antes del Sprint 16). */
export type OrganizationStatus = "active" | "suspended";

/** Ausente = "gratuito". Sin cobro real todavía (Sprint 18) - el Super Admin lo asigna manualmente desde Suscripciones. */
export type OrganizationPlan = "gratuito" | "basico" | "profesional" | "empresarial";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  /** Campos opcionales de Configuración (Sprint 15) - editables por cualquier miembro, sin validación de dominio externo. */
  website?: string;
  industry?: string;
  /** Suspensión de plataforma (Sprint 16) - solo Super Admin puede escribir este campo (ver firestore.rules). */
  status?: OrganizationStatus;
  /** Suscripción de plataforma (Sprint 18) - solo Super Admin puede escribir este campo. */
  plan?: OrganizationPlan;
}

export interface Membership {
  uid: string;
  orgId: string;
  role: Role;
  displayName: string;
  email: string;
  joinedAt: string;
}

export type InviteStatus = "pending" | "accepted" | "revoked";

/**
 * Invitacion a un correo para unirse a la organizacion (Sprint 15). Solo
 * registra la intencion - el envio real de correo y el flujo de
 * aceptacion (un usuario nuevo se une a ESTA organizacion en vez de crear
 * la suya propia) quedan fuera de alcance por ahora, ver
 * app/api/organizations/route.ts.
 */
export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  status: InviteStatus;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
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
  /** Motivo de la solicitud (Panel de Super Admin) - obligatorio en la UI, no impuesto por las Security Rules. */
  reason: string;
  requestedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  /** Denormalizados al crear la solicitud, para mostrar sin fetch extra. */
  organizationName?: string;
  superAdminEmail?: string;
}

/** Acciones de Super Admin que quedan registradas en la Auditoría de plataforma (Sprint 16). */
export type PlatformAuditAction =
  | "organization_suspended"
  | "organization_reactivated"
  | "organization_plan_changed"
  | "support_access_approved"
  | "support_access_denied"
  | "support_access_revoked";

/**
 * Bitácora de auditoría de plataforma (coleccion top-level
 * `platformAuditLog`, solo Super Admin lee/escribe) - distinta del
 * Activity Log de cada organización (services/activity.ts), que registra
 * la actividad de negocio de sus propios miembros.
 */
export interface PlatformAuditLogEntry {
  id: string;
  action: PlatformAuditAction;
  summary: string;
  actorUid: string;
  actorName: string;
  targetOrgId?: string;
  targetOrgName?: string;
  createdAt: string;
}

export type AiProviderName = "anthropic" | "openai" | "google";

/**
 * Configuración global del AI Engine (Sprint 18, coleccion top-level
 * `platformConfig`, doc `aiSettings`). Reemplaza la variable de entorno
 * `AI_PROVIDER` como fuente principal - si este documento no existe,
 * `lib/ai/index.ts#getAiProvider` sigue usando la env var como respaldo,
 * asi que nunca rompe un deploy que todavia no configuro esto desde la UI.
 */
export interface PlatformAiSettings {
  provider: AiProviderName;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Configuración general de plataforma (Sprint 18, coleccion top-level
 * `platformConfig`, doc `general`). `allowNewRegistrations` se aplica de
 * verdad en app/api/organizations/route.ts; `maintenanceMode` bloquea el
 * acceso de cualquier usuario que no sea Super Admin (mismo patron que la
 * suspension de una organizacion especifica, Sprint 16).
 */
export interface PlatformGeneralSettings {
  platformName: string;
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  updatedBy: string;
  updatedAt: string;
}

/** Soft delete universal: nunca borrado fisico. */
export type DeletionStatus = "active" | "archived" | "deleted";

/** Estado de progreso calculado (nunca almacenado - ver ProjectStepState/calculateProjectProgress en services/step-state.ts). */
export type ProgressStatus = "no_iniciado" | "en_progreso" | "aprobado";

/**
 * ---------------------------------------------------------------------
 * Motor Blueprint (Sprint 13): un unico motor universal de ejecucion de
 * procesos. Jerarquia oficial: Blueprint -> Roadmap -> Fase -> Step ->
 * Content -> Resources. No existen mas niveles - toda la inteligencia
 * vive en el Step.
 * ---------------------------------------------------------------------
 */

export type BlueprintStatus = "draft" | "published" | "archived";
export type BlueprintDifficulty = "beginner" | "intermediate" | "advanced";
/**
 * "construction": tiene principio y fin, el progreso llega a 100% (motor
 * de hoy, calculateProjectProgress). "operations": ciclo recurrente sin
 * fin (Strategy/Operations/Business/Customers semanal) - mismo motor de
 * Step, pero el progreso se mide por periodo actual, nunca llega a 100%.
 * Opcional y default "construction" para no romper Blueprints existentes.
 */
export type BlueprintType = "construction" | "operations";
/**
 * Los 4 bloques universales que agrupan Fases (Roadmap del Proyecto) -
 * organizan tanto Blueprints de construccion como, mas adelante, los de
 * operacion (mismo vocabulario en ambos). Opcional: una Fase sin `block`
 * simplemente no se agrupa visualmente.
 */
export type BlueprintBlock = "strategy" | "operations" | "business" | "customers";

/** El tipo del Step define su ciclo de vida, nunca su estructura. */
export type StepType =
  | "one_time"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semester"
  | "yearly"
  | "milestone"
  | "custom";

export type StepDifficulty = "easy" | "medium" | "hard";
export type StepPriority = "low" | "normal" | "high";

/** Catalogo de tipos de Resource (Content Engine) - motor universal, todos comparten la misma estructura, solo cambia `type`. */
export type StepResourceType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "google_docs"
  | "google_sheets"
  | "google_drive"
  | "dropbox"
  | "onedrive"
  | "firebase_storage"
  | "aws_s3"
  | "cloudflare"
  | "youtube"
  | "vimeo"
  | "loom"
  | "spotify"
  | "podcast"
  | "image"
  | "video"
  | "audio"
  | "zip"
  | "code"
  | "website"
  | "api"
  | "form"
  | "template"
  | "presentation"
  | "manual"
  | "other";

export type StepResourceVisibility = "public" | "organization";

/** Regla 4: nunca se almacenan archivos binarios dentro del Blueprint, solo referencias externas. */
export interface StepResource {
  id: string;
  type: StepResourceType;
  title: string;
  description: string;
  provider: string;
  previewUrl: string;
  downloadUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  extension: string;
  size: number;
  metadata: {
    pages: number | null;
    duration: number | null;
    language: string;
  };
  tags: string[];
  visibility: StepResourceVisibility;
}

export interface StepChecklistItem {
  id: string;
  task: string;
  /** Subtitulo breve del item (Vista del Step, pestaña Checklist, mockup "08-vista-paso.png") - opcional. */
  description?: string;
}

/** Define cuando un Step puede darse por terminado - el motor las usa automaticamente. */
export interface StepCompletionRules {
  requiredChecklist: boolean;
  requiredResources: boolean;
  requiredApproval: boolean;
  requiredQuiz: boolean;
}

export interface StepAssistantConfig {
  systemPrompt: string;
  context: string;
  suggestions: string[];
}

/** Herramienta externa sugerida (pestaña "Guía del Paso") - Blueprint nunca reemplaza estas herramientas, solo las recomienda. */
export interface StepRecommendedTool {
  name: string;
  url: string;
}

export type StepRegistroFieldType =
  | "text"
  | "textarea"
  | "select"
  | "url"
  | "number"
  | "date"
  | "checkbox"
  | "email"
  | "phone"
  | "multiselect"
  | "color";

/**
 * Campo del "Registro del Paso" (pestaña 2, Vista del Step): cada
 * Blueprint define que campos necesita registrar en cada Step - Blueprint
 * solo guarda informacion estrategica, nunca archivos (para adjuntar algo
 * existente se usa el tipo "url", nunca una subida binaria).
 */
export interface StepRegistroField {
  id: string;
  label: string;
  type: StepRegistroFieldType;
  placeholder?: string;
  helpText?: string;
  /** Opciones fijas - aplica a "select" (una) y "multiselect" (varias). */
  options?: string[];
  /** Sufijo mostrado junto al valor - solo aplica a "number" (ej. "USD", "%", "horas"). */
  unit?: string;
  required?: boolean;
}

/** Todo el conocimiento del Step vive aqui, nunca fuera. */
export interface StepContent {
  overview: { title: string; summary: string; body: string };
  objective: { description: string };
  checklist: StepChecklistItem[];
  resources: StepResource[];
  assistant: StepAssistantConfig;
  /** Referencias a KnowledgeItem.id (organizations/{orgId}/knowledgeItems) - reutilizables, no pertenecen solo a este Step. */
  knowledge: string[];
  /** Campos opcionales de la pestaña "Guía del Paso" (mockup "08-vista-paso.png") - si faltan, esas tarjetas simplemente no se muestran. */
  whyItMatters?: string;
  bestPractices?: string[];
  commonMistakes?: string[];
  tip?: string;
  recommendedTools?: StepRecommendedTool[];
  /** Campos del "Registro del Paso" (pestaña 2) - vacio/ausente = la pestaña muestra un estado vacio. */
  registroFields?: StepRegistroField[];
  /** Pantalla "Paso Completado" (mockup "09-paso-completado.png") - que gano el usuario al terminar este Step. Opcional: si falta, esa seccion no se muestra. */
  learnings?: { title: string; description: string }[];
  /** Frase inspiradora mostrada al completar el Step - no todos los Blueprints la tienen. */
  inspirationalQuote?: string;
}

/** El objeto mas importante de la plataforma: una unica accion ejecutable. */
export interface BlueprintStep {
  id: string;
  title: string;
  description: string;
  /** Nombre de icono de lucide-react en kebab-case (ej. "scale", "landmark"). Opcional: si falta, se infiere por palabra clave del titulo (ver lib/step-icon.ts). */
  icon?: string;
  order: number;
  type: StepType;
  estimatedHours: number;
  difficulty: StepDifficulty;
  priority: StepPriority;
  /** IDs de otros Steps que deben completarse antes de poder iniciar este. */
  dependencies: string[];
  completionRules: StepCompletionRules;
  content: StepContent;
}

/** Las Fases solo agrupan Steps visualmente - nunca contienen comportamiento propio. */
export interface BlueprintPhase {
  id: string;
  title: string;
  description: string;
  /** Resultado esperado al completar la fase (Vista de la Fase, mockup "07-vista-fase.png") - distinto de `description`. Opcional: si falta, la tarjeta "Objetivo de la fase" simplemente no se muestra. */
  objective?: string;
  /** Recursos generales de la fase completa (guías, plantillas, videos) - distintos de los recursos de cada Step, que viven en StepContent.resources. */
  resources?: StepResource[];
  /** Ver BlueprintBlock. Opcional: agrupa esta Fase visualmente en el Roadmap del Proyecto (lib/phase-block.ts). */
  block?: BlueprintBlock;
  order: number;
  steps: BlueprintStep[];
}

export interface BlueprintSettings {
  allowComments: boolean;
  allowAssistant: boolean;
  allowKnowledge: boolean;
  allowExport: boolean;
  allowMarketplace: boolean;
}

/**
 * Representa una metodologia completa (Blueprint). Coleccion top-level
 * `blueprints/{id}` - autoria exclusiva de Super Admin (ver
 * firestore.rules). Solo contiene informacion general y el Roadmap, nunca
 * logica de ejecucion propia de una organizacion (eso vive en Project).
 */
export interface Blueprint {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  version: string;
  author: string;
  language: string;
  difficulty: BlueprintDifficulty;
  estimatedDuration: string;
  tags: string[];
  coverImage: string;
  icon: string;
  status: BlueprintStatus;
  /** Ver BlueprintType. Opcional para compatibilidad con Blueprints existentes - ausente se trata como "construction". */
  blueprintType?: BlueprintType;
  settings: BlueprintSettings;
  roadmap: BlueprintPhase[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Instancia de un Blueprint para una organizacion (subcoleccion
 * `organizations/{orgId}/projects/{id}`). `blueprintSnapshot` congela el
 * Blueprint completo al momento de iniciar (mismo principio "copia no
 * destructiva" ya usado en Knowledge/Documents/Marketplace) - si el
 * Blueprint original cambia despues, este Proyecto no se ve afectado.
 */
export interface Project {
  id: string;
  orgId: string;
  blueprintId: string;
  blueprintSnapshot: Blueprint;
  name: string;
  icon: string;
  deletionStatus: DeletionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type StepStatus = "pending" | "in_progress" | "completed" | "blocked";

/**
 * El unico lugar donde vive progreso real (subcoleccion
 * `organizations/{orgId}/projects/{projectId}/stepStates/{stepId}`). El %
 * de avance nunca se guarda - siempre se calcula a partir de estos
 * documentos (ver services/step-state.ts#calculateProjectProgress).
 */
export interface ProjectStepState {
  stepId: string;
  status: StepStatus;
  /** IDs de StepChecklistItem ya marcados como hechos. */
  checklistDone: string[];
  timeInvestedMinutes: number;
  completedAt: string | null;
  completedBy: string | null;
  updatedAt: string;
  /** Respuestas del "Registro del Paso" (StepRegistroField.id -> valor) - Blueprint solo guarda informacion estrategica, nunca archivos. */
  registroData?: Record<string, string>;
  /**
   * Completado por periodo para Steps recurrentes (weekly/monthly/etc,
   * ver lib/period.ts#getCurrentPeriodKey) - clave = periodKey (ej.
   * "2026-W28", "2026-07"). Steps `one_time` nunca usan este campo,
   * siguen usando status/completedAt/completedBy de arriba.
   */
  periodCompletions?: Record<string, { completedAt: string; completedBy: string }>;
}

/** Nota privada del usuario sobre un Step - solo el autor puede verla. */
export interface StepNote {
  id: string;
  authorUid: string;
  text: string;
  createdAt: string;
}

/** Comentario colaborativo sobre un Step, visible para toda la organizacion. */
export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: string;
}

/** Catalogo de categorias de la Knowledge Base, extensible. */
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

/** Estado de publicacion de un Knowledge Item - solo lo "aprobado" es reutilizable por defecto. */
export type KnowledgeItemStatus = "borrador" | "en_revision" | "aprobado" | "archivado";

/**
 * Elemento de la Knowledge Base: copia (snapshot) del contenido de origen
 * en el momento de la promocion - no una referencia viva.
 */
export interface KnowledgeItem {
  id: string;
  orgId: string;
  title: string;
  summary: string;
  category: KnowledgeCategory;
  tags: string[];
  /** ID/titulo de lo que se promovio (un Step, un snapshot de Marketplace, etc.) - vacio si no aplica. */
  sourceId: string;
  sourceTitle: string;
  content: unknown;
  status: KnowledgeItemStatus;
  relatedItemIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Catalogo de plantillas del Documents Center. */
export type DocumentTemplateType =
  | "plan_negocio"
  | "modelo_negocio"
  | "propuesta_comercial"
  | "plan_estrategico"
  | "manual_procesos"
  | "manual_operativo"
  | "informe_ejecutivo"
  | "diagnostico_empresarial"
  | "presentacion"
  | "reporte_financiero"
  | "personalizado";

/** Estado de un documento, distinto de KnowledgeItemStatus. */
export type DocumentStatus =
  "borrador" | "en_edicion" | "en_revision" | "aprobado" | "publicado" | "archivado";

/**
 * Seccion de un documento: copia (snapshot) de un Knowledge Item, o texto
 * libre. Reordenar/ocultar/quitar una seccion nunca modifica la fuente.
 */
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  sourceKnowledgeItemId: string | null;
  hidden: boolean;
  order: number;
}

export interface BlueprintDocument {
  id: string;
  orgId: string;
  title: string;
  templateType: DocumentTemplateType;
  status: DocumentStatus;
  sections: DocumentSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentExportFormat = "pdf" | "word" | "markdown" | "html" | "json";

export interface DocumentExportRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  format: DocumentExportFormat;
  url: string;
  createdBy: string;
  createdAt: string;
}

/** Los 6 modos de comportamiento del Blueprint AI Engine - un unico motor. */
export type AssistantMode =
  "consultor" | "redactor" | "analista" | "investigador" | "estratega" | "presentador";

/** Fuente citada por el Assistant (Knowledge Engine): de donde salio la informacion usada. */
export interface KnowledgeSourceRef {
  id: string;
  title: string;
  category: KnowledgeCategory;
}

/** Acciones que el Action/Document Engine puede proponer - nunca se ejecutan solas. */
export type ProposedActionType = "create_document";

export interface CreateDocumentActionPayload {
  title: string;
  templateType: DocumentTemplateType;
  sections: { title: string; content: string }[];
}

export interface ProposedAction {
  id: string;
  type: ProposedActionType;
  summary: string;
  payload: CreateDocumentActionPayload;
}

/** Mensaje de la conversacion continua con el Assistant (una por usuario por organizacion). */
export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AssistantMode;
  sources?: KnowledgeSourceRef[];
  proposedActions?: ProposedAction[];
  createdBy: string;
  createdAt: string;
}

/** Eventos que alimentan el Activity Log de Mission Control - alcance minimo: solo los de mayor valor. */
export type ActivityAction =
  | "project_created"
  | "step_completed"
  | "knowledge_promoted"
  | "document_created"
  | "document_exported";

/** Referencia minima para que "Continuar Trabajando" pueda saltar al Proyecto/Step de origen. */
export interface ActivityProjectRef {
  projectId: string;
  projectName?: string;
  stepId?: string;
  stepTitle?: string;
}

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  summary: string;
  actorUid: string;
  actorName: string;
  projectRef?: ActivityProjectRef;
  createdAt: string;
}

/** Recomendacion generada bajo demanda por el Assistant Recommendations widget, cacheada. */
export interface AssistantRecommendation {
  text: string;
  generatedAt: string;
}

/**
 * Marketplace: recursos reutilizables con alcance Publico o Biblioteca
 * Privada de Empresa. "Incorporar" siempre crea una copia nueva a partir
 * del snapshot - nunca modifica el original. Los Blueprints ya no se
 * publican via Marketplace (Sprint 13): su autoria es exclusiva de Super
 * Admin y su descubrimiento es directo via services/blueprints.ts - el
 * Marketplace queda para Documentos y Knowledge Items.
 */
export type MarketplaceResourceType = "document" | "knowledge_item";
export type MarketplaceVisibility = "public" | "organization";
export type MarketplaceResourceStatus = "publicado" | "archivado";

export interface DocumentResourceSnapshot {
  templateType: DocumentTemplateType;
  sections: { title: string; content: string }[];
}

export interface KnowledgeItemResourceSnapshot {
  category: KnowledgeCategory;
  tags: string[];
  summary: string;
  content: unknown;
}

export interface MarketplaceResource {
  id: string;
  resourceType: MarketplaceResourceType;
  title: string;
  description: string;
  visibility: MarketplaceVisibility;
  orgId: string;
  orgName: string;
  publishedBy: string;
  publishedByName: string;
  status: MarketplaceResourceStatus;
  snapshot: DocumentResourceSnapshot | KnowledgeItemResourceSnapshot;
  createdAt: string;
  updatedAt: string;
}
