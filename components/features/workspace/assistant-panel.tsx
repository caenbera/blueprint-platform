"use client";

import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder persistente del Assistant Panel (Prompt 2/6/10). Completa el
 * layout de 3 columnas (Navigator | Workspace | Assistant). La IA real
 * llega en el Sprint 8 (Blueprint AI Engine) - por ahora solo ocupa su
 * lugar en la estructura para no tener que reordenar el layout despues.
 */
export function AssistantPanel({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center border-l p-2">
        <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-accent h-4 w-4" />
          <span className="text-body font-medium">Assistant</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-center">
        <p className="text-body text-muted-foreground">
          El Assistant IA estará disponible en el Sprint 8 (Blueprint AI Engine).
        </p>
      </div>
    </div>
  );
}
