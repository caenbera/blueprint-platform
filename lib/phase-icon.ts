import {
  Briefcase,
  DollarSign,
  Flag,
  Landmark,
  Megaphone,
  Rocket,
  Scale,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * Icono decorativo por Fase (Roadmap del Proyecto, mockup "06-roadmap.png")
 * - BlueprintPhase no tiene un campo `icon` propio (solo Blueprint y Step lo
 * tienen), asi que se infiere por palabra clave del titulo. Si ninguna
 * coincide, cae en un icono generico (Flag) - nunca se deja el tile vacio.
 */
const PHASE_ICON_KEYWORDS: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: Landmark, keywords: ["constitucion", "constitución", "fundacion", "fundación"] },
  { icon: Scale, keywords: ["legal", "fiscal", "normativ"] },
  { icon: Briefcase, keywords: ["negocio", "estrategia", "modelo"] },
  { icon: Settings, keywords: ["operacion", "operación", "proceso"] },
  { icon: DollarSign, keywords: ["finanza", "financier", "contab", "presupuesto"] },
  { icon: Megaphone, keywords: ["marketing", "venta", "publicidad", "comercial"] },
  { icon: Rocket, keywords: ["crecimiento", "escala", "expansion", "expansión", "lanzamiento"] },
];

export function resolvePhaseIcon(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  const match = PHASE_ICON_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.icon ?? Flag;
}

export const PHASE_TILE_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-chart-2/10 text-chart-2",
  "bg-warning/10 text-warning",
  "bg-chart-3/10 text-chart-3",
  "bg-chart-5/10 text-chart-5",
];

export const PHASE_BADGE_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-success text-white",
  "bg-chart-2 text-white",
  "bg-warning text-white",
  "bg-chart-3 text-white",
  "bg-chart-5 text-white",
];
