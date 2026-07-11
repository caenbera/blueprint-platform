"use client";

import { createElement, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Hammer,
  Loader2,
  Map,
  RefreshCw,
  Repeat,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatEstimatedTime } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { PHASE_STATUS_META, resolvePhaseIcon } from "@/lib/phase-icon";
import { resolveStepIcon, STEP_STATUS_META } from "@/lib/step-icon";
import { periodLabel } from "@/lib/period";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject, syncProjectBlueprint } from "@/services/projects";
import { getBlueprint } from "@/services/blueprints";
import { listMembers } from "@/services/organizations";
import {
  buildRoadmapTree,
  calculatePhaseStatus,
  calculateProjectProgress,
  calculateStepRowStatus,
  countBlueprintResources,
  findNextStep,
  isCountableStep,
  isStepDoneNow,
  listStepStates,
} from "@/services/step-state";
import type {
  RoadmapTreeBlockNode,
  RoadmapTreeKind,
  RoadmapTreePhaseNode,
  RoadmapTreeTypeNode,
} from "@/services/step-state";
import type {
  Blueprint,
  BlueprintStep,
  Membership,
  Project,
  ProjectStepState,
} from "@/types/domain";

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
  const [latestBlueprint, setLatestBlueprint] = useState<Blueprint | null>(null);
  const [syncing, setSyncing] = useState(false);
  // Arbol de 4 niveles (Tipo -> Bloque -> Fase -> Pasos): todo cerrado por
  // defecto - una clave ausente en este mapa significa "cerrado".
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

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
        // Compara contra la version viva del Blueprint para saber si el
        // snapshot congelado de este Proyecto quedo desactualizado.
        getBlueprint(p.blueprintId).then(setLatestBlueprint);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  const isStale = Boolean(
    project && latestBlueprint && latestBlueprint.updatedAt !== project.blueprintSnapshot.updatedAt,
  );

  async function handleSync() {
    if (!orgId) return;
    setSyncing(true);
    try {
      await syncProjectBlueprint(orgId, projectId);
      const [p, states] = await Promise.all([
        getProject(orgId, projectId),
        listStepStates(orgId, projectId),
      ]);
      setProject(p);
      setStepStates(states);
      toast.success("Proyecto sincronizado con la última versión del Blueprint.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

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

  const countableNextPhaseSteps = next
    ? next.phase.steps.filter(isCountableStep).sort((a, b) => a.order - b.order)
    : [];
  const nextStepPosition = next
    ? countableNextPhaseSteps.findIndex((s) => s.id === next.step.id) + 1
    : 0;

  const tree = buildRoadmapTree(project, stepStates);

  function toggleKey(key: string) {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function StepRow({
    step,
    phaseId,
    status,
    caption,
  }: {
    step: BlueprintStep;
    phaseId: string;
    status: "completado" | "en_progreso" | "pendiente" | "bloqueado";
    caption?: string;
  }) {
    const StepIcon = resolveStepIcon(step);
    const rowMeta = STEP_STATUS_META[status];
    return (
      <Link
        href={`/projects/${projectId}/${phaseId}/${step.id}`}
        className={cn(
          "flex items-center gap-3 py-2.5 pr-4 pl-16",
          status === "en_progreso" ? "bg-info/5" : "hover:bg-muted/50",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            status === "completado" && "bg-success text-white",
            status === "en_progreso" && "bg-info text-white",
            (status === "pendiente" || status === "bloqueado") && "bg-muted text-muted-foreground",
          )}
        >
          {status === "completado" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <StepIcon className="h-3.5 w-3.5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium">{step.title}</p>
          {caption && <p className="text-caption text-muted-foreground">{caption}</p>}
        </div>
        <Badge variant={rowMeta.variant} className="shrink-0">
          {rowMeta.label}
        </Badge>
        <ChevronRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
      </Link>
    );
  }

  function renderPhaseNode(node: RoadmapTreePhaseNode, kind: RoadmapTreeKind, key: string) {
    const open = openKeys[key] ?? false;
    const PhaseIcon = resolvePhaseIcon(node.phase.title);
    const statusMeta =
      kind === "construction"
        ? PHASE_STATUS_META[calculatePhaseStatus(node.phase, stepStates!, nextPhaseId)]
        : null;
    const activeStepId =
      kind === "construction" && next && next.phase.id === node.phase.id ? next.step.id : null;

    return (
      <div key={key} className="border-t">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => toggleKey(key)}
            className={cn(
              "hover:bg-muted/30 flex flex-1 items-center gap-3 py-2.5 pr-2 pl-10 text-left",
              node.hasNextStep && "ring-primary/30 ring-2 ring-inset",
            )}
          >
            <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <PhaseIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">{node.phase.title}</p>
              <span className="text-caption text-muted-foreground">
                {node.progress.percent}% · {node.progress.completed} de {node.progress.total} pasos
              </span>
            </div>
            {node.hasNextStep && (
              <Badge variant="info" className="shrink-0">
                Aquí
              </Badge>
            )}
            {statusMeta && (
              <Badge variant={statusMeta.variant} className="shrink-0">
                {statusMeta.label}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform",
                !open && "-rotate-90",
              )}
            />
          </button>
          <Link
            href={`/projects/${projectId}/${node.phase.id}`}
            className="text-caption text-muted-foreground hover:text-foreground shrink-0 pr-4"
          >
            Ver fase
          </Link>
        </div>
        {open && (
          <div className="divide-y">
            {node.steps.map((step) => {
              const status =
                kind === "construction"
                  ? calculateStepRowStatus(step, stepStates!, activeStepId)
                  : isStepDoneNow(
                        step,
                        stepStates!.find((s) => s.stepId === step.id),
                      )
                    ? "completado"
                    : "pendiente";
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  phaseId={node.phase.id}
                  status={status}
                  caption={kind === "operations" ? periodLabel(step.type) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderBlockNode(block: RoadmapTreeBlockNode, kind: RoadmapTreeKind, keyPrefix: string) {
    const key = `${keyPrefix}:${block.meta.value}`;
    const open = openKeys[key] ?? false;
    const BlockIcon = block.meta.icon;
    return (
      <div key={key} className="border-t">
        <button
          type="button"
          onClick={() => toggleKey(key)}
          className={cn(
            "hover:bg-muted/30 flex w-full items-center gap-2.5 py-2.5 pr-4 pl-7 text-left",
            block.hasNextStep && "ring-primary/20 ring-2 ring-inset",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              block.meta.tileColor,
            )}
          >
            <BlockIcon className="h-4 w-4" />
          </div>
          <span className="text-small flex-1 text-left font-semibold tracking-wide uppercase">
            {block.meta.label}
          </span>
          <span className="text-small text-muted-foreground shrink-0">
            {block.progress.percent}% · {block.progress.completed} de {block.progress.total}
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform",
              !open && "-rotate-90",
            )}
          />
        </button>
        {open && (
          <div className="divide-y">
            {block.phases.map((p) => renderPhaseNode(p, kind, `${key}:${p.phase.id}`))}
          </div>
        )}
      </div>
    );
  }

  function renderTypeNode(typeNode: RoadmapTreeTypeNode) {
    const key = typeNode.kind;
    const open = openKeys[key] ?? false;
    const isConstruction = typeNode.kind === "construction";
    return (
      <div key={key}>
        <button
          type="button"
          onClick={() => toggleKey(key)}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3 text-left",
            isConstruction
              ? "bg-primary/5 hover:bg-primary/10"
              : "bg-warning/5 hover:bg-warning/10",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              isConstruction ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning",
            )}
          >
            {isConstruction ? (
              <Hammer className="h-4.5 w-4.5" />
            ) : (
              <Repeat className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-h4", isConstruction ? "text-primary" : "text-warning")}>
              {isConstruction ? "Construcción" : "Operación"}
            </p>
            <span className="text-caption text-muted-foreground">
              {isConstruction ? "Pasos que se hacen una sola vez" : "Tareas que se repiten"}
            </span>
          </div>
          {typeNode.hasNextStep && (
            <Badge variant={isConstruction ? "info" : "warning"} className="shrink-0">
              {isConstruction ? "Siguiente paso aquí" : "Pendiente este período"}
            </Badge>
          )}
          <span className="text-small text-muted-foreground shrink-0">
            {typeNode.progress.percent}% · {typeNode.progress.completed} de{" "}
            {typeNode.progress.total}
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
              !open && "-rotate-90",
            )}
          />
        </button>
        {open && (
          <div className="divide-y">
            {typeNode.blocks.map((b) => renderBlockNode(b, typeNode.kind, key))}
            {typeNode.ungroupedPhases.map((p) =>
              renderPhaseNode(p, typeNode.kind, `${key}:${p.phase.id}`),
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex items-center gap-2">
        <Map className="text-primary h-5 w-5" />
        <span className="text-h4">Roadmap</span>
      </div>

      {isStale && (
        <div className="border-warning bg-warning/10 ring-warning/30 flex items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 ring-4">
          <div className="flex items-center gap-2.5">
            <BellRing className="text-warning h-5 w-5 shrink-0 animate-pulse" />
            <p className="text-body text-warning font-medium">
              Hay una versión más reciente del Blueprint &ldquo;{project.blueprintSnapshot.name}
              &rdquo; disponible.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-warning hover:bg-warning/90 shrink-0 text-white"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sincronizar con Blueprint
          </Button>
        </div>
      )}

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
              <p className="text-h4">Estructura del proyecto</p>
              <span className="text-small text-muted-foreground">{sortedPhases.length} fases</span>
            </div>
            <div className="flex flex-col divide-y">
              {renderTypeNode(tree.construction)}
              {tree.operations.progress.total > 0 && renderTypeNode(tree.operations)}
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
