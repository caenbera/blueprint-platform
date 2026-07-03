"use client";

import { useEffect, useState } from "react";
import { FolderTree, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/ui/search-bar";
import { NavigatorTree } from "@/components/features/navigator/navigator-tree";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useNavigator } from "@/hooks/use-navigator";
import { createBlueprint, listBlueprints } from "@/services/blueprints";
import { createProject, listProjects } from "@/services/projects";
import type { Blueprint, ProgressStatus, Project } from "@/types/domain";

const STATUS_FILTER_OPTIONS: { value: ProgressStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "no_iniciado", label: "No iniciado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "revisado", label: "Revisado" },
  { value: "aprobado", label: "Aprobado" },
  { value: "bloqueado", label: "Bloqueado" },
];

function CreateFirstNodeForm({
  label,
  placeholder,
  onCreate,
}: {
  label: string;
  placeholder: string;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex w-full max-w-xs flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        await onCreate(name.trim());
        setSaving(false);
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={saving}
      />
      <Button type="submit" disabled={saving || !name.trim()}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </form>
  );
}

/**
 * Blueprint Navigator Engine (Prompt 6). Componente contenedor: resuelve
 * Project/Blueprint activos (con Empty States guiados si aun no existen),
 * y renderiza el arbol jerarquico. Vive como chrome persistente dentro de
 * app/(app)/layout.tsx, nunca como pantalla propia.
 */
export function BlueprintNavigator() {
  const { membership } = useAuth();
  const {
    activeProjectId,
    activeProjectName,
    setActiveProject,
    activeBlueprintId,
    activeBlueprintName,
    setActiveBlueprint,
  } = useNavigator();

  const orgId = membership?.orgId ?? null;

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[] | null>(null);
  const [lastProjectId, setLastProjectId] = useLocalStorageState<string | null>(
    orgId ? `blueprint:${orgId}:lastProject` : "blueprint:lastProject",
    null,
  );
  const [search, setSearch] = useLocalStorageState(
    orgId ? `blueprint:${orgId}:navSearch` : "blueprint:navSearch",
    "",
  );
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | "all">("all");

  // Cargar proyectos de la organizacion activa.
  useEffect(() => {
    if (!orgId) return;
    listProjects(orgId).then((list) => {
      setProjects(list);
      const preferred = list.find((p) => p.id === lastProjectId) ?? list[0];
      if (preferred) setActiveProject(preferred.id, preferred.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Cargar blueprints del proyecto activo.
  useEffect(() => {
    if (!orgId || !activeProjectId) {
      // Reset deliberado: sin proyecto activo no hay blueprints que mostrar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlueprints(null);
      return;
    }
    setLastProjectId(activeProjectId);
    listBlueprints({ orgId, projectId: activeProjectId }).then((list) => {
      setBlueprints(list);
      if (list[0]) setActiveBlueprint(list[0].id, list[0].name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, activeProjectId]);

  if (!orgId || projects === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState
          icon={FolderTree}
          title="Aún no tienes proyectos"
          description="Crea tu primer proyecto para empezar a construir tu empresa."
        >
          <CreateFirstNodeForm
            label="Crear proyecto"
            placeholder="Nombre del proyecto"
            onCreate={async (name) => {
              const id = await createProject(orgId, { name });
              const list = await listProjects(orgId);
              setProjects(list);
              setActiveProject(id, name);
            }}
          />
        </EmptyState>
      </div>
    );
  }

  if (blueprints === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (blueprints.length === 0 && activeProjectId) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState
          icon={FolderTree}
          title="Este proyecto aún no tiene Blueprints"
          description="Un Blueprint representa una metodología estructurada para construir tu empresa."
        >
          <CreateFirstNodeForm
            label="Crear Blueprint"
            placeholder="Nombre del Blueprint"
            onCreate={async (name) => {
              const id = await createBlueprint({ orgId, projectId: activeProjectId }, { name });
              const list = await listBlueprints({ orgId, projectId: activeProjectId });
              setBlueprints(list);
              setActiveBlueprint(id, name);
            }}
          />
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b p-3">
        <p className="text-caption text-muted-foreground">Proyecto</p>
        {projects.length > 1 ? (
          <Select
            value={activeProjectId ?? undefined}
            onValueChange={(id) =>
              setActiveProject(id, projects.find((p) => p.id === id)?.name ?? null)
            }
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-body font-medium">{projects[0].name}</p>
        )}

        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Buscar en el Blueprint..."
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProgressStatus | "all")}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeBlueprintId && orgId && activeProjectId && (
          <NavigatorTree
            blueprintRef={{ orgId, projectId: activeProjectId, blueprintId: activeBlueprintId }}
            projectName={activeProjectName ?? ""}
            blueprintName={activeBlueprintName ?? ""}
            searchQuery={search}
            statusFilter={statusFilter}
          />
        )}
      </div>
    </div>
  );
}
