"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusIcon } from "@/components/features/navigator/status-icon";
import { useNavigator } from "@/hooks/use-navigator";
import {
  createChapter,
  createModule,
  createPhase,
  listChapters,
  listModules,
  listPhases,
} from "@/services/blueprints";
import { createWorkspace, listWorkspaces } from "@/services/workspaces";
import type { BlueprintRef, ChapterRef, ModuleRef, PhaseRef } from "@/lib/firestore-hierarchy";
import type { Chapter, Module, Phase, ProgressStatus, Workspace } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Nombres de ancestros acumulados a medida que se desciende por el arbol, para poder construir el breadcrumb sin refetch. */
interface NamesTrail {
  projectName?: string;
  blueprintName?: string;
  phaseName?: string;
  moduleName?: string;
  chapterName?: string;
}

/** Fila presentacional compartida por todos los niveles del arbol. */
function TreeRow({
  depth,
  expanded,
  onToggleExpand,
  status,
  name,
  active,
  onSelect,
  leaf,
}: {
  depth: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  status: ProgressStatus;
  name: string;
  active: boolean;
  onSelect: () => void;
  leaf?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "text-body hover:bg-muted flex w-full items-center gap-1.5 rounded-md py-1.5 text-left",
        active && "bg-accent/10 text-accent-foreground font-medium",
      )}
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
    >
      {!leaf ? (
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="text-muted-foreground shrink-0"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      <StatusIcon status={status} />
      <span className="truncate">{name}</span>
    </button>
  );
}

/** Fila de creacion inline ("+ Fase", "+ Modulo"...) sin modal. */
function InlineCreateRow({
  depth,
  label,
  onCreate,
}: {
  depth: number;
  label: string;
  onCreate: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-muted-foreground hover:text-foreground text-small flex items-center gap-1.5 py-1.5"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1.5 py-1"
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        setSaving(true);
        await onCreate(value.trim());
        setValue("");
        setSaving(false);
        setEditing(false);
      }}
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => !value && setEditing(false)}
        placeholder={label}
        className="text-small h-7"
      />
      {saving && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
    </form>
  );
}

function WorkspaceNode({
  parentRef,
  workspace,
  trail,
}: {
  parentRef: ChapterRef;
  workspace: Workspace;
  trail: NamesTrail;
}) {
  const { selection, setSelection } = useNavigator();
  const active = selection?.workspaceId === workspace.id;

  return (
    <TreeRow
      depth={5}
      leaf
      status={workspace.progressStatus}
      name={workspace.name}
      active={active}
      onSelect={() =>
        setSelection({
          ...parentRef,
          ...trail,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        })
      }
    />
  );
}

