import {
  archiveNode,
  createNode,
  getNode,
  listNodes,
  updateNode,
  workspacePath,
  workspacesPath,
  type ChapterRef,
  type WorkspaceRef,
} from "@/lib/firestore-hierarchy";
import type { Workspace } from "@/types/domain";

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  order?: number;
}

export async function createWorkspace(
  ref: ChapterRef,
  input: CreateWorkspaceInput,
): Promise<string> {
  return createNode(workspacesPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    blueprintId: ref.blueprintId,
    phaseId: ref.phaseId,
    moduleId: ref.moduleId,
    chapterId: ref.chapterId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listWorkspaces(ref: ChapterRef): Promise<Workspace[]> {
  return listNodes<Workspace>(workspacesPath(ref));
}

export async function getWorkspace(ref: WorkspaceRef): Promise<Workspace | null> {
  return getNode<Workspace>(workspacePath(ref));
}

export async function updateWorkspace(
  ref: WorkspaceRef,
  data: Partial<Pick<Workspace, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(workspacePath(ref), data);
}

export async function archiveWorkspace(ref: WorkspaceRef): Promise<void> {
  return archiveNode(workspacePath(ref));
}
