"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FolderKanban, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { deleteProject, listProjects } from "@/services/projects";
import { calculateProjectProgress, listStepStates } from "@/services/step-state";
import type { Project } from "@/types/domain";
import type { ProjectProgress } from "@/services/step-state";

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ project, progress }) => (
          <div
            key={project.id}
            className="hover:border-primary/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="text-h4 line-clamp-2 min-w-0 flex-1 hover:underline"
              >
                {project.name}
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="outline">{project.blueprintSnapshot.name}</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar "${project.name}"`}
                  onClick={() => handleDelete(project)}
                >
                  <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Link href={`/projects/${project.id}`} className="flex flex-col gap-1.5">
              <Progress value={progress.percent} />
              <span className="text-small text-muted-foreground">
                {progress.percent}% · {progress.completed} de {progress.total} pasos
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
