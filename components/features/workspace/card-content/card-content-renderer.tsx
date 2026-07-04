"use client";

import { ChecklistContent } from "@/components/features/workspace/card-content/checklist-content";
import { ComingSoonContent } from "@/components/features/workspace/card-content/coming-soon-content";
import { ComparisonContentEditor } from "@/components/features/workspace/card-content/comparison-content";
import { FileContentEditor } from "@/components/features/workspace/card-content/file-content";
import { FormContentEditor } from "@/components/features/workspace/card-content/form-content";
import { KpiContentEditor } from "@/components/features/workspace/card-content/kpi-content";
import { MediaContentEditor } from "@/components/features/workspace/card-content/media-content";
import { TableContentEditor } from "@/components/features/workspace/card-content/table-content";
import { TextContent } from "@/components/features/workspace/card-content/text-content";
import { TimelineContentEditor } from "@/components/features/workspace/card-content/timeline-content";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { CardType } from "@/types/domain";

const TEXT_TYPES: CardType[] = [
  "informacion",
  "objetivo",
  "pregunta",
  "respuesta",
  "documento",
  "resumen",
  "proceso",
  "plantilla",
];

/**
 * Despacha el editor de contenido correcto segun `type` (Card System,
 * Sprint 5). Cada Card comparte la misma anatomia (Prompt 8/9); solo el
 * area de "Contenido" cambia por tipo.
 */
export function CardContentRenderer({
  type,
  cardRef,
  content,
  onChange,
}: {
  type: CardType;
  cardRef: CardRef;
  content: unknown;
  onChange: (content: unknown) => void;
}) {
  if (TEXT_TYPES.includes(type)) {
    return <TextContent type={type} content={content} onChange={onChange} />;
  }

  switch (type) {
    case "checklist":
      return <ChecklistContent content={content} onChange={onChange} />;
    case "tabla":
      return <TableContentEditor content={content} onChange={onChange} />;
    case "timeline":
      return <TimelineContentEditor content={content} onChange={onChange} />;
    case "kpi":
      return <KpiContentEditor content={content} onChange={onChange} />;
    case "comparacion":
      return <ComparisonContentEditor content={content} onChange={onChange} />;
    case "formulario":
      return <FormContentEditor content={content} onChange={onChange} />;
    case "archivo":
    case "imagen":
      return (
        <FileContentEditor type={type} cardRef={cardRef} content={content} onChange={onChange} />
      );
    case "video":
    case "audio":
      return <MediaContentEditor type={type} content={content} onChange={onChange} />;
    case "canvas":
    case "ia":
      return <ComingSoonContent type={type} />;
    default:
      return <TextContent type={type} content={content} onChange={onChange} />;
  }
}
