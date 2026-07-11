"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Calendar, ChevronRight, Loader2, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getCurrentPeriodKey } from "@/lib/period";
import { resolveBlockMeta } from "@/lib/phase-block";
import { getProject } from "@/services/projects";
import { isStepDoneNow, listStepStates, togglePeriodCompletion } from "@/services/step-state";
import type {
  BlueprintPhase,
  BlueprintStep,
  Project,
  ProjectStepState,
  StepType,
} from "@/types/domain";

const FREQUENCY_ORDER: { type: StepType; label: string }[] = [
  { type: "daily", label: "Hoy" },
  { type: "weekly", label: "Esta semana" },
  { type: "monthly", label: "Este mes" },
  { type: "quarterly", label: "Este trimestre" },
  { type: "semester", label: "Este semestre" },
  { type: "yearly", label: "Este año" },
];

interface OperationRow {
  step: BlueprintStep;
  phase: BlueprintPhase;
}

/**
 * Operación del Proyecto: los Steps recurrentes (weekly/monthly/...) que
 * ya viven dentro del blueprintSnapshot, agrupados por frecuencia -
 * responde "¿qué me toca ahora?". Reutiliza el mismo motor de Steps y el
 * mismo seguimiento por periodo (lib/period.ts, services/step-state.ts)
 * que Vista del Step - no es un Blueprint aparte, es una vista sobre los
 * mismos datos.
 */
export default function ProjectOperationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { membership, user } = useAuth();
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

  async function handleToggle(step: BlueprintStep, periodKey: string, done: boolean) {
    if (!orgId) return;
    try {
      await togglePeriodCompletion(orgId, projectId, step.id, periodKey, done);
      setStepStates((prev) => {
        const list = prev ?? [];
        const idx = list.findIndex((s) => s.stepId === step.id);
        const base: ProjectStepState =
          idx === -1
            ? {
                stepId: step.id,
                status: "pending",
                checklistDone: [],
                timeInvestedMinutes: 0,
                completedAt: null,
                completedBy: null,
                updatedAt: new Date().toISOString(),
              }
            : list[idx];
        const periodCompletions = { ...(base.periodCompletions ?? {}) };
        if (done) {
          periodCompletions[periodKey] = {
            completedAt: new Date().toISOString(),
            completedBy: user?.uid ?? "",
          };
        } else {
          delete periodCompletions[periodKey];
        }
        const updated = { ...base, periodCompletions };
        if (idx === -1) return [...list, updated];
        const next = [...list];
        next[idx] = updated;
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

  const rows: OperationRow[] = project.blueprintSnapshot.roadmap.flatMap((phase) =>
    phase.steps.filter((step) => step.type !== "one_time").map((step) => ({ step, phase })),
  );

  const groups = FREQUENCY_ORDER.map((freq) => ({
    ...freq,
    rows: rows.filter((r) => r.step.type === freq.type),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex items-center gap-2">
        <Repeat className="text-primary h-5 w-5" />
        <span className="text-h4">Operación</span>
      </div>
      <p className="text-body text-muted-foreground -mt-2">
        Las tareas recurrentes de &ldquo;{project.blueprintSnapshot.name}&rdquo;, agrupadas por qué
        tan seguido se repiten.
      </p>

      {groups.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Este Blueprint no tiene tareas de operación todavía"
          description="Los Steps con tipo semanal, mensual, trimestral, etc. aparecerán aquí automáticamente cuando el Blueprint los defina."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const periodKey = getCurrentPeriodKey(group.type)!;
            const doneCount = group.rows.filter(({ step }) => {
              const state = stepStates.find((s) => s.stepId === step.id);
              return isStepDoneNow(step, state);
            }).length;
            return (
              <div key={group.type} className="rounded-lg border">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <p className="text-h4">{group.label}</p>
                  </div>
                  <span className="text-small text-muted-foreground">
                    {doneCount} de {group.rows.length}
                  </span>
                </div>
                <div className="flex flex-col divide-y">
                  {group.rows.map(({ step, phase }) => {
                    const state = stepStates.find((s) => s.stepId === step.id);
                    const done = isStepDoneNow(step, state);
                    const blockMeta = phase.block ? resolveBlockMeta(phase.block) : null;
                    return (
                      <div key={step.id} className="flex items-center gap-3 px-4 py-3">
                        <Checkbox
                          checked={done}
                          onCheckedChange={(checked) =>
                            handleToggle(step, periodKey, checked === true)
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cnDone(done)}>{step.title}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            {blockMeta && (
                              <Badge variant="outline" className="text-caption">
                                {blockMeta.label}
                              </Badge>
                            )}
                            <span className="text-caption text-muted-foreground truncate">
                              {phase.title}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/projects/${projectId}/${phase.id}/${step.id}`}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          aria-label={`Abrir "${step.title}"`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cnDone(done: boolean): string {
  return done ? "text-body text-muted-foreground line-through" : "text-body font-medium";
}
