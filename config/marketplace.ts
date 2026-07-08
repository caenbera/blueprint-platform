import { BookOpen, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarketplaceResourceType, MarketplaceVisibility } from "@/types/domain";

export interface MarketplaceResourceTypeConfig {
  value: MarketplaceResourceType;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Catalogo de tipos de recurso del Marketplace. Sprint 13: "blueprint" se
 * retiro de aqui - los Blueprints ya no se publican/incorporan via
 * Marketplace, su autoria es exclusiva de Super Admin.
 */
export const MARKETPLACE_RESOURCE_TYPES: MarketplaceResourceTypeConfig[] = [
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
