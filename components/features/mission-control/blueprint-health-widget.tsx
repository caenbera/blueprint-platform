"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { getBlueprintHealth, type BlueprintHealth } from "@/services/mission-control";

export function BlueprintHealthWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("blueprintHealth");
  const [health, setHealth] = useState<BlueprintHealth | null>(null);

  useEffect(() => {
    getBlueprintHealth(orgId).then(setHealth);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {health === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {health && health.totalBlueprints === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Blueprints creados.</p>
      )}
      {health && health.totalBlueprints > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {health.totalBlueprints} Blueprints en total
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="success">Aprobados: {health.byStatus.aprobado}</Badge>
            <Badge variant="info">En progreso: {health.byStatus.en_progreso}</Badge>
            <Badge variant="destructive">Bloqueados: {health.byStatus.bloqueado}</Badge>
          </div>
          {health.blocked.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              {health.blocked.slice(0, 3).map((b, i) => (
                <p key={i} className="text-small text-destructive">
                  ⚠ {b.blueprintName} ({b.projectName})
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
