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
import { useNavigator } from "@/hooks/use-navigator";
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/domain";

export function ProjectsWidget({ orgId, ...controls }: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("projects");
  const { setActiveProject } = useNavigator();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects(orgId).then(setProjects);
  }, [orgId]);

  function handleOpen(project: Project) {
    setActiveProject(project.id, project.name);
    router.push("/workspace");
  }

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
            onClick={() => handleOpen(project)}
            className="hover:bg-muted flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left"
          >
            <span className="text-small truncate">{project.name}</span>
            <Badge variant="outline">{project.progressStatus}</Badge>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
