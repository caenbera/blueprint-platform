"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/config/roles";
import { createInvite } from "@/services/invites";
import type { Role } from "@/types/domain";

/**
 * Invitar personas (Sprint 15): crea un Invite pendiente real en Firestore.
 * El envio de correo y la aceptacion (un usuario nuevo se une a ESTA
 * organizacion) todavia no existen - queda documentado como pendiente.
 */
export function InviteMemberDialog({
  orgId,
  open,
  onOpenChange,
  onInvited,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("collaborator");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await createInvite(orgId, email, role);
      setEmail("");
      setRole("collaborator");
      onOpenChange(false);
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la invitación.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar personas</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Correo electrónico</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@empresa.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => r !== "owner").map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-small text-muted-foreground">
            Por ahora esto crea una invitación pendiente - todavía no se envía un correo automático.
          </p>
          {error && <p className="text-small text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={!email.trim() || inviting}>
            {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Enviar invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
