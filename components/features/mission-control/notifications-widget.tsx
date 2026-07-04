"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { getPendingReviewItems, type PendingReviewItem } from "@/services/mission-control";

/**
 * Elementos en estado "en_revision" que necesitan atencion (Sprint 9). El
 * flujo de aprobacion de supportAccessGrants nunca se construyo y queda
 * fuera de alcance de este widget.
 */
export function NotificationsWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("notifications");
  const [items, setItems] = useState<PendingReviewItem[] | null>(null);

  useEffect(() => {
    getPendingReviewItems(orgId).then(setItems);
  }, [orgId]);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {items === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {items?.length === 0 && (
        <p className="text-small text-muted-foreground">Nada pendiente de revisión.</p>
      )}
      <div className="flex flex-col gap-1.5">
        {items?.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.type === "knowledge" ? "/knowledge" : "/documents"}
            className="hover:bg-muted text-small rounded-md px-1.5 py-1"
          >
            {item.type === "knowledge" ? "Knowledge Item" : "Documento"} pendiente de revisión:
            &quot;
            {item.title}&quot;
          </Link>
        ))}
      </div>
    </WidgetShell>
  );
}
