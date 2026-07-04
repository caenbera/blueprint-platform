"use client";

import { Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCardMenu } from "@/components/features/workspace/create-card-menu";
import { useNavigator } from "@/hooks/use-navigator";
import type { CardType } from "@/types/domain";

/**
 * Barra de herramientas del Workspace (Prompt 8): solo acciones del
 * contexto actual, nunca acciones globales de la plataforma.
 */
export function WorkspaceToolbar({ onCreateCard }: { onCreateCard: (type: CardType) => void }) {
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
        <CreateCardMenu onSelect={onCreateCard} />
      </div>
    </div>
  );
}
