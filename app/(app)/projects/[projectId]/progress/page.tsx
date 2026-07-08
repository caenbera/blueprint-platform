"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Loader2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import {
  calculatePhaseProgress,
  calculateProjectProgress,
  listStepStates,
} from "@/services/step-state";
import { listRecentActivity } from "@/services/activity";
import type { ActivityLogEntry, Project, ProjectStepState } from "@/types/domain";

const STATUS_LABEL = {
  no_iniciado: "Pendiente",
  en_progreso: "En progreso",
  aprobado: "Completado",
} as const;
const STATUS_VARIANT = {
  no_iniciado: "secondary",
  en_progreso: "info",
  aprobado: "success",
} as const;

/** Mi Progreso (mockup "10-progreso.png", simplificado): progreso calculado desde ProjectStepState, sin metricas que no tenemos datos reales para respaldar (tiempo invertido diario, rachas). */
export default function ProjectProgressPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { membership } = useAuth();
  const { setActiveProject } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [stepStates, setStepStates] = useState<ProjectStepState[] | null>(null);
  const [activity, setActivity] = useState<ActivityLogEntry[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      getProject(orgId, projectId),
      listStepStates(orgId, projectId),
      listRecentActivity(orgId, 50),
    ]).then(([p, states, entries]) => {
      setProject(p);
      setStepStates(states);
      setActivity(entries.filter((e) => e.projectRef?.projectId === projectId).slice(0, 8));
      if (p) setActiveProject(p.id, p.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  if (!orgId || project === null || stepStates === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const progress = calculateProjectProgress(project, stepStates);
  const sortedPhases = [...project.blueprintSnapshot.roadmap].sort((a, b) => a.order - b.order);
  const estimatedHours = sortedPhases.reduce(
    (sum, phase) => sum + phase.steps.reduce((s, step) => s + step.estimatedHours, 0),
    0,
  );

  return (
    <div className="flex flex-1 gap-4 overflow-y-auto p-4">
      <div className="flex flex-1 flex-col gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-body text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Roadmap
        </Link>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="text-primary h-5 w-5" />
            <h1 className="text-h3">Mi progreso en {project.name}</h1>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-h1 text-primary">{progress.percent}%</span>
            <div className="flex-1">
              <Progress value={progress.percent} />
              <span className="text-small text-muted-foreground">
                {progress.completed} de {progress.total} pasos completados
              </span>
            </div>
          </div>
          <span className="text-small text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> ~{estimatedHours}h estimadas para todo el Blueprint
          </span>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <p className="text-h4">Fases del proyecto</p>
          </div>
          <div className="flex flex-col divide-y">
            {sortedPhases.map((phase, i) => {
              const phaseProgress = calculatePhaseProgress(phase, stepStates);
              return (
                <div key={phase.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="bg-muted text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{phase.title}</p>
                    <Progress value={phaseProgress.percent} className="mt-1.5" />
                    <span className="text-small text-muted-foreground">
                      {phaseProgress.completed} de {phaseProgress.total} pasos
                    </span>
                  </div>
                  <Badge variant={STATUS_VARIANT[phaseProgress.status]}>
                    {STATUS_LABEL[phaseProgress.status]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="w-72 shrink-0 rounded-lg border p-4">
        <p className="text-h4">Actividad reciente</p>
        {activity === null && (
          <Loader2 className="text-muted-foreground mt-2 h-4 w-4 animate-spin" />
        )}
        {activity?.length === 0 && (
          <p className="text-small text-muted-foreground mt-2">
            Aún no hay actividad en este proyecto.
          </p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {activity?.map((entry) => (
            <p key={entry.id} className="text-small text-muted-foreground">
              {entry.summary}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
}
