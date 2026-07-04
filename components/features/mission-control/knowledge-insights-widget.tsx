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
import { getKnowledgeCategoryLabel } from "@/config/knowledge-categories";
import { getKnowledgeInsights, type KnowledgeInsights } from "@/services/mission-control";
import type { KnowledgeCategory } from "@/types/domain";

export function KnowledgeInsightsWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("knowledgeInsights");
  const [insights, setInsights] = useState<KnowledgeInsights | null>(null);

  useEffect(() => {
    getKnowledgeInsights(orgId).then(setInsights);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {insights === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {insights && insights.total === 0 && (
        <p className="text-small text-muted-foreground">Aún no hay Knowledge Items.</p>
      )}
      {insights && insights.total > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-muted-foreground">
            {insights.total} elementos · {insights.byStatus.aprobado} aprobados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {insights.topCategories.map((c) => (
              <Badge key={c.category} variant="outline">
                {getKnowledgeCategoryLabel(c.category as KnowledgeCategory)}: {c.count}
              </Badge>
            ))}
          </div>
          <Link href="/knowledge" className="text-small text-accent hover:underline">
            Ver Knowledge Base →
          </Link>
        </div>
      )}
    </WidgetShell>
  );
}
