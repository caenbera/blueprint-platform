"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FolderKanban,
  FolderPlus,
  History,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatRelativeTime } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { listRecentActivity } from "@/services/activity";
import { archiveProject, deleteProject, listProjects, renameProject } from "@/services/projects";
import {
  calculateProjectProgress,
  findNextStep,
  listStepStates,
  type ProjectProgress,
} from "@/services/step-state";
import type { ActivityAction, ActivityLogEntry, Project, ProjectStepState } from "@/types/domain";

interface ProjectRow {
  project: Project;
  progress: ProjectProgress;
  stepStates: ProjectStepState[];
}

const TILE_COLORS = [
  "bg-info/10 text-info",
  "bg-success/10 text-success",
  "bg-primary/10 text-primary",
  "bg-warning/10 text-warning",
];

const ACTIVITY_META: Record<ActivityAction, { icon: LucideIcon; color: string }> = {
  project_created: { icon: FolderPlus, color: "bg-info/10 text-info" },
  step_completed: { icon: CheckCircle2, color: "bg-success/10 text-success" },
  knowledge_promoted: { icon: BookOpen, color: "bg-primary/10 text-primary" },
  document_created: { icon: FileText, color: "bg-success/10 text-success" },
  document_exported: { icon: Download, color: "bg-warning/10 text-warning" },
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** La "Fase actual" mostrada en las tarjetas: la fase del siguiente Step pendiente, o la ultima fase si ya se completo todo. */
function currentPhaseLabel(row: ProjectRow): string {
  const next = findNextStep(row.project.blueprintSnapshot, row.stepStates);
  if (next) return next.phase.title;
  const phases = [...row.project.blueprintSnapshot.roadmap].sort((a, b) => a.order - b.order);
  return phases[phases.length - 1]?.title ?? "";
}

/**
 * Inicio (mockup "02-inicio.png"): punto de entrada principal, no un
 * Dashboard de KPIs (reemplaza al antiguo Mission Control Grid). Responde
 * 4 preguntas: que estaba haciendo, que proyectos tengo, que ha pasado
 * recientemente, quiero empezar algo nuevo.
 */
export default function DashboardPage() {
  const { membership, user } = useAuth();
  const orgId = membership?.orgId ?? null;
  const router = useRouter();

  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [activity, setActivity] = useState<ActivityLogEntry[] | null>(null);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  function reload() {
    if (!orgId) return;
    listProjects(orgId).then(async (projects) => {
      const withProgress = await Promise.all(
        projects.map(async (project) => {
          const stepStates = await listStepStates(orgId, project.id);
          return { project, progress: calculateProjectProgress(project, stepStates), stepStates };
        }),
      );
      setRows(withProgress);
    });
    listRecentActivity(orgId, 6).then(setActivity);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    // Sincronizacion deliberada con localStorage (sistema externo) al montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastProjectId(window.localStorage.getItem(`blueprint:lastProjectId:${orgId}`));
  }, [orgId]);

  if (!orgId || rows === null || activity === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const continueRow = rows.find((r) => r.project.id === lastProjectId) ?? rows[0] ?? null;

  async function handleRename() {
    if (!renameTarget || !orgId || !renameValue.trim()) return;
    setRenaming(true);
    try {
      await renameProject(orgId, renameTarget.id, renameValue.trim());
      toast.success("Proyecto renombrado.");
      setRenameTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo renombrar el proyecto.");
    } finally {
      setRenaming(false);
    }
  }

  async function handleArchive(project: Project) {
    if (!orgId) return;
    await archiveProject(orgId, project.id);
    toast.success(`"${project.name}" archivado.`);
    reload();
  }

  async function handleDelete(project: Project) {
    if (!orgId) return;
    if (!window.confirm(`¿Eliminar "${project.name}"?`)) return;
    await deleteProject(orgId, project.id);
    toast.success(`"${project.name}" eliminado.`);
    reload();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div>
        <h1 className="text-h2">
          ¡Bienvenido, {firstName(user?.displayName || user?.email || "")}! 👋
        </h1>
        <p className="text-body text-muted-foreground mt-1">
          Aquí tienes todo lo que necesitas para avanzar en tus proyectos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Continuar proyecto */}
        <div className="rounded-lg border p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="bg-info/10 flex h-8 w-8 items-center justify-center rounded-full">
              <Play className="text-info h-4 w-4" />
            </div>
            <span className="text-h4">Continuar proyecto</span>
          </div>

          {continueRow ? (
            <>
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = resolveLucideIcon(continueRow.project.blueprintSnapshot.icon);
                  return (
                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-h4 truncate">{continueRow.project.name}</p>
                  <p className="text-small text-muted-foreground">
                    Fase actual:{" "}
                    <span className="text-primary font-medium">
                      {currentPhaseLabel(continueRow)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={continueRow.progress.percent} className="flex-1" />
                <span className="text-small text-muted-foreground w-10 text-right">
                  {continueRow.progress.percent}%
                </span>
              </div>
              <Button
                className="mt-4 w-full justify-between"
                onClick={() => router.push(`/projects/${continueRow.project.id}`)}
              >
                Continuar donde lo dejé
              </Button>
            </>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="Todavía no has iniciado ningún proyecto."
              actionLabel="Crear proyecto"
              onAction={() => router.push("/projects/new")}
              className="py-6"
            />
          )}
        </div>

        {/* Crear proyecto */}
        <div className="relative overflow-hidden rounded-lg border p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
              <Plus className="text-primary h-4 w-4" />
            </div>
            <span className="text-h4">Crear proyecto</span>
          </div>
          <p className="text-body text-muted-foreground max-w-[70%]">
            Inicia un nuevo proyecto y sigue un blueprint paso a paso hasta lograr tu objetivo.
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">
              Crear nuevo proyecto <Plus className="h-4 w-4" />
            </Link>
          </Button>
          <Image
            src="/illustrations/clipboard.png"
            alt=""
            width={128}
            height={128}
            className="pointer-events-none absolute right-2 bottom-2 h-28 w-28 object-contain select-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Mis proyectos */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="text-muted-foreground h-4 w-4" />
              <span className="text-h4">Mis proyectos</span>
            </div>
            <Link href="/projects" className="text-small text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Aún no tienes proyectos"
              actionLabel="Crear proyecto"
              onAction={() => router.push("/projects/new")}
            />
          ) : (
            <div className="flex flex-col divide-y">
              {rows.slice(0, 4).map((row, i) => {
                const Icon = resolveLucideIcon(row.project.blueprintSnapshot.icon);
                return (
                  <div key={row.project.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        TILE_COLORS[i % TILE_COLORS.length],
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body truncate font-medium">{row.project.name}</p>
                      <p className="text-small text-muted-foreground truncate">
                        Fase: {currentPhaseLabel(row)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={row.progress.percent} className="flex-1" />
                        <span className="text-small text-muted-foreground w-9 shrink-0 text-right">
                          {row.progress.percent}%
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => router.push(`/projects/${row.project.id}`)}
                    >
                      Continuar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameTarget(row.project);
                            setRenameValue(row.project.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Duplicar proyecto estará disponible próximamente.")
                          }
                        >
                          <Copy className="h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(row.project)}>
                          <Archive className="h-4 w-4" /> Archivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Exportar proyecto estará disponible próximamente.")
                          }
                        >
                          <Download className="h-4 w-4" /> Exportar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(row.project)}
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="text-muted-foreground h-4 w-4" />
            <span className="text-h4">Actividad reciente</span>
          </div>

          {activity.length === 0 ? (
            <p className="text-body text-muted-foreground">Aún no hay actividad registrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map((entry) => {
                const meta = ACTIVITY_META[entry.action];
                const Icon = meta.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        meta.color,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body">{entry.summary}</p>
                      <p className="text-small text-muted-foreground">
                        {entry.projectRef?.projectName && (
                          <Badge variant="outline" className="mr-1.5">
                            {entry.projectRef.projectName}
                          </Badge>
                        )}
                        {formatRelativeTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar proyecto</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={renaming || !renameValue.trim()}>
              {renaming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
