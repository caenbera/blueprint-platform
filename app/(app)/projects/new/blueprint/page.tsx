"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Compass, Layers, ListChecks, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { listPublishedBlueprints } from "@/services/blueprints";
import { PROJECT_CATEGORIES } from "@/config/project-categories";
import type { Blueprint } from "@/types/domain";

function countSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
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
  const [category, setCategory] = useState<string | null>(null);
  const [categoryMatched, setCategoryMatched] = useState(false);

  useEffect(() => {
    listPublishedBlueprints().then(setBlueprints);
  }, []);

  // Paso 1 del asistente (Tipo de Proyecto, mockup "03-tipo-proyecto.png"):
  // esas categorias son solo un filtro visual, no coinciden 1:1 con
  // Blueprint.category (texto libre del Super Admin) - se busca la
  // categoria real mas parecida (match flexible) en vez de una igualdad
  // exacta, y si no hay ninguna coincidencia se muestran todos los
  // Blueprints sin bloquear al usuario.
  useEffect(() => {
    if (!blueprints || categoryMatched) return;
    const wantedId = searchParams.get("category");
    if (!wantedId) return;
    const wantedLabel = PROJECT_CATEGORIES.find((c) => c.id === wantedId)?.label ?? wantedId;
    const availableCategories = Array.from(
      new Set(blueprints.map((b) => b.category).filter(Boolean)),
    );
    const found = availableCategories.find(
      (c) =>
        c.toLowerCase().includes(wantedLabel.toLowerCase()) ||
        wantedLabel.toLowerCase().includes(c.toLowerCase()),
    );
    // Sincronizacion deliberada con datos externos (query param + Blueprints ya cargados).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found) setCategory(found);
    setCategoryMatched(true);
  }, [blueprints, categoryMatched, searchParams]);

  if (blueprints === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const categories = Array.from(new Set(blueprints.map((b) => b.category).filter(Boolean)));
  const filtered = blueprints.filter((b) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || b.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <Link
        href="/projects/new"
        className="text-body text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tipo de proyecto
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <Compass className="text-primary h-6 w-6" />
        <div>
          <h1 className="text-h3">Elige un Blueprint</h1>
          <p className="text-body text-muted-foreground">
            Selecciona el Blueprint que mejor se adapte al proyecto que quieres construir.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Buscar Blueprint..."
          className="max-w-xs"
        />
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={category === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(null)}
            >
              Todos
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No hay Blueprints disponibles"
          description="Todavía no hay ningún Blueprint publicado que coincida con tu búsqueda."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((blueprint) => (
          <Link
            key={blueprint.id}
            href={`/projects/new/${blueprint.id}`}
            className="hover:border-primary/50 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
          >
            <span className="text-h4">{blueprint.name}</span>
            <p className="text-body text-muted-foreground line-clamp-2">{blueprint.description}</p>
            <div className="text-small text-muted-foreground mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> {blueprint.roadmap.length} fases
              </span>
              <span className="flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" /> {countSteps(blueprint)} pasos
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
