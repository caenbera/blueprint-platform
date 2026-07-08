"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { ROLE_LABELS } from "@/config/roles";
import { listAllUsers, type PlatformUserRow } from "@/services/platform-admin";

/** Usuarios (Sprint 16, mockup "08-usuarios.png" simplificado): directorio global, fan-out sobre todas las organizaciones. */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUserRow[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAllUsers().then(setUsers);
  }, []);

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Usuarios</h1>
        <p className="text-body text-muted-foreground mb-4">
          Gestiona todos los usuarios del sistema a nivel global.
        </p>

        {users === null ? (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            <SearchBar
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar por nombre, correo u organización..."
              className="mb-4 max-w-sm"
            />
            {(() => {
              const filtered = users.filter((u) => {
                const q = search.toLowerCase();
                return (
                  !q ||
                  u.displayName.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q) ||
                  u.organizationName.toLowerCase().includes(q)
                );
              });
              if (filtered.length === 0) {
                return (
                  <EmptyState
                    title="Sin resultados"
                    description="Nadie coincide con tu búsqueda."
                  />
                );
              }
              return (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Organización</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Se unió</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((u) => (
                        <TableRow key={`${u.orgId}-${u.uid}`}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.displayName || "(sin nombre)"}</span>
                              <span className="text-small text-muted-foreground">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{u.organizationName}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "owner" ? "default" : "outline"}>
                              {ROLE_LABELS[u.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-small text-muted-foreground">
                            {new Date(u.joinedAt).toLocaleDateString("es")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </SuperAdminGuard>
  );
}