function ChapterNode({
  parentRef,
  chapter,
  trail,
}: {
  parentRef: ModuleRef;
  chapter: Chapter;
  trail: NamesTrail;
}) {
  const { selection, setSelection } = useNavigator();
  const chapterRef: ChapterRef = { ...parentRef, chapterId: chapter.id };
  const childTrail: NamesTrail = { ...trail, chapterName: chapter.name };
  const active = selection?.chapterId === chapter.id && !selection?.workspaceId;
  const [expanded, setExpanded] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);

  useEffect(() => {
    if (expanded && workspaces === null) {
      listWorkspaces(chapterRef).then(setWorkspaces);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div>
      <TreeRow
        depth={4}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        status={chapter.progressStatus}
        name={chapter.name}
        active={active}
        onSelect={() => {
          setExpanded(true);
          setSelection({ ...chapterRef, ...childTrail });
        }}
      />
      {expanded && (
        <div>
          {workspaces === null && (
            <Loader2 className="text-muted-foreground ml-10 h-3.5 w-3.5 animate-spin" />
          )}
          {workspaces?.map((w) => (
            <WorkspaceNode key={w.id} parentRef={chapterRef} workspace={w} trail={childTrail} />
          ))}
          <InlineCreateRow
            depth={5}
            label="Workspace"
            onCreate={async (name) => {
              await createWorkspace(chapterRef, { name });
              setWorkspaces(await listWorkspaces(chapterRef));
            }}
          />
        </div>
      )}
    </div>
  );
}

function ModuleNode({
  parentRef,
  module: mod,
  trail,
}: {
  parentRef: PhaseRef;
  module: Module;
  trail: NamesTrail;
}) {
  const { selection, setSelection } = useNavigator();
  const moduleRef: ModuleRef = { ...parentRef, moduleId: mod.id };
  const childTrail: NamesTrail = { ...trail, moduleName: mod.name };
  const active = selection?.moduleId === mod.id && !selection?.chapterId;
  const [expanded, setExpanded] = useState(false);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);

  useEffect(() => {
    if (expanded && chapters === null) {
      listChapters(moduleRef).then(setChapters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div>
      <TreeRow
        depth={3}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        status={mod.progressStatus}
        name={mod.name}
        active={active}
        onSelect={() => {
          setExpanded(true);
          setSelection({ ...moduleRef, ...childTrail });
        }}
      />
      {expanded && (
        <div>
          {chapters === null && (
            <Loader2 className="text-muted-foreground ml-10 h-3.5 w-3.5 animate-spin" />
          )}
          {chapters?.map((c) => (
            <ChapterNode key={c.id} parentRef={moduleRef} chapter={c} trail={childTrail} />
          ))}
          <InlineCreateRow
            depth={4}
            label="Capítulo"
            onCreate={async (name) => {
              await createChapter(moduleRef, { name });
              setChapters(await listChapters(moduleRef));
            }}
          />
        </div>
      )}
    </div>
  );
}

function PhaseNode({
  parentRef,
  phase,
  trail,
}: {
  parentRef: BlueprintRef;
  phase: Phase;
  trail: NamesTrail;
}) {
  const { selection, setSelection } = useNavigator();
  const phaseRef: PhaseRef = { ...parentRef, phaseId: phase.id };
  const childTrail: NamesTrail = { ...trail, phaseName: phase.name };
  const active = selection?.phaseId === phase.id && !selection?.moduleId;
  const [expanded, setExpanded] = useState(true);
  const [modules, setModules] = useState<Module[] | null>(null);

  useEffect(() => {
    if (expanded && modules === null) {
      listModules(phaseRef).then(setModules);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div>
      <TreeRow
        depth={2}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        status={phase.progressStatus}
        name={phase.name}
        active={active}
        onSelect={() => {
          setExpanded(true);
          setSelection({ ...phaseRef, ...childTrail });
        }}
      />
      {expanded && (
        <div>
          {modules === null && (
            <Loader2 className="text-muted-foreground ml-8 h-3.5 w-3.5 animate-spin" />
          )}
          {modules?.map((m) => (
            <ModuleNode key={m.id} parentRef={phaseRef} module={m} trail={childTrail} />
          ))}
          <InlineCreateRow
            depth={3}
            label="Módulo"
            onCreate={async (name) => {
              await createModule(phaseRef, { name });
              setModules(await listModules(phaseRef));
            }}
          />
        </div>
      )}
    </div>
  );
}

export interface NavigatorTreeProps {
  blueprintRef: BlueprintRef;
  projectName: string;
  blueprintName: string;
  /**
   * Filtra las Fases visibles por nombre/estado. Al ser un arbol de carga
   * progresiva (solo se piden datos de los niveles expandidos), la
   * busqueda solo alcanza el nivel raiz ya cargado - buscar dentro de
   * niveles mas profundos requeriria cargar todo el arbol de antemano,
   * lo cual contradice la decision de renderizado progresivo (ver plan
   * del Sprint 3). Se documenta como limitacion conocida.
   */
  searchQuery?: string;
  statusFilter?: ProgressStatus | "all";
}

/** Raiz del arbol: lista las Fases del Blueprint activo. */
export function NavigatorTree({
  blueprintRef,
  projectName,
  blueprintName,
  searchQuery = "",
  statusFilter = "all",
}: NavigatorTreeProps) {
  const [phases, setPhases] = useState<Phase[] | null>(null);
  const rootTrail: NamesTrail = { projectName, blueprintName };

  useEffect(() => {
    listPhases(blueprintRef).then(setPhases);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintRef.blueprintId]);

  if (phases === null) {
    return (
      <div className="flex items-center gap-2 px-2 py-4">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-body text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  const visiblePhases = phases.filter((phase) => {
    const matchesQuery = phase.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || phase.progressStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="flex flex-col">
      {visiblePhases.length === 0 && (searchQuery || statusFilter !== "all") && (
        <p className="text-small text-muted-foreground px-2 py-4 text-center">
          Sin resultados en las Fases visibles.
        </p>
      )}
      {visiblePhases.map((phase) => (
        <PhaseNode key={phase.id} parentRef={blueprintRef} phase={phase} trail={rootTrail} />
      ))}
      <InlineCreateRow
        depth={2}
        label="Fase"
        onCreate={async (name) => {
          await createPhase(blueprintRef, { name });
          setPhases(await listPhases(blueprintRef));
        }}
      />
    </div>
  );
}
