import { listProjects } from "@/services/projects";
import { calculateProjectProgress, listStepStates } from "@/services/step-state";
import { listKnowledgeItems } from "@/services/knowledge";
import { listDocuments } from "@/services/documents";
import type { DocumentStatus, KnowledgeItemStatus, ProgressStatus } from "@/types/domain";

/**
 * Agregaciones de solo lectura para los widgets de Mission Control.
 * Reutiliza los servicios ya existentes de Projects/StepState/Knowledge/
 * Documents en vez de crear una coleccion o indice nuevo. Sprint 13: el
 * progreso ya no se lee de un campo `progressStatus` guardado - se calcula
 * a partir de ProjectStepState (ver services/step-state.ts), consistente
 * con la regla del motor Blueprint "el progreso nunca se guarda".
 */

function emptyProgressCounts(): Record<ProgressStatus, number> {
  return { no_iniciado: 0, en_progreso: 0, aprobado: 0 };
}

export interface ProgressOverview {
  totalProjects: number;
  byStatus: Record<ProgressStatus, number>;
}

/** Fan-out acotado (Projects suelen ser pocos) - mismo patron ya usado en otras pestanas de Mission Control. */
export async function getProgressOverview(orgId: string): Promise<ProgressOverview> {
  const projects = await listProjects(orgId);
  const byStatus = emptyProgressCounts();
  for (const project of projects) {
    const stepStates = await listStepStates(orgId, project.id);
    const { status } = calculateProjectProgress(project, stepStates);
    byStatus[status]++;
  }
  return { totalProjects: projects.length, byStatus };
}

export interface BlueprintUsageEntry {
  blueprintName: string;
  projectCount: number;
}

export interface BlueprintHealth {
  totalProjects: number;
  byBlueprint: BlueprintUsageEntry[];
}

/** Que metodologias (Blueprints) esta usando realmente la organizacion, y cuantos Proyectos activos tiene cada una. */
export async function getBlueprintHealth(orgId: string): Promise<BlueprintHealth> {
  const projects = await listProjects(orgId);
  const counts = new Map<string, number>();
  for (const project of projects) {
    const name = project.blueprintSnapshot.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const byBlueprint = Array.from(counts.entries())
    .map(([blueprintName, projectCount]) => ({ blueprintName, projectCount }))
    .sort((a, b) => b.projectCount - a.projectCount);

  return { totalProjects: projects.length, byBlueprint };
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
