import { BookOpen, FileText, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarketplaceResourceType, MarketplaceVisibility } from "@/types/domain";

export interface MarketplaceResourceTypeConfig {
  value: MarketplaceResourceType;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Catalogo de los 3 tipos de recurso del Marketplace (Sprint 10). */
export const MARKETPLACE_RESOURCE_TYPES: MarketplaceResourceTypeConfig[] = [
  {
    value: "blueprint",
    label: "Blueprint",
    description: "Estructura completa: Fases, Módulos, Capítulos, Workspaces y Cards",
    icon: Layers,
  },
  {
    value: "document",
    label: "Documento",
    description: "Una plantilla de documento con sus secciones",
    icon: FileText,
  },
  {
    value: "knowledge_item",
    label: "Knowledge Item",
    description: "Un elemento reutilizable de la Knowledge Base",
    icon: BookOpen,
  },
];

export function getMarketplaceResourceTypeConfig(
  value: MarketplaceResourceType,
): MarketplaceResourceTypeConfig {
  return MARKETPLACE_RESOURCE_TYPES.find((t) => t.value === value) ?? MARKETPLACE_RESOURCE_TYPES[0];
}

export const MARKETPLACE_VISIBILITY_LABELS: Record<MarketplaceVisibility, string> = {
  public: "Público",
  organization: "Solo mi organización",
};
