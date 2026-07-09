"use client";

import { createElement, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  ListChecks,
  ListTodo,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Target,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { useAuth } from "@/hooks/use-auth";
import { getBlueprint } from "@/services/blueprints";
import { createProjectFromBlueprint } from "@/services/projects";
import type { Blueprint, BlueprintDifficulty, StepResourceType } from "@/types/domain";

function countSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
}

function phaseHours(blueprint: Blueprint, phaseId: string): number {
  const phase = blueprint.roadmap.find((p) => p.id === phaseId);
  return phase?.steps.reduce((sum, step) => sum + step.estimatedHours, 0) ?? 0;
}

interface Deliverable {
  title: string;
  badge: string;
}

const RESOURCE_TYPE_LABELS: Partial<Record<StepResourceType, string>> = {
  pdf: "PDF",
  word: "Documento",
  excel: "Plantilla Excel",
  powerpoint: "Presentación",
  template: "Plantilla",
  manual: "Manual",
  form: "Formulario",
  google_docs: "Documento",
  google_sheets: "Plantilla Excel",
};

function resourceLabel(type: StepResourceType): string {
  return RESOURCE_TYPE_LABELS[type] ?? "Recurso";
}

function listDeliverables(blueprint: Blueprint): Deliverable[] {
  return [...blueprint.roadmap]
    .sort((a, b) => a.order - b.order)
    .flatMap((phase) =>
      [...phase.steps]
        .sort((a, b) => a.order - b.order)
        .flatMap((step) =>
          step.content.resources.map((r) => ({ title: r.title, badge: resourceLabel(r.type) })),
        ),
    );
}

const DIFFICULTY_META: Record<BlueprintDifficulty, { label: string; dots: number }> = {
  beginner: { label: "Principiante", dots: 1 },
  intermediate: { label: "Intermedio", dots: 2 },
  advanced: { label: "Avanzado", dots: 3 },
};

const PHASE_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-success text-white",
  "bg-chart-2 text-white",
  "bg-warning text-white",
  "bg-chart-3 text-white",
  "bg-chart-5 text-white",
];

const STEP_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: FileText, title: "Explicación detallada", description: "Guías claras paso a paso" },
  { icon: ListTodo, title: "Checklist inteligente", description: "Tareas y recursos necesarios" },
  {
    icon: FileText,
    title: "Plantillas y documentos",
    description: "Listos para usar y personalizar",
  },
  { icon: Bot, title: "Recomendaciones con IA", description: "Consejos adaptados a tu proyecto" },
  { icon: Video, title: "Videos y ejemplos", description: "Aprende con casos reales" },
  { icon: MessageSquare, title: "Notas y comentarios", description: "Colabora con tu equipo" },
];

