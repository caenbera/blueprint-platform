"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { getPendingReviewItems, type PendingReviewItem } from "@/services/mission-control";
import { useAuth } from "@/hooks/use-auth";
import {
  listSupportAccessGrantsForOrg,
  respondToSupportAccessGrant,
} from "@/services/platform-admin";
import type { SupportAccessGrant } from "@/types/domain";

/**
 * Elementos en estado "en_revision" que necesitan atencion (Sprint 9), mas
 * (Panel de Super Admin) las solicitudes de acceso de soporte pendientes o
 * aprobadas de la organizacion - solo visibles para owner/administrator,
 * que son los unicos roles que firestore.rules deja aprobar/denegar/revocar.
 */
export function NotificationsWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("notifications");
  const { membership } = useAuth();
  const canManageSupportAccess =
    membership?.role === "owner" || membership?.role === "administrator";
  const [items, setItems] = useState<PendingReviewItem[] | null>(null);
  const [grants, setGrants] = useState<SupportAccessGrant[] | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    getPendingReviewItems(orgId).then(setItems);
  }, [orgId]);

  useEffect(() => {
    if (!canManageSupportAccess) return;
    listSupportAccessGrantsForOrg(orgId).then(setGrants);
  }, [orgId, canManageSupportAccess]);

  async function handleRespond(
    grant: SupportAccessGrant,
    status: "approved" | "denied" | "revoked",
  ) {
    setRespondingTo(grant.superAdminUid);
    try {
      await respondToSupportAccessGrant(orgId, grant.superAdminUid, status);
      setGrants((prev) => prev?.filter((g) => g.superAdminUid !== grant.superAdminUid) ?? null);
    } finally {
      setRespondingTo(null);
    }
  }

  const nothingPending = items?.length === 0 && (!canManageSupportAccess || grants?.length === 0);

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {items === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {nothingPending && (
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

      {canManageSupportAccess && grants && grants.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t pt-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-small font-medium">Solicitudes de Super Admin</span>
          </div>
          {grants.map((grant) => (
            <div key={grant.superAdminUid} className="flex flex-col gap-1 rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-small truncate">{grant.superAdminEmail}</span>
                <Badge variant={grant.status === "approved" ? "success" : "warning"}>
                  {grant.status === "approved" ? "Aprobado" : "Pendiente"}
                </Badge>
              </div>
              <p className="text-small text-muted-foreground">{grant.reason}</p>
              <div className="flex gap-1.5">
                {grant.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleRespond(grant, "approved")}
                      disabled={respondingTo === grant.superAdminUid}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRespond(grant, "denied")}
                      disabled={respondingTo === grant.superAdminUid}
                    >
                      Denegar
                    </Button>
                  </>
                )}
                {grant.status === "approved" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRespond(grant, "revoked")}
                    disabled={respondingTo === grant.superAdminUid}
                  >
                    Revocar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
