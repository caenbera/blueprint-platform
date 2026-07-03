"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { listCardVersions } from "@/services/card-versions";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { CardVersion } from "@/types/domain";

/**
 * Historial de versiones de una Card, de solo lectura (Prompt 8/11).
 * Restaurar una version anterior queda fuera de este alcance (Sprint 4).
 */
export function CardVersionHistory({
  cardRef,
  open,
  onOpenChange,
}: {
  cardRef: CardRef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [versions, setVersions] = useState<CardVersion[] | null>(null);

  useEffect(() => {
    if (open) {
      // Reset deliberado: al reabrir, se vuelve a mostrar el loader mientras se recarga.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVersions(null);
      listCardVersions(cardRef).then(setVersions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardRef.cardId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4 overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Historial de versiones</SheetTitle>
        </SheetHeader>

        {versions === null && (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        )}

        {versions?.length === 0 && (
          <EmptyState
            title="Sin versiones anteriores"
            description="Cada edición del título, objetivo o contenido queda registrada aquí."
          />
        )}

        {versions?.map((v) => (
          <div key={v.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
            <p className="text-caption text-muted-foreground">
              {new Date(v.createdAt).toLocaleString()}
            </p>
            <p className="text-body font-medium">{v.title}</p>
            {v.objective && <p className="text-small text-muted-foreground">{v.objective}</p>}
            {typeof v.content === "string" && v.content && (
              <p className="text-small whitespace-pre-wrap">{v.content}</p>
            )}
          </div>
        ))}
      </SheetContent>
    </Sheet>
  );
}
