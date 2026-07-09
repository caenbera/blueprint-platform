import {
  BarChart3,
  DollarSign,
  FileText,
  Filter,
  Gift,
  Megaphone,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { StepRowStatus } from "@/services/step-state";

/**
 * Icono decorativo por Step (Vista de la Fase, mockup "07-vista-fase.png")
 * - BlueprintStep no tiene un campo `icon` propio (solo Blueprint si lo
 * tiene), asi que se infiere por palabra clave del titulo. Si ninguna
 * coincide, cae en un icono generico (Target).
 */
const STEP_ICON_KEYWORDS: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: Target, keywords: ["cliente ideal", "buyer persona", "publico", "público", "segmento"] },
  { icon: Gift, keywords: ["propuesta de valor", "oferta"] },
  {
    icon: Search,
    keywords: ["competencia", "analisis", "análisis", "investigacion", "investigación"],
  },
  { icon: Megaphone, keywords: ["marketing", "publicidad", "campaña", "campana"] },
  { icon: FileText, keywords: ["contenido", "plan", "documento", "manual", "guia", "guía"] },
  { icon: Filter, keywords: ["embudo", "conversion", "conversión", "ventas"] },
  { icon: BarChart3, keywords: ["indicador", "seguimiento", "kpi", "metrica", "métrica"] },
  { icon: DollarSign, keywords: ["finanza", "presupuesto", "precio", "costo", "financier"] },
];

export function resolveStepIcon(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  const match = STEP_ICON_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.icon ?? Target;
}

export const STEP_STATUS_META: Record<
  StepRowStatus,
  { label: string; variant: "secondary" | "info" | "success" | "outline" }
> = {
  completado: { label: "Completado", variant: "success" },
  en_progreso: { label: "En progreso", variant: "info" },
  pendiente: { label: "Pendiente", variant: "outline" },
  bloqueado: { label: "Bloqueado", variant: "secondary" },
};
