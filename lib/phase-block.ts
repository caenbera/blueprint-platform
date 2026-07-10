import { Briefcase, Compass, Settings, Users, type LucideIcon } from "lucide-react";
import type { BlueprintBlock } from "@/types/domain";

/**
 * Metadata fija de los 4 bloques universales que agrupan Fases en el
 * Roadmap del Proyecto (mismo vocabulario Strategy/Operations/Business/
 * Customers que va a reutilizar el futuro modulo Operacion). Orden de
 * despliegue fijo - nunca se reordena por progreso ni alfabeticamente.
 */
export const BLUEPRINT_BLOCKS: {
  value: BlueprintBlock;
  label: string;
  icon: LucideIcon;
  tileColor: string;
}[] = [
  {
    value: "strategy",
    label: "Estrategia",
    icon: Compass,
    tileColor: "bg-primary/10 text-primary",
  },
  {
    value: "operations",
    label: "Operaciones",
    icon: Settings,
    tileColor: "bg-chart-2/10 text-chart-2",
  },
  {
    value: "business",
    label: "Negocio",
    icon: Briefcase,
    tileColor: "bg-warning/10 text-warning",
  },
  { value: "customers", label: "Clientes", icon: Users, tileColor: "bg-success/10 text-success" },
];

export function resolveBlockMeta(block: BlueprintBlock) {
  return BLUEPRINT_BLOCKS.find((b) => b.value === block)!;
}
