"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { signOutUser } from "@/services/auth";

/**
 * Placeholder de aterrizaje post-login. NO es el Mission Control real
 * (Prompt 4.2 / 7 — eso es el Sprint 9 completo, con Widgets, KPIs, etc.).
 * Solo existe para poder probar el flujo de autenticacion de extremo a
 * extremo hoy.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, membership } = useAuth();

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-h3">Bienvenido, {user?.displayName || user?.email}</h1>
          <p className="text-body text-muted-foreground">
            {membership ? membership.organizationName : "Cargando tu organización..."}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">
            Este es un destino temporal de prueba. El Mission Control real (Prompt 4.2/7) llega en
            el Sprint 9 del roadmap.
          </p>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