/** Resumen del Blueprint (mockup "05-resumen-blueprint.png"): confirma el Blueprint elegido y crea el Proyecto con un snapshot congelado al presionar "Comenzar". */
export default function BlueprintSummaryPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const router = useRouter();
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBlueprint(blueprintId).then(setBlueprint);
  }, [blueprintId]);

  async function handleStart() {
    if (!orgId || !blueprint) return;
    setStarting(true);
    setError(null);
    try {
      const projectId = await createProjectFromBlueprint(orgId, blueprintId, blueprint.name);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto.");
      setStarting(false);
    }
  }

  if (blueprint === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const difficulty = DIFFICULTY_META[blueprint.difficulty];
  const sortedPhases = [...blueprint.roadmap].sort((a, b) => a.order - b.order);
  const deliverables = listDeliverables(blueprint);
  const visibleDeliverables = deliverables.slice(0, 6);
  const updatedLabel = new Date(blueprint.updatedAt).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex items-center gap-3">
        <button
          onClick={() => router.push("/projects/new/blueprint")}
          className="hover:bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <nav className="text-body flex items-center gap-1.5">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            Inicio
          </button>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <button
            onClick={() => router.push("/projects/new/blueprint")}
            className="text-muted-foreground hover:text-foreground"
          >
            Elegir blueprint
          </button>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-primary font-medium">Resumen del blueprint</span>
        </nav>
      </div>

      <div className="relative overflow-hidden rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-xl">
            {createElement(resolveLucideIcon(blueprint.icon), { className: "h-8 w-8" })}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="border-chart-2/30 bg-chart-2/10 text-chart-2 mb-2">
              Blueprint seleccionado
            </Badge>
            <h1 className="text-h2">{blueprint.name}</h1>
            <p className="text-body text-muted-foreground mt-1 max-w-2xl">
              {blueprint.description}
            </p>
            <div className="text-small text-muted-foreground mt-3 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Nivel: {difficulty.label}
              </span>
              <span className="flex items-center gap-1.5">
                Dificultad:
                <span className="flex gap-0.5">
                  {[1, 2, 3].map((dot) => (
                    <span
                      key={dot}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        dot <= difficulty.dots ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Actualizado: {updatedLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <Flag className="text-primary h-5 w-5" />
          <p className="text-h3 mt-1.5">{sortedPhases.length}</p>
          <p className="text-body font-medium">Fases</p>
          <p className="text-small text-muted-foreground">De la idea al crecimiento</p>
        </div>
        <div className="rounded-lg border p-4">
          <ListChecks className="text-primary h-5 w-5" />
          <p className="text-h3 mt-1.5">{countSteps(blueprint)}</p>
          <p className="text-body font-medium">Pasos</p>
          <p className="text-small text-muted-foreground">Acciones detalladas</p>
        </div>
        <div className="rounded-lg border p-4">
          <FileText className="text-primary h-5 w-5" />
          <p className="text-h3 mt-1.5">{deliverables.length}</p>
          <p className="text-body font-medium">Documentos</p>
          <p className="text-small text-muted-foreground">Plantillas incluidas</p>
        </div>
        <div className="rounded-lg border p-4">
          <Clock className="text-primary h-5 w-5" />
          <p className="text-h3 mt-1.5">{blueprint.estimatedDuration || "—"}</p>
          <p className="text-body font-medium">Semanas estimadas</p>
          <p className="text-small text-muted-foreground">Tiempo total del proyecto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="rounded-lg border">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Flag className="text-muted-foreground h-4 w-4" />
            <span className="text-h4">Fases del blueprint</span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {sortedPhases.map((phase, i) => {
              const hours = phaseHours(blueprint, phase.id);
              return (
                <div key={phase.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "text-small flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-medium",
                      PHASE_COLORS[i % PHASE_COLORS.length],
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body font-medium">{phase.title}</p>
                      {hours > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          {hours}h
                        </Badge>
                      )}
                    </div>
                    <p className="text-small text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileText className="text-muted-foreground h-4 w-4" />
            <span className="text-h4">Documentos y entregables incluidos</span>
          </div>
          <div className="flex flex-col gap-1 p-4">
            {visibleDeliverables.length === 0 && (
              <p className="text-small text-muted-foreground">
                Este Blueprint aún no tiene recursos adjuntos.
              </p>
            )}
            {visibleDeliverables.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1.5">
                <span className="text-body truncate">{d.title}</span>
                <Badge variant="secondary" className="shrink-0">
                  {d.badge}
                </Badge>
              </div>
            ))}
            {deliverables.length > visibleDeliverables.length && (
              <p className="text-small text-primary mt-1">
                Y {deliverables.length - visibleDeliverables.length} documentos más...
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
            <span className="text-h4">Incluye en cada paso</span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {STEP_FEATURES.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-2.5">
                  <FeatureIcon className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-body font-medium">{feature.title}</p>
                    <p className="text-small text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-success h-5 w-5" />
          <div>
            <p className="text-body font-medium">Todo listo para comenzar</p>
            <p className="text-small text-muted-foreground">
              Estás a un clic de iniciar tu camino. Puedes pausar y retomar cuando quieras.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {error && <p className="text-small text-destructive">{error}</p>}
          <Button onClick={handleStart} disabled={!orgId || starting}>
            {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Comenzar blueprint <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
