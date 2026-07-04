import { ArrowDown, ArrowUp, EyeOff, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Controles de personalizacion de layout que la grilla pasa a cada widget (ver mission-control-grid.tsx). */
export interface WidgetControlProps {
  editMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}

/** Chrome comun a los 10 Widgets de Mission Control (Prompt 12): titulo, icono, y controles de personalizacion de layout cuando el modo "Personalizar" esta activo. */
export function WidgetShell({
  label,
  icon: Icon,
  editMode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  children,
}: WidgetControlProps & {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
          <CardTitle className="text-h4">{label}</CardTitle>
        </div>
        {editMode && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={!canMoveUp}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={!canMoveDown}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onHide}>
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
