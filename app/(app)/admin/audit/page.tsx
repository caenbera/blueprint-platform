"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { listPlatformAuditLog } from "@/services/platform-audit";
import type { PlatformAuditAction, PlatformAuditLogEntry } from "@/types/domain";

const ACTION_META: Record<
  PlatformAuditAction,
  { label: string; variant: "success" | "destructive" | "warning" | "secondary" }
> = {
  organization_suspended: { label: "Organización suspendida", variant: "destructive" },
  organization_reactivated: { label: "Organización reactivada", variant: "success" },
  organization_plan_changed: { label: "Plan de organización cambiado", variant: "secondary" },
  support_access_approved: { label: "Acceso de soporte aprobado", variant: "success" },
  support_access_denied: { label: "Acceso de soporte denegado", variant: "warning" },
  support_access_revoked: { label: "Acceso de soporte revocado", variant: "secondary" },
};

/** Auditoría (Sprint 16): bitácora de acciones de Super Admin sobre la plataforma (platformAuditLog, top-level). */
export default function AdminAuditPage() {
  const [entries, setEntries] = useState<PlatformAuditLogEntry[] | null>(null);

  useEffect(() => {
    listPlatformAuditLog().then(setEntries);
  }, []);

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Auditoría</h1>
        <p className="text-body text-muted-foreground mb-4">
          Registro de acciones de Super Admin sobre la plataforma.
        </p>

        {entries === null && (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        )}

        {entries?.length === 0 && (
          <EmptyState
            title="Aún no hay eventos"
            description="Las acciones de Super Admin (suspender una organización, responder solicitudes de soporte) van a aparecer aquí."
          />
        )}

        <div className="flex flex-col divide-y rounded-lg border">
          {entries?.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-body">{entry.summary}</p>
                <p className="text-small text-muted-foreground">
                  {entry.actorName} · {new Date(entry.createdAt).toLocaleString("es")}
                </p>
              </div>
              <Badge variant={ACTION_META[entry.action].variant}>
                {ACTION_META[entry.action].label}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminGuard>
  );
}
