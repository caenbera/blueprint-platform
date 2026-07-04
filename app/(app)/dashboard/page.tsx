"use client";

import { useEffect, useState } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CardItem } from "@/components/features/workspace/card-item";
import { WorkspaceToolbar } from "@/components/features/workspace/workspace-toolbar";
import { getCardTypeConfig } from "@/config/card-types";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { createCard, listCards } from "@/services/cards";
import type { WorkspaceRef } from "@/lib/firestore-hierarchy";
import type { Card, CardType } from "@/types/domain";

/**
 * Area de trabajo del Workspace seleccionado (Prompt 8). Si no hay ningun
 * Workspace seleccionado todavia, muestra el estado por defecto guiando
 * al usuario hacia el Navigator.
 */
export default function DashboardPage() {
  const { membership } = useAuth();
  const { selection } = useNavigator();
  const [cards, setCards] = useState<Card[] | null>(null);

  const ref: WorkspaceRef | null =
    membership &&
    selection?.workspaceId &&
    selection.phaseId &&
    selection.moduleId &&
    selection.chapterId
      ? {
          orgId: membership.orgId,
          projectId: selection.projectId,
          blueprintId: selection.blueprintId,
          phaseId: selection.phaseId,
          moduleId: selection.moduleId,
          chapterId: selection.chapterId,
          workspaceId: selection.workspaceId,
        }
      : null;

  useEffect(() => {
    if (!ref) {
      // Reset deliberado: sin workspace activo no hay cards que mostrar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCards(null);
      return;
    }
    listCards(ref).then(setCards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.workspaceId]);

  if (!ref) {
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

  async function handleCreateCard(type: CardType = "informacion") {
    await createCard(ref!, { type, title: `Nueva ${getCardTypeConfig(type).label}` });
    setCards(await listCards(ref!));
  }

  return (
    <div className="flex flex-1 flex-col">
      <WorkspaceToolbar onCreateCard={handleCreateCard} />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {cards === null && (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        )}
        {cards?.length === 0 && (
          <EmptyState
            title="Aún no hay Cards"
            description="Cada idea, respuesta o proceso es una Card independiente."
            actionLabel="Crear la primera Card"
            onAction={() => handleCreateCard()}
          />
        )}
        {cards?.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onArchived={() => setCards((prev) => prev?.filter((c) => c.id !== card.id) ?? null)}
          />
        ))}
      </div>
    </div>
  );
}
