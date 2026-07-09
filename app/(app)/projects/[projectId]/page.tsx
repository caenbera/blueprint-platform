"use client";

import { createElement, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  Loader2,
  Map,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatEstimatedTime } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import {
  PHASE_TILE_COLORS,
  PHASE_BADGE_COLORS,
  PHASE_STATUS_META,
  resolvePhaseIcon,
} from "@/lib/phase-icon";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import { listMembers } from "@/services/organizations";
import {
  calculatePhaseProgress,
  calculatePhaseStatus,
  calculateProjectProgress,
  countBlueprintResources,
  findNextStep,
  listStepStates,
} from "@/services/step-state";
import type { Membership, Project, ProjectStepState } from "@/types/domain";

/**
 * Roadmap del Proyecto (mockup "06-roadmap.png", pantalla A6): el Centro de
 * Ejecucion - responde "donde estoy / que segui / que sigue". Aqui solo
 * aparecen las Fases (nunca los Steps) para no abrumar al usuario; los
 * Steps aparecen recien en la Vista de la Fase.
 */
export default function ProjectRoadmapPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { membership } = useAuth();
  const { setActiveProject, setAssistantCollapsed } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [stepStates, setStepStates] = useState<ProjectStepState[] | null>(null);
  const [members, setMembers] = useState<Membership[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      getProject(orgId, projectId),
      listStepStates(orgId, projectId),
      listMembers(orgId),
    ]).then(([p, states, m]) => {
      setProject(p);
      setStepStates(states);
      setMembers(m);
      if (p) {
        setActiveProject(p.id, p.name);
        // Tarjeta "Continuar proyecto" del Inicio (mockup "02-inicio.png"):
        // recuerda el ultimo Proyecto abierto por este usuario en este navegador.
        window.localStorage.setItem(`blueprint:lastProjectId:${orgId}`, p.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  if (!orgId || project === null || stepStates === null || members === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const progress = calculateProjectProgress(project, stepStates);
  const next = findNextStep(project.blueprintSnapshot, stepStates);
  const sortedPhases = [...project.blueprintSnapshot.roadmap].sort((a, b) => a.order - b.order);
  const nextPhaseId = next?.phase.id ?? null;
  const totalResources = countBlueprintResources(project.blueprintSnapshot);

  const nextStepPosition = next
    ? [...next.phase.steps]
        .sort((a, b) => a.order - b.order)
        .findIndex((s) => s.id === next.step.id) + 1
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex items-center gap-2">
        <Map className="text-primary h-5 w-5" />
        <span className="text-h4">Roadmap</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-lg border p-5">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                {createElement(resolveLucideIcon(project.blueprintSnapshot.icon), {
                  className: "h-7 w-7",
                })}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-h3">{project.name}</h1>
                <p className="text-body text-muted-foreground mt-1">
                  {project.blueprintSnapshot.description}
                </p>
                <p className="text-small text-muted-foreground mt-4">Progreso total</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-h2 text-primary">{progress.percent}%</span>
                  <div className="flex-1">
                    <Progress value={progress.percent} />
                    <span className="text-small text-muted-foreground">
                      {progress.completed} de {progress.total} Steps completados
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Image
              src="/illustrations/empresa-comercial-01.png"
              alt=""
              width={260}
              height={170}
              className="pointer-events-none absolute right-2 bottom-0 hidden h-36 w-auto object-contain select-none lg:block"
            />
          </div>

          <div className="rounded-lg border">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <p className="text-h4">Fases del proyecto</p>
              <span className="text-small text-muted-foreground">{sortedPhases.length} fases</span>
            </div>
            <div className="flex flex-col divide-y">
              {sortedPhases.map((phase, i) => {
                const phaseProgress = calculatePhaseProgress(phase, stepStates);
                const status = calculatePhaseStatus(phase, stepStates, nextPhaseId);
                const statusMeta = PHASE_STATUS_META[status];
                const Icon = resolvePhaseIcon(phase.title);
                return (
                  <Link
                    key={phase.id}
                    href={`/projects/${project.id}/${phase.id}`}
                    className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={cn(
                        "text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold",
                        PHASE_BADGE_COLORS[i % PHASE_BADGE_COLORS.length],
                      )}
                    >
                      {i + 1}
                    </span>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        PHASE_TILE_COLORS[i % PHASE_TILE_COLORS.length],
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium">{phase.title}</p>
                      <p className="text-small text-muted-foreground truncate">
                        {phase.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={phaseProgress.percent} className="max-w-40 flex-1" />
                        <span className="text-small text-muted-foreground shrink-0">
                          {phaseProgress.percent}% · {phaseProgress.completed} de{" "}
                          {phaseProgress.total} Steps
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusMeta.variant} className="shrink-0">
                      {statusMeta.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-1.5">
              <Flag className="text-muted-foreground h-3.5 w-3.5" />
              <p className="text-h4">Siguiente paso</p>
            </div>
            {next ? (
              <>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="text-success h-4 w-4" />
                  <span className="text-small text-muted-foreground">
                    Paso {nextStepPosition} de {next.phase.steps.length}
                  </span>
                </div>
                <p className="text-body mt-1 font-medium">{next.step.title}</p>
                <p className="text-small text-muted-foreground mt-1 line-clamp-2">
                  {next.step.description}
                </p>
                <div className="text-small text-muted-foreground mt-2 flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Tiempo estimado:{" "}
                    {formatEstimatedTime(next.step.estimatedHours)}
                  </span>
                  {next.step.content.resources.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Documento guía disponible
                    </span>
                  )}
                </div>
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
            <div className="flex items-center gap-1.5">
              <Clock className="text-muted-foreground h-3.5 w-3.5" />
              <p className="text-h4">Resumen rápido</p>
            </div>
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
                <span className="text-small text-muted-foreground">Tiempo estimado total</span>
                <span className="text-small font-medium">
                  {project.blueprintSnapshot.estimatedDuration || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Documentos</span>
                <span className="text-small font-medium">{totalResources}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Miembros del equipo</span>
                <span className="text-small font-medium">{members.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-muted-foreground h-3.5 w-3.5" />
              <p className="text-h4">Acciones rápidas</p>
            </div>
            <div className="mt-2 flex flex-col">
              <Link
                href={`/projects/${project.id}/progress`}
                className="hover:bg-muted text-body flex items-center justify-between rounded-md px-1.5 py-1.5"
              >
                Ver mi progreso <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
              </Link>
              <Link
                href="/documents"
                className="hover:bg-muted text-body flex items-center justify-between rounded-md px-1.5 py-1.5"
              >
                Ir a mis documentos <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setAssistantCollapsed(false)}
                className="hover:bg-muted text-body flex items-center justify-between rounded-md px-1.5 py-1.5 text-left"
              >
                Abrir asistente IA <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
