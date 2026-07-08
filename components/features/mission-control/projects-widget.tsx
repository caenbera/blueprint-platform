"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
 * Sprint 14: abre el Roadmap real del Proyecto (/projects/{id}).
 * `navigable=false` se usa para el resumen de solo lectura de una
 * organizacion ajena en el Panel de Super Admin - ahi nunca debe navegar.
 */
export function ProjectsWidget({
  orgId,
  navigable = true,
  ...controls
}: { orgId: string; navigable?: boolean } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("projects");
  const router = useRouter();
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
          <button
            key={project.id}
            onClick={() => navigable && router.push(`/projects/${project.id}`)}
            disabled={!navigable}
            className="hover:bg-muted flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left disabled:cursor-default disabled:hover:bg-transparent"
          >
            <span className="text-small truncate">{project.name}</span>
            <Badge variant="outline">{project.blueprintSnapshot.name}</Badge>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
