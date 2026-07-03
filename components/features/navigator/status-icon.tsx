import { CheckCircle2, Circle, CircleDot, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressStatus } from "@/types/domain";

const STATUS_CONFIG: Record<
  ProgressStatus,
  { icon: typeof Circle; className: string; label: string }
> = {
  no_iniciado: { icon: Circle, className: "text-neutral-400", label: "No iniciado" },
  en_progreso: { icon: CircleDot, className: "text-info", label: "En progreso" },
  revisado: { icon: Eye, className: "text-accent", label: "Revisado" },
  aprobado: { icon: CheckCircle2, className: "text-success", label: "Aprobado" },
  bloqueado: { icon: Lock, className: "text-error", label: "Bloqueado" },
};

/** Mapea ProgressStatus a icono/color (Prompt 6: ⚪🟡🔵🟢🔴). */
export function StatusIcon({ status, className }: { status: ProgressStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", config.className, className)}
      aria-label={config.label}
    />
  );
}

export { STATUS_CONFIG };
