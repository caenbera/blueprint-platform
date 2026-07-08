import * as Icons from "lucide-react";
import { Layers, type LucideIcon } from "lucide-react";

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Convierte un nombre de icono kebab-case (ej. "building-2", autoria de
 * Super Admin en el campo `icon` del JSON del Blueprint) al componente de
 * lucide-react correspondiente. Usado por las tarjetas de Proyecto
 * (mockup "02-inicio.png") para mostrar el icono real del Blueprint.
 */
export function resolveLucideIcon(name: string, fallback: LucideIcon = Layers): LucideIcon {
  if (!name) return fallback;
  const pascal = toPascalCase(name);
  const icon = (Icons as unknown as Record<string, LucideIcon>)[pascal];
  return icon ?? fallback;
}
