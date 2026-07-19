"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FolderKanban, Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { deleteProject, listProjects } from "@/services/projects";
import { calculateProjectProgress, listStepStates } from "@/services/step-state";
import type { Project } from "@/types/domain";
import type { ProjectProgress } from "@/services/step-state";

const TILE_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-chart-2/10 text-chart-2",
  "bg-warning/10 text-warning",
  "bg-chart-3/10 text-chart-3",
];

interface ProjectRow {
  project: Project;
  progress: ProjectProgress;
}

/**
 * Mis Proyectos (Sprint 14): un Proyecto es una instancia de un Blueprint
 * para esta organizacion. Punto de entrada principal al motor de datos
 * nuevo - reemplaza al viejo /workspace.
 */
export default function ProjectsPage() {
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;
  const [rows, setRows] = useState<ProjectRow[] | null>(null);

  function reload() {
    if (!orgId) return;
    listProjects(orgId).then(async (projects) => {
      const withProgress = await Promise.all(
        projects.map(async (project) => {
          const stepStates = await listStepStates(orgId, project.id);
          return { project, progress: calculateProjectProgress(project, stepStates) };
        }),
      );
      setRows(withProgress);
    });
  }

  useEffect(reload, [orgId]);

  async function handleDelete(project: Project) {
    if (!orgId) return;
    if (
      !window.confirm(`¿Eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)
    )
      return;
    await deleteProject(orgId, project.id);
    toast.success(`"${project.name}" eliminado.`);
    reload();
  }

  if (!orgId || rows === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h3">Mis proyectos</h1>
          <p className="text-body text-muted-foreground">
            Cada proyecto sigue el Roadmap de un Blueprint paso a paso.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" /> Crear proyecto
          </Link>
        </Button>
      </div>

      {rows.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="Aún no tienes proyectos"
          description="Elige un Blueprint y empieza a construir paso a paso."
          actionLabel="Crear proyecto"
          onAction={() => (window.location.href = "/projects/new")}
        />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ project, progress }, i) => {
          const Icon = resolveLucideIcon(project.blueprintSnapshot.icon);
          return (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card to-card/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md"
            >
              {/* Header with Icon and Action button */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 shadow-inner",
                    TILE_COLORS[i % TILE_COLORS.length],
                  )}
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>
                
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar "${project.name}"`}
                  onClick={() => handleDelete(project)}
                  className="text-muted-foreground opacity-60 hover:text-destructive hover:opacity-100 transition-all rounded-lg h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Blueprint & Project Names (No conflicts, stacked vertically) */}
              <div className="mb-4 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1">
                  {project.blueprintSnapshot.name}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-h4 font-semibold leading-snug text-foreground hover:text-primary transition-colors block line-clamp-2"
                >
                  {project.name}
                </Link>
              </div>

              {/* Progress Bar and Indicator */}
              <div className="mt-auto pt-3 border-t border-border/40">
                <Link href={`/projects/${project.id}`} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Progreso</span>
                    <span className="text-foreground font-semibold">{progress.percent}%</span>
                  </div>
                  <Progress value={progress.percent} className="h-2 rounded-full bg-muted/65" />
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {progress.completed} de {progress.total} pasos completados
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
