import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title: string;
  cause?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Componente oficial #23 (Prompt 5): todo error debe incluir explicacion
 * clara, causa cuando sea posible, y accion recomendada. Nunca mostrar
 * mensajes tecnicos crudos (codigos, stack traces) al usuario.
 */
export function ErrorState({ title, cause, actionLabel, onAction, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-error/10 flex h-12 w-12 items-center justify-center rounded-full">
        <AlertTriangle className="text-error h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-h4">{title}</p>
        {cause && <p className="text-body text-muted-foreground max-w-sm">{cause}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
