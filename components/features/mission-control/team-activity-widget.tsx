"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { listRecentActivity } from "@/services/activity";

interface MemberActivity {
  actorName: string;
  count: number;
}

/** Misma coleccion que Recent Activity (Activity Log), agrupada por autor en vez de cronologica (Sprint 9). */
export function TeamActivityWidget({ orgId, ...controls }: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("teamActivity");
  const [members, setMembers] = useState<MemberActivity[] | null>(null);

  useEffect(() => {
    listRecentActivity(orgId, 50).then((entries) => {
      const counts = new Map<string, number>();
      for (const entry of entries) {
        counts.set(entry.actorName, (counts.get(entry.actorName) ?? 0) + 1);
      }
      setMembers(
        Array.from(counts.entries())
          .map(([actorName, count]) => ({ actorName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
      );
    });
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {members === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {members?.length === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay actividad del equipo.</p>
      )}
      <div className="flex flex-col gap-1.5">
        {members?.map((m) => (
          <div key={m.actorName} className="flex items-center justify-between gap-2">
            <span className="text-small truncate">{m.actorName}</span>
            <Badge variant="secondary">{m.count} acciones</Badge>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
