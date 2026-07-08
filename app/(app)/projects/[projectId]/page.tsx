"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Flag, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import {
  calculatePhaseProgress,
  calculateProjectProgress,
  findNextStep,
  listStepStates,
} from "@/services/step-state";
import type { Project, ProjectStepState } from "@/types/domain";

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

/** Roadmap del Proyecto (mockup "06-roadmap.png"): fases en orden, progreso calculado, siguiente paso sugerido. */
export default function ProjectRoadmapPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { membership } = useAuth();
  const { setActiveProject } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [stepStates, setStepStates] = useState<ProjectStepState[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([getProject(orgId, projectId), listStepStates(orgId, projectId)]).then(
      ([p, states]) => {
        setProject(p);
        setStepStates(states);
        if (p) {
          setActiveProject(p.id, p.name);
          // Tarjeta "Continuar proyecto" del Inicio (mockup "02-inicio.png"):
          // recuerda el ultimo Proyecto abierto por este usuario en este navegador.
          window.localStorage.setItem(`blueprint:lastProjectId:${orgId}`, p.id);
        }
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

  const progress = calculateProjectProgress(project, stepStates);
  const next = findNextStep(project.blueprintSnapshot, stepStates);
  const sortedPhases = [...project.blueprintSnapshot.roadmap].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-1 gap-4 overflow-y-auto p-4">
      <div className="flex flex-1 flex-col gap-4">
        <div className="rounded-lg border p-5">
          <h1 className="text-h3">{project.name}</h1>
          <p className="text-body text-muted-foreground">{project.blueprintSnapshot.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-h2 text-primary">{progress.percent}%</span>
            <div className="flex-1">
              <Progress value={progress.percent} />
              <span className="text-small text-muted-foreground">
                {progress.completed} de {progress.total} pasos completados
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <p className="text-h4">Fases del proyecto</p>
          </div>
          <div className="flex flex-col divide-y">
            {sortedPhases.map((phase, i) => {
              const phaseProgress = calculatePhaseProgress(phase, stepStates);
              return (
                <Link
                  key={phase.id}
                  href={`/projects/${project.id}/${phase.id}`}
                  className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
                >
                  <span className="bg-muted text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{phase.title}</p>
                    <p className="text-small text-muted-foreground truncate">{phase.description}</p>
                    <Progress value={phaseProgress.percent} className="mt-1.5" />
                  </div>
                  <Badge variant={STATUS_VARIANT[phaseProgress.status]}>
                    {STATUS_LABEL[phaseProgress.status]}
                  </Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="flex w-72 shrink-0 flex-col gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-1.5">
            <Flag className="text-muted-foreground h-3.5 w-3.5" />
            <p className="text-h4">Siguiente paso</p>
          </div>
          {next ? (
            <>
              <p className="text-body mt-2 font-medium">{next.step.title}</p>
              <p className="text-small text-muted-foreground mt-1 line-clamp-2">
                {next.step.description}
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() =>
                  router.push(`/projects/${project.id}/${next.phase.id}/${next.step.id}`)
                }
              >
                Continuar paso <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <p className="text-small text-muted-foreground mt-2">
              ¡Completaste todos los pasos de este Blueprint!
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-h4">Resumen rápido</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-small text-muted-foreground">Progreso total</span>
              <span className="text-small font-medium">{progress.percent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-muted-foreground">Pasos completados</span>
              <span className="text-small font-medium">
                {progress.completed} de {progress.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-muted-foreground">Fases</span>
              <span className="text-small font-medium">{sortedPhases.length}</span>
            </div>
          </div>
          <Link
            href={`/projects/${project.id}/progress`}
            className="text-body text-primary mt-3 block hover:underline"
          >
            Ver mi progreso →
          </Link>
        </div>
      </aside>
    </div>
  );
}
