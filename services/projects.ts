import {
  archiveNode,
  createNode,
  getNode,
  listNodes,
  projectPath,
  projectsPath,
  updateNode,
  type ProjectRef,
} from "@/lib/firestore-hierarchy";
import type { Project } from "@/types/domain";

export interface CreateProjectInput {
  name: string;
  description?: string;
  order?: number;
}

export async function createProject(orgId: string, input: CreateProjectInput): Promise<string> {
  return createNode(projectsPath(orgId), {
    orgId,
    name: input.name,
    description: input.description ?? "",
    order: input.order ?? 0,
    progressStatus: "no_iniciado",
  });
}

export async function listProjects(orgId: string): Promise<Project[]> {
  return listNodes<Project>(projectsPath(orgId));
}

export async function getProject(ref: ProjectRef): Promise<Project | null> {
  return getNode<Project>(projectPath(ref));
}

export async function updateProject(
  ref: ProjectRef,
  data: Partial<Pick<Project, "name" | "description" | "order" | "progressStatus">>,
): Promise<void> {
  return updateNode(projectPath(ref), data);
}

export async function archiveProject(ref: ProjectRef): Promise<void> {
  return archiveNode(projectPath(ref));
}
