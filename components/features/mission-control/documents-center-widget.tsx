"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { getDocumentsSummary, type DocumentsSummary } from "@/services/mission-control";

export function DocumentsCenterWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("documentsCenter");
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);

  useEffect(() => {
    getDocumentsSummary(orgId).then(setSummary);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {summary === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {summary && summary.total === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Documentos creados.</p>
      )}
      {summary && summary.total > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {summary.total} documentos · {summary.byStatus.publicado} publicados
          </p>
          <div className="flex flex-col gap-1">
            {summary.recent.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <span className="text-small truncate">{d.title}</span>
                <Badge variant="outline">{d.status}</Badge>
              </div>
            ))}
          </div>
          <Link href="/documents" className="text-small text-accent hover:underline">
            Ver Documents Center →
          </Link>
        </div>
      )}
    </WidgetShell>
  );
}
