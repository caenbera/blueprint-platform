"use client";

import { useEffect, useState } from "react";
import { Building2, Layers, Loader2, ShieldCheck, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { getPlatformStats, type PlatformStats } from "@/services/platform-admin";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
        <Icon className="text-primary h-5 w-5" />
      </div>
      <div>
        <p className="text-h3 leading-none">{value}</p>
        <p className="text-small text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

/**
 * Dashboard General (Sprint 16, mockup "01-dashboard.png" simplificado):
 * solo metricas reales que el Super Admin ya puede leer sin necesitar un
 * supportAccessGrant por organizacion (ver services/platform-admin.ts#
 * getPlatformStats) - no incluye "Proyectos activos" ni series de tiempo
 * que requeririan romper el aislamiento por organizacion o inventar datos.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getPlatformStats().then(setStats);
  }, []);

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Dashboard General</h1>
        <p className="text-body text-muted-foreground mb-4">Vista ejecutiva de la plataforma.</p>

        {stats === null ? (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile icon={Users} label="Usuarios totales" value={stats.totalUsers} />
              <StatTile
                icon={Building2}
                label="Organizaciones registradas"
                value={stats.totalOrganizations}
              />
              <StatTile
                icon={Layers}
                label="Blueprints publicados"
                value={stats.totalPublishedBlueprints}
              />
              <StatTile
                icon={ShieldCheck}
                label="Solicitudes de soporte pendientes"
                value={stats.pendingSupportRequests}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-h4 mb-2">Organizaciones por estado</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Activas", value: stats.activeOrganizations },
                          { name: "Suspendidas", value: stats.suspendedOrganizations },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                      >
                        <Cell fill="var(--success)" />
                        <Cell fill="var(--destructive)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-h4 mb-2">Top organizaciones por miembros</p>
                {stats.topOrganizationsByMembers.length === 0 && (
                  <p className="text-small text-muted-foreground">Aún no hay organizaciones.</p>
                )}
                <div className="flex flex-col gap-2">
                  {stats.topOrganizationsByMembers.map((org) => (
                    <div key={org.name} className="flex items-center justify-between gap-2">
                      <span className="text-body truncate">{org.name}</span>
                      <span className="text-small text-muted-foreground">
                        {org.memberCount} {org.memberCount === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SuperAdminGuard>
  );
}
