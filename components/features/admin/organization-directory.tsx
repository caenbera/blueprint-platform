"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listAllOrganizations,
  reactivateOrganization,
  requestSupportAccess,
  suspendOrganization,
  type OrganizationSummary,
} from "@/services/platform-admin";
import { OrganizationDetailDialog } from "@/components/features/admin/organization-detail-dialog";
import type { SupportAccessStatus } from "@/types/domain";

const STATUS_META: Record<
  SupportAccessStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "secondary" }
> = {
  pending: { label: "Pendiente", variant: "warning" },
  approved: { label: "Aprobado", variant: "success" },
  denied: { label: "Denegado", variant: "destructive" },
  revoked: { label: "Revocado", variant: "secondary" },
};

/**
 * Directorio de organizaciones (Panel de Super Admin): visible de
 * inmediato sin necesitar ningun supportAccessGrant (ver
 * services/platform-admin.ts#listAllOrganizations). Solicitar acceso solo
 * crea la solicitud - nunca se autoaprueba (lo impide firestore.rules).
 * Sprint 16: se agrega Suspender/Reactivar, tambien real sobre Firestore.
 */
export function OrganizationDirectory() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[] | null>(null);
  const [requestingOrg, setRequestingOrg] = useState<OrganizationSummary | null>(null);
  const [viewingOrg, setViewingOrg] = useState<OrganizationSummary | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<OrganizationSummary | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    listAllOrganizations().then(setOrganizations);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleRequestAccess() {
    if (!requestingOrg || !reason.trim()) return;
    setSubmitting(true);
    try {
      await requestSupportAccess(requestingOrg.id, requestingOrg.name, reason.trim());
      toast.success(`Acceso solicitado para "${requestingOrg.name}"`);
      setRequestingOrg(null);
      setReason("");
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo solicitar el acceso.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleSuspend() {
    if (!suspendTarget) return;
    setSubmitting(true);
    try {
      if (suspendTarget.status === "suspended") {
        await reactivateOrganization(suspendTarget.id, suspendTarget.name);
        toast.success(`"${suspendTarget.name}" reactivada`);
      } else {
        await suspendOrganization(suspendTarget.id, suspendTarget.name);
        toast.success(`"${suspendTarget.name}" suspendida`);
      }
      setSuspendTarget(null);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
    } finally {
      setSubmitting(false);
    }
  }

  if (organizations === null) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-body text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <EmptyState
        title="Aún no hay organizaciones"
        description="Todavía no se registró ninguna organización en la plataforma."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organización</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Miembros</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acceso de soporte</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{org.ownerName || "(sin nombre)"}</span>
                  <span className="text-small text-muted-foreground">{org.ownerEmail}</span>
                </div>
              </TableCell>
              <TableCell>{org.memberCount}</TableCell>
              <TableCell>{new Date(org.createdAt).toLocaleDateString("es")}</TableCell>
              <TableCell>
                <Badge variant={org.status === "suspended" ? "destructive" : "success"}>
                  {org.status === "suspended" ? "Suspendida" : "Activa"}
                </Badge>
              </TableCell>
              <TableCell>
                {org.myGrantStatus === "none" ? (
                  <span className="text-small text-muted-foreground">Sin solicitar</span>
                ) : (
                  <Badge variant={STATUS_META[org.myGrantStatus].variant}>
                    {STATUS_META[org.myGrantStatus].label}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {org.myGrantStatus === "none" && (
                    <Button size="sm" variant="outline" onClick={() => setRequestingOrg(org)}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Solicitar acceso
                    </Button>
                  )}
                  {org.myGrantStatus === "approved" && (
                    <Button size="sm" onClick={() => setViewingOrg(org)}>
                      Ver resumen
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={org.status === "suspended" ? "outline" : "destructive"}
                    onClick={() => setSuspendTarget(org)}
                  >
                    {org.status === "suspended" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reactivar
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" /> Suspender
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={requestingOrg !== null}
        onOpenChange={(open) => !open && setRequestingOrg(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Solicitar acceso de soporte a &quot;{requestingOrg?.name}&quot;
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Motivo (el Owner de la organización lo verá)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRequestAccess} disabled={!reason.trim() || submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={suspendTarget !== null}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendTarget?.status === "suspended" ? "Reactivar" : "Suspender"} &quot;
              {suspendTarget?.name}&quot;
            </DialogTitle>
          </DialogHeader>
          <p className="text-body text-muted-foreground">
            {suspendTarget?.status === "suspended"
              ? "Sus miembros van a recuperar el acceso a la plataforma."
              : "Sus miembros no van a poder entrar a la plataforma hasta que la reactives."}
          </p>
          <DialogFooter>
            <Button
              variant={suspendTarget?.status === "suspended" ? "default" : "destructive"}
              onClick={handleToggleSuspend}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewingOrg && (
        <OrganizationDetailDialog
          organization={viewingOrg}
          open={viewingOrg !== null}
          onOpenChange={(open) => !open && setViewingOrg(null)}
        />
      )}
    </>
  );
}
