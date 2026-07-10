"use client";

import { createElement, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Gem,
  Lightbulb,
  Loader2,
  Lock,
  Map,
  Send,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatEstimatedTime, formatRelativeTime } from "@/lib/utils";
import { resolveStepIcon } from "@/lib/step-icon";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import {
  addComment,
  calculateProjectProgress,
  findNextStep,
  findStepById,
  isStepBlocked,
  listComments,
  listStepStates,
  setStepStatus,
  toggleChecklistItem,
  updateStepRegistroField,
} from "@/services/step-state";
import type {
  BlueprintStep,
  Comment,
  Project,
  ProjectStepState,
  StepRegistroField,
  StepStatus,
} from "@/types/domain";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function priorityLabel(priority: BlueprintStep["priority"]): string {
  return priority === "high" ? "Alta" : priority === "low" ? "Baja" : "Normal";
}

function difficultyLabel(difficulty: BlueprintStep["difficulty"]): string {
  return difficulty === "hard" ? "Difícil" : difficulty === "easy" ? "Fácil" : "Media";
}

const STEP_STATUS_META: Record<
  StepStatus,
  { label: string; variant: "outline" | "info" | "success" | "secondary" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  in_progress: { label: "En progreso", variant: "info" },
  completed: { label: "Completado", variant: "success" },
  blocked: { label: "Bloqueado", variant: "secondary" },
};

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

