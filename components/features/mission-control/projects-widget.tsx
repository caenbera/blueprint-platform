"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/domain";

/**
 * Sprint 13: navegar a un Proyecto (abrir su Roadmap) todavia no tiene
 * pantalla propia - se reconstruye en el Sprint 14. Por ahora el widget
 * solo lista los Proyectos de forma informativa (sin click-to-navigate).
 * `navigable` se mantiene como prop para no romper su uso de solo lectura
 * en el resumen de organizaciones ajenas del Panel de Super Admin.
 */
export function ProjectsWidget({
  orgId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se acepta por compatibilidad de la prop, la navegacion real vuelve en el Sprint 14.
  navigable = true,
  ...controls
}: { orgId: string; navigable?: boolean } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("projects");
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects(orgId).then(setProjects);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {projects === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {projects?.length === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Proyectos creados.</p>
      )}
      <div className="flex flex-col gap-2">
        {projects?.slice(0, 6).map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1"
          >
            <span className="text-small truncate">{project.name}</span>
            <Badge variant="outline">{project.blueprintSnapshot.name}</Badge>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
