import { listProjects } from "@/services/projects";
import { listBlueprints } from "@/services/blueprints";
import { listKnowledgeItems } from "@/services/knowledge";
import { listDocuments } from "@/services/documents";
import type { DocumentStatus, KnowledgeItemStatus, ProgressStatus } from "@/types/domain";

/**
 * Agregaciones de solo lectura para los widgets de Mission Control
 * (Sprint 9). Reutiliza los servicios ya existentes de Projects/Blueprints/
 * Knowledge/Documents en vez de crear una coleccion o indice nuevo - el
 * unico dato nuevo real de este sprint es el Activity Log (services/activity.ts).
 */

function emptyProgressCounts(): Record<ProgressStatus, number> {
  return { no_iniciado: 0, en_progreso: 0, revisado: 0, aprobado: 0, bloqueado: 0 };
}

export interface ProgressOverview {
  totalProjects: number;
  byStatus: Record<ProgressStatus, number>;
}

export async function getProgressOverview(orgId: string): Promise<ProgressOverview> {
  const projects = await listProjects(orgId);
  const byStatus = emptyProgressCounts();
  for (const p of projects) byStatus[p.progressStatus]++;
  return { totalProjects: projects.length, byStatus };
}

export interface BlueprintHealthEntry {
  projectName: string;
  blueprintName: string;
  progressStatus: ProgressStatus;
}

export interface BlueprintHealth {
  totalBlueprints: number;
  byStatus: Record<ProgressStatus, number>;
  blocked: BlueprintHealthEntry[];
}

/** Fan-out acotado (Projects suelen ser pocos) - mismo patron ya usado en la pestana Exports del Documents Center. */
export async function getBlueprintHealth(orgId: string): Promise<BlueprintHealth> {
  const projects = await listProjects(orgId);
  const byStatus = emptyProgressCounts();
  const blocked: BlueprintHealthEntry[] = [];
  let totalBlueprints = 0;

  for (const project of projects) {
    const blueprints = await listBlueprints({ orgId, projectId: project.id });
    for (const bp of blueprints) {
      totalBlueprints++;
      byStatus[bp.progressStatus]++;
      if (bp.progressStatus === "bloqueado") {
        blocked.push({
          projectName: project.name,
          blueprintName: bp.name,
          progressStatus: bp.progressStatus,
        });
      }
    }
  }

  return { totalBlueprints, byStatus, blocked };
}

export interface KnowledgeInsights {
  total: number;
  byStatus: Record<KnowledgeItemStatus, number>;
  topCategories: { category: string; count: number }[];
}

export async function getKnowledgeInsights(orgId: string): Promise<KnowledgeInsights> {
  const items = await listKnowledgeItems(orgId);
  const byStatus: Record<KnowledgeItemStatus, number> = {
    borrador: 0,
    en_revision: 0,
    aprobado: 0,
    archivado: 0,
  };
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    byStatus[item.status]++;
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total: items.length, byStatus, topCategories };
}

export interface DocumentsSummary {
  total: number;
  byStatus: Record<DocumentStatus, number>;
  recent: { id: string; title: string; status: DocumentStatus }[];
}

export async function getDocumentsSummary(orgId: string): Promise<DocumentsSummary> {
  const documents = await listDocuments(orgId);
  const byStatus: Record<DocumentStatus, number> = {
    borrador: 0,
    en_edicion: 0,
    en_revision: 0,
    aprobado: 0,
    publicado: 0,
    archivado: 0,
  };
  for (const d of documents) byStatus[d.status]++;

  return {
    total: documents.length,
    byStatus,
    recent: documents.slice(0, 5).map((d) => ({ id: d.id, title: d.title, status: d.status })),
  };
}

export interface PendingReviewItem {
  type: "knowledge" | "document";
  id: string;
  title: string;
}

/**
 * "Notificaciones" (Sprint 9): elementos que ya estan en estado "en_revision"
 * (asignable desde la UI existente de Knowledge/Documents). El flujo de
 * aprobacion de supportAccessGrants nunca se construyo y queda fuera de
 * alcance - no es parte de Mission Control.
 */
export async function getPendingReviewItems(orgId: string): Promise<PendingReviewItem[]> {
  const [knowledgeItems, documents] = await Promise.all([
    listKnowledgeItems(orgId),
    listDocuments(orgId),
  ]);

  const items: PendingReviewItem[] = [];
  for (const k of knowledgeItems) {
    if (k.status === "en_revision") items.push({ type: "knowledge", id: k.id, title: k.title });
  }
  for (const d of documents) {
    if (d.status === "en_revision") items.push({ type: "document", id: d.id, title: d.title });
  }
  return items;
}