/** Vista del Step (mockup "08-vista-paso.png", pantalla A8): la pantalla mas usada de la plataforma - Guía / Registro / Checklist / Comentarios, siempre la misma estructura sin importar el Blueprint. */
export default function StepView() {
  const { projectId, phaseId, stepId } = useParams<{
    projectId: string;
    phaseId: string;
    stepId: string;
  }>();
  const router = useRouter();
  const { membership, user } = useAuth();
  const { setActiveProject, setSelection, setAssistantCollapsed } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [allStepStates, setAllStepStates] = useState<ProjectStepState[] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("guia");

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      getProject(orgId, projectId),
      listStepStates(orgId, projectId),
      listComments(orgId, projectId, stepId),
    ]).then(([p, states, c]) => {
      setProject(p);
      setAllStepStates(states);
      setComments(c);
      if (p) {
        setActiveProject(p.id, p.name);
        const step = p.blueprintSnapshot.roadmap
          .find((ph) => ph.id === phaseId)
          ?.steps.find((s) => s.id === stepId);
        if (step)
          setSelection({ projectId: p.id, projectName: p.name, stepId, stepTitle: step.title });
        const existing = states.find((s) => s.stepId === stepId);
        if (step && (!existing || existing.status === "pending")) {
          void setStepStatus(orgId, projectId, step, "in_progress");
        }
      }
    });
    // Sincronizacion deliberada: al navegar a otro Step (params de ruta cambiaron), la UI local vuelve a su estado inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJustCompleted(false);
    setActiveTab("guia");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId, phaseId, stepId]);

  if (!orgId || project === null || allStepStates === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const phase = project.blueprintSnapshot.roadmap.find((p) => p.id === phaseId);
  const step = phase?.steps.find((s) => s.id === stepId);
  if (!phase || !step) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState title="Paso no encontrado" />
      </div>
    );
  }

  const stepState = allStepStates.find((s) => s.stepId === stepId);
  const checklistDone = new Set(stepState?.checklistDone ?? []);
  const blocked = isStepBlocked(step, allStepStates);
  const isCompleted = stepState?.status === "completed" || justCompleted;

  if (blocked) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={Lock}
          title="Este paso está bloqueado"
          description="Primero completa los pasos de los que depende."
          actionLabel="Volver a la fase"
          onAction={() => router.push(`/projects/${projectId}/${phaseId}`)}
        />
      </div>
    );
  }

  const sortedPhaseSteps = [...phase.steps].sort((a, b) => a.order - b.order);
  const stepPosition = sortedPhaseSteps.findIndex((s) => s.id === stepId) + 1;

  const flatSteps = [...project.blueprintSnapshot.roadmap]
    .sort((a, b) => a.order - b.order)
    .flatMap((p) =>
      [...p.steps].sort((a, b) => a.order - b.order).map((s) => ({ phaseId: p.id, stepId: s.id })),
    );
  const flatIndex = flatSteps.findIndex((s) => s.stepId === stepId);
  const prevEntry = flatIndex > 0 ? flatSteps[flatIndex - 1] : null;
  const nextEntry =
    flatIndex >= 0 && flatIndex < flatSteps.length - 1 ? flatSteps[flatIndex + 1] : null;

  const dependencyTitles = step.dependencies.map(
    (depId) => findStepById(project.blueprintSnapshot, depId)?.title ?? depId,
  );

  /**
   * Actualiza (o crea) la entrada local de este Step dentro de
   * `allStepStates`. Necesario porque un Step recien tocado por primera
   * vez todavia no tiene un ProjectStepState en Firestore ni en el estado
   * local - sin este upsert, `.map()` no encuentra ninguna entrada que
   * coincida y el cambio (checklist, registro) nunca se refleja en
   * pantalla aunque la escritura en Firestore si haya funcionado.
   */
  function upsertLocalStepState(patch: (current: ProjectStepState) => Partial<ProjectStepState>) {
    setAllStepStates((prev) => {
      const list = prev ?? [];
      const idx = list.findIndex((s) => s.stepId === stepId);
      const base: ProjectStepState =
        idx === -1
          ? {
              stepId,
              status: "pending",
              checklistDone: [],
              timeInvestedMinutes: 0,
              completedAt: null,
              completedBy: null,
              updatedAt: new Date().toISOString(),
            }
          : list[idx];
      const updated = { ...base, ...patch(base) };
      if (idx === -1) return [...list, updated];
      const next = [...list];
      next[idx] = updated;
      return next;
    });
  }

  async function handleToggleChecklist(itemId: string, done: boolean) {
    try {
      await toggleChecklistItem(orgId!, projectId, stepId, itemId, done);
      upsertLocalStepState((current) => ({
        checklistDone: done
          ? [...current.checklistDone, itemId]
          : current.checklistDone.filter((id) => id !== itemId),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el checklist.");
    }
  }

  async function handleSaveRegistroField(fieldId: string, value: string) {
    try {
      await updateStepRegistroField(orgId!, projectId, stepId, fieldId, value);
      upsertLocalStepState((current) => ({
        registroData: { ...(current.registroData ?? {}), [fieldId]: value },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el registro.");
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await setStepStatus(orgId!, projectId, step!, "completed");
      setJustCompleted(true);
    } finally {
      setCompleting(false);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    await addComment(orgId!, projectId, stepId, commentText.trim());
    setComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorUid: user?.uid ?? "",
        authorName: user?.displayName || user?.email || "Usuario",
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentText("");
  }

  if (isCompleted && justCompleted) {
    const next = findNextStep(project.blueprintSnapshot, allStepStates);
    const projectProgress = calculateProjectProgress(project, allStepStates);
    const completedAt = stepState?.completedAt ? new Date(stepState.completedAt) : new Date();
    const firstName = (user?.displayName || user?.email || "").trim().split(/\s+/)[0] || "";
    const completedSortedPhaseSteps = [...phase.steps].sort((a, b) => a.order - b.order);
    const completedStepPosition = completedSortedPhaseSteps.findIndex((s) => s.id === stepId) + 1;
    const learnings = step.content.learnings ?? [];
    const learningIcons = [Target, Lightbulb, BarChart3];
    const learningColors = [
      "bg-success/10 text-success",
      "bg-chart-2/10 text-chart-2",
      "bg-warning/10 text-warning",
    ];
    const nextStepPosition = next
      ? [...next.phase.steps]
          .sort((a, b) => a.order - b.order)
          .findIndex((s) => s.id === next.step.id) + 1
      : 0;

    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-1.5">
          <Map className="text-primary h-5 w-5" />
          <Link
            href={`/projects/${projectId}`}
            className="text-body text-muted-foreground hover:text-foreground"
          >
            Roadmap
          </Link>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <Link
            href={`/projects/${projectId}/${phaseId}`}
            className="text-body text-muted-foreground hover:text-foreground"
          >
            {phase.title}
          </Link>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-body text-muted-foreground">{step.title}</span>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-body font-medium">Paso completado</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-4">
            <div className="bg-success/5 border-success/20 relative overflow-hidden rounded-lg border p-8 text-center">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <Star className="text-warning absolute -top-1 left-1 h-4 w-4" />
                <Star className="text-chart-2 absolute top-3 -right-3 h-3 w-3" />
                <Star className="text-primary absolute bottom-0 -left-4 h-3.5 w-3.5" />
                <div className="bg-success flex h-16 w-16 items-center justify-center rounded-full">
                  <Check className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-h2 mt-4">¡Paso completado!</h1>
              <p className="text-body text-muted-foreground mt-1">
                Has completado el paso {completedStepPosition} de {completedSortedPhaseSteps.length}{" "}
                en la fase {phase.title}.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="bg-success/10 text-success flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  {createElement(resolveStepIcon(step), { className: "h-6 w-6" })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-h4">{step.title}</p>
                  <p className="text-small text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="success">Completado</Badge>
                  <span className="text-small text-muted-foreground">
                    {completedAt.toLocaleDateString("es", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="text-small text-muted-foreground mt-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />{" "}
                {formatEstimatedTime((stepState?.timeInvestedMinutes ?? 0) / 60)} invertidos
              </div>
            </div>

            {learnings.length > 0 && (
              <div>
                <p className="text-h4 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="text-success h-4 w-4" /> ¿Qué aprendiste en este paso?
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {learnings.map((learning, i) => {
                    const LearningIcon = learningIcons[i % learningIcons.length];
                    return (
                      <div key={i} className="rounded-lg border p-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full",
                            learningColors[i % learningColors.length],
                          )}
                        >
                          <LearningIcon className="h-4 w-4" />
                        </div>
                        <p className="text-body mt-2 font-medium">{learning.title}</p>
                        <p className="text-small text-muted-foreground mt-0.5">
                          {learning.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step.content.inspirationalQuote && (
              <div className="bg-success/5 relative overflow-hidden rounded-lg border p-5">
                <p className="text-body max-w-md italic">
                  &quot;{step.content.inspirationalQuote}&quot;
                </p>
                <Image
                  src="/illustrations/empresa-comercial-01.png"
                  alt=""
                  width={140}
                  height={100}
                  className="pointer-events-none absolute right-2 bottom-0 hidden h-20 w-auto object-contain select-none sm:block"
                />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5">
                <Flag className="text-muted-foreground h-3.5 w-3.5" />
                <p className="text-h4">Siguiente paso</p>
              </div>
              {next ? (
                <>
                  <div className="mt-2.5 flex items-start gap-2.5">
                    <span className="bg-primary text-primary-foreground text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold">
                      {nextStepPosition}
                    </span>
                    <div className="min-w-0">
                      <p className="text-small text-muted-foreground">
                        de {next.phase.steps.length}
                      </p>
                      <p className="text-body font-medium">{next.step.title}</p>
                    </div>
                  </div>
                  <p className="text-small text-muted-foreground mt-2 line-clamp-2">
                    {next.step.description}
                  </p>
                  <div className="text-small text-muted-foreground mt-2 flex flex-col gap-1">
                    <span>Tiempo estimado: {formatEstimatedTime(next.step.estimatedHours)}</span>
                    <span>Importancia: {priorityLabel(next.step.priority)}</span>
                    <span>Dificultad: {difficultyLabel(next.step.difficulty)}</span>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={() =>
                      router.push(`/projects/${projectId}/${next.phase.id}/${next.step.id}`)
                    }
                  >
                    Continuar con el siguiente paso <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <p className="text-body text-success mt-2 font-medium">
                  ¡Completaste todos los pasos de este Blueprint!
                </p>
              )}
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => router.push(`/projects/${projectId}/${phaseId}`)}
              >
                Volver a la fase
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-h4">¿Qué puedes hacer ahora?</p>
              <div className="mt-2 flex flex-col">
                <Link
                  href={`/projects/${projectId}`}
                  className="hover:bg-muted flex items-center gap-2.5 rounded-md px-1.5 py-1.5"
                >
                  <Map className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-body">Revisar el roadmap</p>
                    <p className="text-small text-muted-foreground">Ver tu progreso general</p>
                  </div>
                </Link>
                <Link
                  href="/documents"
                  className="hover:bg-muted flex items-center gap-2.5 rounded-md px-1.5 py-1.5"
                >
                  <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-body">Ver mis documentos</p>
                    <p className="text-small text-muted-foreground">Accede a tus documentos</p>
                  </div>
                </Link>
                <button
                  onClick={() => setAssistantCollapsed(false)}
                  className="hover:bg-muted flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left"
                >
                  <Sparkles className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-body">Consultar con la IA</p>
                    <p className="text-small text-muted-foreground">
                      Hazle preguntas sobre el siguiente paso
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="text-body font-medium">
              ¡Vas muy bien{firstName ? `, ${firstName}` : ""}! 🚀
            </p>
            <p className="text-small text-muted-foreground">
              Cada paso te acerca más a construir la empresa que imaginas.
            </p>
          </div>
          <div className="text-right">
            <p className="text-small text-muted-foreground">Progreso del proyecto</p>
            <p className="text-h3 text-primary">{projectProgress.percent}%</p>
            <Progress value={projectProgress.percent} className="mt-1 w-40" />
            <p className="text-small text-muted-foreground mt-1">
              {projectProgress.completed} de {projectProgress.total} pasos completados
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = STEP_STATUS_META[stepState?.status ?? "pending"];
  const checklistTotal = step.content.checklist.length;
  const checklistPercent =
    checklistTotal === 0 ? null : Math.round((checklistDone.size / checklistTotal) * 100);
  const hasGuideContent =
    step.content.objective.description ||
    step.content.whyItMatters ||
    (step.content.bestPractices && step.content.bestPractices.length > 0) ||
    (step.content.commonMistakes && step.content.commonMistakes.length > 0) ||
    step.content.tip;

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center gap-1.5">
        <Map className="text-primary h-5 w-5" />
        <Link
          href={`/projects/${projectId}`}
          className="text-body text-muted-foreground hover:text-foreground"
        >
          Roadmap
        </Link>
        <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
        <Link
          href={`/projects/${projectId}/${phaseId}`}
          className="text-body text-muted-foreground hover:text-foreground"
        >
          {phase.title}
        </Link>
        <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-body font-medium">{step.title}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/${phaseId}`)}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a la fase
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevEntry}
            onClick={() =>
              prevEntry &&
              router.push(`/projects/${projectId}/${prevEntry.phaseId}/${prevEntry.stepId}`)
            }
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Paso anterior
          </Button>
          <Button
            size="sm"
            disabled={!nextEntry}
            onClick={() =>
              nextEntry &&
              router.push(`/projects/${projectId}/${nextEntry.phaseId}/${nextEntry.stepId}`)
            }
          >
            Siguiente paso <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
            {createElement(resolveStepIcon(step), { className: "h-7 w-7" })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-small text-muted-foreground">
              Paso {stepPosition} de {sortedPhaseSteps.length}
            </p>
            <h1 className="text-h3">{step.title}</h1>
            <p className="text-body text-muted-foreground mt-1">{step.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <span className="text-small text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Tiempo estimado
            </span>
            <p className="text-body mt-0.5 font-medium">
              {formatEstimatedTime(step.estimatedHours)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <span className="text-small text-muted-foreground">Importancia</span>
            <p className="text-body mt-0.5 font-medium">{priorityLabel(step.priority)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <span className="text-small text-muted-foreground">Dificultad</span>
            <p className="text-body mt-0.5 font-medium">{difficultyLabel(step.difficulty)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <span className="text-small text-muted-foreground">Dependencias</span>
            <p className="text-body mt-0.5 truncate font-medium">
              {dependencyTitles.length > 0 ? dependencyTitles.join(", ") : "Ninguna"}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="guia">Guía del paso</TabsTrigger>
          <TabsTrigger value="registro">Registro del paso</TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist{checklistTotal > 0 && ` (${checklistDone.size}/${checklistTotal})`}
          </TabsTrigger>
          <TabsTrigger value="comentarios">Comentarios ({comments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="guia" className="mt-3">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-3">
              {!hasGuideContent && (
                <EmptyState
                  title="Este Blueprint aún no incluye una guía detallada para este paso."
                  className="rounded-lg border"
                />
              )}
              {step.content.objective.description && (
                <GuideCard icon={Target} iconColor="text-primary" title="¿Qué debes lograr?">
                  {step.content.objective.description}
                </GuideCard>
              )}
              {step.content.whyItMatters && (
                <GuideCard icon={Gem} iconColor="text-chart-2" title="¿Por qué es importante?">
                  {step.content.whyItMatters}
                </GuideCard>
              )}
              {step.content.bestPractices && step.content.bestPractices.length > 0 && (
                <GuideCard icon={ThumbsUp} iconColor="text-success" title="Buenas prácticas">
                  <ul className="flex flex-col gap-1.5">
                    {step.content.bestPractices.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </GuideCard>
              )}
              {step.content.commonMistakes && step.content.commonMistakes.length > 0 && (
                <GuideCard
                  icon={AlertTriangle}
                  iconColor="text-destructive"
                  title="Errores comunes"
                >
                  <ul className="flex flex-col gap-1.5">
                    {step.content.commonMistakes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5 shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </GuideCard>
              )}
              {step.content.tip && (
                <div className="bg-warning/5 border-warning/20 rounded-lg border p-4">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="text-warning h-4 w-4" />
                    <p className="text-h4">Consejo Blueprint</p>
                  </div>
                  <p className="text-body text-muted-foreground mt-1.5">{step.content.tip}</p>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-h4">Recursos de apoyo</p>
                {step.content.resources.length === 0 ? (
                  <p className="text-small text-muted-foreground mt-2">
                    Sin recursos para este paso.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2.5">
                    {step.content.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={
                          resource.downloadUrl || resource.previewUrl || resource.embedUrl || "#"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="hover:bg-muted/50 flex items-center gap-2.5 rounded-md p-1.5"
                      >
                        <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-body truncate">{resource.title}</p>
                          <p className="text-small text-muted-foreground">
                            {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                            {resource.metadata.duration
                              ? ` · ${resource.metadata.duration} min`
                              : ""}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {step.content.recommendedTools && step.content.recommendedTools.length > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="text-h4">Herramientas recomendadas</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {step.content.recommendedTools.map((tool) => (
                      <a
                        key={tool.name}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:bg-muted/50 flex items-center gap-2 rounded-md p-1.5"
                      >
                        <Wrench className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="text-body flex-1">{tool.name}</span>
                        <ExternalLink className="text-muted-foreground h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border-primary/20 rounded-lg border p-4">
                <p className="text-body font-medium">¿Necesitas ideas?</p>
                <p className="text-small text-muted-foreground mt-1">
                  Usa el asistente para generar ideas para este paso.
                </p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setAssistantCollapsed(false)}
                >
                  Abrir asistente IA <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-3">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="rounded-lg border p-4">
              {!step.content.registroFields || step.content.registroFields.length === 0 ? (
                <EmptyState title="Este paso no tiene campos de registro definidos." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {step.content.registroFields.map((field) => (
                    <RegistroField
                      key={field.id}
                      field={field}
                      value={stepState?.registroData?.[field.id] ?? ""}
                      onSave={(value) => handleSaveRegistroField(field.id, value)}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <StepSummaryCard
                statusLabel={statusMeta.label}
                statusVariant={statusMeta.variant}
                checklistPercent={checklistPercent}
                estimatedHours={step.estimatedHours}
                timeInvestedMinutes={stepState?.timeInvestedMinutes ?? 0}
                responsibleName={user?.displayName || user?.email || "—"}
                updatedAt={stepState?.updatedAt}
              />
              {step.content.tip && (
                <div className="bg-warning/5 border-warning/20 rounded-lg border p-4">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="text-warning h-4 w-4" />
                    <p className="text-h4">Consejo Blueprint</p>
                  </div>
                  <p className="text-body text-muted-foreground mt-1.5">{step.content.tip}</p>
                </div>
              )}
              <div className="rounded-lg border p-4">
                <p className="text-h4">¿Necesitas ayuda?</p>
                <p className="text-small text-muted-foreground mt-1">
                  Consulta la guía del paso o usa los recursos recomendados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setActiveTab("guia")}
                >
                  Ir a Guía del paso <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-3">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="rounded-lg border">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <p className="text-h4">Lista de verificación</p>
                {checklistTotal > 0 && (
                  <Badge variant="success">
                    {checklistDone.size} de {checklistTotal} completados
                  </Badge>
                )}
              </div>
              {checklistTotal === 0 ? (
                <p className="text-small text-muted-foreground p-4">
                  Este paso no tiene checklist.
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {step.content.checklist.map((item, i) => {
                    const done = checklistDone.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className="hover:bg-muted/50 flex items-start gap-3 p-4 text-left"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={done}
                          onCheckedChange={(checked) =>
                            handleToggleChecklist(item.id, checked === true)
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn("text-body font-medium", done && "text-muted-foreground")}
                          >
                            {i + 1}. {item.task}
                          </p>
                          {item.description && (
                            <p className="text-small text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={done ? "success" : "outline"} className="shrink-0">
                          {done ? "Completado" : "Pendiente"}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              )}
              {step.completionRules.requiredChecklist && checklistTotal > 0 && (
                <div className="bg-info/5 text-small text-info m-4 rounded-md p-3">
                  Todos los items deben estar completados para poder marcar este paso como
                  completado.
                </div>
              )}
              <div className="flex justify-end border-t p-4">
                <Button
                  onClick={handleComplete}
                  disabled={
                    completing ||
                    isCompleted ||
                    (step.completionRules.requiredChecklist &&
                      checklistTotal > 0 &&
                      checklistDone.size < checklistTotal)
                  }
                >
                  {completing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isCompleted ? "Paso completado" : "Marcar paso como completado"}
                </Button>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <StepSummaryCard
                statusLabel={statusMeta.label}
                statusVariant={statusMeta.variant}
                checklistPercent={checklistPercent}
                estimatedHours={step.estimatedHours}
                timeInvestedMinutes={stepState?.timeInvestedMinutes ?? 0}
                responsibleName={user?.displayName || user?.email || "—"}
                updatedAt={stepState?.updatedAt}
              />
              <div className="rounded-lg border p-4">
                <p className="text-h4">¿Cómo funciona?</p>
                <div className="mt-2 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-small text-muted-foreground">
                      Revisa cada actividad del checklist y marca las que ya completaste.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-small text-muted-foreground">
                      Cuando todas estén completas, podrás finalizar este paso.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-small text-muted-foreground">
                      Si necesitas ayuda, revisa la guía del paso o deja un comentario.
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-h4">¿Dudas sobre este paso?</p>
                <p className="text-small text-muted-foreground mt-1">
                  Deja tu pregunta en la sección de comentarios y te ayudaremos.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setActiveTab("comentarios")}
                >
                  Ir a comentarios <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="comentarios" className="mt-3">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="rounded-lg border p-4">
              <p className="text-h4 mb-3">Comentarios del paso</p>
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 text-primary text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
                  {initials(user?.displayName || user?.email || "U")}
                </div>
                <div className="flex flex-1 items-end gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe tu comentario..."
                    className="min-h-10"
                  />
                  <Button size="icon-sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col divide-y">
                {comments.length === 0 && (
                  <p className="text-small text-muted-foreground py-3">Aún no hay comentarios.</p>
                )}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5 py-3">
                    <div className="bg-primary/10 text-primary text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
                      {initials(comment.authorName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-medium">{comment.authorName}</p>
                        <span className="text-small text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-body mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <StepSummaryCard
                statusLabel={statusMeta.label}
                statusVariant={statusMeta.variant}
                checklistPercent={checklistPercent}
                estimatedHours={step.estimatedHours}
                timeInvestedMinutes={stepState?.timeInvestedMinutes ?? 0}
                responsibleName={user?.displayName || user?.email || "—"}
                updatedAt={stepState?.updatedAt}
              />
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuideCard({
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  icon: typeof Target;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <p className="text-h4">{title}</p>
      </div>
      <div className="text-body text-muted-foreground mt-2">{children}</div>
    </div>
  );
}

function RegistroField({
  field,
  value,
  onSave,
}: {
  field: StepRegistroField;
  value: string;
  onSave: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  return (
    <div className={cn("flex flex-col gap-1.5", field.type === "textarea" && "md:col-span-2")}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      {field.type === "textarea" ? (
        <>
          <Textarea
            id={field.id}
            value={localValue}
            placeholder={field.placeholder}
            maxLength={1000}
            className="min-h-24"
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => onSave(localValue)}
          />
          <span className="text-caption text-muted-foreground self-end">
            {localValue.length}/1000
          </span>
        </>
      ) : field.type === "select" ? (
        <Select
          value={localValue}
          onValueChange={(v) => {
            setLocalValue(v);
            onSave(v);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.id}
          value={localValue}
          placeholder={field.placeholder}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onSave(localValue)}
        />
      )}
      {field.helpText && <p className="text-caption text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}

function StepSummaryCard({
  statusLabel,
  statusVariant,
  checklistPercent,
  estimatedHours,
  timeInvestedMinutes,
  responsibleName,
  updatedAt,
}: {
  statusLabel: string;
  statusVariant: "outline" | "info" | "success" | "secondary";
  checklistPercent: number | null;
  estimatedHours: number;
  timeInvestedMinutes: number;
  responsibleName: string;
  updatedAt?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-h4">Resumen del paso</p>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      {checklistPercent !== null && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-small text-muted-foreground">Progreso del paso</span>
            <span className="text-small font-medium">{checklistPercent}%</span>
          </div>
          <Progress value={checklistPercent} className="mt-1" />
        </div>
      )}
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-small text-muted-foreground">Tiempo estimado</span>
          <span className="text-small font-medium">{formatEstimatedTime(estimatedHours)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-muted-foreground">Tiempo invertido</span>
          <span className="text-small font-medium">
            {formatEstimatedTime(timeInvestedMinutes / 60)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-muted-foreground">Responsable</span>
          <span className="text-small font-medium">{responsibleName}</span>
        </div>
        {updatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-small text-muted-foreground">Última actualización</span>
            <span className="text-small font-medium">{formatRelativeTime(updatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
