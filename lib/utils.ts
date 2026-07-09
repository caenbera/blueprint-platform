import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Hoy, 10:24 a.m." / "Ayer, 4:15 p.m." / "3 días atrás" (mockup "02-inicio.png", Actividad reciente). */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const time = date.toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) return `Hoy, ${time}`;
  if (dayDiff === 1) return `Ayer, ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} días atrás`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

/** "25 min" / "1h 30min" / "3h" - Step.estimatedHours a texto legible (Roadmap, Vista de Fase). */
export function formatEstimatedTime(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes > 0 ? `${whole}h ${minutes}min` : `${whole}h`;
}
