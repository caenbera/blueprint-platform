import {
  archiveNode,
  blueprintPath,
  blueprintsPath,
  chapterPath,
  chaptersPath,
  createNode,
  getNode,
  listNodes,
  modulePath,
  modulesPath,
  phasePath,
  phasesPath,
  updateNode,
  type BlueprintRef,
  type ChapterRef,
  type ModuleRef,
  type PhaseRef,
  type ProjectRef,
} from "@/lib/firestore-hierarchy";
import type { Blueprint, Chapter, Module, Phase } from "@/types/domain";

export interface CreateNodeInput {
  name: string;
  description?: string;
  order?: number;
}

// --- Blueprint ---

export async function createBlueprint(ref: ProjectRef, input: CreateNodeInput): Promise<string> {
  return createNode(blueprintsPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listBlueprints(ref: ProjectRef): Promise<Blueprint[]> {
  return listNodes<Blueprint>(blueprintsPath(ref));
}

export async function getBlueprint(ref: BlueprintRef): Promise<Blueprint | null> {
  return getNode<Blueprint>(blueprintPath(ref));
}

export async function updateBlueprint(
  ref: BlueprintRef,
  data: Partial<Pick<Blueprint, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(blueprintPath(ref), data);
}

export async function archiveBlueprint(ref: BlueprintRef): Promise<void> {
  return archiveNode(blueprintPath(ref));
}

// --- Phase (Fase) ---

export async function createPhase(ref: BlueprintRef, input: CreateNodeInput): Promise<string> {
  return createNode(phasesPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    blueprintId: ref.blueprintId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listPhases(ref: BlueprintRef): Promise<Phase[]> {
  return listNodes<Phase>(phasesPath(ref));
}

export async function getPhase(ref: PhaseRef): Promise<Phase | null> {
  return getNode<Phase>(phasePath(ref));
}

export async function updatePhase(
  ref: PhaseRef,
  data: Partial<Pick<Phase, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(phasePath(ref), data);
}

export async function archivePhase(ref: PhaseRef): Promise<void> {
  return archiveNode(phasePath(ref));
}

// --- Module (Modulo) ---

export async function createModule(ref: PhaseRef, input: CreateNodeInput): Promise<string> {
  return createNode(modulesPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    blueprintId: ref.blueprintId,
    phaseId: ref.phaseId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listModules(ref: PhaseRef): Promise<Module[]> {
  return listNodes<Module>(modulesPath(ref));
}

export async function getModule(ref: ModuleRef): Promise<Module | null> {
  return getNode<Module>(modulePath(ref));
}

export async function updateModule(
  ref: ModuleRef,
  data: Partial<Pick<Module, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(modulePath(ref), data);
}

export async function archiveModule(ref: ModuleRef): Promise<void> {
  return archiveNode(modulePath(ref));
}

// --- Chapter (Capitulo) ---

export async function createChapter(ref: ModuleRef, input: CreateNodeInput): Promise<string> {
  return createNode(chaptersPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    blueprintId: ref.blueprintId,
    phaseId: ref.phaseId,
    moduleId: ref.moduleId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listChapters(ref: ModuleRef): Promise<Chapter[]> {
  return listNodes<Chapter>(chaptersPath(ref));
}

export async function getChapter(ref: ChapterRef): Promise<Chapter | null> {
  return getNode<Chapter>(chapterPath(ref));
}

export async function updateChapter(
  ref: ChapterRef,
  data: Partial<Pick<Chapter, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(chapterPath(ref), data);
}

export async function archiveChapter(ref: ChapterRef): Promise<void> {
  return archiveNode(chapterPath(ref));
}
