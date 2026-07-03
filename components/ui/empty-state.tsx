import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Contenido personalizado (ej. un formulario) en vez de un unico boton de accion. */
  children?: React.ReactNode;
}

/**
 * Componente oficial #21 (Prompt 5): toda vista sin informacion debe
 * ofrecer mensaje claro, explicacion y accion recomendada. Nunca dejar
 * espacios vacios sin contexto.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-h4">{title}</p>
        {description && <p className="text-body text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
      {children && <div className="mt-2 flex w-full flex-col items-center">{children}</div>}
    </div>
  );
}
