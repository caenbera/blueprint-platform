"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { listAllWorkspacesInBlueprint, type FlatWorkspaceEntry } from "@/services/blueprint-tree";

/**
 * Recorrido exclusivo para Super Admin (fuera de las especificaciones
 * originales, pedido directamente por el usuario): flechas para saltar
 * entre todos los Workspaces del Blueprint activo sin usar el arbol del
 * Navigator ni llenar ningun formulario. Se extendera a otras secciones
 * de la plataforma (Knowledge Base, Documentos, etc.) conforme se
 * construyan en sprints futuros.
 */
export function WorkspaceWalkthroughBar() {
  const { isSuperAdmin, membership } = useAuth();
  const { activeProjectId, activeBlueprintId, selection, setSelection } = useNavigator();
  const [entries, setEntries] = useState<FlatWorkspaceEntry[]>([]);
  const router = useRouter();

  const orgId = membership?.orgId ?? null;

  useEffect(() => {
    if (!isSuperAdmin || !orgId || !activeProjectId || !activeBlueprintId) {
      // Reset deliberado: sin Blueprint activo no hay Workspaces que recorrer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries([]);
      return;
    }
    listAllWorkspacesInBlueprint({
      orgId,
      projectId: activeProjectId,
      blueprintId: activeBlueprintId,
    }).then(setEntries);
  }, [isSuperAdmin, orgId, activeProjectId, activeBlueprintId]);

  if (!isSuperAdmin || entries.length === 0) return null;

  const currentIndex = entries.findIndex((e) => e.workspace.id === selection?.workspaceId);

  function goTo(index: number) {
    const entry = entries[index];
    if (!entry) return;
    const { workspace } = entry;
    setSelection({
      projectId: workspace.projectId,
      blueprintId: workspace.blueprintId,
      phaseId: workspace.phaseId,
      phaseName: entry.phaseName,
      moduleId: workspace.moduleId,
      moduleName: entry.moduleName,
      chapterId: workspace.chapterId,
      chapterName: entry.chapterName,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    });
    // El recorrido siempre debe mostrar el contenido del Workspace, sin
    // importar en que pantalla estaba el Super Admin (Mission Control, etc.).
    router.push("/workspace");
  }

  return (
    <div className="bg-background/95 fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-2 py-1.5 shadow-md backdrop-blur">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentIndex <= 0}
        onClick={() => goTo(currentIndex - 1)}
        aria-label="Workspace anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-caption text-muted-foreground flex items-center gap-1.5 px-1">
        <Compass className="h-3.5 w-3.5" />
        {currentIndex >= 0
          ? `${currentIndex + 1} / ${entries.length}`
          : `${entries.length} Workspaces`}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentIndex >= entries.length - 1}
        onClick={() => goTo(currentIndex === -1 ? 0 : currentIndex + 1)}
        aria-label="Siguiente Workspace"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
