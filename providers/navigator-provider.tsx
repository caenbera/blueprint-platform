"use client";

import { createContext, useState, type ReactNode } from "react";

/**
 * Nodo actualmente seleccionado en el arbol. Puede ser tan profundo como
 * un Workspace o tan superficial como una Fase - el breadcrumb (Prompt 6)
 * refleja exactamente hasta donde llega esta seleccion.
 */
export interface NavigatorSelection {
  projectId: string;
  blueprintId: string;
  phaseId?: string;
  phaseName?: string;
  moduleId?: string;
  moduleName?: string;
  chapterId?: string;
  chapterName?: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface NavigatorContextValue {
  activeProjectId: string | null;
  activeProjectName: string | null;
  setActiveProject: (id: string | null, name: string | null) => void;
  activeBlueprintId: string | null;
  activeBlueprintName: string | null;
  setActiveBlueprint: (id: string | null, name: string | null) => void;
  selection: NavigatorSelection | null;
  setSelection: (selection: NavigatorSelection | null) => void;
}

export const NavigatorContext = createContext<NavigatorContextValue | null>(null);

export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [activeBlueprintName, setActiveBlueprintName] = useState<string | null>(null);
  const [selection, setSelection] = useState<NavigatorSelection | null>(null);

  return (
    <NavigatorContext.Provider
      value={{
        activeProjectId,
        activeProjectName,
        setActiveProject: (id, name) => {
          setActiveProjectId(id);
          setActiveProjectName(name);
        },
        activeBlueprintId,
        activeBlueprintName,
        setActiveBlueprint: (id, name) => {
          setActiveBlueprintId(id);
          setActiveBlueprintName(name);
        },
        selection,
        setSelection,
      }}
    >
      {children}
    </NavigatorContext.Provider>
  );
}
