"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteMemberDialog } from "@/components/features/team/invite-member-dialog";
import { ROLE_LABELS } from "@/config/roles";
import { useAuth } from "@/hooks/use-auth";
import { listMembers } from "@/services/organizations";
import { listInvites, revokeInvite } from "@/services/invites";
import type { Invite, Membership } from "@/types/domain";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Equipo (mockup "14-equipo.png", simplificado): miembros reales + invitaciones pendientes. */
export default function TeamPage() {
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;

  const [members, setMembers] = useState<Membership[] | null>(null);
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  function reload() {
    if (!orgId) return;
    listMembers(orgId).then(setMembers);
    listInvites(orgId).then(setInvites);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function handleRevoke(inviteId: string) {
    if (!orgId) return;
    await revokeInvite(orgId, inviteId);
    setInvites(
      (prev) => prev?.map((i) => (i.id === inviteId ? { ...i, status: "revoked" } : i)) ?? null,
    );
  }

  if (!orgId || members === null || invites === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h3">Equipo</h1>
          <p className="text-body text-muted-foreground">
            {members.length} {members.length === 1 ? "persona" : "personas"} en tu organización.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invitar personas
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Se unió</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.uid}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
                      {initials(m.displayName || m.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body truncate font-medium">
                        {m.displayName || "(sin nombre)"}
                      </p>
                      <p className="text-small text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={m.role === "owner" ? "default" : "outline"}>
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-small text-muted-foreground">
                  {new Date(m.joinedAt).toLocaleDateString("es")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pendingInvites.length > 0 && (
        <div className="mt-6">
          <p className="text-h4 mb-2">Invitaciones pendientes</p>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-body">{invite.email}</p>
                    <p className="text-small text-muted-foreground">
                      Invitado por {invite.invitedByName} · {ROLE_LABELS[invite.role]}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleRevoke(invite.id)}>
                  <X className="h-3.5 w-3.5" /> Revocar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteMemberDialog
        orgId={orgId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={reload}
      />
    </div>
  );
}
