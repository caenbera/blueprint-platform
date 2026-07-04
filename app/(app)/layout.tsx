"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintNavigator } from "@/components/features/navigator/blueprint-navigator";
import { BreadcrumbTrail } from "@/components/features/navigator/breadcrumb-trail";
import { AssistantPanel } from "@/components/features/workspace/assistant-panel";
import { WorkspaceWalkthroughBar } from "@/components/features/super-admin/workspace-walkthrough-bar";
import { NavigatorProvider } from "@/providers/navigator-provider";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { signOutUser } from "@/services/auth";

function AppShell({ children }: { children: React.ReactNode }) {
  const { membership, user } = useAuth();
  const { focusMode } = useNavigator();
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Layers className="text-primary h-5 w-5" />
          <span className="text-body font-semibold">
            {membership?.organizationName ?? "Blueprint"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-small text-muted-foreground">
            {user?.displayName || user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!focusMode && (
          <aside className="w-72 shrink-0 overflow-hidden border-r">
            <BlueprintNavigator />
          </aside>
        )}

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
            />
          </aside>
        )}
      </div>

      <WorkspaceWalkthroughBar />
    </div>
  );
}

/**
 * Chrome persistente para toda la app autenticada (Prompt 2/6/8): Top
 * Navigation + Blueprint Navigator + area de contenido + Assistant Panel.
 * Ninguno de los tres paneles es una pantalla propia, viven aqui para
 * estar siempre visibles (salvo en Modo Focus).
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
