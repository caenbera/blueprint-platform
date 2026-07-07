"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OrganizationDirectory } from "@/components/features/admin/organization-directory";
import { useAuth } from "@/hooks/use-auth";

/**
 * Panel de Super Admin: directorio de organizaciones + flujo de acceso de
 * soporte. Guard client-side, mismo patron que el guard de sesion de
 * app/(app)/layout.tsx.
 */
export default function AdminPage() {
  const { isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, isSuperAdmin, router]);

  if (loading || !isSuperAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h1 className="text-h3 mb-4">Panel de Super Admin</h1>
      <OrganizationDirectory />
    </div>
  );
}
