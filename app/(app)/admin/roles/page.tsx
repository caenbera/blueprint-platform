"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { listAllUsers } from "@/services/platform-admin";
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS, type Permission } from "@/config/roles";
import type { Role } from "@/types/domain";

const PERMISSION_LABELS: Record<Permission, string> = {
  read: "Leer",
  write: "Crear",
  update: "Editar",
  delete: "Eliminar",
  approve: "Aprobar",
  publish: "Publicar",
  export: "Exportar",
  share: "Compartir",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

/**
 * Roles y permisos (Sprint 18): catalogo fijo de 6 roles definido en
 * config/roles.ts - vista de solo lectura de la matriz de permisos, no un
 * editor. Crear roles custom por organizacion queda fuera de alcance (ver
 * plan de Sprint 18).
 */
export default function AdminRolesPage() {
  const [userCounts, setUserCounts] = useState<Record<Role, number> | null>(null);

  useEffect(() => {
    listAllUsers().then((users) => {
      const counts = ROLES.reduce(
        (acc, role) => ({ ...acc, [role]: 0 }),
        {} as Record<Role, number>,
      );
      for (const user of users) {
        counts[user.role] = (counts[user.role] ?? 0) + 1;
      }
      setUserCounts(counts);
    });
  }, []);

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Roles y permisos</h1>
        <p className="text-body text-muted-foreground mb-4">
          Catálogo fijo de roles disponibles para cualquier organización.
        </p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {ROLES.map((role) => (
            <Badge key={role} variant="secondary">
              {ROLE_LABELS[role]}:{" "}
              {userCounts === null ? (
                <Loader2 className="ml-1 h-3 w-3 animate-spin" />
              ) : (
                userCounts[role]
              )}
            </Badge>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                {ALL_PERMISSIONS.map((permission) => (
                  <TableHead key={permission} className="text-center">
                    {PERMISSION_LABELS[permission]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((role) => (
                <TableRow key={role}>
                  <TableCell className="font-medium">{ROLE_LABELS[role]}</TableCell>
                  {ALL_PERMISSIONS.map((permission) => (
                    <TableCell key={permission} className="text-center">
                      {ROLE_PERMISSIONS[role].includes(permission) ? (
                        <Check className="text-success mx-auto h-4 w-4" />
                      ) : (
                        <X className="text-muted-foreground/40 mx-auto h-4 w-4" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
