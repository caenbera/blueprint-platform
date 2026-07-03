"use client";

import { MousePointerClick } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigator } from "@/hooks/use-navigator";

/**
 * Vista por defecto del area de contenido cuando no hay un Workspace
 * seleccionado en el Navigator. El Mission Control real (Prompt 4.2/7)
 * llega en el Sprint 9 del roadmap - esto es solo el "home" mientras tanto.
 */
export default function DashboardPage() {
  const { selection } = useNavigator();

  if (selection?.workspaceId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-body text-muted-foreground">
          {selection.workspaceName} — el Workspace Engine (Sprint 4) construirá aquí el área de
          trabajo con Cards.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={MousePointerClick}
        title="Selecciona un Workspace"
        description="Usa el árbol de la izquierda para navegar tu Blueprint, o crea el primer nodo si aún no existe."
      />
    </div>
  );
}
