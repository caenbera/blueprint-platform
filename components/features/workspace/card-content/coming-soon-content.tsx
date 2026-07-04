import { getCardTypeConfig } from "@/config/card-types";
import type { CardType } from "@/types/domain";

const MESSAGES: Partial<Record<CardType, string>> = {
  canvas: "El Canvas visual (formas, dibujo, arrastrar y soltar) llegará en una fase futura.",
  ia: "Este tipo de Card se activará con el Blueprint AI Engine (Sprint 8).",
};

/** Placeholder honesto para tipos que dependen de features aun no construidas. */
export function ComingSoonContent({ type }: { type: CardType }) {
  const config = getCardTypeConfig(type);
  return (
    <div className="text-body text-muted-foreground rounded-md border border-dashed p-4 text-center">
      {MESSAGES[type] ?? `El tipo "${config.label}" estará disponible próximamente.`}
    </div>
  );
}
