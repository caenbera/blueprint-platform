"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Filter,
  Layers,
  ListChecks,
  Loader2,
  Map,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/ui/search-bar";
import { cn } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { listPublishedBlueprints } from "@/services/blueprints";
import type { ProjectCategory } from "@/config/project-categories";
import {
  BLUEPRINT_CATEGORY_GROUPS,
  BLUEPRINT_CATEGORY_OTHER,
  PROJECT_CATEGORY_TO_GROUP,
  groupForCategory,
  type BlueprintCategoryGroup,
} from "@/config/blueprint-category-groups";
import type { Blueprint, BlueprintDifficulty } from "@/types/domain";

const ALL_GROUPS = [...BLUEPRINT_CATEGORY_GROUPS, BLUEPRINT_CATEGORY_OTHER];

const DIFFICULTY_LABELS: Record<BlueprintDifficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const TILE_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-chart-2/10 text-chart-2",
  "bg-warning/10 text-warning",
  "bg-chart-3/10 text-chart-3",
];

function countSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
}

/** "Documentos" del mockup: total de recursos adjuntos en todos los Steps del Blueprint. */
function countResources(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce(
    (sum, phase) => sum + phase.steps.reduce((s, step) => s + step.content.resources.length, 0),
    0,
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Distintivos (mockup "04-elegir-blueprint.png"): solo se muestran los que
 * se pueden calcular con datos reales (createdAt/updatedAt). "Más popular",
 * "Recomendado", "Premium" y "Oficial" no tienen una señal real detrás
 * todavía (requeriría un conteo global de Proyectos por Blueprint entre
 * organizaciones) y no se inventan.
 */
function blueprintBadge(
  blueprint: Blueprint,
): { label: string; variant: "info" | "secondary" } | null {
  const created = new Date(blueprint.createdAt).getTime();
  const updated = new Date(blueprint.updatedAt).getTime();
  if (Date.now() - created < 14 * DAY_MS) return { label: "Nuevo", variant: "info" };
  if (updated - created > DAY_MS) return { label: "Actualizado", variant: "secondary" };
  return null;
}

export default function ChooseBlueprintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      }
    >
      <ChooseBlueprintContent />
    </Suspense>
  );
}

function ChooseBlueprintContent() {
  const searchParams = useSearchParams();
  const [blueprints, setBlueprints] = useState<Blueprint[] | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<BlueprintCategoryGroup | null>(null);
  const [difficulty, setDifficulty] = useState<BlueprintDifficulty | null>(null);

  useEffect(() => {
    listPublishedBlueprints().then(setBlueprints);
  }, []);

  const wantedProjectCategory = searchParams.get("category") as ProjectCategory | null;
  const initialGroup = wantedProjectCategory
    ? (PROJECT_CATEGORY_TO_GROUP[wantedProjectCategory] ?? null)
    : null;
  const activeGroup = group ?? initialGroup;

  if (blueprints === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const filtered = blueprints.filter((b) => {
    const matchesSearch =
      !search ||
      [b.name, b.description, b.category, b.industry, ...b.tags].some((field) =>
        field?.toLowerCase().includes(search.toLowerCase()),
      );
    const matchesGroup = !activeGroup || groupForCategory(b.category) === activeGroup;
    const matchesDifficulty = !difficulty || b.difficulty === difficulty;
    return matchesSearch && matchesGroup && matchesDifficulty;
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/projects/new"
          className="hover:bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <nav className="text-body flex items-center gap-1.5">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Inicio
          </Link>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <Link href="/projects/new" className="text-muted-foreground hover:text-foreground">
            Crear proyecto
          </Link>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-primary font-medium">Elegir blueprint</span>
        </nav>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Map className="text-primary h-6 w-6" />
          <div>
            <h1 className="text-h3">Elige un Blueprint</h1>
            <p className="text-body text-muted-foreground">
              Selecciona el Blueprint que mejor se adapte al proyecto que deseas construir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por nombre, industria o etiqueta..."
            className="w-64"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <Label className="mb-1.5 block">Dificultad</Label>
              <Select
                value={difficulty ?? "all"}
                onValueChange={(v) =>
                  setDifficulty(v === "all" ? null : (v as BlueprintDifficulty))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquiera</SelectItem>
                  {(Object.keys(DIFFICULTY_LABELS) as BlueprintDifficulty[]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge
          variant={activeGroup === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setGroup(null)}
        >
          Todos
        </Badge>
        {ALL_GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <Badge
              key={g.id}
              variant={activeGroup === g.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroup(g.id)}
            >
              <Icon className="h-3 w-3" /> {g.label}
            </Badge>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No hay Blueprints disponibles"
          description="Todavía no hay ningún Blueprint publicado que coincida con tu búsqueda."
        />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((blueprint, i) => {
          const Icon = resolveLucideIcon(blueprint.icon);
          const badge = blueprintBadge(blueprint);
          return (
            <Link
              key={blueprint.id}
              href={`/projects/new/${blueprint.id}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card to-card/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md"
            >
              {badge && (
                <Badge variant={badge.variant} className="absolute top-4 right-4">
                  {badge.label}
                </Badge>
              )}
              
              {/* Header with Icon */}
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 shadow-inner",
                    TILE_COLORS[i % TILE_COLORS.length],
                  )}
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-4 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block mb-1">
                  {blueprint.category}
                </span>
                <h3 className="text-h4 font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {blueprint.name}
                </h3>
                <p className="text-body text-muted-foreground mt-1.5 line-clamp-2">
                  {blueprint.description}
                </p>
              </div>

              {/* Stats Footer */}
              <div className="mt-auto pt-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> {blueprint.roadmap.length} fases
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> {countSteps(blueprint)} pasos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {countResources(blueprint)} documentos
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-4 w-4" />
          <div>
            <p className="text-body font-medium">¿No encuentras lo que necesitas?</p>
            <p className="text-small text-muted-foreground">
              Puedes elegir &quot;Proyecto personalizado&quot; y crear tu blueprint desde cero.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            toast.info(
              "Los proyectos personalizados (sin Blueprint) estarán disponibles próximamente.",
            )
          }
        >
          Proyecto personalizado
        </Button>
      </div>
    </div>
  );
}
