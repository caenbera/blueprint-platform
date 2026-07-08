"use client";

import { createContext, useState, type ReactNode } from "react";

/**
 * Seleccion actual del usuario (Sprint 13 - motor de datos nuevo): a lo
 * sumo un Proyecto activo y, dentro de el, un Step activo. Reemplaza la
 * seleccion de 7 niveles (Project/Blueprint/Phase/Module/Chapter/Workspace)
 * del modelo viejo - el nuevo motor solo tiene Proyecto -> Fase -> Step.
 */
export interface NavigatorSelection {
  projectId: string;
  projectName?: string;
  stepId?: string;
  stepTitle?: string;
}

export interface NavigatorContextValue {
  activeProjectId: string | null;
  activeProjectName: string | null;
  setActiveProject: (id: string | null, name: string | null) => void;
  selection: NavigatorSelection | null;
  setSelection: (selection: NavigatorSelection | null) => void;
  /** Modo Focus: oculta paneles secundarios, deja solo el breadcrumb + contenido. */
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

export const NavigatorContext = createContext<NavigatorContextValue | null>(null);

export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [selection, setSelection] = useState<NavigatorSelection | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  return (
    <NavigatorContext.Provider
      value={{
        activeProjectId,
        activeProjectName,
        setActiveProject: (id, name) => {
          setActiveProjectId(id);
          setActiveProjectName(name);
        },
        selection,
        setSelection,
        focusMode,
        setFocusMode,
      }}
    >
      {children}
    </NavigatorContext.Provider>
  );
}
