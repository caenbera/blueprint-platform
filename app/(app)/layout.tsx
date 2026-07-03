"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintNavigator } from "@/components/features/navigator/blueprint-navigator";
import { BreadcrumbTrail } from "@/components/features/navigator/breadcrumb-trail";
import { NavigatorProvider } from "@/providers/navigator-provider";
import { useAuth } from "@/hooks/use-auth";
import { signOutUser } from "@/services/auth";

/**
 * Chrome persistente para toda la app autenticada (Prompt 2/6): Top
 * Navigation + Blueprint Navigator (columna izquierda fija) + area de
 * contenido con Breadcrumb arriba. El Navigator nunca es una pantalla
 * propia, vive aqui para estar siempre visible.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, loading } = useAuth();
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

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <NavigatorProvider>
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
              {user.displayName || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 shrink-0 overflow-hidden border-r">
            <BlueprintNavigator />
          </aside>

          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b">
              <BreadcrumbTrail />
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>
    </NavigatorProvider>
  );
}
