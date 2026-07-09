"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbTrail } from "@/components/features/navigator/breadcrumb-trail";
import { AssistantPanel } from "@/components/features/workspace/assistant-panel";
import { CollapsibleSidebar } from "@/components/features/shell/collapsible-sidebar";
import { ProjectSwitcher } from "@/components/features/shell/project-switcher";
import { NavigatorProvider } from "@/providers/navigator-provider";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { signOutUser } from "@/services/auth";
import { getGeneralSettings } from "@/services/platform-config";
import { getAdminNavGroups } from "@/config/admin-nav";
import { SUPER_ADMIN_NAV_GROUPS } from "@/config/super-admin-nav";
import { ROLE_LABELS } from "@/config/roles";

function AppShell({ children }: { children: React.ReactNode }) {
  const { membership, user, isSuperAdmin } = useAuth();
  const { focusMode, selection, activeProjectId, assistantCollapsed, setAssistantCollapsed } =
    useNavigator();
  const router = useRouter();

  const navGroups = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : getAdminNavGroups(activeProjectId);
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : (membership && ROLE_LABELS[membership.role]) || "";

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen">
      <CollapsibleSidebar
        groups={navGroups}
        brandSubtitle={membership?.organizationName ?? "Construye tu empresa paso a paso"}
        topSlot={!isSuperAdmin && activeProjectId && <ProjectSwitcher />}
        footerTop={
          !isSuperAdmin && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-primary h-4 w-4" />
                <span className="text-body font-medium">Asistente IA</span>
              </div>
              <p className="text-caption text-muted-foreground mt-0.5">
                Tu copiloto para construir cada paso.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full justify-between"
                onClick={() => setAssistantCollapsed(false)}
              >
                Abrir asistente
              </Button>
            </div>
          )
        }
        userName={user?.displayName || user?.email || ""}
        userRoleLabel={roleLabel}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b">
            <BreadcrumbTrail />
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>

        {!focusMode && (
          <aside
            className="shrink-0 border-l"
            style={{ width: assistantCollapsed ? "auto" : "18rem" }}
          >
            <AssistantPanel
              collapsed={assistantCollapsed}
              onToggleCollapsed={() => setAssistantCollapsed((v) => !v)}
              orgId={membership?.orgId ?? null}
              selection={selection}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Chrome persistente para toda la app autenticada: Sidebar + area de
 * contenido + Assistant Panel. El Navigator de arbol (Fase/Modulo/
 * Capitulo/Workspace) se retiro en el Sprint 13 junto con el modelo de
 * datos viejo - el Sprint 14 reconstruye la navegacion sobre Proyecto ->
 * Fase -> Step (Roadmap).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, isSuperAdmin, loading } = useAuth();
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getGeneralSettings().then((settings) => setMaintenanceMode(settings.maintenanceMode));
  }, [user]);

  if (loading || !user || maintenanceMode === null) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Modo Mantenimiento (Sprint 18, Configuracion Global): mismo patron que
  // la suspension de una organizacion especifica, pero se aplica a
  // CUALQUIER usuario que no sea Super Admin, sin importar su organizacion.
  if (maintenanceMode && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-warning/10 flex h-14 w-14 items-center justify-center rounded-full">
          <Wrench className="text-warning h-7 w-7" />
        </div>
        <h1 className="text-h3">Blueprint está en mantenimiento</h1>
        <p className="text-body text-muted-foreground max-w-sm">
          Estamos haciendo ajustes en la plataforma. Vuelve a intentarlo en unos minutos.
        </p>
        <Button
          variant="outline"
          onClick={() => signOutUser().then(() => router.replace("/login"))}
        >
          Cerrar sesión
        </Button>
      </div>
    );
  }

  // Suspension de plataforma (Sprint 16): un Super Admin siempre puede
  // entrar (necesita revisar/reactivar la organizacion), pero sus propios
  // miembros quedan bloqueados hasta que se reactive.
  if (membership?.organizationStatus === "suspended" && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full">
          <ShieldAlert className="text-destructive h-7 w-7" />
        </div>
        <h1 className="text-h3">Tu organización está suspendida</h1>
        <p className="text-body text-muted-foreground max-w-sm">
          El acceso a {membership.organizationName} fue suspendido por un administrador de la
          plataforma. Contacta a soporte si crees que esto es un error.
        </p>
        <Button
          variant="outline"
          onClick={() => signOutUser().then(() => router.replace("/login"))}
        >
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <NavigatorProvider>
      <AppShell>{children}</AppShell>
    </NavigatorProvider>
  );
}
