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
 * Busca un nombre de icono kebab-case en lucide-react - devuelve `null` si
 * no existe, a diferencia de resolveLucideIcon que siempre devuelve algo
 * (util para saber si un `icon` explicito del JSON es valido antes de caer
 * a una inferencia por palabra clave, ver lib/step-icon.ts).
 */
export function findLucideIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  const pascal = toPascalCase(name);
  return (Icons as unknown as Record<string, LucideIcon>)[pascal] ?? null;
}

/**
 * Convierte un nombre de icono kebab-case (ej. "building-2", autoria de
 * Super Admin en el campo `icon` del JSON del Blueprint) al componente de
 * lucide-react correspondiente. Usado por las tarjetas de Proyecto
 * (mockup "02-inicio.png") para mostrar el icono real del Blueprint.
 */
export function resolveLucideIcon(name: string, fallback: LucideIcon = Layers): LucideIcon {
  return findLucideIcon(name) ?? fallback;
}
