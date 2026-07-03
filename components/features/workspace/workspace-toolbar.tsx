"use client";

import { Focus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigator } from "@/hooks/use-navigator";

/**
 * Barra de herramientas del Workspace (Prompt 8): solo acciones del
 * contexto actual, nunca acciones globales de la plataforma.
 */
export function WorkspaceToolbar({ onCreateCard }: { onCreateCard: () => void }) {
  const { focusMode, setFocusMode } = useNavigator();

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <p className="text-caption text-muted-foreground">Los cambios se guardan automáticamente</p>
      <div className="flex items-center gap-2">
        <Button
          variant={focusMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setFocusMode(!focusMode)}
        >
          <Focus className="h-4 w-4" />
          Modo Focus
        </Button>
        <Button size="sm" onClick={onCreateCard}>
          <Plus className="h-4 w-4" />
          Nueva Card
        </Button>
      </div>
    </div>
  );
}
