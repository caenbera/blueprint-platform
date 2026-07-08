"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import { calculatePhaseProgress, isStepBlocked, listStepStates } from "@/services/step-state";
import type { Project, ProjectStepState, StepStatus } from "@/types/domain";

const STATUS_ICON: Record<StepStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Circle,
  pending: Circle,
  blocked: Lock,
};

function stepStatus(stepId: string, stepStates: ProjectStepState[]): StepStatus {
  return stepStates.find((s) => s.stepId === stepId)?.status ?? "pending";
}

/** Vista de Fase (mockup "07-vista-fase.png"): lista de Steps con su estado, respeta dependencias. */
export default function PhaseView() {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const router = useRouter();
  const { membership } = useAuth();
  const { setActiveProject, setSelection } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [stepStates, setStepStates] = useState<ProjectStepState[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([getProject(orgId, projectId), listStepStates(orgId, projectId)]).then(
      ([p, states]) => {
        setProject(p);
        setStepStates(states);
        if (p) setActiveProject(p.id, p.name);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  if (!orgId || project === null || stepStates === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const phase = project.blueprintSnapshot.roadmap.find((p) => p.id === phaseId);
  if (!phase) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState title="Fase no encontrada" />
      </div>
    );
  }

  const progress = calculatePhaseProgress(phase, stepStates);
  const sortedSteps = [...phase.steps].sort((a, b) => a.order - b.order);

  function openStep(stepId: string, stepTitle: string) {
    setSelection({ projectId: project!.id, projectName: project!.name, stepId, stepTitle });
    router.push(`/projects/${projectId}/${phaseId}/${stepId}`);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <Link
        href={`/projects/${projectId}`}
        className="text-body text-muted-foreground hover:text-foreground mb-3 flex w-fit items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Roadmap
      </Link>

      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-h3">{phase.title}</h1>
          <Badge variant="outline">{progress.percent}%</Badge>
        </div>
        <p className="text-body text-muted-foreground mt-1">{phase.description}</p>
        <Progress value={progress.percent} className="mt-3" />
        <span className="text-small text-muted-foreground">
          {progress.completed} de {progress.total} pasos completados
        </span>
      </div>

      <div className="mt-4 rounded-lg border">
        <div className="border-b px-4 py-3">
          <p className="text-h4">Pasos ({sortedSteps.length})</p>
        </div>
        <div className="flex flex-col divide-y">
          {sortedSteps.map((step, i) => {
            const status = stepStatus(step.id, stepStates);
            const blocked = status !== "completed" && isStepBlocked(step, stepStates);
            const Icon = blocked ? Lock : STATUS_ICON[status];
            return (
              <button
                key={step.id}
                onClick={() => !blocked && openStep(step.id, step.title)}
                disabled={blocked}
                className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="bg-muted text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-medium">
                  {i + 1}
                </span>
                <Icon
                  className={
                    status === "completed"
                      ? "text-success h-4 w-4 shrink-0"
                      : "text-muted-foreground h-4 w-4 shrink-0"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{step.title}</p>
                  <p className="text-small text-muted-foreground truncate">{step.description}</p>
                </div>
                <span className="text-small text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {step.estimatedHours}h
                </span>
                <Badge
                  variant={
                    blocked
                      ? "secondary"
                      : status === "completed"
                        ? "success"
                        : status === "in_progress"
                          ? "info"
                          : "outline"
                  }
                >
                  {blocked
                    ? "Bloqueado"
                    : status === "completed"
                      ? "Completado"
                      : status === "in_progress"
                        ? "En progreso"
                        : "Pendiente"}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
