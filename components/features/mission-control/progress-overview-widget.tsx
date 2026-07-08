"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { getProgressOverview, type ProgressOverview } from "@/services/mission-control";
import type { ProgressStatus } from "@/types/domain";

const STATUS_META: Record<
  ProgressStatus,
  { label: string; variant: "secondary" | "info" | "success" }
> = {
  no_iniciado: { label: "No iniciado", variant: "secondary" },
  en_progreso: { label: "En progreso", variant: "info" },
  aprobado: { label: "Completado", variant: "success" },
};

export function ProgressOverviewWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("progressOverview");
  const [data, setData] = useState<ProgressOverview | null>(null);

  useEffect(() => {
    getProgressOverview(orgId).then(setData);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {data === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {data && data.totalProjects === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Proyectos creados.</p>
      )}
      {data && data.totalProjects > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {data.totalProjects} Proyectos en total
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_META) as ProgressStatus[]).map((status) => (
              <Badge key={status} variant={STATUS_META[status].variant}>
                {STATUS_META[status].label}: {data.byStatus[status]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
