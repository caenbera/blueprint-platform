"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BreadcrumbTrail } from "@/components/features/navigator/breadcrumb-trail";
import { AssistantPanel } from "@/components/features/workspace/assistant-panel";
import { CollapsibleSidebar } from "@/components/features/shell/collapsible-sidebar";
import { NavigatorProvider } from "@/providers/navigator-provider";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { signOutUser } from "@/services/auth";
import { ADMIN_NAV_GROUPS } from "@/config/admin-nav";
import { SUPER_ADMIN_NAV_GROUPS } from "@/config/super-admin-nav";
import { ROLE_LABELS } from "@/config/roles";

function AppShell({ children }: { children: React.ReactNode }) {
  const { membership, user, isSuperAdmin } = useAuth();
  const { focusMode, selection } = useNavigator();
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const router = useRouter();

  const navGroups = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : ADMIN_NAV_GROUPS;
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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <NavigatorProvider>
      <AppShell>{children}</AppShell>
    </NavigatorProvider>
  );
}
