"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import {
  listAllOrganizations,
  updateOrganizationPlan,
  type OrganizationSummary,
} from "@/services/platform-admin";
import type { OrganizationPlan } from "@/types/domain";

const PLAN_LABELS: Record<OrganizationPlan, string> = {
  gratuito: "Gratuito",
  basico: "Básico",
  profesional: "Profesional",
  empresarial: "Empresarial",
};

const PLAN_VARIANT: Record<OrganizationPlan, "secondary" | "info" | "success" | "default"> = {
  gratuito: "secondary",
  basico: "info",
  profesional: "success",
  empresarial: "default",
};

/**
 * Suscripciones (Sprint 18, mockup implícito en varias pantallas): sin
 * cobro real todavía - el plan es un campo real en Firestore que el Super
 * Admin asigna manualmente. Integrar un procesador de pagos (Stripe u
 * otro) queda fuera de alcance por ahora.
 */
export default function AdminSubscriptionsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[] | null>(null);
  const [editingOrg, setEditingOrg] = useState<OrganizationSummary | null>(null);
  const [newPlan, setNewPlan] = useState<OrganizationPlan>("gratuito");
  const [saving, setSaving] = useState(false);

  function reload() {
    listAllOrganizations().then(setOrganizations);
  }

  useEffect(() => {
    reload();
  }, []);

  function openEdit(org: OrganizationSummary) {
    setEditingOrg(org);
    setNewPlan(org.plan);
  }

  async function handleSave() {
    if (!editingOrg) return;
    setSaving(true);
    try {
      await updateOrganizationPlan(editingOrg.id, editingOrg.name, newPlan);
      toast.success(`Plan de "${editingOrg.name}" actualizado`);
      setEditingOrg(null);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el plan.");
    } finally {
      setSaving(false);
    }
  }

  const planCounts = organizations?.reduce<Record<string, number>>((acc, org) => {
    acc[org.plan] = (acc[org.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Suscripciones</h1>
        <p className="text-body text-muted-foreground mb-4">
          Plan asignado a cada organización. No hay cobros reales todavía.
        </p>

        {organizations === null ? (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(Object.keys(PLAN_LABELS) as OrganizationPlan[]).map((plan) => (
                <Badge key={plan} variant={PLAN_VARIANT[plan]}>
                  {PLAN_LABELS[plan]}: {planCounts?.[plan] ?? 0}
                </Badge>
              ))}
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead>Miembros</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.memberCount}</TableCell>
                      <TableCell>
                        <Badge variant={PLAN_VARIANT[org.plan]}>{PLAN_LABELS[org.plan]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openEdit(org)}>
                          Cambiar plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <Dialog open={editingOrg !== null} onOpenChange={(open) => !open && setEditingOrg(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar plan de &quot;{editingOrg?.name}&quot;</DialogTitle>
            </DialogHeader>
            <Select value={newPlan} onValueChange={(v) => setNewPlan(v as OrganizationPlan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PLAN_LABELS) as OrganizationPlan[]).map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {PLAN_LABELS[plan]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminGuard>
  );
}
