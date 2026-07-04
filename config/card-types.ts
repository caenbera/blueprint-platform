import {
  ClipboardList,
  Clock,
  FileText,
  Gauge,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  ListChecks,
  MessageSquare,
  Music,
  Paperclip,
  PenTool,
  ScrollText,
  Sparkles,
  SplitSquareHorizontal,
  Table as TableIcon,
  Target,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { CardType } from "@/types/domain";

export type CardTypeCategory = "Texto" | "Estructurado" | "Multimedia" | "Otro";

export interface CardTypeConfig {
  type: CardType;
  label: string;
  description: string;
  icon: LucideIcon;
  category: CardTypeCategory;
}

/** Catalogo de los 20 tipos oficiales de Card (Prompt 9). */
export const CARD_TYPES: CardTypeConfig[] = [
  {
    type: "informacion",
    label: "Información",
    description: "Texto general",
    icon: Info,
    category: "Texto",
  },
  {
    type: "objetivo",
    label: "Objetivo",
    description: "Qué se busca lograr",
    icon: Target,
    category: "Texto",
  },
  {
    type: "pregunta",
    label: "Pregunta",
    description: "Una pregunta a responder",
    icon: HelpCircle,
    category: "Texto",
  },
  {
    type: "respuesta",
    label: "Respuesta",
    description: "Respuesta a una pregunta",
    icon: MessageSquare,
    category: "Texto",
  },
  {
    type: "documento",
    label: "Documento",
    description: "Contenido tipo documento",
    icon: FileText,
    category: "Texto",
  },
  {
    type: "resumen",
    label: "Resumen",
    description: "Síntesis de información",
    icon: ScrollText,
    category: "Texto",
  },
  {
    type: "proceso",
    label: "Proceso",
    description: "Descripción de un proceso",
    icon: Workflow,
    category: "Texto",
  },
  {
    type: "plantilla",
    label: "Plantilla",
    description: "Plantilla reutilizable",
    icon: LayoutTemplate,
    category: "Texto",
  },

  {
    type: "checklist",
    label: "Checklist",
    description: "Lista de tareas con casillas",
    icon: ListChecks,
    category: "Estructurado",
  },
  {
    type: "tabla",
    label: "Tabla",
    description: "Datos en filas y columnas",
    icon: TableIcon,
    category: "Estructurado",
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Secuencia de eventos",
    icon: Clock,
    category: "Estructurado",
  },
  {
    type: "kpi",
    label: "KPI",
    description: "Un indicador clave",
    icon: Gauge,
    category: "Estructurado",
  },
  {
    type: "comparacion",
    label: "Comparación",
    description: "Dos opciones lado a lado",
    icon: SplitSquareHorizontal,
    category: "Estructurado",
  },
  {
    type: "formulario",
    label: "Formulario",
    description: "Preguntas y respuestas",
    icon: ClipboardList,
    category: "Estructurado",
  },

  {
    type: "archivo",
    label: "Archivo",
    description: "Un archivo adjunto",
    icon: Paperclip,
    category: "Multimedia",
  },
  {
    type: "imagen",
    label: "Imagen",
    description: "Una imagen con vista previa",
    icon: ImageIcon,
    category: "Multimedia",
  },
  {
    type: "video",
    label: "Video",
    description: "Enlace a un video",
    icon: Video,
    category: "Multimedia",
  },
  {
    type: "audio",
    label: "Audio",
    description: "Enlace a un audio",
    icon: Music,
    category: "Multimedia",
  },

  { type: "canvas", label: "Canvas", description: "Próximamente", icon: PenTool, category: "Otro" },
  {
    type: "ia",
    label: "IA",
    description: "Requiere el AI Engine (Sprint 8)",
    icon: Sparkles,
    category: "Otro",
  },
];

export const CARD_TYPE_CATEGORIES: CardTypeCategory[] = [
  "Texto",
  "Estructurado",
  "Multimedia",
  "Otro",
];

export function getCardTypeConfig(type: CardType): CardTypeConfig {
  const found = CARD_TYPES.find((c) => c.type === type);
  if (!found) throw new Error(`Tipo de Card desconocido: ${type}`);
  return found;
}
