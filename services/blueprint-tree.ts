import { listChapters, listModules, listPhases } from "@/services/blueprints";
import { listWorkspaces } from "@/services/workspaces";
import type { BlueprintRef } from "@/lib/firestore-hierarchy";
import type { Workspace } from "@/types/domain";

export interface FlatWorkspaceEntry {
  workspace: Workspace;
  phaseName: string;
  moduleName: string;
  chapterName: string;
}

/**
 * Recorre TODO el arbol de un Blueprint (Fase -> Modulo -> Capitulo ->
 * Workspace) y devuelve la lista plana de Workspaces con los nombres de
 * sus ancestros (para poder alimentar el breadcrumb al saltar
 * directamente a uno). A diferencia del Navigator (carga progresiva por
 * nivel expandido), esto carga todo de una vez - uso deliberadamente
 * acotado a la barra de recorrido del Super Admin
 * (components/features/super-admin), no al arbol principal.
 */
export async function listAllWorkspacesInBlueprint(
  ref: BlueprintRef,
): Promise<FlatWorkspaceEntry[]> {
  const phases = await listPhases(ref);
  const entries: FlatWorkspaceEntry[] = [];

  for (const phase of phases) {
    const phaseRef = { ...ref, phaseId: phase.id };
    const modules = await listModules(phaseRef);

    for (const mod of modules) {
      const moduleRef = { ...phaseRef, moduleId: mod.id };
      const chapters = await listChapters(moduleRef);

      for (const chapter of chapters) {
        const chapterRef = { ...moduleRef, chapterId: chapter.id };
        const chapterWorkspaces = await listWorkspaces(chapterRef);
        for (const workspace of chapterWorkspaces) {
          entries.push({
            workspace,
            phaseName: phase.name,
            moduleName: mod.name,
            chapterName: chapter.name,
          });
        }
      }
    }
  }

  return entries;
}
