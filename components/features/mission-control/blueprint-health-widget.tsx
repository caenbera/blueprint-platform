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

/** Que metodologias (Blueprints) esta usando realmente la organizacion (Sprint 13: ya no hay "progressStatus" de Blueprint - son plantillas globales). */
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
      {health && health.byBlueprint.length === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Proyectos creados.</p>
      )}
      {health && health.byBlueprint.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {health.totalProjects} Proyectos en {health.byBlueprint.length} Blueprints distintos
          </p>
          <div className="flex flex-col gap-1.5">
            {health.byBlueprint.slice(0, 5).map((entry) => (
              <div key={entry.blueprintName} className="flex items-center justify-between gap-2">
                <span className="text-small truncate">{entry.blueprintName}</span>
                <Badge variant="outline">{entry.projectCount}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
