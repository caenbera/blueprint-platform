"use client";

import { createElement, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatEstimatedTime } from "@/lib/utils";
import { PHASE_STATUS_META, resolvePhaseIcon } from "@/lib/phase-icon";
import { resolveStepIcon, STEP_STATUS_META } from "@/lib/step-icon";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import {
  calculatePhaseProgress,
  calculatePhaseStatus,
  calculateStepRowStatus,
  findNextStep,
  listStepStates,
} from "@/services/step-state";
import type { Project, ProjectStepState } from "@/types/domain";

const RESOURCE_TYPE_LABELS: Partial<Record<string, string>> = {
  pdf: "PDF",
  word: "Documento",
  excel: "Plantilla Excel",
  powerpoint: "Presentación",
  template: "Plantilla",
  manual: "Manual",
  video: "Video",
  youtube: "Video",
};

/** Vista de la Fase (mockup "07-vista-fase.png", pantalla A7): indice de navegacion de una Fase - revela sus Steps sin mostrar todavia su contenido. */
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
        <div className="text-muted-foreground text-body">Cargando…</div>
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
  const next = findNextStep(project.blueprintSnapshot, stepStates);
  const nextPhaseId = next?.phase.id ?? null;
  const status = calculatePhaseStatus(phase, stepStates, nextPhaseId);
  const statusMeta = PHASE_STATUS_META[status];
  const activeStepId = next && next.phase.id === phase.id ? next.step.id : null;
  const sortedSteps = [...phase.steps].sort((a, b) => a.order - b.order);

  const totalMinutesInvested = stepStates
    .filter((s) => sortedSteps.some((step) => step.id === s.stepId))
    .reduce((sum, s) => sum + s.timeInvestedMinutes, 0);
  const totalEstimatedHours = sortedSteps.reduce((sum, s) => sum + s.estimatedHours, 0);
  const completedCount = sortedSteps.filter(
    (s) => stepStates.find((st) => st.stepId === s.id)?.status === "completed",
  ).length;
  const inProgressCount = activeStepId ? 1 : 0;
  const pendingCount = sortedSteps.length - completedCount - inProgressCount;

  const nextStepPosition = next
    ? [...next.phase.steps]
        .sort((a, b) => a.order - b.order)
        .findIndex((s) => s.id === next.step.id) + 1
    : 0;

  function openStep(stepId: string, stepTitle: string) {
    setSelection({ projectId: project!.id, projectName: project!.name, stepId, stepTitle });
    router.push(`/projects/${projectId}/${phaseId}/${stepId}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex items-center gap-1.5">
        <Map className="text-primary h-5 w-5" />
        <Link
          href={`/projects/${projectId}`}
          className="text-body text-muted-foreground hover:text-foreground"
        >
          Roadmap
        </Link>
        <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-body font-medium">{phase.title}</span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          phase.objective ? "lg:grid-cols-[1fr_20rem]" : "lg:grid-cols-1",
        )}
      >
        <div className="relative overflow-hidden rounded-lg border p-5">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
              {createElement(resolvePhaseIcon(phase.title), { className: "h-7 w-7" })}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h3">{phase.title}</h1>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>
              <p className="text-body text-muted-foreground mt-1">{phase.description}</p>
              <p className="text-small text-muted-foreground mt-4">Progreso de la fase</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress.percent} />
                </div>
                <span className="text-h4 shrink-0">{progress.percent}%</span>
              </div>
              <span className="text-small text-muted-foreground">
                {progress.completed} de {progress.total} pasos completados
              </span>
            </div>
          </div>
          <Image
            src="/illustrations/marketing-ventas.png"
            alt=""
            width={220}
            height={150}
            className="pointer-events-none absolute right-2 bottom-0 hidden h-28 w-auto object-contain select-none md:block"
          />
        </div>

        {phase.objective && (
          <div className="bg-success/5 border-success/20 rounded-lg border p-4">
            <div className="flex items-center gap-1.5">
              <Target className="text-success h-4 w-4" />
              <p className="text-h4">Objetivo de la fase</p>
            </div>
            <p className="text-body text-muted-foreground mt-2">{phase.objective}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Tabs defaultValue="pasos">
          <TabsList variant="line">
            <TabsTrigger value="pasos">Pasos de la fase</TabsTrigger>
            <TabsTrigger value="info">Información de la fase</TabsTrigger>
          </TabsList>

          <TabsContent value="pasos" className="mt-3">
            <div className="rounded-lg border">
              <div className="border-b px-4 py-3">
                <p className="text-h4">Pasos ({sortedSteps.length})</p>
              </div>
              <div className="flex flex-col divide-y">
                {sortedSteps.map((step, i) => {
                  const rowStatus = calculateStepRowStatus(step, stepStates, activeStepId);
                  const rowMeta = STEP_STATUS_META[rowStatus];
                  const StepIcon = resolveStepIcon(step);
                  const blocked = rowStatus === "bloqueado";
                  return (
                    <button
                      key={step.id}
                      onClick={() => !blocked && openStep(step.id, step.title)}
                      disabled={blocked}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                        rowStatus === "en_progreso" ? "bg-info/5" : "hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold",
                          rowStatus === "completado" && "bg-success text-white",
                          rowStatus === "en_progreso" && "bg-info text-white",
                          (rowStatus === "pendiente" || rowStatus === "bloqueado") &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {rowStatus === "completado" ? <Check className="h-4 w-4" /> : i + 1}
                      </span>
                      <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <StepIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{step.title}</p>
                        <p className="text-small text-muted-foreground truncate">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <Badge variant={rowMeta.variant}>{rowMeta.label}</Badge>
                        <span className="text-small text-muted-foreground">
                          {formatEstimatedTime(step.estimatedHours)}
                        </span>
                      </div>
                      {!blocked && (
                        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-3">
            <div className="rounded-lg border p-4">
              <p className="text-h4 mb-2">Descripción</p>
              <p className="text-body text-muted-foreground">{phase.description}</p>
              {phase.objective && (
                <>
                  <p className="text-h4 mt-4 mb-2">Objetivo</p>
                  <p className="text-body text-muted-foreground">{phase.objective}</p>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-h4">Resumen de la fase</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Pasos totales</span>
                <span className="text-small font-medium">{sortedSteps.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Completados</span>
                <span className="text-small font-medium">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">En progreso</span>
                <span className="text-small font-medium">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Pendientes</span>
                <span className="text-small font-medium">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Tiempo estimado</span>
                <span className="text-small font-medium">
                  {formatEstimatedTime(totalEstimatedHours)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Tiempo invertido</span>
                <span className="text-small font-medium">
                  {formatEstimatedTime(totalMinutesInvested / 60)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground">Avance de la fase</span>
                <span className="text-small font-medium">{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="mt-1" />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-muted-foreground h-3.5 w-3.5" />
              <p className="text-h4">Recursos de la fase</p>
            </div>
            {!phase.resources || phase.resources.length === 0 ? (
              <p className="text-small text-muted-foreground mt-2">
                Aún no hay recursos generales para esta fase.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {phase.resources.slice(0, 5).map((resource) => (
                  <div key={resource.id} className="flex items-center gap-2.5">
                    <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-body truncate">{resource.title}</p>
                      <p className="text-small text-muted-foreground">
                        {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                      </p>
                    </div>
                  </div>
                ))}
                {phase.resources.length > 5 && (
                  <p className="text-small text-muted-foreground">
                    +{phase.resources.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>
          <ArrowLeft className="h-4 w-4" /> Volver al roadmap
        </Button>
        {next ? (
          <Button
            onClick={() => router.push(`/projects/${project.id}/${next.phase.id}/${next.step.id}`)}
          >
            Continuar con el paso {nextStepPosition} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Badge variant="success">¡Blueprint completado!</Badge>
        )}
      </div>
    </div>
  );
}
