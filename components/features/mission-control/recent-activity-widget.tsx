"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { listRecentActivity } from "@/services/activity";
import type { ActivityLogEntry } from "@/types/domain";

export function RecentActivityWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("recentActivity");
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);

  useEffect(() => {
    listRecentActivity(orgId, 10).then(setEntries);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {entries === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {entries?.length === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay actividad registrada.</p>
      )}
      <div className="flex flex-col gap-2">
        {entries?.map((entry) => (
          <div key={entry.id} className="flex flex-col">
            <span className="text-small">{entry.summary}</span>
            <span className="text-small text-muted-foreground">
              {entry.actorName} · {new Date(entry.createdAt).toLocaleString("es")}
            </span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
